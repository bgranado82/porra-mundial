
import { KnockoutBracketMatch, KnockoutPredictionMap, Team } from "@/types";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  round32: KnockoutBracketMatch[];
  round16: KnockoutBracketMatch[];
  quarterfinals: KnockoutBracketMatch[];
  semifinals: KnockoutBracketMatch[];
  finals: KnockoutBracketMatch[];
  teams: Team[];
  picks: KnockoutPredictionMap;
  onPick: (matchId: string, teamId: string | null) => void;
};

function getOfficialMatchNumber(id: string) {
  const map: Record<string, number> = {
    "r32-1": 73,
    "r32-2": 74,
    "r32-3": 75,
    "r32-4": 76,
    "r32-5": 77,
    "r32-6": 78,
    "r32-7": 79,
    "r32-8": 80,
    "r32-9": 81,
    "r32-10": 82,
    "r32-11": 83,
    "r32-12": 84,
    "r32-13": 85,
    "r32-14": 86,
    "r32-15": 87,
    "r32-16": 88,
    "r16-1": 89,
    "r16-2": 90,
    "r16-3": 91,
    "r16-4": 92,
    "r16-5": 93,
    "r16-6": 94,
    "r16-7": 95,
    "r16-8": 96,
    "qf-1": 97,
    "qf-2": 98,
    "qf-3": 99,
    "qf-4": 100,
    "sf-1": 101,
    "sf-2": 102,
    "third-1": 103,
    "final-1": 104,
  };

  return map[id] ?? null;
}

function getDisplayText(team: Team | null, label?: string) {
  if (!team) return label ?? "Por definir";

  return (
    <span className="flex items-center gap-2">
      <img
        src={team.flagUrl}
        alt={team.name}
        className="h-4 w-6 rounded-[2px] border border-gray-200 object-cover"
      />
      {team.name}
    </span>
  );
}

function TeamButton({
  team,
  label,
  selected,
  onClick,
}: {
  team: Team | null;
  label?: string;
  selected: boolean;
  onClick: () => void;
}) {
  const clickable = !!team;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`w-full rounded-xl border px-3 py-3 text-left text-sm font-bold transition ${
        selected
          ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green)]/10 text-[var(--iberdrola-forest)]"
          : "border-[var(--iberdrola-sky)] bg-white text-[var(--iberdrola-forest)]"
      } ${
        clickable
          ? "hover:bg-[var(--iberdrola-sand)]"
          : "cursor-default opacity-85"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 break-words">{getDisplayText(team, label)}</span>
        <span className="shrink-0">
          {selected ? (
            <span className="ml-2 rounded-full bg-[var(--iberdrola-forest)] px-2 py-1 text-[10px] font-black text-white">
              ✓
            </span>
          ) : null}
        </span>
      </div>
    </button>
  );
}

function MatchCard({
  match,
  teams,
  picks,
  onPick,
}: {
  match: KnockoutBracketMatch;
  teams: Team[];
  picks: KnockoutPredictionMap;
  onPick: (matchId: string, teamId: string | null) => void;
}) {
  const homeTeam = teams.find((t) => t.id === match.homeTeamId) ?? null;
  const awayTeam = teams.find((t) => t.id === match.awayTeamId) ?? null;
  const selected = picks[match.id] ?? null;
  const officialNumber = getOfficialMatchNumber(match.id);

  return (
    <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-3 shadow-sm">
      <div className="mb-3 text-xs font-black uppercase tracking-wide text-[var(--iberdrola-forest)]/65">
        {officialNumber ? `Partido ${officialNumber}` : match.id.toUpperCase()}
      </div>

      <div className="space-y-2">
        <TeamButton
          team={homeTeam}
          label={match.homeLabel}
          selected={selected === homeTeam?.id}
          onClick={() =>
            onPick(match.id, selected === homeTeam?.id ? null : homeTeam?.id ?? null)
          }
        />

        <TeamButton
          team={awayTeam}
          label={match.awayLabel}
          selected={selected === awayTeam?.id}
          onClick={() =>
            onPick(match.id, selected === awayTeam?.id ? null : awayTeam?.id ?? null)
          }
        />
      </div>
    </div>
  );
}

function StageTitle({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-[var(--iberdrola-sand)] px-3 py-2 text-sm font-black text-[var(--iberdrola-forest)]">
      {children}
    </div>
  );
}

function StageColumn({
  title,
  matches,
  teams,
  picks,
  onPick,
}: {
  title: string;
  matches: KnockoutBracketMatch[];
  teams: Team[];
  picks: KnockoutPredictionMap;
  onPick: (matchId: string, teamId: string | null) => void;
}) {
  return (
    <div className="space-y-3">
      <StageTitle>{title}</StageTitle>
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          teams={teams}
          picks={picks}
          onPick={onPick}
        />
      ))}
    </div>
  );
}

export default function AdminKnockoutBracket({
  title,
  subtitle,
  round32,
  round16,
  quarterfinals,
  semifinals,
  finals,
  teams,
  picks,
  onPick,
}: Props) {
  const orderedRound32Left = [
    "r32-2",
    "r32-5",
    "r32-1",
    "r32-3",
    "r32-4",
    "r32-6",
    "r32-7",
    "r32-8",
  ]
    .map((id) => round32.find((m) => m.id === id))
    .filter(Boolean) as KnockoutBracketMatch[];

  const orderedRound32Right = [
    "r32-11",
    "r32-12",
    "r32-9",
    "r32-10",
    "r32-14",
    "r32-16",
    "r32-13",
    "r32-15",
  ]
    .map((id) => round32.find((m) => m.id === id))
    .filter(Boolean) as KnockoutBracketMatch[];

  const orderedRound16Left = ["r16-1", "r16-2", "r16-3", "r16-4"]
    .map((id) => round16.find((m) => m.id === id))
    .filter(Boolean) as KnockoutBracketMatch[];

  const orderedRound16Right = ["r16-5", "r16-6", "r16-7", "r16-8"]
    .map((id) => round16.find((m) => m.id === id))
    .filter(Boolean) as KnockoutBracketMatch[];

  const orderedQuarterLeft = ["qf-1", "qf-3"]
    .map((id) => quarterfinals.find((m) => m.id === id))
    .filter(Boolean) as KnockoutBracketMatch[];

  const orderedQuarterRight = ["qf-2", "qf-4"]
    .map((id) => quarterfinals.find((m) => m.id === id))
    .filter(Boolean) as KnockoutBracketMatch[];

  return (
    <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
      <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
        <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="space-y-6 p-4">
        <div className="lg:hidden space-y-6">
          <div className="space-y-3">
            <StageTitle>Lado izquierdo</StageTitle>
            <StageColumn
              title="Round of 32"
              matches={orderedRound32Left}
              teams={teams}
              picks={picks}
              onPick={onPick}
            />
            <StageColumn
              title="Round of 16"
              matches={orderedRound16Left}
              teams={teams}
              picks={picks}
              onPick={onPick}
            />
            <StageColumn
              title="Cuartos"
              matches={orderedQuarterLeft}
              teams={teams}
              picks={picks}
              onPick={onPick}
            />
          </div>

          <div className="space-y-3">
            <StageTitle>Lado derecho</StageTitle>
            <StageColumn
              title="Round of 32"
              matches={orderedRound32Right}
              teams={teams}
              picks={picks}
              onPick={onPick}
            />
            <StageColumn
              title="Round of 16"
              matches={orderedRound16Right}
              teams={teams}
              picks={picks}
              onPick={onPick}
            />
            <StageColumn
              title="Cuartos"
              matches={orderedQuarterRight}
              teams={teams}
              picks={picks}
              onPick={onPick}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <StageColumn
              title="Semis"
              matches={semifinals}
              teams={teams}
              picks={picks}
              onPick={onPick}
            />
            <StageColumn
              title="Final"
              matches={finals}
              teams={teams}
              picks={picks}
              onPick={onPick}
            />
          </div>
        </div>

        <div className="hidden lg:grid lg:grid-cols-[1fr_1fr_0.8fr_1fr_1fr] xl:gap-4">
          <StageColumn
            title="Round of 32"
            matches={orderedRound32Left}
            teams={teams}
            picks={picks}
            onPick={onPick}
          />

          <StageColumn
            title="Round of 16"
            matches={orderedRound16Left}
            teams={teams}
            picks={picks}
            onPick={onPick}
          />

          <div className="space-y-4">
            <StageColumn
              title="Cuartos"
              matches={[...orderedQuarterLeft, ...orderedQuarterRight]}
              teams={teams}
              picks={picks}
              onPick={onPick}
            />
            <StageColumn
              title="Semis"
              matches={semifinals}
              teams={teams}
              picks={picks}
              onPick={onPick}
            />
            <StageColumn
              title="Final"
              matches={finals}
              teams={teams}
              picks={picks}
              onPick={onPick}
            />
          </div>

          <StageColumn
            title="Round of 16"
            matches={orderedRound16Right}
            teams={teams}
            picks={picks}
            onPick={onPick}
          />

          <StageColumn
            title="Round of 32"
            matches={orderedRound32Right}
            teams={teams}
            picks={picks}
            onPick={onPick}
          />
        </div>
      </div>
    </section>
  );
}