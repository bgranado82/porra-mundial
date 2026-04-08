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
      ? `${officialLabel}: ${officialHomeGoals}-${officialAwayGoals}`
      : `${officialLabel}: ${officialPendingLabel}`;

  return (
    <div className="py-2">
      <div className="mb-1 flex items-center justify-between text-[10px] leading-none text-gray-500 md:text-[11px]">
        <span>#{matchNumber ?? "-"}</span>
        <span>{kickoffInfo.short || "-"}</span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_74px_minmax(0,1fr)_30px] items-center gap-2 md:grid-cols-[minmax(0,1fr)_86px_minmax(0,1fr)_34px] md:gap-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 text-sm md:text-base">{homeTeam.flag}</span>
          <span className="truncate text-sm text-[var(--iberdrola-forest)] md:text-[15px]">
            {homeTeam.name}
          </span>
        </div>

        <div className="flex items-center justify-center gap-1">
          <input
            type="number"
            min="0"
            value={homePrediction ?? ""}
            onChange={(e) =>
              onChangeHome(e.target.value === "" ? null : Number(e.target.value))
            }
            className="h-8 w-8 rounded-md border border-[var(--iberdrola-sky)] bg-white p-0 text-center text-sm text-[var(--iberdrola-forest)] md:h-9 md:w-9"
          />
          <span className="text-sm font-semibold text-[var(--iberdrola-forest)]">
            -
          </span>
          <input
            type="number"
            min="0"
            value={awayPrediction ?? ""}
            onChange={(e) =>
              onChangeAway(e.target.value === "" ? null : Number(e.target.value))
            }
            className="h-8 w-8 rounded-md border border-[var(--iberdrola-sky)] bg-white p-0 text-center text-sm text-[var(--iberdrola-forest)] md:h-9 md:w-9"
          />
        </div>

        <div className="flex min-w-0 items-center justify-end gap-1.5">
          <span className="truncate text-right text-sm text-[var(--iberdrola-forest)] md:text-[15px]">
            {awayTeam.name}
          </span>
          <span className="shrink-0 text-sm md:text-base">{awayTeam.flag}</span>
        </div>

        <div className="text-right">
          <div className="text-[9px] leading-none text-gray-500 md:text-[10px]">
            {pointsShortLabel}
          </div>
          <div className="text-sm font-semibold leading-tight text-[var(--iberdrola-green)] md:text-base">
            {points}
          </div>
        </div>
      </div>

      <div className="mt-1 text-center text-[10px] leading-none text-gray-500 md:text-[11px]">
        {officialText}
      </div>
    </div>
  );
}