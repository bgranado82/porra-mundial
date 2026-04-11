import { createAdminClient } from "@/utils/supabase/admin";
import { calculateMatchPredictionScore } from "@/lib/scoring";
import { scoreSettings } from "@/data/settings";

function normalize(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
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

  const rowsToInsert = [];

  for (const pred of predictions ?? []) {
    const entry = entryById.get(normalize(pred.entry_id));
    if (!entry) continue;

    const official = officialByMatchId.get(normalize(pred.match_id));
    if (!official) continue;

    if (
      official.home_goals === null ||
      official.away_goals === null ||
      pred.home_goals === null ||
      pred.away_goals === null
    ) {
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

    const officialOutcome =
      official.home_goals > official.away_goals
        ? "home"
        : official.home_goals < official.away_goals
        ? "away"
        : "draw";

    const predictedOutcome =
      pred.home_goals > pred.away_goals
        ? "home"
        : pred.home_goals < pred.away_goals
        ? "away"
        : "draw";

    rowsToInsert.push({
      entry_id: pred.entry_id,
      pool_id: entry.pool_id,
      match_id: pred.match_id,
      matchday: 0,
      stage: "group",
      points: score.points,
      is_exact: isExact,
      is_outcome: officialOutcome === predictedOutcome,
    });
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
    groupPredictions: predictions?.length ?? 0,
    rowsToInsert: rowsToInsert.length,
  };
}