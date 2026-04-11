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

type OfficialKnockoutRow = {
  match_id: string;
  picked_team_id: string | null;
};

type EntryRow = {
  id: string;
  pool_id: string;
};

export async function recalculateScoresAll() {
  const supabase = await createClient();

  console.log("RECALCULANDO SCORES ALL");

  // 1. Borrar puntuaciones anteriores
  const { error: deleteScoresError } = await supabase
    .from("entry_scores")
    .delete()
    .not("id", "is", null);

  if (deleteScoresError) {
    console.error("DELETE entry_scores ERROR:", deleteScoresError);
    throw deleteScoresError;
  }

  // 2. Cargar entries
  const { data: entries, error: entriesError } = await supabase
    .from("entries")
    .select("id, pool_id");

  if (entriesError) {
    console.error("ENTRIES ERROR:", entriesError);
    throw entriesError;
  }

  if (!entries || entries.length === 0) {
    console.log("No hay entries");
    return {
      entries: 0,
      officialGroupResults: 0,
      officialKnockoutResults: 0,
      groupPredictions: 0,
      knockoutPredictions: 0,
      scoresToInsert: 0,
    };
  }

  // 3. Cargar resultados oficiales de grupos
  const { data: officialGroupResults, error: officialGroupError } = await supabase
    .from("official_group_results")
    .select("match_id, home_goals, away_goals");

  if (officialGroupError) {
    console.error("OFFICIAL GROUP ERROR:", officialGroupError);
    throw officialGroupError;
  }

  // 4. Cargar resultados oficiales de knockout
  const { data: officialKnockoutResults, error: officialKnockoutError } = await supabase
    .from("official_knockout_results")
    .select("match_id, picked_team_id");

  if (officialKnockoutError) {
    console.error("OFFICIAL KNOCKOUT ERROR:", officialKnockoutError);
    throw officialKnockoutError;
  }

  // 5. Cargar predicciones de grupos
  const { data: groupPredictions, error: groupPredictionsError } = await supabase
    .from("entry_group_predictions")
    .select("entry_id, match_id, home_goals, away_goals");

  if (groupPredictionsError) {
    console.error("GROUP PREDICTIONS ERROR:", groupPredictionsError);
    throw groupPredictionsError;
  }

  // 6. Cargar predicciones de knockout
  const { data: knockoutPredictions, error: knockoutPredictionsError } = await supabase
    .from("entry_knockout_predictions")
    .select("entry_id, match_id, picked_team_id");

  if (knockoutPredictionsError) {
    console.error("KNOCKOUT PREDICTIONS ERROR:", knockoutPredictionsError);
    throw knockoutPredictionsError;
  }

  console.log("entries:", entries?.length ?? 0);
  console.log("officialGroupResults:", officialGroupResults?.length ?? 0);
  console.log("officialKnockoutResults:", officialKnockoutResults?.length ?? 0);
  console.log("groupPredictions:", groupPredictions?.length ?? 0);
  console.log("knockoutPredictions:", knockoutPredictions?.length ?? 0);

  const entryMap = new Map<string, EntryRow>();
  entries.forEach((entry) => entryMap.set(entry.id, entry));

  const officialGroupMap = new Map<string, OfficialGroupRow>();
  (officialGroupResults ?? []).forEach((row) => {
    officialGroupMap.set(row.match_id, row);
  });

  const officialKnockoutMap = new Map<string, string | null>();
  (officialKnockoutResults ?? []).forEach((row) => {
    officialKnockoutMap.set(row.match_id, row.picked_team_id);
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

  function getOutcome(
    homeGoals: number,
    awayGoals: number
  ): "home" | "draw" | "away" {
    if (homeGoals > awayGoals) return "home";
    if (homeGoals < awayGoals) return "away";
    return "draw";
  }

  // 7. Calcular grupos
  (groupPredictions ?? []).forEach((pred) => {
    const entry = entryMap.get(pred.entry_id);
    if (!entry) return;

    const official = officialGroupMap.get(pred.match_id);
    if (!official) return;

    if (official.home_goals === null || official.away_goals === null) return;
    if (pred.home_goals === null || pred.away_goals === null) return;

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
  });

  // 8. Calcular knockout
  const knockoutPointsByRound: Record<string, number> = {
    r32: scoreSettings.round32QualifiedPoints,
    r16: scoreSettings.round16QualifiedPoints,
    qf: scoreSettings.quarterfinalQualifiedPoints,
    sf: scoreSettings.semifinalQualifiedPoints,
    final: scoreSettings.finalQualifiedPoints,
    champion: scoreSettings.championPoints,
  };

  function getKnockoutStage(matchId: string): string {
    if (matchId.startsWith("r32-")) return "r32";
    if (matchId.startsWith("r16-")) return "r16";
    if (matchId.startsWith("qf-")) return "qf";
    if (matchId.startsWith("sf-")) return "sf";
    if (matchId.startsWith("final-")) return "final";
    if (matchId === "champion") return "champion";
    return "knockout";
  }

  (knockoutPredictions ?? []).forEach((pred) => {
    const entry = entryMap.get(pred.entry_id);
    if (!entry) return;

    const officialPicked =
      officialKnockoutMap.get(pred.match_id) ??
      initialRealKnockoutPredictions[pred.match_id] ??
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

  console.log("scoresToInsert length:", scoresToInsert.length);
  console.log("scoresToInsert sample:", scoresToInsert.slice(0, 5));

  // 9. Insertar todo
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
    entries: entries?.length ?? 0,
    officialGroupResults: officialGroupResults?.length ?? 0,
    officialKnockoutResults: officialKnockoutResults?.length ?? 0,
    groupPredictions: groupPredictions?.length ?? 0,
    knockoutPredictions: knockoutPredictions?.length ?? 0,
    scoresToInsert: scoresToInsert.length,
  };
}