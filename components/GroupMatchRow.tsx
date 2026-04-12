import { formatKickoff } from "@/lib/timezone";

type TeamDisplay = {
  name: string;
  flag: string;
};

type Props = {
  matchNumber?: number | null;
  kickoff?: string | null;
  timeZone: string;
  homeTeam: TeamDisplay;
  awayTeam: TeamDisplay;
  homePrediction: number | null;
  awayPrediction: number | null;
  officialHomeGoals: number | null;
  officialAwayGoals: number | null;
  points: number;
  pointsShortLabel: string;
  officialLabel: string;
  officialPendingLabel: string;
  onChangeHome: (value: number | null) => void;
  onChangeAway: (value: number | null) => void;
};

export default function GroupMatchRow({
  matchNumber,
  kickoff,
  timeZone,
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
  onChangeHome,
  onChangeAway,
}: Props) {
  const kickoffInfo = formatKickoff(kickoff, timeZone);

  const officialText =
    officialHomeGoals !== null && officialAwayGoals !== null
      ? `${officialHomeGoals}-${officialAwayGoals}`
      : officialPendingLabel;

  return (
    <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0 text-xs font-semibold text-[var(--iberdrola-forest)]/65">
          {matchNumber ? `Partido ${matchNumber}` : ""}
          {kickoffInfo.short ? ` · ${kickoffInfo.short}` : ""}
        </div>

        <div className="rounded-full bg-[var(--iberdrola-green)] px-3 py-1 text-sm font-black text-white">
          {points} {pointsShortLabel}
        </div>
      </div>

      <div className="hidden items-center gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)_44px_20px_44px_minmax(0,1fr)]">
        <div className="truncate text-right text-[15px] font-bold text-[var(--iberdrola-forest)]">
          {homeTeam.flag} {homeTeam.name}
        </div>

        <input
          type="number"
          min={0}
          value={homePrediction ?? ""}
          onChange={(e) =>
            onChangeHome(e.target.value === "" ? null : Number(e.target.value))
          }
          className="h-10 w-11 rounded-xl border border-[var(--iberdrola-sky)] bg-white text-center text-base font-black text-[var(--iberdrola-forest)]"
        />

        <div className="text-center text-sm font-black text-[var(--iberdrola-forest)]">
          -
        </div>

        <input
          type="number"
          min={0}
          value={awayPrediction ?? ""}
          onChange={(e) =>
            onChangeAway(e.target.value === "" ? null : Number(e.target.value))
          }
          className="h-10 w-11 rounded-xl border border-[var(--iberdrola-sky)] bg-white text-center text-base font-black text-[var(--iberdrola-forest)]"
        />

        <div className="truncate text-left text-[15px] font-bold text-[var(--iberdrola-forest)]">
          {awayTeam.name} {awayTeam.flag}
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="min-w-0 truncate text-sm font-bold text-[var(--iberdrola-forest)]">
            {homeTeam.flag} {homeTeam.name}
          </div>
          <input
            type="number"
            min={0}
            value={homePrediction ?? ""}
            onChange={(e) =>
              onChangeHome(e.target.value === "" ? null : Number(e.target.value))
            }
            className="h-11 w-12 rounded-xl border border-[var(--iberdrola-sky)] bg-white text-center text-base font-black text-[var(--iberdrola-forest)]"
          />
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="min-w-0 truncate text-sm font-bold text-[var(--iberdrola-forest)]">
            {awayTeam.flag} {awayTeam.name}
          </div>
          <input
            type="number"
            min={0}
            value={awayPrediction ?? ""}
            onChange={(e) =>
              onChangeAway(e.target.value === "" ? null : Number(e.target.value))
            }
            className="h-11 w-12 rounded-xl border border-[var(--iberdrola-sky)] bg-white text-center text-base font-black text-[var(--iberdrola-forest)]"
          />
        </div>
      </div>

      <div className="mt-2 border-t border-dashed border-[var(--iberdrola-sky)] pt-2 text-xs font-semibold text-[var(--iberdrola-forest)]/75">
        {officialLabel}: {officialText}
      </div>
    </div>
  );
}