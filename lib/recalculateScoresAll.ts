
import { createAdminClient } from "@/utils/supabase/admin";
import { calculateMatchPredictionScore } from "@/lib/scoring";
import { scoreSettings } from "@/data/settings";

function normalize(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function getOutcome(homeGoals: number, awayGoals: number): "home" | "draw" | "away" {
  if (homeGoals > awayGoals) return "home";
  if (homeGoals < awayGoals) return "away";
  return "draw";
}

export async function recalculateScoresAll() {
  const supabase = createAdminClient();

  // 1. Borrar puntuaciones anteriores
  const { error: deleteError } = await supabase
    .from("entry_scores")
    .delete()
    .not("entry_id", "is", null);

  if (deleteError) {
    throw deleteError;
  }

  // 2. Leer entries
  const { data: entries, error: entriesError } = await supabase
    .from("entries")
    .select("id, pool_id");

  if (entriesError) {
    throw entriesError;
  }

  // 3. Leer resultados oficiales de grupos
  const { data: officialResults, error: officialError } = await supabase
    .from("official_group_results")
    .select("match_id, home_goals, away_goals");

  if (officialError) {
    throw officialError;
  }

  // 4. Leer predicciones de grupos
  const { data: predictions, error: predictionsError } = await supabase
    .from("entry_group_predictions")
    .select("entry_id, match_id, home_goals, away_goals");

  if (predictionsError) {
    throw predictionsError;
  }

  // 5. Mapas auxiliares
  const entryById = new Map(
    (entries ?? []).map((entry) => [normalize(entry.id), entry])
  );

  const officialByMatchId = new Map(
    (officialResults ?? []).map((row) => [normalize(row.match_id), row])
  );

  // 6. Generar filas de puntuación
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

  const samplePredictions: Array<{
    entry_id: string;
    match_id: string;
    normalized_entry_id: string;
    normalized_match_id: string;
    entryFound: boolean;
    officialFound: boolean;
    predHome: number | null;
    predAway: number | null;
    officialHome: number | null | undefined;
    officialAway: number | null | undefined;
  }> = [];

  for (const pred of predictions ?? []) {
    const normalizedEntryId = normalize(pred.entry_id);
    const normalizedMatchId = normalize(pred.match_id);

    const entry = entryById.get(normalizedEntryId);
    const official = officialByMatchId.get(normalizedMatchId);

    if (samplePredictions.length < 10) {
      samplePredictions.push({
        entry_id: pred.entry_id,
        match_id: pred.match_id,
        normalized_entry_id: normalizedEntryId,
        normalized_match_id: normalizedMatchId,
        entryFound: !!entry,
        officialFound: !!official,
        predHome: pred.home_goals,
        predAway: pred.away_goals,
        officialHome: official?.home_goals,
        officialAway: official?.away_goals,
      });
    }

    if (!entry) {
      skippedNoEntry += 1;
      continue;
    }

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
      matchday: 0,
      stage: "group",
      points: score.points,
      is_exact: isExact,
      is_outcome: isOutcome,
    });

    pushedGroupScores += 1;
  }

  // 7. Guardar
  // IMPORTANTE: no metemos "id"
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

  // 8. Debug
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
    samplePredictions,
  };
}