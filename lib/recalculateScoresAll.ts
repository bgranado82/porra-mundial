import { createAdminClient } from "@/utils/supabase/admin";
import { calculateMatchPredictionScore } from "@/lib/scoring";
import { scoreSettings } from "@/data/settings";
import { matches } from "@/data/matches";

function normalize(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function getOutcome(homeGoals: number, awayGoals: number): "home" | "draw" | "away" {
  if (homeGoals > awayGoals) return "home";
  if (homeGoals < awayGoals) return "away";
  return "draw";
}

function getDateKeyFromKickoff(kickoff: string | null | undefined) {
  if (!kickoff) return null;

  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
}

const groupMatches = matches.filter((match) => match.stage === "group");

const uniqueGroupDates = Array.from(
  new Set(
    groupMatches
      .map((match) => getDateKeyFromKickoff(match.kickoff))
      .filter(Boolean)
  )
).sort();

const matchdayByMatchId = new Map<string, number>();

groupMatches.forEach((match) => {
  const dateKey = getDateKeyFromKickoff(match.kickoff);
  if (!dateKey) return;

  const index = uniqueGroupDates.indexOf(dateKey);
  if (index === -1) return;

  matchdayByMatchId.set(String(match.id), index + 1);
});

function getMatchday(matchId: string) {
  return matchdayByMatchId.get(String(matchId)) ?? 0;
}

export async function recalculateScoresAll() {
  const supabase = createAdminClient();

  const { error: deleteError } = await supabase
    .from("entry_scores")
    .delete()
    .not("entry_id", "is", null);

  if (deleteError) {
    throw deleteError;
  }

  const { data: entries, error: entriesError } = await supabase
    .from("entries")
    .select("id, pool_id");

  if (entriesError) {
    throw entriesError;
  }

  const { data: officialResults, error: officialError } = await supabase
    .from("official_group_results")
    .select("match_id, home_goals, away_goals");

  if (officialError) {
    throw officialError;
  }

  const { data: predictions, error: predictionsError } = await supabase
    .from("entry_group_predictions")
    .select("entry_id, match_id, home_goals, away_goals");

  if (predictionsError) {
    throw predictionsError;
  }

  const entryById = new Map(
    (entries ?? []).map((entry) => [normalize(entry.id), entry])
  );

  const officialByMatchId = new Map(
    (officialResults ?? []).map((row) => [normalize(row.match_id), row])
  );

  const rowsToUpsert: Array<{
    entry_id: string;
    pool_id: string;
    match_id: string;
    matchday: number;
    stage: string;
    points: number;
    is_exact: boolean;
    is_outcome: boolean;
  }> = [];

  let skippedNoEntry = 0;
  let skippedNoOfficial = 0;
  let skippedOfficialNull = 0;
  let skippedPredictionNull = 0;
  let pushedGroupScores = 0;

  for (const pred of predictions ?? []) {
    const entry = entryById.get(normalize(pred.entry_id));
    if (!entry) {
      skippedNoEntry += 1;
      continue;
    }

    const official = officialByMatchId.get(normalize(pred.match_id));
    if (!official) {
      skippedNoOfficial += 1;
      continue;
    }

    if (official.home_goals === null || official.away_goals === null) {
      skippedOfficialNull += 1;
      continue;
    }

    if (pred.home_goals === null || pred.away_goals === null) {
      skippedPredictionNull += 1;
      continue;
    }

    const score = calculateMatchPredictionScore(
      official.home_goals,
      official.away_goals,
      pred.home_goals,
      pred.away_goals,
      scoreSettings
    );

    const isExact =
      pred.home_goals === official.home_goals &&
      pred.away_goals === official.away_goals;

    const isOutcome =
      getOutcome(pred.home_goals, pred.away_goals) ===
      getOutcome(official.home_goals, official.away_goals);

    rowsToUpsert.push({
      entry_id: pred.entry_id,
      pool_id: entry.pool_id,
      match_id: pred.match_id,
      matchday: getMatchday(pred.match_id),
      stage: "group",
      points: score.points,
      is_exact: isExact,
      is_outcome: isOutcome,
    });

    pushedGroupScores += 1;
  }

  if (rowsToUpsert.length > 0) {
    const { error: upsertError } = await supabase
      .from("entry_scores")
      .upsert(rowsToUpsert, {
        onConflict: "entry_id,match_id",
      });

    if (upsertError) {
      throw upsertError;
    }
  }

  return {
    entries: entries?.length ?? 0,
    officialGroupResults: officialResults?.length ?? 0,
    groupPredictions: predictions?.length ?? 0,
    rowsToUpsert: rowsToUpsert.length,
    skippedNoEntry,
    skippedNoOfficial,
    skippedOfficialNull,
    skippedPredictionNull,
    pushedGroupScores,
    uniqueGroupDates,
  };
}