
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

type TeamRankingMeta = {
  fairPlayPoints?: number | null;
  fifaRanking?: number | null;
};

type TeamRankingMetaMap = Record<string, TeamRankingMeta | undefined>;
type ManualTiebreakMap = Record<string, number> | undefined;
type MiniStandingRow = StandingRow;

function createBaseRows(groupTeams: Team[]): StandingRow[] {
  return groupTeams.map((team) => ({
    teamId: team.id,
    teamName: team.name,
    teamFlag: team.flagUrl,
    group: team.group ?? null,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));
}

function cloneRows(rows: StandingRow[]): StandingRow[] {
  return rows.map((row) => ({ ...row }));
}

function getPlayedGroupMatches(matches: Match[], group: string): Match[] {
  return matches.filter(
    (match) =>
      match.stage === "group" &&
      match.group === group &&
      match.homeGoals !== null &&
      match.awayGoals !== null &&
      match.homeTeamId !== null &&
      match.awayTeamId !== null
  );
}

function applyMatchToRowMap(rowMap: Map<string, StandingRow>, match: Match): void {
  if (
    !match.homeTeamId ||
    !match.awayTeamId ||
    match.homeGoals === null ||
    match.awayGoals === null
  ) {
    return;
  }

  const home = rowMap.get(match.homeTeamId);
  const away = rowMap.get(match.awayTeamId);
  if (!home || !away) return;

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

function finalizeRows(rows: StandingRow[]): void {
  for (const row of rows) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  }
}

function buildOverallRows(
  teams: Team[],
  matches: Match[],
  group: string
): StandingRow[] {
  const groupTeams = teams.filter((team) => team.group === group);
  const table = createBaseRows(groupTeams);
  const rowMap = new Map(table.map((row) => [row.teamId, row]));

  for (const match of getPlayedGroupMatches(matches, group)) {
    applyMatchToRowMap(rowMap, match);
  }

  finalizeRows(table);
  return table;
}

function buildMiniTable(
  tiedRows: StandingRow[],
  matches: Match[],
  group: string
): MiniStandingRow[] {
  const tiedIds = new Set(tiedRows.map((row) => row.teamId));
  const miniRows = cloneRows(tiedRows).map((row) => ({
    ...row,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));

  const rowMap = new Map(miniRows.map((row) => [row.teamId, row]));
  const miniMatches = getPlayedGroupMatches(matches, group).filter(
    (match) =>
      match.homeTeamId !== null &&
      match.awayTeamId !== null &&
      tiedIds.has(match.homeTeamId) &&
      tiedIds.has(match.awayTeamId)
  );

  for (const match of miniMatches) {
    applyMatchToRowMap(rowMap, match);
  }

  finalizeRows(miniRows);
  return miniRows;
}

function compareUsingStats(a: StandingRow, b: StandingRow): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) {
    return b.goalDifference - a.goalDifference;
  }
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return 0;
}

function compareUsingFairPlayAndRanking(
  a: StandingRow,
  b: StandingRow,
  rankingMeta?: TeamRankingMetaMap
): number {
  if (!rankingMeta) return 0;

  const aFair = rankingMeta[a.teamId]?.fairPlayPoints;
  const bFair = rankingMeta[b.teamId]?.fairPlayPoints;

  if (
    typeof aFair === "number" &&
    typeof bFair === "number" &&
    aFair !== bFair
  ) {
    return bFair - aFair;
  }

  const aRank = rankingMeta[a.teamId]?.fifaRanking;
  const bRank = rankingMeta[b.teamId]?.fifaRanking;

  if (
    typeof aRank === "number" &&
    typeof bRank === "number" &&
    aRank !== bRank
  ) {
    return aRank - bRank;
  }

  return 0;
}

function compareUsingManualTiebreak(
  a: StandingRow,
  b: StandingRow,
  manualTiebreaks?: ManualTiebreakMap
): number {
  if (!manualTiebreaks) return 0;

  const aManual = manualTiebreaks[a.teamId];
  const bManual = manualTiebreaks[b.teamId];

  if (
    typeof aManual === "number" &&
    typeof bManual === "number" &&
    aManual !== bManual
  ) {
    return aManual - bManual;
  }

  return 0;
}

function resolveTiedCluster(
  cluster: StandingRow[],
  overallMap: Map<string, StandingRow>,
  matches: Match[],
  group: string,
  rankingMeta?: TeamRankingMetaMap,
  manualTiebreaks?: ManualTiebreakMap
): StandingRow[] {
  if (cluster.length <= 1) return cluster;

  const miniTable = buildMiniTable(cluster, matches, group);
  const miniMap = new Map(miniTable.map((row) => [row.teamId, row]));

  const ordered = [...cluster].sort((a, b) => {
    const miniA = miniMap.get(a.teamId)!;
    const miniB = miniMap.get(b.teamId)!;

    const miniCompare = compareUsingStats(miniA, miniB);
    if (miniCompare !== 0) return miniCompare;

    const overallA = overallMap.get(a.teamId)!;
    const overallB = overallMap.get(b.teamId)!;

    if (overallB.goalDifference !== overallA.goalDifference) {
      return overallB.goalDifference - overallA.goalDifference;
    }

    if (overallB.goalsFor !== overallA.goalsFor) {
      return overallB.goalsFor - overallA.goalsFor;
    }

    const fairPlayCompare = compareUsingFairPlayAndRanking(
      overallA,
      overallB,
      rankingMeta
    );
    if (fairPlayCompare !== 0) return fairPlayCompare;

    const manualCompare = compareUsingManualTiebreak(
      overallA,
      overallB,
      manualTiebreaks
    );
    if (manualCompare !== 0) return manualCompare;

    return a.teamName.localeCompare(b.teamName);
  });

  const resolved: StandingRow[] = [];
  let start = 0;

  while (start < ordered.length) {
    let end = start + 1;
    while (end < ordered.length) {
      const left = miniMap.get(ordered[start].teamId)!;
      const right = miniMap.get(ordered[end].teamId)!;

      if (
        left.points === right.points &&
        left.goalDifference === right.goalDifference &&
        left.goalsFor === right.goalsFor
      ) {
        end += 1;
        continue;
      }
      break;
    }

    const subCluster = ordered.slice(start, end);

    if (subCluster.length === cluster.length) {
      resolved.push(
        ...subCluster.sort((a, b) => {
          const overallA = overallMap.get(a.teamId)!;
          const overallB = overallMap.get(b.teamId)!;

          if (overallB.goalDifference !== overallA.goalDifference) {
            return overallB.goalDifference - overallA.goalDifference;
          }

          if (overallB.goalsFor !== overallA.goalsFor) {
            return overallB.goalsFor - overallA.goalsFor;
          }

          const fairPlayCompare = compareUsingFairPlayAndRanking(
            overallA,
            overallB,
            rankingMeta
          );
          if (fairPlayCompare !== 0) return fairPlayCompare;

          const manualCompare = compareUsingManualTiebreak(
            overallA,
            overallB,
            manualTiebreaks
          );
          if (manualCompare !== 0) return manualCompare;

          return a.teamName.localeCompare(b.teamName);
        })
      );
      return resolved;
    }

    resolved.push(
      ...resolveTiedCluster(
        subCluster,
        overallMap,
        matches,
        group,
        rankingMeta,
        manualTiebreaks
      )
    );
    start = end;
  }

  return resolved;
}

export function calculateStandings(
  teams: Team[],
  matches: Match[],
  group: string,
  rankingMeta?: TeamRankingMetaMap,
  manualTiebreaks?: Record<string, number>
): StandingRow[] {
  const table = buildOverallRows(teams, matches, group);
  const overallMap = new Map(table.map((row) => [row.teamId, row]));
  const byPoints = [...table].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.teamName.localeCompare(b.teamName);
  });

  const resolved: StandingRow[] = [];
  let start = 0;

  while (start < byPoints.length) {
    let end = start + 1;
    while (
      end < byPoints.length &&
      byPoints[end].points === byPoints[start].points
    ) {
      end += 1;
    }

    const cluster = byPoints.slice(start, end);
    if (cluster.length === 1) {
      resolved.push(cluster[0]);
    } else {
      resolved.push(
        ...resolveTiedCluster(
          cluster,
          overallMap,
          matches,
          group,
          rankingMeta,
          manualTiebreaks
        )
      );
    }

    start = end;
  }

  return resolved;
}

export function calculatePredictedStandings(
  teams: Team[],
  matches: Match[],
  predictions: Record<string, { homeGoals: number | null; awayGoals: number | null }>,
  group: string,
  rankingMeta?: TeamRankingMetaMap,
  manualTiebreaks?: Record<string, number>
): StandingRow[] {
  const predictedMatches: Match[] = matches.map((match) => ({
    ...match,
    homeGoals: predictions[match.id]?.homeGoals ?? null,
    awayGoals: predictions[match.id]?.awayGoals ?? null,
  }));

  return calculateStandings(
    teams,
    predictedMatches,
    group,
    rankingMeta,
    manualTiebreaks
  );
}