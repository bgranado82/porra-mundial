
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { matches as initialMatches } from "@/data/matches";
import { teams } from "@/data/teams";
import { scoreSettings } from "@/data/settings";
import { buildUserKnockoutBracket } from "@/lib/knockoutBracket";
import { buildRealKnockoutBracket } from "@/lib/realKnockout";
import { calculateKnockoutScore, calculateKnockoutPrecision } from "@/lib/knockoutScoring";
import { KnockoutPredictionMap, Match } from "@/types";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";

function normalizeExtraValue(value: string | null | undefined): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

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
  group_position: number | null;
  captured_at: string;
};

type OfficialGroupRow = {
  match_id: string;
  home_goals: number | null;
  away_goals: number | null;
};

type GroupPredictionRow = {
  entry_id: string;
  match_id: string;
  home_goals: number | null;
  away_goals: number | null;
};

type KnockoutPredictionRow = {
  entry_id: string;
  match_id: string;
  picked_team_id: string | null;
};

type OfficialKnockoutRow = {
  match_id: string;
  picked_team_id: string | null;
};

type EntryTiebreakRow = {
  entry_id: string;
  scope: "group" | "third_place";
  scope_value: string;
  team_id: string;
  priority: number;
};

type PredictionMap = Record<
  string,
  { homeGoals: number | null; awayGoals: number | null }
>;

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
  champion_points: number;
  extra_group_points: number;
  extra_total_points: number;
  extra_points: ExtraPointsMap;
  total_points: number;
  outcome_hits: number;
  exact_hits: number;
  ko_r32_hits: number; ko_r32_total: number;
  ko_r16_hits: number; ko_r16_total: number;
  ko_qf_hits: number; ko_qf_total: number;
  ko_sf_hits: number; ko_sf_total: number;
  ko_final_hits: number; ko_final_total: number;
  ko_champ_hits: number; ko_champ_total: number;
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

function getScoreValue(score: any, keys: string[]) {
  for (const key of keys) {
    const value = score?.[key];
    if (typeof value === "number") return value;
  }
  return 0;
}

export async function GET(req: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const poolId = searchParams.get("poolId");

    if (!poolId) {
      return NextResponse.json({ error: "poolId requerido" }, { status: 400 });
    }

    const groups = [
      ...new Set(teams.map((team) => team.group).filter(Boolean)),
    ] as string[];

    const { data: entries, error: entriesError } = await supabase
      .from("entries")
      .select("id, name, email, company, country, pool_id")
      .eq("pool_id", poolId)
      .eq("status", "submitted");

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

    const { data: officialGroupRows, error: officialGroupError } =
      await supabase
        .from("official_group_results")
        .select("match_id, home_goals, away_goals");

    if (officialGroupError) {
      return NextResponse.json(
        { error: officialGroupError.message },
        { status: 500 }
      );
    }

    const officialMatches: Match[] = initialMatches.map((match) => {
      if (match.stage !== "group") return match;

      const official = (officialGroupRows as OfficialGroupRow[] | null)?.find(
        (row) => row.match_id === match.id
      );

      return {
        ...match,
        homeGoals: official?.home_goals ?? null,
        awayGoals: official?.away_goals ?? null,
      };
    });

    const { data: allGroupPredictions, error: groupPredictionsError } =
      await supabase
        .from("entry_group_predictions")
        .select("entry_id, match_id, home_goals, away_goals")
        .in(
          "entry_id",
          (entries ?? []).map((entry: EntryRow) => entry.id)
        );

    if (groupPredictionsError) {
      return NextResponse.json(
        { error: groupPredictionsError.message },
        { status: 500 }
      );
    }

    const { data: allKnockoutPredictions, error: koPredictionsError } =
      await supabase
        .from("entry_knockout_predictions")
        .select("entry_id, match_id, picked_team_id")
        .in(
          "entry_id",
          (entries ?? []).map((entry: EntryRow) => entry.id)
        );

    if (koPredictionsError) {
      return NextResponse.json(
        { error: koPredictionsError.message },
        { status: 500 }
      );
    }

    const { data: officialKnockoutRows, error: officialKnockoutError } =
      await supabase
        .from("official_knockout_results")
        .select("match_id, picked_team_id");

    if (officialKnockoutError) {
      return NextResponse.json(
        { error: officialKnockoutError.message },
        { status: 500 }
      );
    }

    const { data: tiebreakRows, error: tiebreakError } = await supabase
      .from("entry_tiebreaks")
      .select("entry_id, scope, scope_value, team_id, priority")
      .in(
        "entry_id",
        (entries ?? []).map((entry: EntryRow) => entry.id)
      );

    if (tiebreakError) {
      return NextResponse.json(
        { error: tiebreakError.message },
        { status: 500 }
      );
    }

    const { data: adminTiebreakRows, error: adminTiebreakError } = await supabase
      .from("admin_tiebreaks")
      .select("scope, scope_value, team_id, priority");

    if (adminTiebreakError) {
      return NextResponse.json(
        { error: adminTiebreakError.message },
        { status: 500 }
      );
    }

    const groupAdminTiebreaks: Record<string, Record<string, number>> = {};
    const thirdPlaceAdminTiebreaks: Record<string, number> = {};

    (adminTiebreakRows ?? []).forEach((row: any) => {
      if (row.scope === "group") {
        if (!groupAdminTiebreaks[row.scope_value]) groupAdminTiebreaks[row.scope_value] = {};
        groupAdminTiebreaks[row.scope_value][row.team_id] = row.priority;
      } else if (row.scope === "third_place") {
        thirdPlaceAdminTiebreaks[row.team_id] = row.priority;
      }
    });

    const { data: snapshots, error: snapshotsError } = await supabase
      .from("standings_snapshots")
      .select("entry_id, position, group_position, captured_at")
      .eq("pool_id", poolId)
      .order("captured_at", { ascending: false });

    if (snapshotsError) {
      return NextResponse.json(
        { error: snapshotsError.message },
        { status: 500 }
      );
    }

    const { data: allExtraPredictions, error: extraPredictionsError } = await supabase
      .from("entry_extra_predictions")
      .select("entry_id, question_key, predicted_value")
      .in("entry_id", (entries ?? []).map((e: EntryRow) => e.id));

    if (extraPredictionsError) {
      return NextResponse.json({ error: extraPredictionsError.message }, { status: 500 });
    }

    const { data: officialExtraRows, error: officialExtraError } = await supabase
      .from("official_extra_results")
      .select("question_key, official_value");

    if (officialExtraError) {
      return NextResponse.json({ error: officialExtraError.message }, { status: 500 });
    }

    const officialExtraMap: Record<string, string> = {};
    (officialExtraRows ?? []).forEach((row: { question_key: string; official_value: string }) => {
      officialExtraMap[row.question_key] = row.official_value;
    });

    // Extra predictions grouped by entry_id
    const extraPredByEntry = new Map<string, Record<string, string>>();
    (allExtraPredictions ?? []).forEach((row: { entry_id: string; question_key: string; predicted_value: string | null }) => {
      const entryId = String(row.entry_id);
      if (!extraPredByEntry.has(entryId)) extraPredByEntry.set(entryId, {});
      extraPredByEntry.get(entryId)![row.question_key] = row.predicted_value ?? "";
    });

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
        champion_points: 0,
        extra_group_points: 0,
        extra_total_points: 0,
        extra_points: createEmptyExtraPoints(),
        total_points: 0,
        outcome_hits: 0,
        exact_hits: 0,
        ko_r32_hits: 0, ko_r32_total: 0,
        ko_r16_hits: 0, ko_r16_total: 0,
        ko_qf_hits: 0, ko_qf_total: 0,
        ko_sf_hits: 0, ko_sf_total: 0,
        ko_final_hits: 0, ko_final_total: 0,
        ko_champ_hits: 0, ko_champ_total: 0,
        total_group_matches: 0,
      });
    });

    const daysSet = new Set<number>();

    // Grupos + extras desde entry_scores.
    // Knockouts NO se suman aquí para no depender de entry_scores viejos o incompletos.
    (scores ?? []).forEach((row: ScoreRow) => {
      const current = grouped.get(String(row.entry_id));
      if (!current) return;

      const pts = Number(row.points ?? 0);

      if (row.stage === "group") {
        current.total_points += pts;
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

    });

    // Calcular extras en vivo desde official_extra_results + entry_extra_predictions
    // (igual que PredictionsPageClient, para evitar dependencia de entry_scores)
    grouped.forEach((current) => {
      const entryPreds = extraPredByEntry.get(current.entry_id) ?? {};

      EXTRA_QUESTIONS.forEach((question) => {
        const predicted = entryPreds[question.key] ?? "";
        const official = officialExtraMap[question.key] ?? "";

        if (!official || !predicted) return;

        const isHit = normalizeExtraValue(predicted) === normalizeExtraValue(official);
        if (!isHit) return;

        const pts = (scoreSettings[question.pointsKey as keyof typeof scoreSettings] as number) ?? 0;

        current.extra_points[question.key as keyof ExtraPointsMap] += pts;
        current.extra_total_points += pts;
        current.total_points += pts;

        if (question.key === "first_goal_scorer_world" || question.key === "first_goal_scorer_spain") {
          current.extra_group_points += pts;
        }
      });
    });

    const realKnockoutPredictions: KnockoutPredictionMap = {};
    ((officialKnockoutRows ?? []) as OfficialKnockoutRow[]).forEach((row) => {
      realKnockoutPredictions[row.match_id] = row.picked_team_id;
    });

    const realBracket = buildRealKnockoutBracket(
      teams,
      officialMatches,
      groups,
      realKnockoutPredictions,
      { groupAdminTiebreaks, thirdPlaceAdminTiebreaks }
    );

    for (const entry of entries ?? []) {
      const entryId = String(entry.id);
      const current = grouped.get(entryId);
      if (!current) continue;

      const predictions: PredictionMap = {};
      ((allGroupPredictions ?? []) as GroupPredictionRow[])
        .filter((row) => row.entry_id === entryId)
        .forEach((row) => {
          predictions[row.match_id] = {
            homeGoals: row.home_goals,
            awayGoals: row.away_goals,
          };
        });

      const knockoutPredictions: KnockoutPredictionMap = {};
      ((allKnockoutPredictions ?? []) as KnockoutPredictionRow[])
        .filter((row) => row.entry_id === entryId)
        .forEach((row) => {
          knockoutPredictions[row.match_id] = row.picked_team_id;
        });

      const groupUserTiebreaks: Record<string, Record<string, number>> = {};
      const thirdPlaceUserTiebreaks: Record<string, number> = {};

      ((tiebreakRows ?? []) as EntryTiebreakRow[])
        .filter((row) => row.entry_id === entryId)
        .forEach((row) => {
          if (row.scope === "group") {
            if (!groupUserTiebreaks[row.scope_value]) {
              groupUserTiebreaks[row.scope_value] = {};
            }

            groupUserTiebreaks[row.scope_value][row.team_id] = row.priority;
          }

          if (row.scope === "third_place") {
            thirdPlaceUserTiebreaks[row.team_id] = row.priority;
          }
        });

      const userBracket = buildUserKnockoutBracket(
        teams,
        officialMatches,
        groups,
        predictions,
        knockoutPredictions,
        {
          groupUserTiebreaks,
          thirdPlaceUserTiebreaks,
        }
      );

      const knockoutScore = calculateKnockoutScore(
        scoreSettings,
        userBracket,
        realBracket
      ) as any;

      const koPrecision = calculateKnockoutPrecision(
        scoreSettings,
        {
          round32: userBracket.round32 ?? [],
          round16: userBracket.round16 ?? [],
          quarterfinals: userBracket.quarterfinals ?? [],
          semifinals: userBracket.semifinals ?? [],
          finals: userBracket.finals ?? [],
          championId: userBracket.championId ?? null,
        },
        {
          round32: realBracket?.round32 ?? [],
          round16: realBracket?.round16 ?? [],
          quarterfinals: realBracket?.quarterfinals ?? [],
          semifinals: realBracket?.semifinals ?? [],
          finals: realBracket?.finals ?? [],
          championId: realBracket?.championId ?? null,
        }
      );
      current.ko_r32_hits = koPrecision.round32.hits;
      current.ko_r32_total = koPrecision.round32.total;
      current.ko_r16_hits = koPrecision.round16.hits;
      current.ko_r16_total = koPrecision.round16.total;
      current.ko_qf_hits = koPrecision.quarterfinals.hits;
      current.ko_qf_total = koPrecision.quarterfinals.total;
      current.ko_sf_hits = koPrecision.semifinals.hits;
      current.ko_sf_total = koPrecision.semifinals.total;
      current.ko_final_hits = koPrecision.final.hits;
      current.ko_final_total = koPrecision.final.total;
      current.ko_champ_hits = koPrecision.champion.hits;
      current.ko_champ_total = koPrecision.champion.total;
      current.r32_points = getScoreValue(knockoutScore, ["round32", "r32"]);
      current.r16_points = getScoreValue(knockoutScore, ["round16", "r16"]);
      current.qf_points = getScoreValue(knockoutScore, [
        "quarterfinals",
        "quarterfinal",
        "qf",
      ]);
      current.sf_points = getScoreValue(knockoutScore, [
        "semifinals",
        "semifinal",
        "sf",
      ]);
      current.third_points = getScoreValue(knockoutScore, [
        "thirdPlace",
        "third",
      ]);
      current.final_points = getScoreValue(knockoutScore, ["final"]);
      current.champion_points = getScoreValue(knockoutScore, ["champion"]);

      current.total_points +=
        current.r32_points +
        current.r16_points +
        current.qf_points +
        current.sf_points +
        current.third_points +
        current.final_points +
        current.champion_points;
    }

    // Always show all 18 group stage matchdays so columns stay fixed
    const days = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];

    const currentStandings = Array.from(grouped.values()).sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }
      return a.name.localeCompare(b.name);
    });

    const snapshotTimes = Array.from(
      new Set((snapshots ?? []).map((s: SnapshotRow) => s.captured_at))
    ).sort((a, b) => (String(a) < String(b) ? 1 : -1));

    const lastUpdate = snapshotTimes[0] ?? null;
    const prevTime = snapshotTimes[1];
    const prevMap = new Map<string, number>();
    const prevGroupMap = new Map<string, number>();

    if (prevTime) {
      (snapshots ?? [])
        .filter((s: SnapshotRow) => s.captured_at === prevTime)
        .forEach((s: SnapshotRow) => {
          prevMap.set(String(s.entry_id), s.position);
          if (s.group_position != null) {
            prevGroupMap.set(String(s.entry_id), s.group_position);
          }
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

      // group_movement: se calcula en el frontend con groupStandings,
      // pero pasamos la posición de grupos anterior del snapshot
      const prevGroupPos = prevGroupMap.get(row.entry_id) ?? null;

      return {
        ...row,
        position,
        movement,
        movement_value,
        prev_group_position: prevGroupPos,
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

    return NextResponse.json({ days, standings, lastUpdate });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error cargando clasificación" },
      { status: 500 }
    );
  }
}