
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
  matchNumber: number;
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

export default function AdminGroupMatchRow({
  day,
  group,
  kickoff,
  matchNumber,
  homeTeam,
  awayTeam,
  homeValue,
  awayValue,
  onChangeHome,
  onChangeAway,
}: Props) {
  const completed = isFilled(homeValue) && isFilled(awayValue);

  return (
    <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-3 py-3 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/60">
            Partido {matchNumber || "-"} · J{day} · {group ?? "-"}
          </div>
          <div className="mt-1 text-xs font-medium text-[var(--iberdrola-forest)]/65">
            {formatKickoff(kickoff)}
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
            completed
              ? "bg-[var(--iberdrola-green)] text-white"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {completed ? "OK" : "Pendiente"}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <TeamFlag team={homeTeam} />
            <span className="truncate text-sm font-semibold text-[var(--iberdrola-forest)]">
              {homeTeam.name}
            </span>
          </div>

          <input
            inputMode="numeric"
            value={homeValue}
            onChange={(e) => onChangeHome(e.target.value.replace(/\D/g, ""))}
            className="h-10 w-12 rounded-xl border border-[var(--iberdrola-green)] bg-white text-center text-sm font-bold text-[var(--iberdrola-forest)]"
          />
        </div>

        <div className="flex items-center justify-center">
          <span className="text-sm font-black text-[var(--iberdrola-forest)]/55">
            vs
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <TeamFlag team={awayTeam} />
            <span className="truncate text-sm font-semibold text-[var(--iberdrola-forest)]">
              {awayTeam.name}
            </span>
          </div>

          <input
            inputMode="numeric"
            value={awayValue}
            onChange={(e) => onChangeAway(e.target.value.replace(/\D/g, ""))}
            className="h-10 w-12 rounded-xl border border-[var(--iberdrola-green)] bg-white text-center text-sm font-bold text-[var(--iberdrola-forest)]"
          />
        </div>
      </div>
    </div>
  );
}