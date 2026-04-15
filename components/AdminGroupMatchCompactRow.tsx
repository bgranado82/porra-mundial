
"use client";

type Team = {
  id: string;
  name: string;
  flagUrl?: string;
};

type Props = {
  day: number;
  group: string | null;
  kickoff: string | null;
  homeTeam: Team;
  awayTeam: Team;
  homeValue: string;
  awayValue: string;
  onChangeHome: (value: string) => void;
  onChangeAway: (value: string) => void;
};

function formatKickoff(kickoff: string | null) {
  if (!kickoff) return "-";

  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TeamFlag({ team }: { team: Team }) {
  if (!team.flagUrl) return null;

  return (
    <img
      src={team.flagUrl}
      alt={team.name}
      className="h-4 w-6 rounded-[2px] border border-gray-200 object-cover"
    />
  );
}

function isFilled(value: string) {
  return value.trim() !== "";
}

export default function AdminGroupMatchCompactRow({
  day,
  group,
  kickoff,
  homeTeam,
  awayTeam,
  homeValue,
  awayValue,
  onChangeHome,
  onChangeAway,
}: Props) {
  const completed = isFilled(homeValue) && isFilled(awayValue);

  return (
    <div className="grid h-[56px] grid-cols-[140px_minmax(0,1fr)_80px] items-center gap-3 border-b border-[var(--iberdrola-sky)]/70 px-4 py-2 text-sm">
      <div className="flex flex-col justify-center leading-tight">
        <span className="text-[12px] font-bold text-[var(--iberdrola-forest)]">
          J{day} · {group ?? "-"}
        </span>

        <span className="whitespace-nowrap text-[10px] font-medium text-[var(--iberdrola-forest)]/60">
          {formatKickoff(kickoff)}
        </span>

        <span className="whitespace-nowrap text-[10px] font-semibold text-[var(--iberdrola-forest)]/75">
          Oficial
        </span>
      </div>

      <div className="grid grid-cols-[minmax(140px,1fr)_auto_minmax(140px,1fr)] items-center gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <TeamFlag team={homeTeam} />
          <span className="truncate text-[13px] font-semibold text-[var(--iberdrola-forest)]">
            {homeTeam.name}
          </span>
        </div>

        <div className="flex items-center justify-center gap-2">
          <input
            inputMode="numeric"
            value={homeValue}
            onChange={(e) => onChangeHome(e.target.value.replace(/\D/g, ""))}
            className="h-9 w-11 rounded-xl border border-[var(--iberdrola-sky)] bg-white text-center text-[13px] font-bold text-[var(--iberdrola-forest)] outline-none"
          />

          <span className="font-bold text-[var(--iberdrola-forest)]/60">-</span>

          <input
            inputMode="numeric"
            value={awayValue}
            onChange={(e) => onChangeAway(e.target.value.replace(/\D/g, ""))}
            className="h-9 w-11 rounded-xl border border-[var(--iberdrola-sky)] bg-white text-center text-[13px] font-bold text-[var(--iberdrola-forest)] outline-none"
          />
        </div>

        <div className="flex min-w-0 items-center justify-end gap-1.5">
          <span className="truncate text-right text-[13px] font-semibold text-[var(--iberdrola-forest)]">
            {awayTeam.name}
          </span>
          <TeamFlag team={awayTeam} />
        </div>
      </div>

      <div className="flex justify-end">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
            completed
              ? "bg-[var(--iberdrola-green)] text-white"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {completed ? "OK" : "—"}
        </span>
      </div>
    </div>
  );
}