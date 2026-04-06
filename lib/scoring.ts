import { MatchPredictionScore, ScoreSettings } from "@/types";

function getOutcome(homeGoals: number, awayGoals: number): "H" | "D" | "A" {
  if (homeGoals > awayGoals) return "H";
  if (homeGoals < awayGoals) return "A";
  return "D";
}

export function calculateMatchPredictionScore(
  officialHomeGoals: number | null,
  officialAwayGoals: number | null,
  predictedHomeGoals: number | null,
  predictedAwayGoals: number | null,
  settings: ScoreSettings
): MatchPredictionScore {
  if (
    officialHomeGoals === null ||
    officialAwayGoals === null ||
    predictedHomeGoals === null ||
    predictedAwayGoals === null
  ) {
    return {
      points: 0,
      exactHit: false,
      outcomeHit: false,
      homeGoalsHit: false,
      awayGoalsHit: false,
    };
  }

  const exactHit =
    officialHomeGoals === predictedHomeGoals &&
    officialAwayGoals === predictedAwayGoals;

  const outcomeHit =
    getOutcome(officialHomeGoals, officialAwayGoals) ===
    getOutcome(predictedHomeGoals, predictedAwayGoals);

  const homeGoalsHit = officialHomeGoals === predictedHomeGoals;
  const awayGoalsHit = officialAwayGoals === predictedAwayGoals;

  let points = 0;

  if (exactHit) {
    points += settings.exactScore;
  } else {
    if (outcomeHit) points += settings.outcome;
    if (homeGoalsHit) points += settings.homeGoals;
    if (awayGoalsHit) points += settings.awayGoals;
  }

  return {
    points,
    exactHit,
    outcomeHit,
    homeGoalsHit,
    awayGoalsHit,
  };
}