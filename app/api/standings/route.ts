
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

type EntryRow = {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  country: string | null;
  pool_id: string;
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

type SnapshotRow = {
  entry_id: string;
  position: number;
  captured_at: string;
};

type ExtraPointsMap = {
  first_goal_scorer_world: number;
  first_goal_scorer_spain: number;
  golden_boot: number;
  golden_ball: number;
  best_young_player: number;
  golden_glove: number;
  top_spanish_scorer: number;
};

type StandingRow = {
  entry_id: string;
  pool_id: string;
  name: string;
  email: string;
  company: string;
  country: string;
  day_points: Record<string, number>;
  group_total: number;
  r32_points: number;
  r16_points: number;
  qf_points: number;
  sf_points: number;
  third_points: number;
  final_points: number;
  extra_group_points: number;
  extra_total_points: number;
  extra_points: ExtraPointsMap;
  total_points: number;
  outcome_hits: number;
  exact_hits: number;
  total_group_matches: number;
};

function createEmptyExtraPoints(): ExtraPointsMap {
  return {
    first_goal_scorer_world: 0,
    first_goal_scorer_spain: 0,
    golden_boot: 0,
    golden_ball: 0,
    best_young_player: 0,
    golden_glove: 0,
    top_spanish_scorer: 0,
  };
}

export async function GET(req: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const poolId = searchParams.get("poolId");

    if (!poolId) {
      return NextResponse.json({ error: "poolId requerido" }, { status: 400 });
    }

    const { data: entries, error: entriesError } = await supabase
      .from("entries")
      .select("id, name, email, company, country, pool_id")
      .eq("pool_id", poolId);

    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    const { data: scores, error: scoresError } = await supabase
      .from("entry_scores")
      .select("entry_id, pool_id, matchday, stage, points, is_exact, is_outcome")
      .eq("pool_id", poolId);

    if (scoresError) {
      return NextResponse.json({ error: scoresError.message }, { status: 500 });
    }

    const { data: snapshots, error: snapshotsError } = await supabase
      .from("standings_snapshots")
      .select("entry_id, position, captured_at")
      .eq("pool_id", poolId)
      .order("captured_at", { ascending: false });

    if (snapshotsError) {
      return NextResponse.json(
        { error: snapshotsError.message },
        { status: 500 }
      );
    }

    const grouped = new Map<string, StandingRow>();

    (entries ?? []).forEach((entry: EntryRow) => {
      const id = String(entry.id);

      grouped.set(id, {
        entry_id: id,
        pool_id: entry.pool_id,
        name: entry.name || entry.email || "Jugador",
        email: entry.email || "",
        company: entry.company || "",
        country: entry.country || "",
        day_points: {},
        group_total: 0,
        r32_points: 0,
        r16_points: 0,
        qf_points: 0,
        sf_points: 0,
        third_points: 0,
        final_points: 0,
        extra_group_points: 0,
        extra_total_points: 0,
        extra_points: createEmptyExtraPoints(),
        total_points: 0,
        outcome_hits: 0,
        exact_hits: 0,
        total_group_matches: 0,
      });
    });

    const daysSet = new Set<number>();

    (scores ?? []).forEach((row: ScoreRow) => {
      const current = grouped.get(String(row.entry_id));
      if (!current) return;

      const pts = Number(row.points ?? 0);
      current.total_points += pts;

      if (row.stage === "group") {
        current.group_total += pts;

        if (row.matchday != null) {
          const day = Number(row.matchday);
          daysSet.add(day);

          current.day_points[String(day)] =
            (current.day_points[String(day)] ?? 0) + pts;
        }

        current.total_group_matches++;

        if (row.is_outcome) current.outcome_hits++;
        if (row.is_exact) current.exact_hits++;
        return;
      }

      if (row.stage === "r32") {
        current.r32_points += pts;
        return;
      }

      if (row.stage === "r16") {
        current.r16_points += pts;
        return;
      }

      if (row.stage === "qf") {
        current.qf_points += pts;
        return;
      }

      if (row.stage === "sf") {
        current.sf_points += pts;
        return;
      }

      if (row.stage === "third") {
        current.third_points += pts;
        return;
      }

      if (row.stage === "final") {
        current.final_points += pts;
        return;
      }

      if (row.stage.startsWith("extra:")) {
        const questionKey = row.stage.replace("extra:", "") as keyof ExtraPointsMap;

        if (questionKey in current.extra_points) {
          current.extra_points[questionKey] += pts;
          current.extra_total_points += pts;

          if (
            questionKey === "first_goal_scorer_world" ||
            questionKey === "first_goal_scorer_spain"
          ) {
            current.extra_group_points += pts;
          }
        }
      }
    });

    const days = Array.from(daysSet).sort((a, b) => a - b);

    const currentStandings = Array.from(grouped.values()).sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }
      return a.name.localeCompare(b.name);
    });

    const snapshotTimes = Array.from(
      new Set((snapshots ?? []).map((s: SnapshotRow) => s.captured_at))
    ).sort((a, b) => (a < b ? 1 : -1));

    const prevTime = snapshotTimes[1];
    const prevMap = new Map<string, number>();

    if (prevTime) {
      (snapshots ?? [])
        .filter((s: SnapshotRow) => s.captured_at === prevTime)
        .forEach((s: SnapshotRow) => {
          prevMap.set(String(s.entry_id), s.position);
        });
    }

    const standings = currentStandings.map((row, index) => {
      const position = index + 1;
      const prev = prevMap.get(row.entry_id) ?? position;

      let movement: "up" | "down" | "same" = "same";
      let movement_value = 0;

      if (position < prev) {
        movement = "up";
        movement_value = prev - position;
      } else if (position > prev) {
        movement = "down";
        movement_value = position - prev;
      }

      return {
        ...row,
        position,
        movement,
        movement_value,
        outcome_percent:
          row.total_group_matches > 0
            ? Math.round((row.outcome_hits / row.total_group_matches) * 100)
            : 0,
        exact_percent:
          row.total_group_matches > 0
            ? Math.round((row.exact_hits / row.total_group_matches) * 100)
            : 0,
      };
    });

    return NextResponse.json({ days, standings });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error cargando clasificación" },
      { status: 500 }
    );
  }
}