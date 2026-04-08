
export function getKickoff(day: number): string {
  const baseDate = new Date("2026-06-11T18:00:00Z"); // inicio Mundial

  const date = new Date(baseDate);
  date.setDate(baseDate.getDate() + (day - 1));

  return date.toISOString();
}