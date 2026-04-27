
"use client";

type Team = {
  id: string;
  name: string;
  flagUrl: string;
};

type Props = {
  day: number;
  group: string | null;
  matchNumber?: number | null;
  kickoff?: string | null;
  homeTeam: Team;
  awayTeam: Team;
  homePrediction: number | null;
  awayPrediction: number | null;
  officialHomeGoals: number | null;
  officialAwayGoals: number | null;
  points: number;
  pointsShortLabel: string;
  officialLabel: string;
  officialPendingLabel: string;
  matchLabel: string;
  onChangeHome: (value: number | null) => void;
  onChangeAway: (value: number | null) => void;
};

function formatKickoff(kickoff?: string | null) {
  if (!kickoff) return { short: "" };

  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) return { short: "" };

  return {
    short: date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function TeamFlag({ team }: { team: Team }) {
  return (
    <img
      src={team.flagUrl}
      alt={team.name}
      className="h-5 w-7 rounded-[3px] border border-gray-200 object-cover shadow-sm"
    />
  );
}

export default function GroupMatchRow({
  matchNumber,
  kickoff,
  homeTeam,
  awayTeam,
  homePrediction,
  awayPrediction,
  officialHomeGoals,
  officialAwayGoals,
  points,
  pointsShortLabel,
  officialLabel,
  officialPendingLabel,
  matchLabel,
  onChangeHome,
  onChangeAway,
}: Props) {
  const kickoffInfo = formatKickoff(kickoff);

  const hasOfficialResult =
    officialHomeGoals !== null && officialAwayGoals !== null;

  const officialText = hasOfficialResult
    ? `${officialHomeGoals}-${officialAwayGoals}`
    : officialPendingLabel;

  const pointsBadgeClass = !hasOfficialResult
    ? "bg-gray-100 text-gray-500"
    : points > 0
    ? "bg-[var(--iberdrola-green)] text-white"
    : "bg-gray-100 text-gray-500";

  return (
    <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-3 shadow-sm transition hover:shadow-md hover:border-[var(--iberdrola-green)]/40">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0 text-xs font-semibold text-[var(--iberdrola-forest)]/65">
          {matchNumber ? `${matchLabel} ${matchNumber}` : ""}
          {kickoffInfo.short ? ` · ${kickoffInfo.short}` : ""}
        </div>

        <div
          className={`rounded-full px-3 py-1 text-sm font-black ${pointsBadgeClass}`}
        >
          {hasOfficialResult ? `${points} ${pointsShortLabel}` : "-"}
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="min-w-0 flex items-center gap-2">
            <TeamFlag team={homeTeam} />
            <span className="truncate text-sm font-bold text-[var(--iberdrola-forest)]">
              {homeTeam.name}
            </span>
          </div>

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
            className="h-12 w-13 rounded-xl border-2 border-[var(--iberdrola-sky)] bg-[var(--iberdrola-green-light)]/30 px-0 text-center text-lg font-black leading-none text-[var(--iberdrola-forest)] focus:border-[var(--iberdrola-green)] focus:bg-white focus:outline-none transition"
          />
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="min-w-0 flex items-center gap-2">
            <TeamFlag team={awayTeam} />
            <span className="truncate text-sm font-bold text-[var(--iberdrola-forest)]">
              {awayTeam.name}
            </span>
          </div>

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
            className="h-12 w-13 rounded-xl border-2 border-[var(--iberdrola-sky)] bg-[var(--iberdrola-green-light)]/30 px-0 text-center text-lg font-black leading-none text-[var(--iberdrola-forest)] focus:border-[var(--iberdrola-green)] focus:bg-white focus:outline-none transition"
          />
        </div>
      </div>

      <div className="mt-2 border-t border-dashed border-[var(--iberdrola-sky)] pt-2 text-xs font-semibold text-[var(--iberdrola-forest)]/75">
        {officialLabel}: {officialText}
      </div>
    </div>
  );
}