import { ScoreSettings } from "@/types";

type Props = {
  settings: ScoreSettings;
  title: string;
  exactScoreLabel: string;
  outcomeLabel: string;
  homeGoalsLabel: string;
  awayGoalsLabel: string;
  round32Label: string;
  round16Label: string;
  quarterfinalLabel: string;
  semifinalLabel: string;
  finalLabel: string;
  championLabel: string;
  noteLabel: string;
  pointsLabel: string;
};

export default function ScoringRulesCard({
  settings,
  title,
  exactScoreLabel,
  outcomeLabel,
  homeGoalsLabel,
  awayGoalsLabel,
  round32Label,
  round16Label,
  quarterfinalLabel,
  semifinalLabel,
  finalLabel,
  championLabel,
  noteLabel,
  pointsLabel,
}: Props) {
  return (
    <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-[var(--iberdrola-forest)]">
        {title}
      </h3>

      <div className="space-y-3">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--iberdrola-forest)]">
            Grupos
          </div>

          <div className="grid gap-2 text-sm text-[var(--iberdrola-forest)]">
            <div className="flex items-center justify-between rounded-lg bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
              <span>{exactScoreLabel}</span>
              <strong>{settings.exactScore} {pointsLabel}</strong>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
              <span>{outcomeLabel}</span>
              <strong>{settings.outcome} {pointsLabel}</strong>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
              <span>{homeGoalsLabel}</span>
              <strong>{settings.homeGoals} {pointsLabel}</strong>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
              <span>{awayGoalsLabel}</span>
              <strong>{settings.awayGoals} {pointsLabel}</strong>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--iberdrola-forest)]">
            Eliminatorias
          </div>

          <div className="grid gap-2 text-sm text-[var(--iberdrola-forest)]">
            <div className="flex items-center justify-between rounded-lg bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
              <span>{round32Label}</span>
              <strong>{settings.round32QualifiedPoints} {pointsLabel}</strong>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
              <span>{round16Label}</span>
              <strong>{settings.round16QualifiedPoints} {pointsLabel}</strong>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
              <span>{quarterfinalLabel}</span>
              <strong>{settings.quarterfinalQualifiedPoints} {pointsLabel}</strong>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
              <span>{semifinalLabel}</span>
              <strong>{settings.semifinalQualifiedPoints} {pointsLabel}</strong>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
              <span>{finalLabel}</span>
              <strong>{settings.finalQualifiedPoints} {pointsLabel}</strong>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
              <span>{championLabel}</span>
              <strong>{settings.championPoints} {pointsLabel}</strong>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-gray-500">{noteLabel}</p>
    </div>
  );
}