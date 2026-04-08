export const TIMEZONE_OPTIONS = [
  { value: "local", label: "Local del dispositivo" },
  { value: "America/New_York", label: "Este EEUU" },
  { value: "America/Chicago", label: "Centro EEUU" },
  { value: "America/Denver", label: "Montaña EEUU" },
  { value: "America/Los_Angeles", label: "Pacífico EEUU" },
  { value: "Europe/Madrid", label: "Madrid" },
  { value: "Atlantic/Canary", label: "Canarias" },
  { value: "UTC", label: "UTC" },
] as const;

export type TimezoneValue = (typeof TIMEZONE_OPTIONS)[number]["value"];

function resolveTimeZone(timeZone: TimezoneValue | string) {
  if (timeZone === "local") {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return timeZone;
}

export function formatKickoff(
  kickoff: string | null | undefined,
  timeZone: TimezoneValue | string,
  locale = "es-ES"
) {
  if (!kickoff) {
    return {
      date: "",
      time: "",
      full: "",
      short: "",
      zone: "",
    };
  }

  const resolvedTimeZone = resolveTimeZone(timeZone);
  const date = new Date(kickoff);

  const dateLabel = new Intl.DateTimeFormat(locale, {
    timeZone: resolvedTimeZone,
    day: "2-digit",
    month: "short",
  }).format(date);

  const weekdayLabel = new Intl.DateTimeFormat(locale, {
    timeZone: resolvedTimeZone,
    weekday: "short",
  }).format(date);

  const timeLabel = new Intl.DateTimeFormat(locale, {
    timeZone: resolvedTimeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return {
    date: dateLabel,
    time: timeLabel,
    full: `${weekdayLabel} ${dateLabel} · ${timeLabel}`,
    short: `${dateLabel} · ${timeLabel}`,
    zone: resolvedTimeZone,
  };
}

export function getDateKey(
  kickoff: string | null | undefined,
  timeZone: TimezoneValue | string
) {
  if (!kickoff) return "";

  const resolvedTimeZone = resolveTimeZone(timeZone);
  const date = new Date(kickoff);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: resolvedTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}