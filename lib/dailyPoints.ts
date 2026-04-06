import { Match, ScoreSettings } from "@/types";
import { calculateMatchPredictionScore } from "@/lib/scoring";

export function calculateDailyPoints(
  matches: Match[],
  predictions: Record<
    string,
    { homeGoals: number | null; awayGoals: number | null }
  >,
  settings: ScoreSettings
) {
  const playedMatches = matches.filter(
    (match) =>
      match.stage === "group" &&
      match.homeTeamId &&
      match.awayTeamId
  );

  const distinctDays = [...new Set(playedMatches.map((match) => match.day))].sort(
    (a, b) => a - b
  );

  const normalizedDayMap = new Map(
    distinctDays.map((day, index) => [day, index + 1])
  );

  const pointsByDay: Record<number, number> = {};

  for (const match of playedMatches) {
    const normalizedDay = normalizedDayMap.get(match.day);
    if (!normalizedDay) continue;

    const prediction = predictions[match.id];
    if (!prediction) continue;

    const score = calculateMatchPredictionScore(
      match.homeGoals,
      match.awayGoals,
      prediction.homeGoals,
      prediction.awayGoals,
      settings
    );

    if (pointsByDay[normalizedDay] === undefined) {
      pointsByDay[normalizedDay] = 0;
    }

    pointsByDay[normalizedDay] += score.points;
  }

  return pointsByDay;
}