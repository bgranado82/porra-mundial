import { Match, Team } from "@/types";
import { calculateStandings, StandingRow } from "@/lib/standings";

export type ThirdPlaceRow = StandingRow & {
  rankInGroup: number;
  qualifies: boolean;
};

export function getThirdPlacedTeams(
  teams: Team[],
  matches: Match[],
  groups: string[]
): ThirdPlaceRow[] {
  const thirdPlacedTeams: ThirdPlaceRow[] = [];

  for (const group of groups) {
    const standings = calculateStandings(teams, matches, group);

    if (standings.length >= 3) {
      thirdPlacedTeams.push({
        ...standings[2],
        rankInGroup: 3,
        qualifies: false,
      });
    }
  }

  return thirdPlacedTeams;
}

export function getBestThirdPlacedTeams(
  teams: Team[],
  matches: Match[],
  groups: string[],
  limit = 8
): ThirdPlaceRow[] {
  const thirdPlacedTeams = getThirdPlacedTeams(teams, matches, groups);

  const sorted = [...thirdPlacedTeams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });

  return sorted.map((team, index) => ({
    ...team,
    qualifies: index < limit,
  }));
}