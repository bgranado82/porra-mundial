export function getMatchday(matchId: string): number {
  const normalized = String(matchId).toLowerCase();

  if (normalized.startsWith("match-")) {
    const num = Number(normalized.replace("match-", ""));
    if (!Number.isNaN(num)) {
      if (num <= 16) return 1;
      if (num <= 32) return 2;
      return 3;
    }
  }

  const num = Number(normalized);
  if (!Number.isNaN(num)) {
    if (num <= 16) return 1;
    if (num <= 32) return 2;
    return 3;
  }

  return 0;
}