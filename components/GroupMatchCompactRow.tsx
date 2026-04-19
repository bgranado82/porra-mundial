
"use client";

type Team = {
  id: string;
  name: string;
  flagUrl: string;
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

function TeamFlag({ team }: { team: Team }) {
  return (
    <img
      src={team.flagUrl}
      alt={team.name}
      className="h-4 w-6 rounded-[2px] border border-gray-200 object-cover"
    />
  );
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
      
      {/* INFO */}
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

      {/* MATCH */}
      <div className="grid grid-cols-[minmax(135px,1fr)_auto_minmax(135px,1fr)] items-center gap-2 -ml-12">
        
        {/* HOME */}
        <div className="flex min-w-0 items-center justify-start gap-1.5">
          <TeamFlag team={homeTeam} />
          <span className="truncate text-left text-[13px] font-semibold text-[var(--iberdrola-forest)]">
            {homeTeam.name}
          </span>
        </div>

        {/* INPUTS */}
        <div className="flex items-center justify-center gap-2">
          <input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  value={homePrediction ?? ""}
  onChange={(e) => {
    const value = e.target.value;

    if (!/^\d*$/.test(value)) return;

    if (value === "") {
      onChangeHome(null);
      return;
    }

    onChangeHome(Number(value));
  }}
  className="h-8 w-8 rounded-lg border border-[var(--iberdrola-sky)] bg-white text-center text-sm font-bold text-[var(--iberdrola-forest)]"
/>

          <span className="font-bold text-[var(--iberdrola-forest)]/60">-</span>

          <input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  value={awayPrediction ?? ""}
  onChange={(e) => {
    const value = e.target.value;

    if (!/^\d*$/.test(value)) return;

    if (value === "") {
      onChangeAway(null);
      return;
    }

    onChangeAway(Number(value));
  }}
  className="h-8 w-8 rounded-lg border border-[var(--iberdrola-sky)] bg-white text-center text-sm font-bold text-[var(--iberdrola-forest)]"
/>
        </div>

        {/* AWAY */}
        <div className="flex min-w-0 items-center justify-end gap-1.5">
          <span className="truncate text-right text-[13px] font-semibold text-[var(--iberdrola-forest)]">
            {awayTeam.name}
          </span>
          <TeamFlag team={awayTeam} />
        </div>
      </div>

      {/* POINTS */}
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