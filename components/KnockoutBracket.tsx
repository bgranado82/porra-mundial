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

function MatchRow({
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
  const officialNumber = getOfficialMatchNumber(match.id);
  const pointsPerTeam = getPointsForStage(match.stage);
  const roundKey = getRoundKey(match.stage);

  const homeHit =
    !!homeTeam &&
    !!realTeamsByRound &&
    realTeamsByRound[roundKey].has(homeTeam.id);

  const awayHit =
    !!awayTeam &&
    !!realTeamsByRound &&
    realTeamsByRound[roundKey].has(awayTeam.id);

  function TeamButton({
    team,
    label,
    isSelected,
    hasPoints,
  }: {
    team: Team | null;
    label?: string;
    isSelected: boolean;
    hasPoints: boolean;
  }) {
    const clickable = !!onPick && !!team;

    return (
      <button
        type="button"
        disabled={!clickable}
        onClick={() =>
          onPick?.(match.id, isSelected ? null : team?.id ?? null)
        }
        className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
          isSelected
            ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)]"
            : hasPoints
            ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)]/60"
            : "border-gray-200 bg-white"
        } ${clickable ? "cursor-pointer hover:border-[var(--iberdrola-green)]" : "cursor-default opacity-95"}`}
      >
        <span className="font-medium text-[var(--iberdrola-forest)]">
          {getDisplayText(team, label)}
        </span>

        <div className="ml-3 flex items-center gap-2">
          {hasPoints ? (
            <span className="rounded-full bg-[var(--iberdrola-green)] px-2 py-0.5 text-[11px] font-bold text-white">
              +{pointsPerTeam}
            </span>
          ) : null}

          {isSelected ? (
            <span className="font-bold text-[var(--iberdrola-green)]">✓</span>
          ) : null}
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-[var(--iberdrola-forest)]">
          {officialNumber ? `Partido ${officialNumber}` : match.id.toUpperCase()}
        </div>

        <div className="rounded-full bg-[var(--iberdrola-green-light)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--iberdrola-forest)]">
          {match.stage}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <TeamButton
          team={homeTeam}
          label={match.homeLabel}
          isSelected={selected === homeTeam?.id}
          hasPoints={homeHit}
        />

        <div className="text-center text-sm font-bold text-gray-400">vs</div>

        <TeamButton
          team={awayTeam}
          label={match.awayLabel}
          isSelected={selected === awayTeam?.id}
          hasPoints={awayHit}
        />
      </div>
    </div>
  );
}

function SectionBlock({
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
  if (!matches.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-[var(--iberdrola-forest)]">
        {title}
      </h3>

      <div className="grid gap-3">
        {matches.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            teams={teams}
            picks={picks}
            onPick={onPick}
            realTeamsByRound={realTeamsByRound}
          />
        ))}
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
    <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)]/35 p-4 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-[var(--iberdrola-forest)]">
        Campeón
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-base font-semibold text-[var(--iberdrola-forest)]">
          {champion ? `${champion.flag} ${champion.name}` : "Por definir"}
        </div>

        {points && points > 0 ? (
          <span className="rounded-full bg-[var(--iberdrola-green)] px-2 py-1 text-xs font-bold text-white">
            +{points}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function PlaceholderCard({
  title,
  line1,
  line2,
}: {
  title: string;
  line1: string;
  line2: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-[var(--iberdrola-forest)]">
        {title}
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="rounded-xl border border-gray-200 px-3 py-3 text-sm text-[var(--iberdrola-forest)]">
          {line1}
        </div>
        <div className="text-center text-sm font-bold text-gray-400">vs</div>
        <div className="rounded-xl border border-gray-200 px-3 py-3 text-sm text-[var(--iberdrola-forest)]">
          {line2}
        </div>
      </div>
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
    <section className="rounded-3xl bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-[var(--iberdrola-forest)] md:text-xl">
        {title}
      </h2>

      {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}

      <div className="mt-4 space-y-5">
        <SectionBlock
          title="Round of 32"
          matches={round32}
          teams={teams}
          picks={picks}
          onPick={onPick}
          realTeamsByRound={realTeamsByRound}
        />

        <SectionBlock
          title="Round of 16"
          matches={round16}
          teams={teams}
          picks={picks}
          onPick={onPick}
          realTeamsByRound={realTeamsByRound}
        />

        <SectionBlock
          title="Quarter-finals"
          matches={quarterfinals}
          teams={teams}
          picks={picks}
          onPick={onPick}
          realTeamsByRound={realTeamsByRound}
        />

        <SectionBlock
          title="Semi-finals"
          matches={semifinals}
          teams={teams}
          picks={picks}
          onPick={onPick}
          realTeamsByRound={realTeamsByRound}
        />

        {finalMatch ? (
          <SectionBlock
            title="Final"
            matches={[finalMatch]}
            teams={teams}
            picks={picks}
            onPick={onPick}
            realTeamsByRound={realTeamsByRound}
          />
        ) : (
          <PlaceholderCard
            title="Final"
            line1="Ganador partido 101"
            line2="Ganador partido 102"
          />
        )}

        <PlaceholderCard
          title="Tercer y cuarto puesto · Partido 103"
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
    </section>
  );
}