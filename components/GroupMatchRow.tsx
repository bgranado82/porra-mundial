type TeamView = {
  name: string;
  flag: string;
};

type Props = {
  homeTeam: TeamView;
  awayTeam: TeamView;
  homePrediction: number | null;
  awayPrediction: number | null;
  officialHomeGoals: number | null;
  officialAwayGoals: number | null;
  points: number;
  pointsLabel: string;
  pointsShortLabel: string;
  officialLabel: string;
  officialPendingLabel: string;
  onChangeHome: (value: number | null) => void;
  onChangeAway: (value: number | null) => void;
};

export default function GroupMatchRow({
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
  const officialResultText =
    officialHomeGoals === null || officialAwayGoals === null
      ? `${officialLabel}: ${officialPendingLabel}`
      : `${officialLabel}: ${officialHomeGoals} - ${officialAwayGoals}`;

  return (
    <div className="grid grid-cols-[1.4fr_160px_1.4fr_60px] items-center gap-2 rounded-2xl border border-[var(--iberdrola-green)] bg-white p-2.5 shadow-sm">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-lg">{homeTeam.flag}</span>
        <span className="truncate text-sm font-medium text-[var(--iberdrola-forest)] md:text-base">
          {homeTeam.name}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center gap-1">
        <div className="flex items-center justify-center gap-1.5">
          <input
            type="number"
            min="0"
            value={homePrediction ?? ""}
            onChange={(e) =>
              onChangeHome(e.target.value === "" ? null : Number(e.target.value))
            }
            className="w-11 rounded border border-[var(--iberdrola-sky)] p-1 text-center text-sm text-[var(--iberdrola-forest)]"
          />
          <span className="font-bold text-[var(--iberdrola-forest)]">-</span>
          <input
            type="number"
            min="0"
            value={awayPrediction ?? ""}
            onChange={(e) =>
              onChangeAway(e.target.value === "" ? null : Number(e.target.value))
            }
            className="w-11 rounded border border-[var(--iberdrola-sky)] p-1 text-center text-sm text-[var(--iberdrola-forest)]"
          />
        </div>

        <div className="text-[10px] text-gray-500 md:text-[11px]">
          {officialResultText}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-lg">{awayTeam.flag}</span>
        <span className="truncate text-sm font-medium text-[var(--iberdrola-forest)] md:text-base">
          {awayTeam.name}
        </span>
      </div>

      <div className="text-center">
        <div className="text-[10px] text-gray-500">{pointsShortLabel}</div>
        <div className="text-sm font-bold text-[var(--iberdrola-green)] md:text-base">
          {points}
        </div>
      </div>
    </div>
  );
}