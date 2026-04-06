import { Match } from "@/types";

export function isGroupStageComplete(matches: Match[]) {
  const groupMatches = matches.filter((match) => match.stage === "group");

  return groupMatches.every(
    (match) => match.homeGoals !== null && match.awayGoals !== null
  );
}