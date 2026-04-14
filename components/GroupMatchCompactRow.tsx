
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
  const hasOfficialResult =
    officialHomeGoals !== null && officialAwayGoals !== null;

  const pointsBadgeClass = !hasOfficialResult
    ? "bg-gray-100 text-gray-500"
    : points > 0
      ? "bg-[var(--iberdrola-green)] text-white"
      : "bg-gray-100 text-gray-500";

  const pointsLabel = !hasOfficialResult ? "- pts" : `${points} pts`;

  return (
    <div className="grid h-[52px] grid-cols-[132px_minmax(0,1fr)_82px] items-center gap-2 border-b border-[var(--iberdrola-sky)]/70 px-3 py-2 text-sm">
      <div className="flex flex-col justify-center leading-tight">
        <span className="text-[12px] font-bold text-[var(--iberdrola-forest)]">
          J{day} · {group ?? "-"}
        </span>

        <span className="whitespace-nowrap text-[10px] font-medium text-[var(--iberdrola-forest)]/60">
          {formatKickoff(kickoff)}
        </span>

        <span className="whitespace-nowrap text-[10px] font-semibold text-[var(--iberdrola-forest)]/75">
          Oficial:{" "}
          {hasOfficialResult
            ? `${officialHomeGoals}-${officialAwayGoals}`
            : "-"}
        </span>
      </div>

      <div className="grid grid-cols-[minmax(135px,1fr)_auto_minmax(135px,1fr)] items-center gap-2 -ml-9">
        <div className="flex min-w-0 items-center justify-start gap-1.5">
          <span className="shrink-0 text-[11px]">{homeTeam.flag}</span>
          <span className="truncate text-left text-[13px] font-semibold text-[var(--iberdrola-forest)]">
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
            className="h-9 w-11 rounded-xl border border-[var(--iberdrola-sky)] bg-white px-0 text-center text-[13px] font-bold leading-none text-[var(--iberdrola-forest)] outline-none"
          />

          <span className="font-bold text-[var(--iberdrola-forest)]/60">-</span>

          <input
            type="number"
            min={0}
            value={awayPrediction ?? ""}
            onChange={(e) =>
              onChangeAway(e.target.value === "" ? null : Number(e.target.value))
            }
            className="h-9 w-11 rounded-xl border border-[var(--iberdrola-sky)] bg-white px-0 text-center text-[13px] font-bold leading-none text-[var(--iberdrola-forest)] outline-none"
          />
        </div>

        <div className="flex min-w-0 items-center justify-end gap-1.5">
          <span className="truncate text-right text-[13px] font-semibold text-[var(--iberdrola-forest)]">
            {awayTeam.name}
          </span>
          <span className="shrink-0 text-[11px]">{awayTeam.flag}</span>
        </div>
      </div>

      <div className="flex justify-end">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${pointsBadgeClass}`}
        >
          {pointsLabel}
        </span>
      </div>
    </div>
  );
}