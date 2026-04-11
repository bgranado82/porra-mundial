
import { createClient } from "@/utils/supabase/server";
import { calculateMatchPredictionScore } from "@/lib/scoring";
import { scoreSettings } from "@/data/settings";
import { getMatchday } from "@/lib/getMatchday";
import { realKnockoutPredictions as initialRealKnockoutPredictions } from "@/data/realKnockoutPredictions";

type OfficialGroupRow = {
  match_id: string;
  home_goals: number | null;
  away_goals: number | null;
};

type EntryRow = {
  id: string;
  pool_id: string;
};

type GroupPredictionRow = {
  entry_id: string;
  match_id: string;
  home_goals: number | null;
  away_goals: number | null;
};

type KnockoutPredictionRow = {
  entry_id: string;
  match_id: string;
  picked_team_id: string | null;
};

function normalizeMatchId(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function getOutcome(
  homeGoals: number,
  awayGoals: number
): "home" | "draw" | "away" {
  if (homeGoals > awayGoals) return "home";
  if (homeGoals < awayGoals) return "away";
  return "draw";
}

function getKnockoutStage(matchId: string): string {
  const id = normalizeMatchId(matchId);

  if (id.startsWith("r32-")) return "r32";
  if (id.startsWith("r16-")) return "r16";
  if (id.startsWith("qf-")) return "qf";
  if (id.startsWith("sf-")) return "sf";
  if (id.startsWith("final-")) return "final";
  if (id === "champion") return "champion";

  return "knockout";
}

export async function recalculateScoresAll() {
  const supabase = await createClient();

  console.log("RECALCULANDO SCORES ALL");

  const { error: deleteScoresError } = await supabase
    .from("entry_scores")
    .delete()
    .not("entry_id", "is", null);

  if (deleteScoresError) {
    console.error("DELETE entry_scores ERROR:", deleteScoresError);
    throw deleteScoresError;
  }

  const { data: entries, error: entriesError } = await supabase
    .from("entries")
    .select("id, pool_id");

  if (entriesError) {
    console.error("ENTRIES ERROR:", entriesError);
    throw entriesError;
  }

  if (!entries || entries.length === 0) {
    return {
      entries: 0,
      officialGroupResults: 0,
      officialKnockoutResults: 0,
      groupPredictions: 0,
      knockoutPredictions: 0,
      scoresToInsert: 0,
      skippedNoEntry: 0,
      skippedNoOfficial: 0,
      skippedOfficialNull: 0,
      skippedPredictionNull: 0,
      pushedGroupScores: 0,
      samplePredictions: [],
    };
  }

  const { data: officialGroupResults, error: officialGroupError } = await supabase
    .from("official_group_results")
    .select("match_id, home_goals, away_goals");

  if (officialGroupError) {
    console.error("OFFICIAL GROUP ERROR:", officialGroupError);
    throw officialGroupError;
  }

  const { data: officialKnockoutResults, error: officialKnockoutError } = await supabase
    .from("official_knockout_results")
    .select("match_id, picked_team_id");

  if (officialKnockoutError) {
    console.error("OFFICIAL KNOCKOUT ERROR:", officialKnockoutError);
    throw officialKnockoutError;
  }

  const { data: groupPredictions, error: groupPredictionsError } = await supabase
    .from("entry_group_predictions")
    .select("entry_id, match_id, home_goals, away_goals");

  if (groupPredictionsError) {
    console.error("GROUP PREDICTIONS ERROR:", groupPredictionsError);
    throw groupPredictionsError;
  }

  const { data: knockoutPredictions, error: knockoutPredictionsError } = await supabase
    .from("entry_knockout_predictions")
    .select("entry_id, match_id, picked_team_id");

  if (knockoutPredictionsError) {
    console.error("KNOCKOUT PREDICTIONS ERROR:", knockoutPredictionsError);
    throw knockoutPredictionsError;
  }

  const entryMap = new Map<string, EntryRow>();
  (entries ?? []).forEach((entry) => {
    entryMap.set(entry.id, entry);
  });

  const officialGroupMap = new Map<string, OfficialGroupRow>();
  (officialGroupResults ?? []).forEach((row) => {
    officialGroupMap.set(normalizeMatchId(row.match_id), row);
  });

  const officialKnockoutMap = new Map<string, string | null>();
  (officialKnockoutResults ?? []).forEach((row) => {
    officialKnockoutMap.set(
      normalizeMatchId(row.match_id),
      row.picked_team_id ?? null
    );
  });

  const scoresToInsert: {
    entry_id: string;
    pool_id: string;
    match_id: string;
    matchday: number;
    stage: string;
    points: number;
    is_exact: boolean;
    is_outcome: boolean;
  }[] = [];

  let skippedNoEntry = 0;
  let skippedNoOfficial = 0;
  let skippedOfficialNull = 0;
  let skippedPredictionNull = 0;
  let pushedGroupScores = 0;

  const samplePredictions: Array<{
    match_id: string;
    normalized_match_id: string;
    entryFound: boolean;
    officialFound: boolean;
    officialHome: number | null | undefined;
    officialAway: number | null | undefined;
    predHome: number | null | undefined;
    predAway: number | null | undefined;
  }> = [];

  (groupPredictions ?? []).forEach((pred: GroupPredictionRow) => {
    const normalizedMatchId = normalizeMatchId(pred.match_id);
    const entry = entryMap.get(pred.entry_id);
    const official = officialGroupMap.get(normalizedMatchId);

    if (samplePredictions.length < 10) {
      samplePredictions.push({
        match_id: pred.match_id,
        normalized_match_id: normalizedMatchId,
        entryFound: !!entry,
        officialFound: !!official,
        officialHome: official?.home_goals,
        officialAway: official?.away_goals,
        predHome: pred.home_goals,
        predAway: pred.away_goals,
      });
    }

    if (!entry) {
      skippedNoEntry += 1;
      return;
    }

    if (!official) {
      skippedNoOfficial += 1;
      return;
    }

    if (official.home_goals === null || official.away_goals === null) {
      skippedOfficialNull += 1;
      return;
    }

    if (pred.home_goals === null || pred.away_goals === null) {
      skippedPredictionNull += 1;
      return;
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

    scoresToInsert.push({
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
  });

  const knockoutPointsByRound: Record<string, number> = {
    r32: scoreSettings.round32QualifiedPoints,
    r16: scoreSettings.round16QualifiedPoints,
    qf: scoreSettings.quarterfinalQualifiedPoints,
    sf: scoreSettings.semifinalQualifiedPoints,
    final: scoreSettings.finalQualifiedPoints,
    champion: scoreSettings.championPoints,
  };

  (knockoutPredictions ?? []).forEach((pred: KnockoutPredictionRow) => {
    const entry = entryMap.get(pred.entry_id);
    if (!entry) return;

    const normalizedMatchId = normalizeMatchId(pred.match_id);

    const officialPicked =
      officialKnockoutMap.get(normalizedMatchId) ??
      initialRealKnockoutPredictions[pred.match_id] ??
      initialRealKnockoutPredictions[normalizedMatchId] ??
      null;

    if (!officialPicked || !pred.picked_team_id) return;

    const stageKey = getKnockoutStage(pred.match_id);
    const pointsForStage = knockoutPointsByRound[stageKey] ?? 0;
    const isHit = pred.picked_team_id === officialPicked;

    scoresToInsert.push({
      entry_id: pred.entry_id,
      pool_id: entry.pool_id,
      match_id: pred.match_id,
      matchday: 0,
      stage: "knockout",
      points: isHit ? pointsForStage : 0,
      is_exact: false,
      is_outcome: isHit,
    });
  });

  console.log("entries:", entries.length);
  console.log("officialGroupResults:", officialGroupResults?.length ?? 0);
  console.log("groupPredictions:", groupPredictions?.length ?? 0);
  console.log("scoresToInsert:", scoresToInsert.length);
  console.log("samplePredictions:", samplePredictions);

  if (scoresToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("entry_scores")
      .insert(scoresToInsert);

    if (insertError) {
      console.error("INSERT entry_scores ERROR:", insertError);
      throw insertError;
    }
  }

  return {
    entries: entries.length,
    officialGroupResults: officialGroupResults?.length ?? 0,
    officialKnockoutResults: officialKnockoutResults?.length ?? 0,
    groupPredictions: groupPredictions?.length ?? 0,
    knockoutPredictions: knockoutPredictions?.length ?? 0,
    scoresToInsert: scoresToInsert.length,
    skippedNoEntry,
    skippedNoOfficial,
    skippedOfficialNull,
    skippedPredictionNull,
    pushedGroupScores,
    samplePredictions,
  };
}