import { Match } from "@/types";
import { calculateMatchPredictionScore } from "@/lib/scoring";
import { getDateKey, formatKickoff } from "@/lib/timezone";

type PredictionMap = Record<
  string,
  { homeGoals: number | null; awayGoals: number | null }
>;

export type DailyPointsRow = {
  dateKey: string;
  label: string;
  points: number;
};

export function calculateDailyPoints(
  officialMatches: Match[],
  predictions: PredictionMap,
  scoreSettings: any,
  timeZone: string
): DailyPointsRow[] {
  const totals = new Map<string, number>();

  for (const match of officialMatches) {
    if (match.stage !== "group") continue;

    const dateKey = getDateKey((match as any).kickoff ?? null, timeZone);
    if (!dateKey) continue;

    const label = formatKickoff((match as any).kickoff ?? null, timeZone).date;

    const score = calculateMatchPredictionScore(
      match.homeGoals,
      match.awayGoals,
      predictions[match.id]?.homeGoals ?? null,
      predictions[match.id]?.awayGoals ?? null,
      scoreSettings
    );

    const key = `${dateKey}|${label}`;
    const current = totals.get(key) ?? 0;
    totals.set(key, current + score.points);
  }

  return [...totals.entries()]
    .map(([key, points]) => {
      const [dateKey, label] = key.split("|");
      return { dateKey, label, points };
    })
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}