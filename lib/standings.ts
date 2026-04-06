import { Match, Team } from "@/types";

export type StandingRow = {
  teamId: string;
  teamName: string;
  teamFlag: string;
  group: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export function calculateStandings(
  teams: Team[],
  matches: Match[],
  group: string
): StandingRow[] {
  const groupTeams = teams.filter((team) => team.group === group);

  const table: StandingRow[] = groupTeams.map((team) => ({
    teamId: team.id,
    teamName: team.name,
    teamFlag: team.flag,
    group: team.group,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));

  const rowMap = new Map(table.map((row) => [row.teamId, row]));

  const playedMatches = matches.filter(
    (match) =>
      match.stage === "group" &&
      match.group === group &&
      match.homeGoals !== null &&
      match.awayGoals !== null
  );

  for (const match of playedMatches) {
    if (
      !match.homeTeamId ||
      !match.awayTeamId ||
      match.homeGoals === null ||
      match.awayGoals === null
    ) {
      continue;
    }

    const home = rowMap.get(match.homeTeamId);
    const away = rowMap.get(match.awayTeamId);

    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;

    home.goalsFor += match.homeGoals;
    home.goalsAgainst += match.awayGoals;

    away.goalsFor += match.awayGoals;
    away.goalsAgainst += match.homeGoals;

    if (match.homeGoals > match.awayGoals) {
      home.won += 1;
      away.lost += 1;
      home.points += 3;
    } else if (match.homeGoals < match.awayGoals) {
      away.won += 1;
      home.lost += 1;
      away.points += 3;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const row of table) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  }

  return table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });
}

export function calculatePredictedStandings(
  teams: Team[],
  matches: Match[],
  predictions: Record<string, { homeGoals: number | null; awayGoals: number | null }>,
  group: string
): StandingRow[] {
  const predictedMatches: Match[] = matches.map((match) => ({
    ...match,
    homeGoals: predictions[match.id]?.homeGoals ?? null,
    awayGoals: predictions[match.id]?.awayGoals ?? null,
  }));

  return calculateStandings(teams, predictedMatches, group);
}