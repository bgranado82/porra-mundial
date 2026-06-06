import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { calculateStandings } from "@/lib/calculateStandings";

type SnapshotRow = {
  entry_id: string;
  position: number;
  group_position: number | null;
  captured_at: string | null;
};

async function fetchAll<T>(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  selectFields: string,
  filters?: Record<string, string>
): Promise<T[]> {
  const PAGE = 1000;
  let from = 0;
  const results: T[] = [];
  while (true) {
    let query = supabase.from(table).select(selectFields).range(from, from + PAGE - 1);
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
    }
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    results.push(...(data as T[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return results;
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
      entries,
      scores,
      officialGroupRows,
      officialKnockoutRows,
      adminTiebreakRows,
      officialExtraRows,
      snapshots,
      allGroupPredictions,
      allKnockoutPredictions,
      tiebreakRows,
      allExtraPredictions,
    ] = await Promise.all([
      fetchAll(supabase, "entries", "id, name, email, company, country, pool_id", { pool_id: poolId, status: "submitted" }),
      fetchAll(supabase, "entry_scores", "entry_id, pool_id, matchday, stage, points, is_exact, is_outcome", { pool_id: poolId }),
      fetchAll(supabase, "official_group_results", "match_id, home_goals, away_goals"),
      fetchAll(supabase, "official_knockout_results", "match_id, picked_team_id"),
      fetchAll(supabase, "admin_tiebreaks", "scope, scope_value, team_id, priority"),
      fetchAll(supabase, "official_extra_results", "question_key, official_value"),
      fetchAll(supabase, "standings_snapshots", "entry_id, position, group_position, captured_at", { pool_id: poolId }),
      fetchAll(supabase, "entry_group_predictions", "entry_id, match_id, home_goals, away_goals"),
      fetchAll(supabase, "entry_knockout_predictions", "entry_id, match_id, picked_team_id"),
      fetchAll(supabase, "entry_tiebreaks", "entry_id, scope, scope_value, team_id, priority"),
      fetchAll(supabase, "entry_extra_predictions", "entry_id, question_key, predicted_value, normalized_value"),
    ]);

    const currentStandings = calculateStandings({
      entries,
      scores,
      officialGroupRows,
      allGroupPredictions,
      allKnockoutPredictions,
      officialKnockoutRows,
      tiebreakRows,
      adminTiebreakRows,
      allExtraPredictions,
      officialExtraRows,
    });

    const days = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];

    const prevMap = new Map<string, number>();
    const prevGroupMap = new Map<string, number>();
    let lastUpdate: string | null = null;

    snapshots.forEach((s: SnapshotRow) => {
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
