
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

    // 5. Crear snapshot de clasificación tras recalcular
    const { data: entries, error: entriesError } = await adminSupabase
      .from("entries")
      .select("id, pool_id, name, email");

    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    const { data: scores, error: scoresError } = await adminSupabase
      .from("entry_scores")
      .select("entry_id, pool_id, points");

    if (scoresError) {
      return NextResponse.json({ error: scoresError.message }, { status: 500 });
    }

    const typedEntries = (entries ?? []) as EntryRow[];
    const typedScores = (scores ?? []) as ScoreRow[];

    const entryMap = new Map<string, EntryRow>(
      typedEntries.map((entry) => [String(entry.id), entry])
    );

    const grouped = new Map<
      string,
      { entry_id: string; pool_id: string; total_points: number; name: string }
    >();

    typedScores.forEach((row) => {
      const entryId = String(row.entry_id);
      const entry = entryMap.get(entryId);
      if (!entry) return;

      const current = grouped.get(entryId) ?? {
        entry_id: entryId,
        pool_id: String(row.pool_id),
        total_points: 0,
        name: entry.name || entry.email || "Jugador",
      };

      current.total_points += Number(row.points ?? 0);
      grouped.set(entryId, current);
    });

    const byPool = new Map<
      string,
      Array<{ entry_id: string; pool_id: string; total_points: number; name: string }>
    >();

    Array.from(grouped.values()).forEach((row) => {
      const current = byPool.get(row.pool_id) ?? [];
      current.push(row);
      byPool.set(row.pool_id, current);
    });

    const snapshotRows: Array<{
      pool_id: string;
      entry_id: string;
      position: number;
      total_points: number;
    }> = [];

    for (const [poolId, poolRows] of byPool.entries()) {
      const sorted = poolRows.sort((a, b) => {
        if (b.total_points !== a.total_points) {
          return b.total_points - a.total_points;
        }
        return a.name.localeCompare(b.name);
      });

      sorted.forEach((row, index) => {
        snapshotRows.push({
          pool_id: poolId,
          entry_id: row.entry_id,
          position: index + 1,
          total_points: row.total_points,
        });
      });
    }

    if (snapshotRows.length > 0) {
      const { error: snapshotError } = await adminSupabase
        .from("standings_snapshots")
        .insert(snapshotRows);

      if (snapshotError) {
        return NextResponse.json(
          { error: snapshotError.message },
          { status: 500 }
        );
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