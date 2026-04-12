import { Match, Team } from "@/types";
import { calculateStandings, StandingRow } from "@/lib/standings";

type TeamRankingMeta = {
  fairPlayPoints?: number | null;
  fifaRanking?: number | null;
};

type TeamRankingMetaMap = Record<string, TeamRankingMeta | undefined>;

export type ThirdPlaceRow = StandingRow & {
  rankInGroup: number;
  qualifies: boolean;
};

function compareThirdPlacedTeams(
  a: ThirdPlaceRow,
  b: ThirdPlaceRow,
  rankingMeta?: TeamRankingMetaMap,
): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) {
    return b.goalDifference - a.goalDifference;
  }
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

  if (rankingMeta) {
    const aFair = rankingMeta[a.teamId]?.fairPlayPoints;
    const bFair = rankingMeta[b.teamId]?.fairPlayPoints;

    if (typeof aFair === "number" && typeof bFair === "number" && aFair !== bFair) {
      return bFair - aFair;
    }

    const aRank = rankingMeta[a.teamId]?.fifaRanking;
    const bRank = rankingMeta[b.teamId]?.fifaRanking;

    if (typeof aRank === "number" && typeof bRank === "number" && aRank !== bRank) {
      return aRank - bRank;
    }
  }

  return a.teamName.localeCompare(b.teamName);
}

export function getThirdPlacedTeams(
  teams: Team[],
  matches: Match[],
  groups: string[],
  rankingMeta?: TeamRankingMetaMap,
): ThirdPlaceRow[] {
  const thirdPlacedTeams: ThirdPlaceRow[] = [];

  for (const group of groups) {
    const standings = calculateStandings(teams, matches, group, rankingMeta);
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
  limit = 8,
  rankingMeta?: TeamRankingMetaMap,
): ThirdPlaceRow[] {
  const thirdPlacedTeams = getThirdPlacedTeams(teams, matches, groups, rankingMeta);

  const sorted = [...thirdPlacedTeams].sort((a, b) =>
    compareThirdPlacedTeams(a, b, rankingMeta),
  );

  return sorted.map((team, index) => ({
    ...team,
    qualifies: index < limit,
  }));
}
