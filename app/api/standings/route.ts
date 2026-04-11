
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type EntryRow = {
  id: string;
  name: string | null;
  email: string | null;
};

type ScoreRow = {
  entry_id: string;
  pool_id: string;
  matchday: number | null;
  stage: string;
  points: number | null;
  is_exact: boolean | null;
  is_outcome: boolean | null;
};

type StandingRow = {
  entry_id: string;
  name: string;
  email: string;
  day_points: Record<string, number>;
  group_total: number;
  r32_points: number;
  r16_points: number;
  qf_points: number;
  sf_points: number;
  third_points: number;
  final_points: number;
  total_points: number;
  outcome_hits: number;
  exact_hits: number;
  total_group_matches: number;
};

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const poolId = searchParams.get("poolId");

    if (!poolId) {
      return NextResponse.json({ error: "poolId requerido" }, { status: 400 });
    }

    const { data: scores, error: scoresError } = await supabase
      .from("entry_scores")
      .select("entry_id, pool_id, matchday, stage, points, is_exact, is_outcome")
      .eq("pool_id", poolId);

    if (scoresError) {
      return NextResponse.json({ error: scoresError.message }, { status: 500 });
    }

    const { data: entries, error: entriesError } = await supabase
      .from("entries")
      .select("id, name, email")
      .eq("pool_id", poolId);

    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    const typedEntries = (entries ?? []) as EntryRow[];
    const typedScores = (scores ?? []) as ScoreRow[];

    const entryMap = new Map<string, EntryRow>(
      typedEntries.map((entry) => [String(entry.id), entry])
    );

    const grouped = new Map<string, StandingRow>();
    const daysSet = new Set<number>();

    typedScores.forEach((row) => {
      const entryId = String(row.entry_id);

      let current = grouped.get(entryId);

      if (!current) {
        current = {
          entry_id: entryId,
          name: entryMap.get(entryId)?.name || "Jugador",
          email: entryMap.get(entryId)?.email || "",
          day_points: {},
          group_total: 0,
          r32_points: 0,
          r16_points: 0,
          qf_points: 0,
          sf_points: 0,
          third_points: 0,
          final_points: 0,
          total_points: 0,
          outcome_hits: 0,
          exact_hits: 0,
          total_group_matches: 0,
        };
      }

      const points = Number(row.points ?? 0);
      current.total_points += points;

      if (row.stage === "group") {
        current.group_total += points;

        if (row.matchday !== null && row.matchday !== undefined) {
          const day = Number(row.matchday);
          daysSet.add(day);
          current.day_points[String(day)] =
            (current.day_points[String(day)] ?? 0) + points;
        }

        current.total_group_matches += 1;
        if (row.is_outcome) current.outcome_hits += 1;
        if (row.is_exact) current.exact_hits += 1;
      }

      if (row.stage === "r32") current.r32_points += points;
      if (row.stage === "r16") current.r16_points += points;
      if (row.stage === "qf") current.qf_points += points;
      if (row.stage === "sf") current.sf_points += points;
      if (row.stage === "third") current.third_points += points;
      if (row.stage === "final") current.final_points += points;

      grouped.set(entryId, current);
    });

    const days = Array.from(daysSet).sort((a, b) => a - b);

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

    return NextResponse.json({
      days,
      standings,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error cargando clasificación" },
      { status: 500 }
    );
  }
}