import { matches as initialMatches } from "@/data/matches";
import { teams } from "@/data/teams";
import { scoreSettings } from "@/data/settings";
import { buildUserKnockoutBracket } from "@/lib/knockoutBracket";
import { buildRealKnockoutBracket } from "@/lib/realKnockout";
import { calculateKnockoutScore, calculateKnockoutPrecision } from "@/lib/knockoutScoring";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";
import { KnockoutPredictionMap, Match } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExtraPointsMap = {
  first_goal_scorer_world: number;
  first_goal_scorer_spain: number;
  golden_boot: number;
  golden_ball: number;
  best_young_player: number;
  golden_glove: number;
  top_spanish_scorer: number;
};

export type StandingRow = {
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

type AdminTiebreakRow = {
  scope: string;
  scope_value: string;
  team_id: string;
  priority: number;
};

type PredictionMap = Record<
  string,
  { homeGoals: number | null; awayGoals: number | null }
>;

export type CalculateStandingsInput = {
  entries: EntryRow[];
  scores: ScoreRow[];
  officialGroupRows: OfficialGroupRow[];
  allGroupPredictions: GroupPredictionRow[];
  allKnockoutPredictions: KnockoutPredictionRow[];
  officialKnockoutRows: OfficialKnockoutRow[];
  tiebreakRows: EntryTiebreakRow[];
  adminTiebreakRows: AdminTiebreakRow[];
  allExtraPredictions: { entry_id: string; question_key: string; predicted_value: string | null }[];
  officialExtraRows: { question_key: string; official_value: string }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function normalizeExtraValue(value: string | null | undefined): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

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

function getScoreValue(score: any, keys: string[]): number {
  for (const key of keys) {
    const value = score?.[key];
    if (typeof value === "number") return value;
  }
  return 0;
}

// ─── Main calculation ─────────────────────────────────────────────────────────

export function calculateStandings(input: CalculateStandingsInput): StandingRow[] {
  const {
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
  } = input;

  const groups = [
    ...new Set(teams.map((team) => team.group).filter(Boolean)),
  ] as string[];

  // Official matches with results
  const officialMatches: Match[] = initialMatches.map((match) => {
    if (match.stage !== "group") return match;
    const official = officialGroupRows.find((row) => row.match_id === match.id);
    return {
      ...match,
      homeGoals: official?.home_goals ?? null,
      awayGoals: official?.away_goals ?? null,
    };
  });

  // Admin tiebreaks
  const groupAdminTiebreaks: Record<string, Record<string, number>> = {};
  const thirdPlaceAdminTiebreaks: Record<string, number> = {};
  adminTiebreakRows.forEach((row) => {
    if (row.scope === "group") {
      if (!groupAdminTiebreaks[row.scope_value]) groupAdminTiebreaks[row.scope_value] = {};
      groupAdminTiebreaks[row.scope_value][row.team_id] = row.priority;
    } else if (row.scope === "third_place") {
      thirdPlaceAdminTiebreaks[row.team_id] = row.priority;
    }
  });

  // Official extra results map
  const officialExtraMap: Record<string, string> = {};
  officialExtraRows.forEach((row) => {
    officialExtraMap[row.question_key] = row.official_value;
  });

  // Extra predictions by entry
  const extraPredByEntry = new Map<string, Record<string, string>>();
  allExtraPredictions.forEach((row) => {
    const entryId = String(row.entry_id);
    if (!extraPredByEntry.has(entryId)) extraPredByEntry.set(entryId, {});
    extraPredByEntry.get(entryId)![row.question_key] = row.predicted_value ?? "";
  });

  // Initialize grouped map
  const grouped = new Map<string, StandingRow>();
  entries.forEach((entry) => {
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

  // Group stage points from entry_scores
  scores.forEach((row) => {
    const current = grouped.get(String(row.entry_id));
    if (!current) return;
    const pts = Number(row.points ?? 0);
    if (row.stage === "group") {
      current.total_points += pts;
      current.group_total += pts;
      if (row.matchday != null) {
        const day = Number(row.matchday);
        current.day_points[String(day)] = (current.day_points[String(day)] ?? 0) + pts;
      }
      current.total_group_matches++;
      if (row.is_outcome) current.outcome_hits++;
      if (row.is_exact) current.exact_hits++;
    }
  });

  // Extra points calculated live
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

  // Knockout points calculated live
  const realKnockoutPredictions: KnockoutPredictionMap = {};
  officialKnockoutRows.forEach((row) => {
    realKnockoutPredictions[row.match_id] = row.picked_team_id;
  });

  const realBracket = buildRealKnockoutBracket(
    teams,
    officialMatches,
    groups,
    realKnockoutPredictions,
    { groupAdminTiebreaks, thirdPlaceAdminTiebreaks }
  );

  // Per-entry tiebreaks
  const entryTiebreaksByEntryId = new Map<string, {
    group: Record<string, Record<string, number>>;
    thirdPlace: Record<string, number>;
  }>();
  tiebreakRows.forEach((row) => {
    const id = String(row.entry_id);
    if (!entryTiebreaksByEntryId.has(id)) {
      entryTiebreaksByEntryId.set(id, { group: {}, thirdPlace: {} });
    }
    const tb = entryTiebreaksByEntryId.get(id)!;
    if (row.scope === "group") {
      if (!tb.group[row.scope_value]) tb.group[row.scope_value] = {};
      tb.group[row.scope_value][row.team_id] = row.priority;
    } else if (row.scope === "third_place") {
      tb.thirdPlace[row.team_id] = row.priority;
    }
  });

  for (const entry of entries) {
    const entryId = String(entry.id);
    const current = grouped.get(entryId);
    if (!current) continue;

    const predictions: PredictionMap = {};
    allGroupPredictions
      .filter((row) => row.entry_id === entryId)
      .forEach((row) => {
        predictions[row.match_id] = { homeGoals: row.home_goals, awayGoals: row.away_goals };
      });

    const knockoutPredictions: KnockoutPredictionMap = {};
    allKnockoutPredictions
      .filter((row) => row.entry_id === entryId)
      .forEach((row) => {
        knockoutPredictions[row.match_id] = row.picked_team_id;
      });

    const entryTb = entryTiebreaksByEntryId.get(entryId) ?? { group: {}, thirdPlace: {} };

    const userBracket = buildUserKnockoutBracket(
      teams,
      officialMatches,
      groups,
      predictions,
      knockoutPredictions,
      { groupUserTiebreaks: entryTb.group, thirdPlaceUserTiebreaks: entryTb.thirdPlace }
    );

    const knockoutScore = calculateKnockoutScore(scoreSettings, userBracket, realBracket) as any;

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
    current.qf_points = getScoreValue(knockoutScore, ["quarterfinals", "quarterfinal", "qf"]);
    current.sf_points = getScoreValue(knockoutScore, ["semifinals", "semifinal", "sf"]);
    current.third_points = getScoreValue(knockoutScore, ["thirdPlace", "third"]);
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

  return Array.from(grouped.values()).sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    return a.name.localeCompare(b.name);
  });
}
