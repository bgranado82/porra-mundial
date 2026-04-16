
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

export function buildRealKnockoutBracket(
  teams: Team[],
  matches: Match[],
  groups: string[],
  realKnockoutPredictions: KnockoutPredictionMap,
  options?: {
    groupAdminTiebreaks?: Record<string, Record<string, number>>;
    thirdPlaceAdminTiebreaks?: Record<string, number>;
  }
) {
  const round32 = generateRound32(teams, matches, groups, {
    requireCompleteGroupsForQualifiedTeams: true,
    requireWholeGroupStageForThirds: true,
    groupAdminTiebreaks: options?.groupAdminTiebreaks,
    thirdPlaceAdminTiebreaks: options?.thirdPlaceAdminTiebreaks,
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
      homeTeamId: getPickedWinner("r32-2", realKnockoutPredictions),
      awayTeamId: getPickedWinner("r32-5", realKnockoutPredictions),
      homeLabel: "Ganador partido 74",
      awayLabel: "Ganador partido 77",
    },
    {
      id: "r16-2",
      stage: "round16",
      homeTeamId: getPickedWinner("r32-1", realKnockoutPredictions),
      awayTeamId: getPickedWinner("r32-3", realKnockoutPredictions),
      homeLabel: "Ganador partido 73",
      awayLabel: "Ganador partido 75",
    },
    {
      id: "r16-3",
      stage: "round16",
      homeTeamId: getPickedWinner("r32-4", realKnockoutPredictions),
      awayTeamId: getPickedWinner("r32-6", realKnockoutPredictions),
      homeLabel: "Ganador partido 76",
      awayLabel: "Ganador partido 78",
    },
    {
      id: "r16-4",
      stage: "round16",
      homeTeamId: getPickedWinner("r32-7", realKnockoutPredictions),
      awayTeamId: getPickedWinner("r32-8", realKnockoutPredictions),
      homeLabel: "Ganador partido 79",
      awayLabel: "Ganador partido 80",
    },
    {
      id: "r16-5",
      stage: "round16",
      homeTeamId: getPickedWinner("r32-11", realKnockoutPredictions),
      awayTeamId: getPickedWinner("r32-12", realKnockoutPredictions),
      homeLabel: "Ganador partido 83",
      awayLabel: "Ganador partido 84",
    },
    {
      id: "r16-6",
      stage: "round16",
      homeTeamId: getPickedWinner("r32-9", realKnockoutPredictions),
      awayTeamId: getPickedWinner("r32-10", realKnockoutPredictions),
      homeLabel: "Ganador partido 81",
      awayLabel: "Ganador partido 82",
    },
    {
      id: "r16-7",
      stage: "round16",
      homeTeamId: getPickedWinner("r32-14", realKnockoutPredictions),
      awayTeamId: getPickedWinner("r32-16", realKnockoutPredictions),
      homeLabel: "Ganador partido 86",
      awayLabel: "Ganador partido 88",
    },
    {
      id: "r16-8",
      stage: "round16",
      homeTeamId: getPickedWinner("r32-13", realKnockoutPredictions),
      awayTeamId: getPickedWinner("r32-15", realKnockoutPredictions),
      homeLabel: "Ganador partido 85",
      awayLabel: "Ganador partido 87",
    },
  ];

  const quarterfinals: KnockoutBracketMatch[] = [
    {
      id: "qf-1",
      stage: "quarterfinal",
      homeTeamId: getPickedWinner("r16-1", realKnockoutPredictions),
      awayTeamId: getPickedWinner("r16-2", realKnockoutPredictions),
      homeLabel: "Ganador partido 89",
      awayLabel: "Ganador partido 90",
    },
    {
      id: "qf-2",
      stage: "quarterfinal",
      homeTeamId: getPickedWinner("r16-5", realKnockoutPredictions),
      awayTeamId: getPickedWinner("r16-6", realKnockoutPredictions),
      homeLabel: "Ganador partido 93",
      awayLabel: "Ganador partido 94",
    },
    {
      id: "qf-3",
      stage: "quarterfinal",
      homeTeamId: getPickedWinner("r16-3", realKnockoutPredictions),
      awayTeamId: getPickedWinner("r16-4", realKnockoutPredictions),
      homeLabel: "Ganador partido 91",
      awayLabel: "Ganador partido 92",
    },
    {
      id: "qf-4",
      stage: "quarterfinal",
      homeTeamId: getPickedWinner("r16-7", realKnockoutPredictions),
      awayTeamId: getPickedWinner("r16-8", realKnockoutPredictions),
      homeLabel: "Ganador partido 95",
      awayLabel: "Ganador partido 96",
    },
  ];

  const semifinals: KnockoutBracketMatch[] = [
    {
      id: "sf-1",
      stage: "semifinal",
      homeTeamId: getPickedWinner("qf-1", realKnockoutPredictions),
      awayTeamId: getPickedWinner("qf-2", realKnockoutPredictions),
      homeLabel: "Ganador partido 97",
      awayLabel: "Ganador partido 98",
    },
    {
      id: "sf-2",
      stage: "semifinal",
      homeTeamId: getPickedWinner("qf-3", realKnockoutPredictions),
      awayTeamId: getPickedWinner("qf-4", realKnockoutPredictions),
      homeLabel: "Ganador partido 99",
      awayLabel: "Ganador partido 100",
    },
  ];

  const finals: KnockoutBracketMatch[] = [
    {
      id: "final-1",
      stage: "final",
      homeTeamId: getPickedWinner("sf-1", realKnockoutPredictions),
      awayTeamId: getPickedWinner("sf-2", realKnockoutPredictions),
      homeLabel: "Ganador partido 101",
      awayLabel: "Ganador partido 102",
    },
  ];

  const thirdPlace: KnockoutBracketMatch[] = [
    {
      id: "third-1",
      stage: "final",
      homeTeamId: null,
      awayTeamId: null,
      homeLabel: "Perdedor partido 101",
      awayLabel: "Perdedor partido 102",
    },
  ];

  const championId = getPickedWinner("final-1", realKnockoutPredictions);

  return {
    round32,
    round16,
    quarterfinals,
    semifinals,
    finals,
    thirdPlace,
    championId,
  };
}