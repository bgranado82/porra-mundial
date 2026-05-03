
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { recalculateScoresAll } from "@/lib/recalculateScoresAll";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";
import { scoreSettings } from "@/data/settings";

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

    // Fetch extras para incluirlos en el snapshot (igual que standings/route.ts)
    const { data: allExtraPreds } = await adminSupabase
      .from("entry_extra_predictions")
      .select("entry_id, question_key, predicted_value");

    const { data: officialExtrasSnap } = await adminSupabase
      .from("official_extra_results")
      .select("question_key, official_value");

    const officialExtraSnapMap: Record<string, string> = {};
    (officialExtrasSnap ?? []).forEach((row: any) => {
      officialExtraSnapMap[row.question_key] = row.official_value;
    });

    const extraPredsByEntry = new Map<string, Record<string, string>>();
    (allExtraPreds ?? []).forEach((row: any) => {
      const id = String(row.entry_id);
      if (!extraPredsByEntry.has(id)) extraPredsByEntry.set(id, {});
      extraPredsByEntry.get(id)![row.question_key] = row.predicted_value ?? "";
    });

    function normalizeForSnapshot(v: string | null | undefined): string {
      return String(v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
    }

    function calcExtraPoints(entryId: string): number {
      const preds = extraPredsByEntry.get(entryId) ?? {};
      let pts = 0;
      for (const [key, officialVal] of Object.entries(officialExtraSnapMap)) {
        const predicted = preds[key] ?? "";
        if (!predicted || !officialVal) continue;
        if (normalizeForSnapshot(predicted) === normalizeForSnapshot(officialVal)) {
          const q = EXTRA_QUESTIONS.find((q) => q.key === key);
          if (q) pts += (scoreSettings[q.pointsKey as keyof typeof scoreSettings] as number) ?? 0;
        }
      }
      return pts;
    }

    function calcExtraGroupPoints(entryId: string): number {
      const groupKeys = ["first_goal_scorer_world", "first_goal_scorer_spain"];
      const preds = extraPredsByEntry.get(entryId) ?? {};
      let pts = 0;
      for (const key of groupKeys) {
        const officialVal = officialExtraSnapMap[key] ?? "";
        const predicted = preds[key] ?? "";
        if (!predicted || !officialVal) continue;
        if (normalizeForSnapshot(predicted) === normalizeForSnapshot(officialVal)) {
          const q = EXTRA_QUESTIONS.find((q) => q.key === key);
          if (q) pts += (scoreSettings[q.pointsKey as keyof typeof scoreSettings] as number) ?? 0;
        }
      }
      return pts;
    }

    const typedEntries = (entries ?? []) as EntryRow[];
    const typedScores = (scores ?? []) as ScoreRow[];

    const entryMap = new Map<string, EntryRow>(
      typedEntries.map((entry) => [String(entry.id), entry])
    );

    const grouped = new Map<
      string,
      { entry_id: string; pool_id: string; total_points: number; group_points: number; name: string }
    >();

    typedScores.forEach((row: any) => {
      const entryId = String(row.entry_id);
      const entry = entryMap.get(entryId);
      if (!entry) return;

      const current = grouped.get(entryId) ?? {
        entry_id: entryId,
        pool_id: String(row.pool_id),
        total_points: 0,
        group_points: 0,
        name: entry.name || entry.email || "Jugador",
      };

      const pts = Number(row.points ?? 0);
      current.total_points += pts;
      if (row.stage === "group") current.group_points += pts;
      grouped.set(entryId, current);
    });

    // Añadir puntos extra a cada entrada del snapshot
    grouped.forEach((row) => {
      const extraPts = calcExtraPoints(row.entry_id);
      row.total_points += extraPts;
      // extra_group_points (first_goal_scorer_world y first_goal_scorer_spain) van también a grupos
      const extraGroupPts = calcExtraGroupPoints(row.entry_id);
      row.group_points += extraGroupPts;
    });

    const byPool = new Map<
      string,
      Array<{ entry_id: string; pool_id: string; total_points: number; group_points: number; name: string }>
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
      group_position: number;
    }> = [];

    for (const [poolId, poolRows] of byPool.entries()) {
      const sortedGeneral = [...poolRows].sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points;
        return a.name.localeCompare(b.name);
      });

      const sortedGroups = [...poolRows].sort((a, b) => {
        if (b.group_points !== a.group_points) return b.group_points - a.group_points;
        return a.name.localeCompare(b.name);
      });

      const groupPosMap = new Map(sortedGroups.map((r, i) => [r.entry_id, i + 1]));

      sortedGeneral.forEach((row, index) => {
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