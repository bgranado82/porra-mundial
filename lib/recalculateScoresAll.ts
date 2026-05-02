
import { createAdminClient } from "@/utils/supabase/admin";
import { calculateMatchPredictionScore } from "@/lib/scoring";
import { scoreSettings } from "@/data/settings";
import { matches } from "@/data/matches";
import { teams } from "@/data/teams";
import { buildUserKnockoutBracket } from "@/lib/knockoutBracket";
import { buildRealKnockoutBracket } from "@/lib/realKnockout";
import { calculateKnockoutScore } from "@/lib/knockoutScoring";
import { KnockoutPredictionMap, Match } from "@/types";

function normalize(value: string | null | undefined) {
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

function getDateKeyFromKickoff(kickoff: string | null | undefined) {
  if (!kickoff) return null;

  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getExtraQuestionPoints(questionKey: string) {
  if (questionKey === "first_goal_scorer_world") {
    return scoreSettings.firstGoalScorerWorldPoints;
  }
  if (questionKey === "first_goal_scorer_spain") {
    return scoreSettings.firstGoalScorerSpainPoints;
  }
  if (questionKey === "golden_boot") {
    return scoreSettings.goldenBootPoints;
  }
  if (questionKey === "golden_ball") {
    return scoreSettings.goldenBallPoints;
  }
  if (questionKey === "best_young_player") {
    return scoreSettings.bestYoungPlayerPoints;
  }
  if (questionKey === "golden_glove") {
    return scoreSettings.goldenGlovePoints;
  }
  if (questionKey === "top_spanish_scorer") {
    return scoreSettings.topSpanishScorerPoints;
  }

  return 0;
}

const groupMatches = matches.filter((match) => match.stage === "group");

const uniqueGroupDates = Array.from(
  new Set(
    groupMatches
      .map((match) => getDateKeyFromKickoff(match.kickoff))
      .filter((value): value is string => Boolean(value))
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

  const { data: extraPredictions, error: extraPredictionsError } =
    await supabase
      .from("entry_extra_predictions")
      .select("entry_id, question_key, predicted_value");

  if (extraPredictionsError) {
    throw extraPredictionsError;
  }

  const { data: officialExtraResults, error: officialExtraResultsError } =
    await supabase
      .from("official_extra_results")
      .select("question_key, official_value");

  if (officialExtraResultsError) {
    throw officialExtraResultsError;
  }

  const { data: knockoutPredictions, error: knockoutPredictionsError } =
    await supabase
      .from("entry_knockout_predictions")
      .select("entry_id, match_id, picked_team_id");

  if (knockoutPredictionsError) {
    throw knockoutPredictionsError;
  }

  const { data: officialKnockoutResults, error: officialKnockoutResultsError } =
    await supabase
      .from("official_knockout_results")
      .select("match_id, picked_team_id");

  if (officialKnockoutResultsError) {
    throw officialKnockoutResultsError;
  }

  const entryById = new Map(
    (entries ?? []).map((entry) => [normalize(entry.id), entry])
  );

  const officialByMatchId = new Map(
    (officialResults ?? []).map((row) => [normalize(row.match_id), row])
  );

  const officialExtraByQuestionKey = new Map(
    (officialExtraResults ?? []).map((row) => [
      normalize(row.question_key),
      row,
    ])
  );

  const officialKnockoutMap: KnockoutPredictionMap = {};
  (officialKnockoutResults ?? []).forEach((row) => {
    officialKnockoutMap[row.match_id] = row.picked_team_id ?? null;
  });

  const officialMatchesWithResults: Match[] = matches.map((match) => {
    if (match.stage !== "group") return match;

    const official = officialByMatchId.get(normalize(match.id));

    return {
      ...match,
      homeGoals: official?.home_goals ?? null,
      awayGoals: official?.away_goals ?? null,
    };
  });

  const groups = [
    ...new Set(teams.map((team) => team.group).filter(Boolean)),
  ] as string[];

  const rowsToInsert: Array<{
    entry_id: string;
    pool_id: string;
    match_id: string | null;
    matchday: number | null;
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

  let skippedExtraNoEntry = 0;
  let skippedExtraNoOfficial = 0;
  let skippedExtraOfficialNull = 0;
  let skippedExtraPredictionNull = 0;
  let pushedExtraScores = 0;

  let pushedKnockoutScores = 0;
  let skippedKnockoutNoEntry = 0;

  // GROUPS
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

    rowsToInsert.push({
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

  // EXTRAS
  for (const pred of extraPredictions ?? []) {
    const entry = entryById.get(normalize(pred.entry_id));
    if (!entry) {
      skippedExtraNoEntry += 1;
      continue;
    }

    const official = officialExtraByQuestionKey.get(normalize(pred.question_key));
    if (!official) {
      skippedExtraNoOfficial += 1;
      continue;
    }

    if (!official.official_value) {
      skippedExtraOfficialNull += 1;
      continue;
    }

    if (!pred.predicted_value) {
      skippedExtraPredictionNull += 1;
      continue;
    }

    const predictedValue = normalize(pred.predicted_value);
    const officialValue = normalize(official.official_value);
    const isExact = predictedValue === officialValue;
    const points = isExact ? getExtraQuestionPoints(pred.question_key) : 0;

    rowsToInsert.push({
      entry_id: pred.entry_id,
      pool_id: entry.pool_id,
      match_id: null,
      matchday: null,
      stage: `extra:${pred.question_key}`,
      points,
      is_exact: isExact,
      is_outcome: false,
    });

    pushedExtraScores += 1;
  }

  // KNOCKOUT
  const knockoutPredictionsByEntry = new Map<string, KnockoutPredictionMap>();

  (knockoutPredictions ?? []).forEach((row) => {
    const entryId = String(row.entry_id);
    const current = knockoutPredictionsByEntry.get(entryId) ?? {};
    current[row.match_id] = row.picked_team_id ?? null;
    knockoutPredictionsByEntry.set(entryId, current);
  });

  const realBracket = buildRealKnockoutBracket(
    teams,
    officialMatchesWithResults,
    groups,
    officialKnockoutMap
  );

  for (const entry of entries ?? []) {
  const entryId = String(entry.id);
  const mappedEntry = entryById.get(normalize(entryId));

  if (!mappedEntry) {
    skippedKnockoutNoEntry += 1;
    continue;
  }

  const picks = knockoutPredictionsByEntry.get(entryId) ?? {};

  const userGroupPredictions = (predictions ?? []).filter(
    (row) => String(row.entry_id) === entryId
  );

  const groupPredictionMap: Record<
    string,
    { homeGoals: number | null; awayGoals: number | null }
  > = {};

  userGroupPredictions.forEach((row) => {
    groupPredictionMap[row.match_id] = {
      homeGoals: row.home_goals,
      awayGoals: row.away_goals,
    };
  });

  const userBracket = buildUserKnockoutBracket(
    teams,
    officialMatchesWithResults,
    groups,
    groupPredictionMap,
    picks
  );

  const knockoutScore = calculateKnockoutScore(
    scoreSettings,
    userBracket,
    realBracket
  );

  rowsToInsert.push(
    {
      entry_id: entryId,
      pool_id: mappedEntry.pool_id,
      match_id: null,
      matchday: null,
      stage: "r32",
      points: knockoutScore.round32,
      is_exact: false,
      is_outcome: false,
    },
    {
      entry_id: entryId,
      pool_id: mappedEntry.pool_id,
      match_id: null,
      matchday: null,
      stage: "r16",
      points: knockoutScore.round16,
      is_exact: false,
      is_outcome: false,
    },
    {
      entry_id: entryId,
      pool_id: mappedEntry.pool_id,
      match_id: null,
      matchday: null,
      stage: "qf",
      points: knockoutScore.quarterfinals,
      is_exact: false,
      is_outcome: false,
    },
    {
      entry_id: entryId,
      pool_id: mappedEntry.pool_id,
      match_id: null,
      matchday: null,
      stage: "sf",
      points: knockoutScore.semifinals,
      is_exact: false,
      is_outcome: false,
    },
    {
      entry_id: entryId,
      pool_id: mappedEntry.pool_id,
      match_id: null,
      matchday: null,
      stage: "final",
      points: knockoutScore.final + knockoutScore.champion,
      is_exact: false,
      is_outcome: false,
    }
  );

  pushedKnockoutScores += 5;
}

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("entry_scores")
      .insert(rowsToInsert);

    if (insertError) {
      throw insertError;
    }
  }

  return {
    entries: entries?.length ?? 0,
    officialGroupResults: officialResults?.length ?? 0,
    officialKnockoutResults: officialKnockoutResults?.length ?? 0,
    groupPredictions: predictions?.length ?? 0,
    knockoutPredictions: knockoutPredictions?.length ?? 0,
    extraPredictions: extraPredictions?.length ?? 0,
    officialExtraResults: officialExtraResults?.length ?? 0,
    rowsToInsert: rowsToInsert.length,
    skippedNoEntry,
    skippedNoOfficial,
    skippedOfficialNull,
    skippedPredictionNull,
    pushedGroupScores,
    skippedExtraNoEntry,
    skippedExtraNoOfficial,
    skippedExtraOfficialNull,
    skippedExtraPredictionNull,
    pushedExtraScores,
    skippedKnockoutNoEntry,
    pushedKnockoutScores,
    sampleMatchdays: (predictions ?? []).slice(0, 10).map((pred) => {
      const match = matches.find((m) => String(m.id) === String(pred.match_id));
      return {
        match_id: pred.match_id,
        kickoff: match?.kickoff ?? null,
        computed_matchday: getMatchday(pred.match_id),
      };
    }),
    uniqueGroupDates,
  };
}