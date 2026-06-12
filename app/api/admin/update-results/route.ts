
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { recalculateScoresAll } from "@/lib/recalculateScoresAll";

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

    // 0. Guardar snapshot de posiciones ANTES de tocar nada.
    //    En vez de duplicar la lógica de cálculo, llamamos al MISMO endpoint
    //    /api/standings que ya pinta la clasificación del usuario y guardamos
    //    las posiciones que devuelve. Misma fuente, mismo resultado.
    try {
      const { data: snapPools } = await adminSupabase
        .from("entries")
        .select("pool_id")
        .eq("status", "submitted")
        .range(0, 99999);

      const poolIds = [...new Set((snapPools ?? []).map((e: any) => String(e.pool_id)))];

      // Construir URL absoluta a partir de la request actual
      const origin = new URL(req.url).origin;

      const snapRows: any[] = [];

      // Timestamp único del guardado: se escribe en TODAS las filas de TODOS
      // los pools para que "Actualizado" refleje exactamente cuándo se pulsó
      // el botón de guardar resultados (idéntico en todos los pools).
      const capturedAt = new Date().toISOString();

      for (const pid of poolIds) {
        const resp = await fetch(`${origin}/api/standings?poolId=${pid}`, {
          headers: { cookie: req.headers.get("cookie") ?? "" },
        });
        if (!resp.ok) continue;
        const json = await resp.json();
        const standings = json.standings ?? [];

        // standings viene ordenado por la posición general (position = index + 1).
        // group_position se calcula igual que en el front (ordenando por
        // group_total + extra_group_points).
        const sortedByGroups = [...standings].sort((a: any, b: any) => {
          const aG = (a.group_total ?? 0) + (a.extra_group_points ?? 0);
          const bG = (b.group_total ?? 0) + (b.extra_group_points ?? 0);
          if (bG !== aG) return bG - aG;
          return String(a.name ?? "").localeCompare(String(b.name ?? ""));
        });
        const groupPosMap = new Map<string, number>(
          sortedByGroups.map((r: any, i: number) => [String(r.entry_id), i + 1])
        );

        standings.forEach((row: any) => {
          snapRows.push({
            pool_id: pid,
            entry_id: row.entry_id,
            position: row.position,
            total_points: row.total_points,
            group_position: groupPosMap.get(String(row.entry_id)) ?? row.position,
            captured_at: capturedAt,
          });
        });
      }

      if (snapRows.length > 0) {
        await adminSupabase
          .from("standings_snapshots")
          .upsert(snapRows, { onConflict: "pool_id,entry_id" });
      }
    } catch (snapErr) {
      console.error("Snapshot error (non-blocking):", snapErr);
    }

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