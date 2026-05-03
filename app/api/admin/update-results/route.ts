
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { recalculateScoresAll } from "@/lib/recalculateScoresAll";
import { calculateStandings } from "@/lib/calculateStandings";

type GroupResultRow = {
  match_id: string;
  home_goals: number;
  away_goals: number;
};

type KnockoutResultRow = {
  match_id: string;
  picked_team_id: string;
};

type ExtraResultRow = {
  question_key: string;
  official_value: string;
};

type AdminTiebreakRow = {
  scope: "group" | "third_place";
  scope_value: string;
  team_id: string;
  priority: number;
};

type EntryRow = {
  id: string;
  pool_id: string;
  name: string | null;
  email: string | null;
};

type ScoreRow = {
  entry_id: string;
  pool_id: string;
  points: number | null;
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const adminSupabase = createAdminClient();

    const body = await req.json();
    const groupResults = (body.groupResults ?? []) as GroupResultRow[];
    const knockoutResults = (body.knockoutResults ?? []) as KnockoutResultRow[];
    const extraResults = (body.extraResults ?? []) as ExtraResultRow[];
    const adminTiebreaks = (body.adminTiebreaks ?? []) as AdminTiebreakRow[];

    // 1. Limpiar resultados oficiales actuales
    const { error: deleteGroupError } = await adminSupabase
      .from("official_group_results")
      .delete()
      .not("match_id", "is", null);

    if (deleteGroupError) {
      return NextResponse.json(
        { error: deleteGroupError.message },
        { status: 500 }
      );
    }

    const { error: deleteKnockoutError } = await adminSupabase
      .from("official_knockout_results")
      .delete()
      .not("match_id", "is", null);

    if (deleteKnockoutError) {
      return NextResponse.json(
        { error: deleteKnockoutError.message },
        { status: 500 }
      );
    }

    // Borrar siempre los extras para que los campos vaciados se eliminen correctamente
    const { error: deleteExtraError } = await adminSupabase
      .from("official_extra_results")
      .delete()
      .not("question_key", "is", null);

    if (deleteExtraError) {
      return NextResponse.json(
        { error: deleteExtraError.message },
        { status: 500 }
      );
    }

    // 2. Limpiar desempates admin actuales
    const { error: deleteTiebreaksError } = await adminSupabase
      .from("admin_tiebreaks")
      .delete()
      .in("scope", ["group", "third_place"]);

    if (deleteTiebreaksError) {
      return NextResponse.json(
        { error: deleteTiebreaksError.message },
        { status: 500 }
      );
    }

    // 3. Insertar solo lo que venga ahora
    if (groupResults.length > 0) {
      const { error: insertGroupError } = await adminSupabase
        .from("official_group_results")
        .insert(groupResults);

      if (insertGroupError) {
        return NextResponse.json(
          { error: insertGroupError.message },
          { status: 500 }
        );
      }
    }

    if (knockoutResults.length > 0) {
      const { error: insertKnockoutError } = await adminSupabase
        .from("official_knockout_results")
        .insert(knockoutResults);

      if (insertKnockoutError) {
        return NextResponse.json(
          { error: insertKnockoutError.message },
          { status: 500 }
        );
      }
    }

    if (extraResults.length > 0) {
      const { error: insertExtraError } = await adminSupabase
        .from("official_extra_results")
        .insert(extraResults);

      if (insertExtraError) {
        return NextResponse.json(
          { error: insertExtraError.message },
          { status: 500 }
        );
      }
    }

    if (adminTiebreaks.length > 0) {
      const { error: insertTiebreaksError } = await adminSupabase
        .from("admin_tiebreaks")
        .insert(adminTiebreaks);

      if (insertTiebreaksError) {
        return NextResponse.json(
          { error: insertTiebreaksError.message },
          { status: 500 }
        );
      }
    }

    // 4. Recalcular puntuaciones desde cero
    const debug = await recalculateScoresAll();

    // 5. Crear snapshot usando exactamente la misma función que la clasificación en vivo
    const { data: allEntries } = await adminSupabase
      .from("entries")
      .select("id, name, email, company, country, pool_id")
      .eq("status", "submitted");

    const poolIds = [...new Set((allEntries ?? []).map((e: any) => String(e.pool_id)))] as string[];

    // Fetch datos compartidos (no dependen del pool)
    const [
      { data: officialGroupRows },
      { data: officialKnockoutRows },
      { data: adminTiebreakRows },
      { data: officialExtraRows },
      { data: allScores },
      { data: allExtraPredictions },
    ] = await Promise.all([
      adminSupabase.from("official_group_results").select("match_id, home_goals, away_goals"),
      adminSupabase.from("official_knockout_results").select("match_id, picked_team_id"),
      adminSupabase.from("admin_tiebreaks").select("scope, scope_value, team_id, priority"),
      adminSupabase.from("official_extra_results").select("question_key, official_value"),
      adminSupabase.from("entry_scores").select("entry_id, pool_id, matchday, stage, points, is_exact, is_outcome"),
      adminSupabase.from("entry_extra_predictions").select("entry_id, question_key, predicted_value"),
    ]);

    const allEntryIds = (allEntries ?? []).map((e: any) => e.id);

    const [
      { data: allGroupPredictions },
      { data: allKnockoutPredictions },
      { data: allTiebreakRows },
    ] = await Promise.all([
      adminSupabase.from("entry_group_predictions").select("entry_id, match_id, home_goals, away_goals").in("entry_id", allEntryIds),
      adminSupabase.from("entry_knockout_predictions").select("entry_id, match_id, picked_team_id").in("entry_id", allEntryIds),
      adminSupabase.from("entry_tiebreaks").select("entry_id, scope, scope_value, team_id, priority").in("entry_id", allEntryIds),
    ]);

    const snapshotRows: Array<{
      pool_id: string;
      entry_id: string;
      position: number;
      total_points: number;
      group_position: number;
    }> = [];

    for (const poolId of poolIds) {
      const poolEntries = (allEntries ?? []).filter((e: any) => String(e.pool_id) === poolId);
      const poolEntryIds = new Set(poolEntries.map((e: any) => String(e.id)));

      // Usar exactamente calculateStandings — misma función que standings/route.ts
      const poolStandings = calculateStandings({
        entries: poolEntries,
        scores: (allScores ?? []).filter((r: any) => String(r.pool_id) === poolId),
        officialGroupRows: officialGroupRows ?? [],
        allGroupPredictions: (allGroupPredictions ?? []).filter((r: any) => poolEntryIds.has(String(r.entry_id))),
        allKnockoutPredictions: (allKnockoutPredictions ?? []).filter((r: any) => poolEntryIds.has(String(r.entry_id))),
        officialKnockoutRows: officialKnockoutRows ?? [],
        tiebreakRows: (allTiebreakRows ?? []).filter((r: any) => poolEntryIds.has(String(r.entry_id))),
        adminTiebreakRows: adminTiebreakRows ?? [],
        allExtraPredictions: (allExtraPredictions ?? []).filter((r: any) => poolEntryIds.has(String(r.entry_id))),
        officialExtraRows: officialExtraRows ?? [],
      });

      // Posición general: ya viene ordenada de calculateStandings
      // Posición de grupos: ordenar por group_total + extra_group_points
      const sortedByGroups = [...poolStandings].sort((a, b) => {
        const aG = a.group_total + a.extra_group_points;
        const bG = b.group_total + b.extra_group_points;
        if (bG !== aG) return bG - aG;
        return a.name.localeCompare(b.name);
      });
      const groupPosMap = new Map(sortedByGroups.map((r, i) => [r.entry_id, i + 1]));

      poolStandings.forEach((row, index) => {
        snapshotRows.push({
          pool_id: poolId,
          entry_id: row.entry_id,
          position: index + 1,
          total_points: row.total_points,
          group_position: groupPosMap.get(row.entry_id) ?? index + 1,
        });
      });
    }

    if (snapshotRows.length > 0) {
      // Mantener solo el snapshot más reciente como "anterior" para calcular variación
      for (const poolId of poolIds) {
        const { data: existingSnaps } = await adminSupabase
          .from("standings_snapshots")
          .select("captured_at")
          .eq("pool_id", poolId)
          .order("captured_at", { ascending: false })
          .limit(1);

        if (existingSnaps && existingSnaps.length > 0) {
          const latestTime = existingSnaps[0].captured_at;
          await adminSupabase
            .from("standings_snapshots")
            .delete()
            .eq("pool_id", poolId)
            .neq("captured_at", latestTime);
        }
      }

      const { error: snapshotError } = await adminSupabase
        .from("standings_snapshots")
        .insert(snapshotRows);

      if (snapshotError) {
        return NextResponse.json({ error: snapshotError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, debug });
  } catch (error: any) {
    console.error("ERROR API ADMIN:", error);

    return NextResponse.json(
      {
        error: "Error actualizando resultados",
        details:
          error?.message ||
          error?.details ||
          error?.hint ||
          JSON.stringify(error, null, 2),
      },
      { status: 500 }
    );
  }
}