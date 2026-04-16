
import { Match, Team } from "@/types";
import { calculateStandings } from "@/lib/standings";
import { getBestThirdPlacedTeams } from "@/lib/thirdPlace";
import {
  buildThirdComboKey,
  THIRD_PLACE_COMBINATIONS,
} from "@/lib/thirdPlaceCombinations";

export type Round32Match = {
  id: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeLabel: string;
  awayLabel: string;
};

type StandingTeam = {
  teamId: string | null;
  label: string;
};

type TeamRankingMeta = {
  fairPlayPoints?: number | null;
  fifaRanking?: number | null;
};

type TeamRankingMetaMap = Record<string, TeamRankingMeta | undefined>;

type GenerateRound32Options = {
  requireCompleteGroupsForQualifiedTeams?: boolean;
  requireWholeGroupStageForThirds?: boolean;
  rankingMeta?: TeamRankingMetaMap;
  allowLegacyFallbackWhileTableIsIncomplete?: boolean;
  groupAdminTiebreaks?: Record<string, Record<string, number>>;
  thirdPlaceAdminTiebreaks?: Record<string, number>;
};

type ThirdCandidate = {
  teamId: string;
  group: string | null;
};

type ThirdSlot =
  | "third74"
  | "third77"
  | "third79"
  | "third80"
  | "third81"
  | "third82"
  | "third85"
  | "third87";

const SLOT_ALLOWED_GROUPS: Record<ThirdSlot, string[]> = {
  third74: ["A", "B", "C", "D", "F"],
  third77: ["C", "D", "F", "G", "H"],
  third79: ["C", "E", "F", "H", "I"],
  third80: ["E", "H", "I", "J", "K"],
  third81: ["B", "E", "F", "I", "J"],
  third82: ["A", "E", "H", "I", "J"],
  third85: ["E", "F", "G", "I", "J"],
  third87: ["D", "E", "I", "J", "L"],
};

function isGroupComplete(matches: Match[], group: string) {
  const groupMatches = matches.filter(
    (match) => match.stage === "group" && match.group === group
  );

  if (groupMatches.length === 0) return false;

  return groupMatches.every(
    (match) => match.homeGoals !== null && match.awayGoals !== null
  );
}

function isWholeGroupStageComplete(matches: Match[]) {
  const groupMatches = matches.filter((match) => match.stage === "group");

  if (groupMatches.length === 0) return false;

  return groupMatches.every(
    (match) => match.homeGoals !== null && match.awayGoals !== null
  );
}

function getGroupPosition(
  teams: Team[],
  matches: Match[],
  group: string,
  position: 1 | 2 | 3,
  requireCompleteGroup: boolean,
  rankingMeta?: TeamRankingMetaMap,
  manualTiebreaks?: Record<string, number>
): StandingTeam {
  const label =
    position === 1
      ? `1º Grupo ${group}`
      : position === 2
      ? `2º Grupo ${group}`
      : `3º Grupo ${group}`;

  if (requireCompleteGroup && !isGroupComplete(matches, group)) {
    return {
      teamId: null,
      label,
    };
  }

  const standings = calculateStandings(
    teams,
    matches,
    group,
    rankingMeta,
    manualTiebreaks
  );
  const row = standings[position - 1];

  return {
    teamId: row?.teamId ?? null,
    label,
  };
}

function assignThirdsLegacyBacktracking(availableThirds: ThirdCandidate[]) {
  const result: Record<ThirdSlot, string | null> = {
    third74: null,
    third77: null,
    third79: null,
    third80: null,
    third81: null,
    third82: null,
    third85: null,
    third87: null,
  };

  const slots = (Object.keys(SLOT_ALLOWED_GROUPS) as ThirdSlot[]).sort((a, b) => {
    const aCount = availableThirds.filter(
      (t) => t.group && SLOT_ALLOWED_GROUPS[a].includes(t.group)
    ).length;

    const bCount = availableThirds.filter(
      (t) => t.group && SLOT_ALLOWED_GROUPS[b].includes(t.group)
    ).length;

    return aCount - bCount;
  });

  const used = new Set<string>();

  function backtrack(index: number): boolean {
    if (index >= slots.length) return true;

    const slot = slots[index];
    const allowedGroups = SLOT_ALLOWED_GROUPS[slot];

    const candidates = availableThirds.filter(
      (team) =>
        team.group !== null &&
        allowedGroups.includes(team.group) &&
        !used.has(team.teamId)
    );

    for (const candidate of candidates) {
      used.add(candidate.teamId);
      result[slot] = candidate.teamId;

      if (backtrack(index + 1)) return true;

      used.delete(candidate.teamId);
      result[slot] = null;
    }

    return false;
  }

  const solved = backtrack(0);

  if (!solved) {
    return {
      third74: null,
      third77: null,
      third79: null,
      third80: null,
      third81: null,
      third82: null,
      third85: null,
      third87: null,
    };
  }

  return result;
}

function resolveThirdAssignments(
  qualifiedThirds: ThirdCandidate[],
  allowLegacyFallbackWhileTableIsIncomplete: boolean
) {
  const groups = qualifiedThirds
    .map((team) => team.group)
    .filter((group): group is string => Boolean(group));

  const teamIdByGroup = new Map(
    qualifiedThirds
      .filter(
        (team): team is { teamId: string; group: string } => Boolean(team.group)
      )
      .map((team) => [team.group, team.teamId])
  );

  const key = buildThirdComboKey(groups);
  const official = THIRD_PLACE_COMBINATIONS[key];

  if (official) {
    return {
      third74: teamIdByGroup.get(official.third74) ?? null,
      third77: teamIdByGroup.get(official.third77) ?? null,
      third79: teamIdByGroup.get(official.third79) ?? null,
      third80: teamIdByGroup.get(official.third80) ?? null,
      third81: teamIdByGroup.get(official.third81) ?? null,
      third82: teamIdByGroup.get(official.third82) ?? null,
      third85: teamIdByGroup.get(official.third85) ?? null,
      third87: teamIdByGroup.get(official.third87) ?? null,
      source: "official" as const,
      key,
    };
  }

  if (allowLegacyFallbackWhileTableIsIncomplete) {
    return {
      ...assignThirdsLegacyBacktracking(qualifiedThirds),
      source: "legacy-fallback" as const,
      key,
    };
  }

  return {
    third74: null,
    third77: null,
    third79: null,
    third80: null,
    third81: null,
    third82: null,
    third85: null,
    third87: null,
    source: "missing-official-combination" as const,
    key,
  };
}

export function generateRound32(
  teams: Team[],
  matches: Match[],
  groups: string[],
  options?: GenerateRound32Options
): Round32Match[] {
  const requireCompleteGroupsForQualifiedTeams =
    options?.requireCompleteGroupsForQualifiedTeams ?? true;
  const requireWholeGroupStageForThirds =
    options?.requireWholeGroupStageForThirds ?? true;
  const rankingMeta = options?.rankingMeta;
  const allowLegacyFallbackWhileTableIsIncomplete =
    options?.allowLegacyFallbackWhileTableIsIncomplete ?? true;
  const groupAdminTiebreaks = options?.groupAdminTiebreaks;
  const thirdPlaceAdminTiebreaks = options?.thirdPlaceAdminTiebreaks;

  const A1 = getGroupPosition(
    teams,
    matches,
    "A",
    1,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.A
  );
  const A2 = getGroupPosition(
    teams,
    matches,
    "A",
    2,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.A
  );
  const B1 = getGroupPosition(
    teams,
    matches,
    "B",
    1,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.B
  );
  const B2 = getGroupPosition(
    teams,
    matches,
    "B",
    2,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.B
  );
  const C1 = getGroupPosition(
    teams,
    matches,
    "C",
    1,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.C
  );
  const C2 = getGroupPosition(
    teams,
    matches,
    "C",
    2,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.C
  );
  const D1 = getGroupPosition(
    teams,
    matches,
    "D",
    1,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.D
  );
  const D2 = getGroupPosition(
    teams,
    matches,
    "D",
    2,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.D
  );
  const E1 = getGroupPosition(
    teams,
    matches,
    "E",
    1,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.E
  );
  const E2 = getGroupPosition(
    teams,
    matches,
    "E",
    2,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.E
  );
  const F1 = getGroupPosition(
    teams,
    matches,
    "F",
    1,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.F
  );
  const F2 = getGroupPosition(
    teams,
    matches,
    "F",
    2,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.F
  );
  const G1 = getGroupPosition(
    teams,
    matches,
    "G",
    1,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.G
  );
  const G2 = getGroupPosition(
    teams,
    matches,
    "G",
    2,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.G
  );
  const H1 = getGroupPosition(
    teams,
    matches,
    "H",
    1,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.H
  );
  const H2 = getGroupPosition(
    teams,
    matches,
    "H",
    2,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.H
  );
  const I1 = getGroupPosition(
    teams,
    matches,
    "I",
    1,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.I
  );
  const I2 = getGroupPosition(
    teams,
    matches,
    "I",
    2,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.I
  );
  const J1 = getGroupPosition(
    teams,
    matches,
    "J",
    1,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.J
  );
  const J2 = getGroupPosition(
    teams,
    matches,
    "J",
    2,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.J
  );
  const K1 = getGroupPosition(
    teams,
    matches,
    "K",
    1,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.K
  );
  const K2 = getGroupPosition(
    teams,
    matches,
    "K",
    2,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.K
  );
  const L1 = getGroupPosition(
    teams,
    matches,
    "L",
    1,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.L
  );
  const L2 = getGroupPosition(
    teams,
    matches,
    "L",
    2,
    requireCompleteGroupsForQualifiedTeams,
    rankingMeta,
    groupAdminTiebreaks?.L
  );

  let third74: string | null = null;
  let third77: string | null = null;
  let third79: string | null = null;
  let third80: string | null = null;
  let third81: string | null = null;
  let third82: string | null = null;
  let third85: string | null = null;
  let third87: string | null = null;

  const canResolveThirds = requireWholeGroupStageForThirds
    ? isWholeGroupStageComplete(matches)
    : true;

  if (canResolveThirds) {
    const qualifiedThirds = getBestThirdPlacedTeams(
      teams,
      matches,
      groups,
      8,
      rankingMeta,
      thirdPlaceAdminTiebreaks,
      groupAdminTiebreaks
    )
      .filter((team) => team.qualifies)
      .map((team) => ({
        teamId: team.teamId,
        group: team.group ?? null,
      }));

    const assigned = resolveThirdAssignments(
      qualifiedThirds,
      allowLegacyFallbackWhileTableIsIncomplete
    );

    third74 = assigned.third74;
    third77 = assigned.third77;
    third79 = assigned.third79;
    third80 = assigned.third80;
    third81 = assigned.third81;
    third82 = assigned.third82;
    third85 = assigned.third85;
    third87 = assigned.third87;
  }

  return [
    { id: "r32-1", homeTeamId: A2.teamId, awayTeamId: B2.teamId, homeLabel: "2º Grupo A", awayLabel: "2º Grupo B" },
    { id: "r32-2", homeTeamId: E1.teamId, awayTeamId: third74, homeLabel: "1º Grupo E", awayLabel: "3º oficial" },
    { id: "r32-3", homeTeamId: F1.teamId, awayTeamId: C2.teamId, homeLabel: "1º Grupo F", awayLabel: "2º Grupo C" },
    { id: "r32-4", homeTeamId: C1.teamId, awayTeamId: F2.teamId, homeLabel: "1º Grupo C", awayLabel: "2º Grupo F" },
    { id: "r32-5", homeTeamId: I1.teamId, awayTeamId: third77, homeLabel: "1º Grupo I", awayLabel: "3º oficial" },
    { id: "r32-6", homeTeamId: E2.teamId, awayTeamId: I2.teamId, homeLabel: "2º Grupo E", awayLabel: "2º Grupo I" },
    { id: "r32-7", homeTeamId: A1.teamId, awayTeamId: third79, homeLabel: "1º Grupo A", awayLabel: "3º oficial" },
    { id: "r32-8", homeTeamId: L1.teamId, awayTeamId: third80, homeLabel: "1º Grupo L", awayLabel: "3º oficial" },
    { id: "r32-9", homeTeamId: D1.teamId, awayTeamId: third81, homeLabel: "1º Grupo D", awayLabel: "3º oficial" },
    { id: "r32-10", homeTeamId: G1.teamId, awayTeamId: third82, homeLabel: "1º Grupo G", awayLabel: "3º oficial" },
    { id: "r32-11", homeTeamId: K2.teamId, awayTeamId: L2.teamId, homeLabel: "2º Grupo K", awayLabel: "2º Grupo L" },
    { id: "r32-12", homeTeamId: H1.teamId, awayTeamId: J2.teamId, homeLabel: "1º Grupo H", awayLabel: "2º Grupo J" },
    { id: "r32-13", homeTeamId: B1.teamId, awayTeamId: third85, homeLabel: "1º Grupo B", awayLabel: "3º oficial" },
    { id: "r32-14", homeTeamId: J1.teamId, awayTeamId: H2.teamId, homeLabel: "1º Grupo J", awayLabel: "2º Grupo H" },
    { id: "r32-15", homeTeamId: K1.teamId, awayTeamId: third87, homeLabel: "1º Grupo K", awayLabel: "3º oficial" },
    { id: "r32-16", homeTeamId: D2.teamId, awayTeamId: G2.teamId, homeLabel: "2º Grupo D", awayLabel: "2º Grupo G" },
  ];
}