import {
  KnockoutBracketMatch,
  KnockoutPredictionMap,
  Match,
  Team,
} from "@/types";
import { generateRound32 } from "@/lib/round32";

function getPickedWinner(matchId: string, picks: KnockoutPredictionMap) {
  return picks[matchId] ?? null;
}

function buildPredictedMatches(
  matches: Match[],
  predictions: Record<string, { homeGoals: number | null; awayGoals: number | null }>
): Match[] {
  return matches.map((match) => {
    if (match.stage !== "group") return match;

    return {
      ...match,
      homeGoals: predictions[match.id]?.homeGoals ?? null,
      awayGoals: predictions[match.id]?.awayGoals ?? null,
    };
  });
}

export function buildUserKnockoutBracket(
  teams: Team[],
  matches: Match[],
  groups: string[],
  groupPredictions: Record<string, { homeGoals: number | null; awayGoals: number | null }>,
  knockoutPredictions: KnockoutPredictionMap
) {
  const predictedMatches = buildPredictedMatches(matches, groupPredictions);

  const round32 = generateRound32(teams, predictedMatches, groups, {
    requireCompleteGroupsForQualifiedTeams: true,
    requireWholeGroupStageForThirds: true,
  }).map((m) => ({
    id: m.id,
    stage: "round32" as const,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    homeLabel: m.homeLabel,
    awayLabel: m.awayLabel,
  }));

  const round16: KnockoutBracketMatch[] = [
    {
      id: "r16-1",
      stage: "round16",
      homeTeamId: getPickedWinner("r32-2", knockoutPredictions),
      awayTeamId: getPickedWinner("r32-5", knockoutPredictions),
      homeLabel: "Ganador partido 74",
      awayLabel: "Ganador partido 77",
    },
    {
      id: "r16-2",
      stage: "round16",
      homeTeamId: getPickedWinner("r32-1", knockoutPredictions),
      awayTeamId: getPickedWinner("r32-3", knockoutPredictions),
      homeLabel: "Ganador partido 73",
      awayLabel: "Ganador partido 75",
    },
    {
      id: "r16-3",
      stage: "round16",
      homeTeamId: getPickedWinner("r32-4", knockoutPredictions),
      awayTeamId: getPickedWinner("r32-6", knockoutPredictions),
      homeLabel: "Ganador partido 76",
      awayLabel: "Ganador partido 78",
    },
    {
      id: "r16-4",
      stage: "round16",
      homeTeamId: getPickedWinner("r32-7", knockoutPredictions),
      awayTeamId: getPickedWinner("r32-8", knockoutPredictions),
      homeLabel: "Ganador partido 79",
      awayLabel: "Ganador partido 80",
    },
    {
      id: "r16-5",
      stage: "round16",
      homeTeamId: getPickedWinner("r32-11", knockoutPredictions),
      awayTeamId: getPickedWinner("r32-12", knockoutPredictions),
      homeLabel: "Ganador partido 83",
      awayLabel: "Ganador partido 84",
    },
    {
      id: "r16-6",
      stage: "round16",
      homeTeamId: getPickedWinner("r32-9", knockoutPredictions),
      awayTeamId: getPickedWinner("r32-10", knockoutPredictions),
      homeLabel: "Ganador partido 81",
      awayLabel: "Ganador partido 82",
    },
    {
      id: "r16-7",
      stage: "round16",
      homeTeamId: getPickedWinner("r32-14", knockoutPredictions),
      awayTeamId: getPickedWinner("r32-16", knockoutPredictions),
      homeLabel: "Ganador partido 86",
      awayLabel: "Ganador partido 88",
    },
    {
      id: "r16-8",
      stage: "round16",
      homeTeamId: getPickedWinner("r32-13", knockoutPredictions),
      awayTeamId: getPickedWinner("r32-15", knockoutPredictions),
      homeLabel: "Ganador partido 85",
      awayLabel: "Ganador partido 87",
    },
  ];

  const quarterfinals: KnockoutBracketMatch[] = [
    {
      id: "qf-1",
      stage: "quarterfinal",
      homeTeamId: getPickedWinner("r16-1", knockoutPredictions),
      awayTeamId: getPickedWinner("r16-2", knockoutPredictions),
      homeLabel: "Ganador partido 89",
      awayLabel: "Ganador partido 90",
    },
    {
      id: "qf-2",
      stage: "quarterfinal",
      homeTeamId: getPickedWinner("r16-5", knockoutPredictions),
      awayTeamId: getPickedWinner("r16-6", knockoutPredictions),
      homeLabel: "Ganador partido 93",
      awayLabel: "Ganador partido 94",
    },
    {
      id: "qf-3",
      stage: "quarterfinal",
      homeTeamId: getPickedWinner("r16-3", knockoutPredictions),
      awayTeamId: getPickedWinner("r16-4", knockoutPredictions),
      homeLabel: "Ganador partido 91",
      awayLabel: "Ganador partido 92",
    },
    {
      id: "qf-4",
      stage: "quarterfinal",
      homeTeamId: getPickedWinner("r16-7", knockoutPredictions),
      awayTeamId: getPickedWinner("r16-8", knockoutPredictions),
      homeLabel: "Ganador partido 95",
      awayLabel: "Ganador partido 96",
    },
  ];

  const semifinals: KnockoutBracketMatch[] = [
    {
      id: "sf-1",
      stage: "semifinal",
      homeTeamId: getPickedWinner("qf-1", knockoutPredictions),
      awayTeamId: getPickedWinner("qf-2", knockoutPredictions),
      homeLabel: "Ganador partido 97",
      awayLabel: "Ganador partido 98",
    },
    {
      id: "sf-2",
      stage: "semifinal",
      homeTeamId: getPickedWinner("qf-3", knockoutPredictions),
      awayTeamId: getPickedWinner("qf-4", knockoutPredictions),
      homeLabel: "Ganador partido 99",
      awayLabel: "Ganador partido 100",
    },
  ];

  const finals: KnockoutBracketMatch[] = [
    {
      id: "final-1",
      stage: "final",
      homeTeamId: getPickedWinner("sf-1", knockoutPredictions),
      awayTeamId: getPickedWinner("sf-2", knockoutPredictions),
      homeLabel: "Ganador partido 101",
      awayLabel: "Ganador partido 102",
    },
  ];

  const championId = getPickedWinner("final-1", knockoutPredictions);

  return {
    round32,
    round16,
    quarterfinals,
    semifinals,
    finals,
    championId,
  };
}