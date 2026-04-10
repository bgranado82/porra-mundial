import {
  KnockoutBracketMatch,
  KnockoutPredictionMap,
  Team,
} from "@/types";

type Props = {
  title: string;
  subtitle?: string;
  round32: KnockoutBracketMatch[];
  round16: KnockoutBracketMatch[];
  quarterfinals: KnockoutBracketMatch[];
  semifinals: KnockoutBracketMatch[];
  finals: KnockoutBracketMatch[];
  championId: string | null;
  teams: Team[];
  picks: KnockoutPredictionMap;
  onPick?: (matchId: string, teamId: string | null) => void;
  hitMap?: Record<string, number>;
  realTeamsByRound?: {
    round32: Set<string>;
    round16: Set<string>;
    quarterfinals: Set<string>;
    semifinals: Set<string>;
    finals: Set<string>;
    champion: string | null;
  };
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
  if (team) return `${team.flag} ${team.name}`;
  return label ?? "Por definir";
}

function getPointsForStage(stage: string) {
  if (stage === "round32") return 15;
  if (stage === "round16") return 20;
  if (stage === "quarterfinal") return 30;
  if (stage === "semifinal") return 50;
  if (stage === "final") return 75;
  return 0;
}

function getRoundKey(stage: string) {
  if (stage === "round32") return "round32";
  if (stage === "round16") return "round16";
  if (stage === "quarterfinal") return "quarterfinals";
  if (stage === "semifinal") return "semifinals";
  return "finals";
}

function TeamButton({
  team,
  label,
  selected,
  onClick,
  interactive,
  points,
}: {
  team: Team | null;
  label?: string;
  selected: boolean;
  onClick?: () => void;
  interactive: boolean;
  points?: number;
}) {
  const clickable = interactive && !!team;
  const hasPoints = !!points && points > 0;

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
        selected
          ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)] text-[var(--iberdrola-forest)]"
          : hasPoints
          ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)]/50 text-[var(--iberdrola-forest)]"
          : "border-gray-200 bg-white text-[var(--iberdrola-forest)]"
      } ${clickable ? "cursor-pointer" : "cursor-default opacity-95"}`}
    >
      <span className="truncate pr-2">{getDisplayText(team, label)}</span>

      <div className="flex items-center gap-2">
        {hasPoints ? (
          <span className="rounded-full bg-[var(--iberdrola-green)] px-2 py-0.5 text-[11px] font-bold text-white">
            +{points}
          </span>
        ) : null}

        {selected ? (
          <span className="text-xs font-bold text-[var(--iberdrola-green)]">
            ✓
          </span>
        ) : null}
      </div>
    </button>
  );
}

function MatchCard({
  match,
  teams,
  picks,
  onPick,
  realTeamsByRound,
}: {
  match: KnockoutBracketMatch;
  teams: Team[];
  picks: KnockoutPredictionMap;
  onPick?: (matchId: string, teamId: string | null) => void;
  realTeamsByRound?: Props["realTeamsByRound"];
}) {
  const homeTeam = teams.find((t) => t.id === match.homeTeamId) ?? null;
  const awayTeam = teams.find((t) => t.id === match.awayTeamId) ?? null;
  const selected = picks[match.id] ?? null;
  const interactive = Boolean(onPick);
  const officialNumber = getOfficialMatchNumber(match.id);

  const roundKey = getRoundKey(match.stage);
  const pointsPerTeam = getPointsForStage(match.stage);

  const homeHit =
    !!homeTeam &&
    !!realTeamsByRound &&
    realTeamsByRound[roundKey].has(homeTeam.id);

  const awayHit =
    !!awayTeam &&
    !!realTeamsByRound &&
    realTeamsByRound[roundKey].has(awayTeam.id);

  return (
    <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white p-3 shadow-sm">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {officialNumber ? `Partido ${officialNumber}` : match.id.toUpperCase()}
      </div>

      <div className="space-y-2">
        <TeamButton
          team={homeTeam}
          label={match.homeLabel}
          selected={selected === homeTeam?.id}
          interactive={interactive}
          onClick={() =>
            onPick?.(match.id, selected === homeTeam?.id ? null : homeTeam?.id ?? null)
          }
          points={homeHit ? pointsPerTeam : 0}
        />

        <TeamButton
          team={awayTeam}
          label={match.awayLabel}
          selected={selected === awayTeam?.id}
          interactive={interactive}
          onClick={() =>
            onPick?.(match.id, selected === awayTeam?.id ? null : awayTeam?.id ?? null)
          }
          points={awayHit ? pointsPerTeam : 0}
        />
      </div>
    </div>
  );
}

function InfoCard({
  title,
  line1,
  line2,
}: {
  title: string;
  line1: string;
  line2: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white p-3 shadow-sm">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </div>
      <div className="space-y-2 text-sm text-[var(--iberdrola-forest)]">
        <div className="rounded-xl border border-gray-200 px-3 py-2">{line1}</div>
        <div className="rounded-xl border border-gray-200 px-3 py-2">{line2}</div>
      </div>
    </div>
  );
}

function ChampionCard({
  champion,
  points,
}: {
  champion: Team | null;
  points?: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)]/35 p-3 shadow-sm">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Campeón
      </div>

      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[var(--iberdrola-forest)]">
        <span>{champion ? `${champion.flag} ${champion.name}` : "Por definir"}</span>

        {points && points > 0 ? (
          <span className="rounded-full bg-[var(--iberdrola-green)] px-2 py-0.5 text-[11px] font-bold text-white">
            +{points}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function StageColumn({
  title,
  matches,
  teams,
  picks,
  onPick,
  realTeamsByRound,
}: {
  title: string;
  matches: KnockoutBracketMatch[];
  teams: Team[];
  picks: KnockoutPredictionMap;
  onPick?: (matchId: string, teamId: string | null) => void;
  realTeamsByRound?: Props["realTeamsByRound"];
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-[var(--iberdrola-green-light)]/35 px-3 py-2 text-center text-sm font-semibold uppercase tracking-wide text-[var(--iberdrola-forest)]">
        {title}
      </div>

      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          teams={teams}
          picks={picks}
          onPick={onPick}
          realTeamsByRound={realTeamsByRound}
        />
      ))}
    </div>
  );
}

export default function KnockoutBracket({
  title,
  subtitle,
  round32,
  round16,
  quarterfinals,
  semifinals,
  finals,
  championId,
  teams,
  picks,
  onPick,
  realTeamsByRound,
}: Props) {
  const champion = teams.find((team) => team.id === championId) ?? null;

  const finalMatch = finals.find((m) => m.id === "final-1") ?? null;

  return (
    <section className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-4 shadow-sm md:p-5">
      <h2 className="text-xl font-semibold text-[var(--iberdrola-forest)] md:text-2xl">
        {title}
      </h2>

      {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StageColumn
          title="R32"
          matches={round32}
          teams={teams}
          picks={picks}
          onPick={onPick}
          realTeamsByRound={realTeamsByRound}
        />

        <StageColumn
          title="R16"
          matches={round16}
          teams={teams}
          picks={picks}
          onPick={onPick}
          realTeamsByRound={realTeamsByRound}
        />

        <StageColumn
          title="QF"
          matches={quarterfinals}
          teams={teams}
          picks={picks}
          onPick={onPick}
          realTeamsByRound={realTeamsByRound}
        />

        <StageColumn
          title="SF"
          matches={semifinals}
          teams={teams}
          picks={picks}
          onPick={onPick}
          realTeamsByRound={realTeamsByRound}
        />

        <div className="space-y-3">
          <div className="rounded-2xl bg-[var(--iberdrola-green-light)]/35 px-3 py-2 text-center text-sm font-semibold uppercase tracking-wide text-[var(--iberdrola-forest)]">
            Final
          </div>

          {finalMatch ? (
            <MatchCard
              match={finalMatch}
              teams={teams}
              picks={picks}
              onPick={onPick}
              realTeamsByRound={realTeamsByRound}
            />
          ) : (
            <InfoCard
              title="Partido 104"
              line1="Ganador partido 101"
              line2="Ganador partido 102"
            />
          )}

          <InfoCard
            title="Partido 103"
            line1="Perdedor partido 101"
            line2="Perdedor partido 102"
          />

          <ChampionCard
            champion={champion}
            points={
              champion &&
              realTeamsByRound?.champion &&
              champion.id === realTeamsByRound.champion
                ? 100
                : 0
            }
          />
        </div>
      </div>
    </section>
  );
}