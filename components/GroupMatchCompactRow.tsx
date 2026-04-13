"use client";

type Team = {
  id: string;
  name: string;
  flag: string;
};

type Props = {
  day: number;
  group: string | null;
  kickoff: string | null;
  homeTeam: Team;
  awayTeam: Team;
  homePrediction: number | null;
  awayPrediction: number | null;
  officialHomeGoals: number | null;
  officialAwayGoals: number | null;
  points: number;
  onChangeHome: (value: number | null) => void;
  onChangeAway: (value: number | null) => void;
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

export default function GroupMatchCompactRow({
  day,
  group,
  kickoff,
  homeTeam,
  awayTeam,
  homePrediction,
  awayPrediction,
  officialHomeGoals,
  officialAwayGoals,
  points,
  onChangeHome,
  onChangeAway,
}: Props) {
  return (
    <div className="grid grid-cols-[72px_44px_96px_minmax(520px,1fr)_78px_92px] items-center gap-2 border-b border-[var(--iberdrola-sky)]/70 px-3 py-2 text-sm">
      <div className="font-bold text-[var(--iberdrola-forest)]">
        J{day}
      </div>

      <div className="font-bold text-[var(--iberdrola-forest)]">
        {group ?? "-"}
      </div>

      <div className="whitespace-nowrap text-xs font-medium text-[var(--iberdrola-forest)]/70">
        {formatKickoff(kickoff)}
      </div>

      <div className="grid grid-cols-[minmax(180px,1fr)_auto_minmax(180px,1fr)] items-center gap-3">
        <div className="flex min-w-0 items-center justify-start gap-2">
          <span className="shrink-0 text-xs">{homeTeam.flag}</span>
          <span className="truncate text-left font-semibold text-[var(--iberdrola-forest)]">
            {homeTeam.name}
          </span>
        </div>

        <div className="flex items-center justify-center gap-2">
          <input
            type="number"
            min={0}
            value={homePrediction ?? ""}
            onChange={(e) =>
              onChangeHome(e.target.value === "" ? null : Number(e.target.value))
            }
            className="h-9 w-12 rounded-xl border border-[var(--iberdrola-sky)] bg-white text-center font-bold text-[var(--iberdrola-forest)] outline-none"
          />

          <span className="font-bold text-[var(--iberdrola-forest)]/60">-</span>

          <input
            type="number"
            min={0}
            value={awayPrediction ?? ""}
            onChange={(e) =>
              onChangeAway(e.target.value === "" ? null : Number(e.target.value))
            }
            className="h-9 w-12 rounded-xl border border-[var(--iberdrola-sky)] bg-white text-center font-bold text-[var(--iberdrola-forest)] outline-none"
          />
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <span className="truncate text-right font-semibold text-[var(--iberdrola-forest)]">
            {awayTeam.name}
          </span>
          <span className="shrink-0 text-xs">{awayTeam.flag}</span>
        </div>
      </div>

      <div className="whitespace-nowrap text-[11px] font-semibold text-[var(--iberdrola-forest)]/60">
        {officialHomeGoals !== null && officialAwayGoals !== null
          ? `${officialHomeGoals}-${officialAwayGoals}`
          : "-"}
      </div>

      <div className="flex justify-end">
        <span className="inline-flex rounded-full bg-[var(--iberdrola-green)] px-3 py-1 text-xs font-black text-white">
          {points} pts
        </span>
      </div>
    </div>
  );
}