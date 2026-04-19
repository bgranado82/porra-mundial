
import { KnockoutBracketMatch, KnockoutPredictionMap, Team } from "@/types";

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
  realTeamsByRound?: {
    round32: Set<string>;
    round16: Set<string>;
    quarterfinals: Set<string>;
    semifinals: Set<string>;
    finals: Set<string>;
    champion: string | null;
  };
  invalidPicks?: Record<string, boolean>;
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

function getPointsForStage(stage: string) {
  if (stage === "round32") return 15;
  if (stage === "round16") return 30;
  if (stage === "quarterfinal") return 45;
  if (stage === "semifinal") return 60;
  if (stage === "final") return 80;
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
  invalid = false,
  onClick,
  interactive,
  points,
}: {
  team: Team | null;
  label?: string;
  selected: boolean;
  invalid?: boolean;
  onClick?: () => void;
  interactive: boolean;
  points?: number;
}) {
  const clickable = interactive && !!team;
  const hasPoints = !!points && points > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`w-full rounded-xl border px-3 py-3 text-left text-sm font-bold transition ${
        invalid
          ? "border-red-400 bg-red-50 text-red-700"
          : selected
            ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green)]/10 text-[var(--iberdrola-forest)]"
            : "border-[var(--iberdrola-sky)] bg-white text-[var(--iberdrola-forest)]"
      } ${clickable ? "hover:bg-[var(--iberdrola-sand)]" : "cursor-default opacity-85"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 break-words">{getDisplayText(team, label)}</span>
        <span className="shrink-0">
          {hasPoints ? (
            <span className="rounded-full bg-[var(--iberdrola-green)] px-2 py-1 text-[10px] font-black text-white">
              +{points}
            </span>
          ) : null}
          {invalid ? (
            <span className="ml-2 rounded-full bg-red-600 px-2 py-1 text-[10px] font-black text-white">
              ⚠
            </span>
          ) : selected ? (
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
  realTeamsByRound,
  invalidPicks,
}: {
  match: KnockoutBracketMatch;
  teams: Team[];
  picks: KnockoutPredictionMap;
  onPick?: (matchId: string, teamId: string | null) => void;
  realTeamsByRound?: Props["realTeamsByRound"];
  invalidPicks?: Record<string, boolean>;
}) {
  const homeTeam = teams.find((t) => t.id === match.homeTeamId) ?? null;
  const awayTeam = teams.find((t) => t.id === match.awayTeamId) ?? null;
  const selected = picks[match.id] ?? null;
  const matchHasInvalidPick = !!invalidPicks?.[match.id];
  const homeInvalid = matchHasInvalidPick && selected === homeTeam?.id;
  const awayInvalid = matchHasInvalidPick && selected === awayTeam?.id;
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
    <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-3 shadow-sm">
      <div className="mb-3 text-xs font-black uppercase tracking-wide text-[var(--iberdrola-forest)]/65">
        {officialNumber ? `Partido ${officialNumber}` : match.id.toUpperCase()}
      </div>

      <div className="space-y-2">
        <TeamButton
          team={homeTeam}
          label={match.homeLabel}
          selected={selected === homeTeam?.id}
          invalid={homeInvalid}
          onClick={() =>
            onPick?.(match.id, selected === homeTeam?.id ? null : homeTeam?.id ?? null)
          }
          interactive={interactive}
          points={homeHit ? pointsPerTeam : 0}
        />
        <TeamButton
          team={awayTeam}
          label={match.awayLabel}
          selected={selected === awayTeam?.id}
          invalid={awayInvalid}
          onClick={() =>
            onPick?.(match.id, selected === awayTeam?.id ? null : awayTeam?.id ?? null)
          }
          interactive={interactive}
          points={awayHit ? pointsPerTeam : 0}
        />
      </div>
    </div>
  );
}

function StageTitle({ children }: { children: React.ReactNode }) {
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
  realTeamsByRound,
  invalidPicks,
  className = "",
  matchesClassName = "space-y-3",
}: {
  title: string;
  matches: KnockoutBracketMatch[];
  teams: Team[];
  picks: KnockoutPredictionMap;
  onPick?: (matchId: string, teamId: string | null) => void;
  realTeamsByRound?: Props["realTeamsByRound"];
  invalidPicks?: Record<string, boolean>;
  className?: string;
  matchesClassName?: string;
}) {
  return (
    <div className={className}>
      <StageTitle>{title}</StageTitle>
      <div className={matchesClassName}>
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            teams={teams}
            picks={picks}
            onPick={onPick}
            realTeamsByRound={realTeamsByRound}
            invalidPicks={invalidPicks}
          />
        ))}
      </div>
    </div>
  );
}

function ChampionCard({
  champion,
  points,
  invalid = false,
}: {
  champion: Team | null;
  points?: number;
  invalid?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 text-center shadow-sm ${
        invalid
          ? "border-red-400 bg-red-50"
          : "border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)]"
      }`}
    >
      <div className="text-xs font-black uppercase tracking-wide text-[var(--iberdrola-forest)]/65">
        Campeón
      </div>

      <div className="mt-2 text-lg font-black text-[var(--iberdrola-forest)]">
        {champion ? (
          <div className="flex items-center justify-center gap-2">
            <img
              src={champion.flagUrl}
              alt={champion.name}
              className="h-5 w-7 rounded-[2px] border border-gray-200 object-cover"
            />
            <span>{champion.name}</span>
          </div>
        ) : (
          "Por definir"
        )}
      </div>

      {invalid ? (
        <div className="mt-2 inline-flex rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
          ⚠ Inválido
        </div>
      ) : null}

      {points && points > 0 ? (
        <div className="mt-2 inline-flex rounded-full bg-[var(--iberdrola-green)] px-3 py-1 text-xs font-black text-white">
          +{points}
        </div>
      ) : null}
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
  invalidPicks,
}: Props) {
  const champion = teams.find((team) => team.id === championId) ?? null;

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

  const championInvalid =
    !!championId &&
    finals.length > 0 &&
    !finals.some(
      (match) => match.homeTeamId === championId || match.awayTeamId === championId
    );

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
        <div className="space-y-6 lg:hidden">
          <div className="space-y-3">
            <StageTitle>Lado izquierdo</StageTitle>
            <StageColumn
              title="Round of 32"
              matches={orderedRound32Left}
              teams={teams}
              picks={picks}
              onPick={onPick}
              realTeamsByRound={realTeamsByRound}
              invalidPicks={invalidPicks}
              matchesClassName="space-y-3"
            />
            <StageColumn
              title="Octavos"
              matches={orderedRound16Left}
              teams={teams}
              picks={picks}
              onPick={onPick}
              realTeamsByRound={realTeamsByRound}
              invalidPicks={invalidPicks}
              matchesClassName="space-y-3"
            />
            <StageColumn
              title="Cuartos"
              matches={orderedQuarterLeft}
              teams={teams}
              picks={picks}
              onPick={onPick}
              realTeamsByRound={realTeamsByRound}
              invalidPicks={invalidPicks}
              matchesClassName="space-y-3"
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
              realTeamsByRound={realTeamsByRound}
              invalidPicks={invalidPicks}
              matchesClassName="space-y-3"
            />
            <StageColumn
              title="Octavos"
              matches={orderedRound16Right}
              teams={teams}
              picks={picks}
              onPick={onPick}
              realTeamsByRound={realTeamsByRound}
              invalidPicks={invalidPicks}
              matchesClassName="space-y-3"
            />
            <StageColumn
              title="Cuartos"
              matches={orderedQuarterRight}
              teams={teams}
              picks={picks}
              onPick={onPick}
              realTeamsByRound={realTeamsByRound}
              invalidPicks={invalidPicks}
              matchesClassName="space-y-3"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_1fr_0.8fr]">
            <StageColumn
              title="Semis"
              matches={semifinals}
              teams={teams}
              picks={picks}
              onPick={onPick}
              realTeamsByRound={realTeamsByRound}
              invalidPicks={invalidPicks}
              matchesClassName="space-y-3"
            />
            <StageColumn
              title="Final"
              matches={finals}
              teams={teams}
              picks={picks}
              onPick={onPick}
              realTeamsByRound={realTeamsByRound}
              invalidPicks={invalidPicks}
              matchesClassName="space-y-3"
            />
            <ChampionCard
              champion={champion}
              invalid={championInvalid}
              points={
                championId &&
                realTeamsByRound?.champion &&
                championId === realTeamsByRound.champion
                  ? 120
                  : 0
              }
            />
          </div>
        </div>

       <div className="hidden overflow-x-auto lg:block">
  <div className="min-w-[1380px]">
    <div className="grid grid-cols-[0.9fr_0.9fr_0.82fr_0.95fr_0.82fr_0.9fr_0.9fr] gap-3 xl:gap-4">
      
      {/* LEFT SIDE */}
      <StageColumn
        title="Round of 32"
        matches={orderedRound32Left}
        teams={teams}
        picks={picks}
        onPick={onPick}
        realTeamsByRound={realTeamsByRound}
        invalidPicks={invalidPicks}
        className="pt-0"
        matchesClassName="space-y-4"
      />

      <StageColumn
        title="Octavos"
        matches={orderedRound16Left}
        teams={teams}
        picks={picks}
        onPick={onPick}
        realTeamsByRound={realTeamsByRound}
        invalidPicks={invalidPicks}
        className="pt-[82px]"
        matchesClassName="space-y-[180px]"
      />

      <StageColumn
        title="Cuartos"
        matches={orderedQuarterLeft}
        teams={teams}
        picks={picks}
        onPick={onPick}
        realTeamsByRound={realTeamsByRound}
        invalidPicks={invalidPicks}
        className="pt-[250px]"
        matchesClassName="space-y-[540px]"
      />

      {/* CENTER COLUMN (SEMIS + FINAL + CHAMPION) */}
      <div className="flex flex-col items-center">

        {/* Semi 101 */}
        <div className="w-full pt-[430px]">
          <StageColumn
            title="Semis"
            matches={semifinals[0] ? [semifinals[0]] : []}
            teams={teams}
            picks={picks}
            onPick={onPick}
            realTeamsByRound={realTeamsByRound}
            invalidPicks={invalidPicks}
          />
        </div>

        {/* Final */}
        <div className="w-full pt-[120px]">
          <StageColumn
            title="Final"
            matches={finals}
            teams={teams}
            picks={picks}
            onPick={onPick}
            realTeamsByRound={realTeamsByRound}
            invalidPicks={invalidPicks}
          />
        </div>

        {/* Semi 102 */}
        <div className="w-full pt-[120px]">
          <StageColumn
            title="Semis"
            matches={semifinals[1] ? [semifinals[1]] : []}
            teams={teams}
            picks={picks}
            onPick={onPick}
            realTeamsByRound={realTeamsByRound}
            invalidPicks={invalidPicks}
          />
        </div>

        {/* Champion */}
        <div className="w-full pt-[140px]">
          <ChampionCard
            champion={champion}
            invalid={championInvalid}
            points={
              championId &&
              realTeamsByRound?.champion &&
              championId === realTeamsByRound.champion
                ? 120
                : 0
            }
          />
        </div>
      </div>

      {/* RIGHT SIDE */}
      <StageColumn
        title="Cuartos"
        matches={orderedQuarterRight}
        teams={teams}
        picks={picks}
        onPick={onPick}
        realTeamsByRound={realTeamsByRound}
        invalidPicks={invalidPicks}
        className="pt-[250px]"
        matchesClassName="space-y-[540px]"
      />

      <StageColumn
        title="Octavos"
        matches={orderedRound16Right}
        teams={teams}
        picks={picks}
        onPick={onPick}
        realTeamsByRound={realTeamsByRound}
        invalidPicks={invalidPicks}
        className="pt-[82px]"
        matchesClassName="space-y-[180px]"
      />

      <StageColumn
        title="Round of 32"
        matches={orderedRound32Right}
        teams={teams}
        picks={picks}
        onPick={onPick}
        realTeamsByRound={realTeamsByRound}
        invalidPicks={invalidPicks}
        className="pt-0"
        matchesClassName="space-y-4"
      />

    </div>
  </div>
</div>
      </div>
    </section>
  );
}
