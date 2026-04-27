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
    <div className="rounded-2xl border border-[var(--iberdrola-green)]/40 bg-white p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--iberdrola-forest)]/55">
        <span className="inline-block h-1 w-4 rounded-full bg-[var(--iberdrola-green)]" />
        {title}
      </h3>

      <div className="space-y-3">
        <div>
          <div className="mb-2 text-xs font-black uppercase tracking-wide text-[var(--iberdrola-forest)]/70">
            Grupos
          </div>

          <div className="grid gap-2 text-sm text-[var(--iberdrola-forest)]">
            <div className="flex items-center justify-between rounded-xl bg-[var(--iberdrola-green-light)]/50 px-3 py-2.5 transition hover:bg-[var(--iberdrola-green-light)]">
              <span>{exactScoreLabel}</span>
              <strong>{settings.exactScore} {pointsLabel}</strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[var(--iberdrola-green-light)]/50 px-3 py-2.5 transition hover:bg-[var(--iberdrola-green-light)]">
              <span>{outcomeLabel}</span>
              <strong>{settings.outcome} {pointsLabel}</strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[var(--iberdrola-green-light)]/50 px-3 py-2.5 transition hover:bg-[var(--iberdrola-green-light)]">
              <span>{homeGoalsLabel}</span>
              <strong>{settings.homeGoals} {pointsLabel}</strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[var(--iberdrola-green-light)]/50 px-3 py-2.5 transition hover:bg-[var(--iberdrola-green-light)]">
              <span>{awayGoalsLabel}</span>
              <strong>{settings.awayGoals} {pointsLabel}</strong>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-black uppercase tracking-wide text-[var(--iberdrola-forest)]/70">
            Eliminatorias
          </div>

          <div className="grid gap-2 text-sm text-[var(--iberdrola-forest)]">
            <div className="flex items-center justify-between rounded-xl bg-[var(--iberdrola-green-light)]/50 px-3 py-2.5 transition hover:bg-[var(--iberdrola-green-light)]">
              <span>{round32Label}</span>
              <strong>{settings.round32QualifiedPoints} {pointsLabel}</strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[var(--iberdrola-green-light)]/50 px-3 py-2.5 transition hover:bg-[var(--iberdrola-green-light)]">
              <span>{round16Label}</span>
              <strong>{settings.round16QualifiedPoints} {pointsLabel}</strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[var(--iberdrola-green-light)]/50 px-3 py-2.5 transition hover:bg-[var(--iberdrola-green-light)]">
              <span>{quarterfinalLabel}</span>
              <strong>{settings.quarterfinalQualifiedPoints} {pointsLabel}</strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[var(--iberdrola-green-light)]/50 px-3 py-2.5 transition hover:bg-[var(--iberdrola-green-light)]">
              <span>{semifinalLabel}</span>
              <strong>{settings.semifinalQualifiedPoints} {pointsLabel}</strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[var(--iberdrola-green-light)]/50 px-3 py-2.5 transition hover:bg-[var(--iberdrola-green-light)]">
              <span>{finalLabel}</span>
              <strong>{settings.finalQualifiedPoints} {pointsLabel}</strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[var(--iberdrola-green-light)]/50 px-3 py-2.5 transition hover:bg-[var(--iberdrola-green-light)]">
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