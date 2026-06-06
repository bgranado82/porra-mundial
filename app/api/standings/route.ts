
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { calculateStandings } from "@/lib/calculateStandings";

type SnapshotRow = {
  entry_id: string;
  position: number;
  group_position: number | null;
  captured_at: string | null;
};

// Supabase .in() tiene un límite práctico de ~100 elementos por llamada.
// Con pools de 300+ participantes hay que hacer las queries en batches
// y combinar los resultados para no perder predicciones.
const CHUNK_SIZE = 100;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

async function fetchInChunks<T>(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  selectFields: string,
  idChunks: any[][]
): Promise<{ data: T[]; error: any }> {
  const results: T[] = [];
  for (const chunk of idChunks) {
    const { data, error } = await supabase
      .from(table)
      .select(selectFields)
      .in("entry_id", chunk)
      .range(0, 99999);
    if (error) return { data: [], error };
    if (data) results.push(...(data as T[]));
  }
  return { data: results, error: null };
}

export async function GET(req: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const poolId = searchParams.get("poolId");

    if (!poolId) {
      return NextResponse.json({ error: "poolId requerido" }, { status: 400 });
    }

    const [
      { data: entries, error: entriesError },
      { data: scores, error: scoresError },
      { data: officialGroupRows, error: officialGroupError },
      { data: officialKnockoutRows, error: officialKnockoutError },
      { data: adminTiebreakRows, error: adminTiebreakError },
      { data: officialExtraRows, error: officialExtraError },
      { data: snapshots, error: snapshotsError },
    ] = await Promise.all([
      supabase.from("entries").select("id, name, email, company, country, pool_id").eq("pool_id", poolId).eq("status", "submitted").range(0, 99999),
      supabase.from("entry_scores").select("entry_id, pool_id, matchday, stage, points, is_exact, is_outcome").eq("pool_id", poolId).range(0, 99999),
      supabase.from("official_group_results").select("match_id, home_goals, away_goals").range(0, 99999),
      supabase.from("official_knockout_results").select("match_id, picked_team_id").range(0, 99999),
      supabase.from("admin_tiebreaks").select("scope, scope_value, team_id, priority").range(0, 99999),
      supabase.from("official_extra_results").select("question_key, official_value").range(0, 99999),
      supabase.from("standings_snapshots").select("entry_id, position, group_position, captured_at").eq("pool_id", poolId).range(0, 99999),
    ]);

    if (entriesError) return NextResponse.json({ error: entriesError.message }, { status: 500 });
    if (scoresError) return NextResponse.json({ error: scoresError.message }, { status: 500 });
    if (officialGroupError) return NextResponse.json({ error: officialGroupError.message }, { status: 500 });
    if (officialKnockoutError) return NextResponse.json({ error: officialKnockoutError.message }, { status: 500 });
    if (adminTiebreakError) return NextResponse.json({ error: adminTiebreakError.message }, { status: 500 });
    if (officialExtraError) return NextResponse.json({ error: officialExtraError.message }, { status: 500 });
    if (snapshotsError) return NextResponse.json({ error: snapshotsError.message }, { status: 500 });

    const entryIds = (entries ?? []).map((e: any) => e.id);
    const idChunks = chunkArray(entryIds, CHUNK_SIZE);

    const [
      { data: allGroupPredictions, error: groupPredictionsError },
      { data: allKnockoutPredictions, error: koPredictionsError },
      { data: tiebreakRows, error: tiebreakError },
      { data: allExtraPredictions, error: extraPredictionsError },
    ] = await Promise.all([
      fetchInChunks<any>(supabase, "entry_group_predictions", "entry_id, match_id, home_goals, away_goals", idChunks),
      fetchInChunks<any>(supabase, "entry_knockout_predictions", "entry_id, match_id, picked_team_id", idChunks),
      fetchInChunks<any>(supabase, "entry_tiebreaks", "entry_id, scope, scope_value, team_id, priority", idChunks),
      fetchInChunks<any>(supabase, "entry_extra_predictions", "entry_id, question_key, predicted_value, normalized_value", idChunks),
    ]);

    if (groupPredictionsError) return NextResponse.json({ error: groupPredictionsError.message }, { status: 500 });
    if (koPredictionsError) return NextResponse.json({ error: koPredictionsError.message }, { status: 500 });
    if (tiebreakError) return NextResponse.json({ error: tiebreakError.message }, { status: 500 });
    if (extraPredictionsError) return NextResponse.json({ error: extraPredictionsError.message }, { status: 500 });

    const currentStandings = calculateStandings({
      entries: entries ?? [],
      scores: scores ?? [],
      officialGroupRows: officialGroupRows ?? [],
      allGroupPredictions: allGroupPredictions ?? [],
      allKnockoutPredictions: allKnockoutPredictions ?? [],
      officialKnockoutRows: officialKnockoutRows ?? [],
      tiebreakRows: tiebreakRows ?? [],
      adminTiebreakRows: adminTiebreakRows ?? [],
      allExtraPredictions: allExtraPredictions ?? [],
      officialExtraRows: officialExtraRows ?? [],
    });

    const days = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];

    // Posiciones anteriores: una sola fila por entry (upsert en update-results),
    // así que basta con leer directamente la tabla filtrada por pool.
    const prevMap = new Map<string, number>();
    const prevGroupMap = new Map<string, number>();
    let lastUpdate: string | null = null;

    (snapshots ?? []).forEach((s: SnapshotRow) => {
      prevMap.set(String(s.entry_id), s.position);
      if (s.group_position != null) prevGroupMap.set(String(s.entry_id), s.group_position);
      if (s.captured_at && (!lastUpdate || s.captured_at > lastUpdate)) {
        lastUpdate = s.captured_at;
      }
    });

    const standings = currentStandings.map((row, index) => {
      const position = index + 1;
      const prev = prevMap.get(row.entry_id) ?? position;

      let movement: "up" | "down" | "same" = "same";
      let movement_value = 0;
      if (position < prev) { movement = "up"; movement_value = prev - position; }
      else if (position > prev) { movement = "down"; movement_value = position - prev; }

      return {
        ...row,
        position,
        movement,
        movement_value,
        // El front (StandingsTable) usa prev_group_position para calcular
        // la variación de la pestaña "fase de grupos" comparándola con la
        // posición que toca AHORA en ese orden distinto.
        prev_group_position: prevGroupMap.get(row.entry_id) ?? null,
        outcome_percent: row.total_group_matches > 0
          ? Math.round((row.outcome_hits / row.total_group_matches) * 100) : 0,
        exact_percent: row.total_group_matches > 0
          ? Math.round((row.exact_hits / row.total_group_matches) * 100) : 0,
      };
    });

    return NextResponse.json({ days, standings, lastUpdate });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error cargando clasificación" }, { status: 500 });
  }
}
