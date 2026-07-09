/**
 * /api/admin/simulate
 *
 * Endpoint de SOLO LECTURA para el simulador de resultados del admin.
 *
 * GARANTÍAS DE AISLAMIENTO (no tocar si se amplía este archivo):
 * - Nunca hace INSERT/UPDATE/DELETE en Supabase. Solo SELECT.
 * - Nunca llama a recalculateScoresAll, ni escribe en entry_scores,
 *   standings_snapshots, official_group_results, official_knockout_results
 *   ni official_extra_results.
 * - Los resultados "simulados" viven solo en la request (body del POST) y en
 *   el estado del navegador del admin que los pidió. No se persisten en ningún
 *   sitio, así que ningún otro usuario (ni otro admin) puede verlos.
 * - No lleva Cache-Control de CDN: cada simulación es distinta y no debe
 *   cachearse ni compartirse entre requests de distintos admins.
 *
 * GET  -> datos reales necesarios para construir el formulario del simulador
 *         (resultados de grupos, picks de eliminatorias, preguntas extra y
 *         tiebreaks de admin, todos oficiales/reales).
 * POST -> recibe overrides (resultados hipotéticos de grupos, ganadores de
 *         eliminatorias y/o preguntas extra) y devuelve la clasificación
 *         resultante, calculada con calculateStandings, en el mismo formato
 *         que /api/standings.
 *
 * El bracket de eliminatorias (buildRealKnockoutBracket) se resuelve de forma
 * puramente incremental a partir de un mapa match_id -> equipo_ganador, así
 * que sobreescribir el ganador de un partido de eliminatorias basta para que
 * las siguientes rondas se recalculen solas — no hace falta lógica extra.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { calculateStandings } from "@/lib/calculateStandings";

const PAGE = 1000;

async function fetchAllNoFilter(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  selectFields: string
): Promise<any[]> {
  const results: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(selectFields)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    results.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return results;
}

async function fetchAllByPoolId(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  selectFields: string,
  poolId: string
): Promise<any[]> {
  const results: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(selectFields)
      .eq("pool_id", poolId)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    results.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return results;
}

async function fetchSubmittedEntries(
  supabase: ReturnType<typeof createAdminClient>,
  poolId: string
): Promise<any[]> {
  const results: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("entries")
      .select("id, name, email, company, country, pool_id")
      .eq("pool_id", poolId)
      .eq("status", "submitted")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    results.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return results;
}

/** Verifica que quien llama es un admin autenticado. Redirect no aplica en
 * una API route, así que devolvemos 401/403 en su lugar. */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    return { ok: false as const, response: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }

  return { ok: true as const };
}

// ─── GET: datos reales para construir el formulario ───────────────────────

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const supabase = createAdminClient();

    const [officialGroupRows, officialKnockoutRows, officialExtraRows, adminTiebreakRows] = await Promise.all([
      fetchAllNoFilter(supabase, "official_group_results", "match_id, home_goals, away_goals"),
      fetchAllNoFilter(supabase, "official_knockout_results", "match_id, picked_team_id"),
      fetchAllNoFilter(supabase, "official_extra_results", "question_key, official_value"),
      fetchAllNoFilter(supabase, "admin_tiebreaks", "scope, scope_value, team_id, priority"),
    ]);

    return NextResponse.json(
      { officialGroupRows, officialKnockoutRows, officialExtraRows, adminTiebreakRows },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error cargando datos del simulador" }, { status: 500 });
  }
}

// ─── POST: calcula la clasificación simulada (no persiste nada) ───────────

type GroupOverride = { matchId: string; homeGoals: number | null; awayGoals: number | null };
type ExtraOverride = { questionKey: string; value: string | null };
type KnockoutOverride = { matchId: string; pickedTeamId: string | null };

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const poolId: string | undefined = body?.poolId;
    const groupOverrides: GroupOverride[] = Array.isArray(body?.groupOverrides) ? body.groupOverrides : [];
    const extraOverrides: ExtraOverride[] = Array.isArray(body?.extraOverrides) ? body.extraOverrides : [];
    const knockoutOverrides: KnockoutOverride[] = Array.isArray(body?.knockoutOverrides) ? body.knockoutOverrides : [];

    if (!poolId) {
      return NextResponse.json({ error: "poolId requerido" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Misma data real que usa /api/standings — nunca se escribe, solo se lee.
    const [
      entries,
      scores,
      officialGroupRows,
      officialKnockoutRows,
      adminTiebreakRows,
      officialExtraRows,
      allGroupPredictions,
      allKnockoutPredictions,
      tiebreakRows,
      allExtraPredictions,
    ] = await Promise.all([
      fetchSubmittedEntries(supabase, poolId),
      fetchAllByPoolId(supabase, "entry_scores", "entry_id, pool_id, matchday, stage, points, is_exact, is_outcome", poolId),
      fetchAllNoFilter(supabase, "official_group_results", "match_id, home_goals, away_goals"),
      fetchAllNoFilter(supabase, "official_knockout_results", "match_id, picked_team_id"),
      fetchAllNoFilter(supabase, "admin_tiebreaks", "scope, scope_value, team_id, priority"),
      fetchAllNoFilter(supabase, "official_extra_results", "question_key, official_value"),
      fetchAllNoFilter(supabase, "entry_group_predictions", "entry_id, match_id, home_goals, away_goals"),
      fetchAllNoFilter(supabase, "entry_knockout_predictions", "entry_id, match_id, picked_team_id"),
      fetchAllNoFilter(supabase, "entry_tiebreaks", "entry_id, scope, scope_value, team_id, priority"),
      fetchAllNoFilter(supabase, "entry_extra_predictions", "entry_id, question_key, predicted_value, normalized_value"),
    ]);

    // ── Mezcla: overrides simulados pisan los resultados reales, solo en memoria ──
    const groupOverrideMap = new Map(groupOverrides.map((o) => [o.matchId, o]));
    const simulatedGroupRows = officialGroupRows.map((row: any) => {
      const override = groupOverrideMap.get(row.match_id);
      if (!override) return row;
      return { ...row, home_goals: override.homeGoals, away_goals: override.awayGoals };
    });
    // Overrides de partidos que aún no existían como fila oficial (sin resultado real todavía)
    groupOverrides.forEach((o) => {
      if (!officialGroupRows.some((row: any) => row.match_id === o.matchId)) {
        simulatedGroupRows.push({ match_id: o.matchId, home_goals: o.homeGoals, away_goals: o.awayGoals });
      }
    });

    const extraOverrideMap = new Map(extraOverrides.map((o) => [o.questionKey, o]));
    const simulatedExtraRows = officialExtraRows.map((row: any) => {
      const override = extraOverrideMap.get(row.question_key);
      if (!override) return row;
      return { ...row, official_value: override.value ?? "" };
    });
    extraOverrides.forEach((o) => {
      if (!officialExtraRows.some((row: any) => row.question_key === o.questionKey)) {
        simulatedExtraRows.push({ question_key: o.questionKey, official_value: o.value ?? "" });
      }
    });

    const knockoutOverrideMap = new Map(knockoutOverrides.map((o) => [o.matchId, o]));
    const simulatedKnockoutRows = officialKnockoutRows.map((row: any) => {
      const override = knockoutOverrideMap.get(row.match_id);
      if (!override) return row;
      return { ...row, picked_team_id: override.pickedTeamId };
    });
    knockoutOverrides.forEach((o) => {
      if (!officialKnockoutRows.some((row: any) => row.match_id === o.matchId)) {
        simulatedKnockoutRows.push({ match_id: o.matchId, picked_team_id: o.pickedTeamId });
      }
    });

    const standings = calculateStandings({
      entries,
      scores,
      officialGroupRows: simulatedGroupRows,
      allGroupPredictions,
      allKnockoutPredictions,
      officialKnockoutRows: simulatedKnockoutRows,
      tiebreakRows,
      adminTiebreakRows,
      allExtraPredictions,
      officialExtraRows: simulatedExtraRows,
    });

    const days = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];

    const rankedStandings = standings.map((row, index) => ({
      ...row,
      position: index + 1,
      movement: "same" as const,
      movement_value: 0,
      prev_group_position: null,
      outcome_percent: row.total_group_matches > 0
        ? Math.round((row.outcome_hits / row.total_group_matches) * 100) : 0,
      exact_percent: row.total_group_matches > 0
        ? Math.round((row.exact_hits / row.total_group_matches) * 100) : 0,
    }));

    return NextResponse.json(
      { days, standings: rankedStandings },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error calculando simulación" }, { status: 500 });
  }
}
