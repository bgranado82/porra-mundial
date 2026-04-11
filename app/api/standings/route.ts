
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const poolId = searchParams.get("poolId");

    if (!poolId) {
      return NextResponse.json({ error: "poolId requerido" }, { status: 400 });
    }

    const { data: scores, error } = await supabase
      .from("entry_scores")
      .select("entry_id, pool_id, matchday, stage, points, is_exact, is_outcome")
      .eq("pool_id", poolId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: entries, error: entriesError } = await supabase
      .from("entries")
      .select("id, name, email")
      .eq("pool_id", poolId);

    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    const entryMap = new Map(
      (entries ?? []).map((entry) => [entry.id, entry])
    );

    const grouped = new Map<
      string,
      {
        entry_id: string;
        name: string;
        total_points: number;
        day_1: number;
        day_2: number;
        day_3: number;
        outcome_hits: number;
        exact_hits: number;
        total_group_matches: number;
      }
    >();

    (scores ?? []).forEach((row) => {
      const current = grouped.get(row.entry_id) ?? {
        entry_id: row.entry_id,
        name:
          entryMap.get(row.entry_id)?.name ||
          entryMap.get(row.entry_id)?.email ||
          "Jugador",
        total_points: 0,
        day_1: 0,
        day_2: 0,
        day_3: 0,
        outcome_hits: 0,
        exact_hits: 0,
        total_group_matches: 0,
      };

      current.total_points += row.points ?? 0;

      if (row.matchday === 1) current.day_1 += row.points ?? 0;
      if (row.matchday === 2) current.day_2 += row.points ?? 0;
      if (row.matchday === 3) current.day_3 += row.points ?? 0;

      if (row.stage === "group") {
        current.total_group_matches += 1;
        if (row.is_outcome) current.outcome_hits += 1;
        if (row.is_exact) current.exact_hits += 1;
      }

      grouped.set(row.entry_id, current);
    });

    const standings = Array.from(grouped.values())
      .sort((a, b) => b.total_points - a.total_points)
      .map((row, index) => ({
        ...row,
        position: index + 1,
        outcome_percent:
          row.total_group_matches > 0
            ? Math.round((row.outcome_hits / row.total_group_matches) * 100)
            : 0,
        exact_percent:
          row.total_group_matches > 0
            ? Math.round((row.exact_hits / row.total_group_matches) * 100)
            : 0,
      }));

    return NextResponse.json({ standings });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error cargando clasificación" },
      { status: 500 }
    );
  }
}