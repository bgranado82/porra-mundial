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
) {
  const realTeams = getTeamsInRound(realMatches);
  let points = 0;

  for (const match of userMatches) {
    let matchPoints = 0;

    if (match.homeTeamId && realTeams.has(match.homeTeamId)) {
      matchPoints += pointsPerHit;
    }

    if (match.awayTeamId && realTeams.has(match.awayTeamId)) {
      matchPoints += pointsPerHit;
    }

    hitMap[match.id] = matchPoints;
    points += matchPoints;
  }

  return points;
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

  const round32 = scoreRoundByTeamsPresent(
    userBracket.round32,
    realBracket.round32,
    settings.round32QualifiedPoints,
    hitMap
  );

  const round16 = scoreRoundByTeamsPresent(
    userBracket.round16,
    realBracket.round16,
    settings.round16QualifiedPoints,
    hitMap
  );

  const quarterfinals = scoreRoundByTeamsPresent(
    userBracket.quarterfinals,
    realBracket.quarterfinals,
    settings.quarterfinalQualifiedPoints,
    hitMap
  );

  const semifinals = scoreRoundByTeamsPresent(
    userBracket.semifinals,
    realBracket.semifinals,
    settings.semifinalQualifiedPoints,
    hitMap
  );

  const finalPoints = scoreRoundByTeamsPresent(
    userBracket.finals,
    realBracket.finals,
    settings.finalQualifiedPoints,
    hitMap
  );

  const champion =
    userBracket.championId &&
    realBracket.championId &&
    userBracket.championId === realBracket.championId
      ? settings.championPoints
      : 0;

  return {
    round32,
    round16,
    quarterfinals,
    semifinals,
    final: finalPoints,
    champion,
    total:
      round32 +
      round16 +
      quarterfinals +
      semifinals +
      finalPoints +
      champion,
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

  scoreRoundByTeamsPresent(
    userBracket.round32,
    realBracket.round32,
    settings.round32QualifiedPoints,
    hitMap
  );

  scoreRoundByTeamsPresent(
    userBracket.round16,
    realBracket.round16,
    settings.round16QualifiedPoints,
    hitMap
  );

  scoreRoundByTeamsPresent(
    userBracket.quarterfinals,
    realBracket.quarterfinals,
    settings.quarterfinalQualifiedPoints,
    hitMap
  );

  scoreRoundByTeamsPresent(
    userBracket.semifinals,
    realBracket.semifinals,
    settings.semifinalQualifiedPoints,
    hitMap
  );

  scoreRoundByTeamsPresent(
    userBracket.finals,
    realBracket.finals,
    settings.finalQualifiedPoints,
    hitMap
  );

  hitMap["champion"] =
    userBracket.championId &&
    realBracket.championId &&
    userBracket.championId === realBracket.championId
      ? settings.championPoints
      : 0;

  return hitMap;
}