import { KnockoutBracketMatch, ScoreSettings } from "@/types";

type KnockoutScoreBreakdown = {
  round32: number;
  round16: number;
  quarterfinals: number;
  semifinals: number;
  final: number;
  champion: number;
  total: number;
};

export type KnockoutPrecision = {
  hits: number;
  total: number;
};

export type KnockoutPrecisionBreakdown = {
  round32: KnockoutPrecision;
  round16: KnockoutPrecision;
  quarterfinals: KnockoutPrecision;
  semifinals: KnockoutPrecision;
  final: KnockoutPrecision;
  champion: KnockoutPrecision;
  cumulative: KnockoutPrecision;
};

export type KnockoutHitMap = Record<string, number>;

function getTeamsInRound(matches: KnockoutBracketMatch[]) {
  const teams = new Set<string>();
  for (const match of matches) {
    if (match.homeTeamId) teams.add(match.homeTeamId);
    if (match.awayTeamId) teams.add(match.awayTeamId);
  }
  return teams;
}

function scoreRoundByTeamsPresent(
  userMatches: KnockoutBracketMatch[],
  realMatches: KnockoutBracketMatch[],
  pointsPerHit: number,
  hitMap: KnockoutHitMap
): { points: number; hits: number; total: number } {
  const realTeams = getTeamsInRound(realMatches);
  let points = 0;
  let hits = 0;
  const total = realTeams.size; // only officially known teams count

  for (const match of userMatches) {
    let matchPoints = 0;

    if (match.homeTeamId && realTeams.has(match.homeTeamId)) {
      matchPoints += pointsPerHit;
      hits++;
    }

    if (match.awayTeamId && realTeams.has(match.awayTeamId)) {
      matchPoints += pointsPerHit;
      hits++;
    }

    hitMap[match.id] = matchPoints;
    points += matchPoints;
  }

  return { points, hits, total };
}

export function calculateKnockoutScore(
  settings: ScoreSettings,
  userBracket: {
    round32: KnockoutBracketMatch[];
    round16: KnockoutBracketMatch[];
    quarterfinals: KnockoutBracketMatch[];
    semifinals: KnockoutBracketMatch[];
    finals: KnockoutBracketMatch[];
    championId: string | null;
  },
  realBracket: {
    round32: KnockoutBracketMatch[];
    round16: KnockoutBracketMatch[];
    quarterfinals: KnockoutBracketMatch[];
    semifinals: KnockoutBracketMatch[];
    finals: KnockoutBracketMatch[];
    championId: string | null;
  }
): KnockoutScoreBreakdown {
  const hitMap: KnockoutHitMap = {};

  const r32 = scoreRoundByTeamsPresent(userBracket.round32, realBracket.round32, settings.round32QualifiedPoints, hitMap);
  const r16 = scoreRoundByTeamsPresent(userBracket.round16, realBracket.round16, settings.round16QualifiedPoints, hitMap);
  const qf = scoreRoundByTeamsPresent(userBracket.quarterfinals, realBracket.quarterfinals, settings.quarterfinalQualifiedPoints, hitMap);
  const sf = scoreRoundByTeamsPresent(userBracket.semifinals, realBracket.semifinals, settings.semifinalQualifiedPoints, hitMap);
  const fin = scoreRoundByTeamsPresent(userBracket.finals, realBracket.finals, settings.finalQualifiedPoints, hitMap);

  const champion = userBracket.championId && realBracket.championId && userBracket.championId === realBracket.championId
    ? settings.championPoints : 0;

  return {
    round32: r32.points,
    round16: r16.points,
    quarterfinals: qf.points,
    semifinals: sf.points,
    final: fin.points,
    champion,
    total: r32.points + r16.points + qf.points + sf.points + fin.points + champion,
  };
}

export function calculateKnockoutPrecision(
  settings: ScoreSettings,
  userBracket: {
    round32: KnockoutBracketMatch[];
    round16: KnockoutBracketMatch[];
    quarterfinals: KnockoutBracketMatch[];
    semifinals: KnockoutBracketMatch[];
    finals: KnockoutBracketMatch[];
    championId: string | null;
  },
  realBracket: {
    round32: KnockoutBracketMatch[];
    round16: KnockoutBracketMatch[];
    quarterfinals: KnockoutBracketMatch[];
    semifinals: KnockoutBracketMatch[];
    finals: KnockoutBracketMatch[];
    championId: string | null;
  }
): KnockoutPrecisionBreakdown {
  const hitMap: KnockoutHitMap = {};

  const r32 = scoreRoundByTeamsPresent(userBracket.round32, realBracket.round32, 1, hitMap);
  const r16 = scoreRoundByTeamsPresent(userBracket.round16, realBracket.round16, 1, hitMap);
  const qf = scoreRoundByTeamsPresent(userBracket.quarterfinals, realBracket.quarterfinals, 1, hitMap);
  const sf = scoreRoundByTeamsPresent(userBracket.semifinals, realBracket.semifinals, 1, hitMap);
  const fin = scoreRoundByTeamsPresent(userBracket.finals, realBracket.finals, 1, hitMap);

  const champHit = userBracket.championId && realBracket.championId && userBracket.championId === realBracket.championId ? 1 : 0;
  const champTotal = realBracket.championId ? 1 : 0;

  const totalHits = r32.hits + r16.hits + qf.hits + sf.hits + fin.hits + champHit;
  const totalKnown = r32.total + r16.total + qf.total + sf.total + fin.total + champTotal;

  return {
    round32: { hits: r32.hits, total: r32.total },
    round16: { hits: r16.hits, total: r16.total },
    quarterfinals: { hits: qf.hits, total: qf.total },
    semifinals: { hits: sf.hits, total: sf.total },
    final: { hits: fin.hits, total: fin.total },
    champion: { hits: champHit, total: champTotal },
    cumulative: { hits: totalHits, total: totalKnown },
  };
}

export function calculateKnockoutHitMap(
  settings: ScoreSettings,
  userBracket: {
    round32: KnockoutBracketMatch[];
    round16: KnockoutBracketMatch[];
    quarterfinals: KnockoutBracketMatch[];
    semifinals: KnockoutBracketMatch[];
    finals: KnockoutBracketMatch[];
    championId: string | null;
  },
  realBracket: {
    round32: KnockoutBracketMatch[];
    round16: KnockoutBracketMatch[];
    quarterfinals: KnockoutBracketMatch[];
    semifinals: KnockoutBracketMatch[];
    finals: KnockoutBracketMatch[];
    championId: string | null;
  }
): KnockoutHitMap {
  const hitMap: KnockoutHitMap = {};
  scoreRoundByTeamsPresent(userBracket.round32, realBracket.round32, settings.round32QualifiedPoints, hitMap);
  scoreRoundByTeamsPresent(userBracket.round16, realBracket.round16, settings.round16QualifiedPoints, hitMap);
  scoreRoundByTeamsPresent(userBracket.quarterfinals, realBracket.quarterfinals, settings.quarterfinalQualifiedPoints, hitMap);
  scoreRoundByTeamsPresent(userBracket.semifinals, realBracket.semifinals, settings.semifinalQualifiedPoints, hitMap);
  scoreRoundByTeamsPresent(userBracket.finals, realBracket.finals, settings.finalQualifiedPoints, hitMap);
  hitMap["champion"] = userBracket.championId && realBracket.championId && userBracket.championId === realBracket.championId
    ? settings.championPoints : 0;
  return hitMap;
}
