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

function orderMatches(
  matches: KnockoutBracketMatch[],
  ids: string[]
): KnockoutBracketMatch[] {
  const map = new Map(matches.map((m) => [m.id, m]));
  return ids.map((id) => map.get(id)).filter(Boolean) as KnockoutBracketMatch[];
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

function TeamOption({
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
      className={`flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left text-[12px] ${
        selected
          ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)]"
          : hasPoints
          ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)]/60"
          : "border-gray-200 bg-white"
      } ${clickable ? "cursor-pointer" : "cursor-default opacity-95"}`}
    >
      <span className="truncate">{getDisplayText(team, label)}</span>

      <div className="ml-2 flex items-center gap-1">
        {hasPoints ? (
          <span className="rounded-full bg-[var(--iberdrola-green)] px-1.5 py-0.5 text-[10px] font-bold text-white">
            +{points}
          </span>
        ) : null}

        {selected ? (
          <span className="font-bold text-[var(--iberdrola-green)]">X</span>
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
  hitMap,
  realTeamsByRound,
  compact = false,
}: {
  match: KnockoutBracketMatch;
  teams: Team[];
  picks: KnockoutPredictionMap;
  onPick?: (matchId: string, teamId: string | null) => void;
  hitMap?: Record<string, number>;
  realTeamsByRound?: Props["realTeamsByRound"];
  compact?: boolean;
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
    <div
      className={`rounded-lg border border-[var(--iberdrola-green)] bg-white p-2 shadow-sm ${
        compact ? "w-[165px]" : "w-[185px]"
      }`}
    >
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--iberdrola-forest)]">
        {officialNumber ? `Partido ${officialNumber}` : match.id.toUpperCase()}
      </div>

      <div className="space-y-1.5">
        <TeamOption
          team={homeTeam}
          label={match.homeLabel}
          selected={selected === homeTeam?.id}
          interactive={interactive}
          onClick={() =>
            onPick?.(match.id, selected === homeTeam?.id ? null : homeTeam?.id ?? null)
          }
          points={homeHit ? pointsPerTeam : 0}
        />

        <TeamOption
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

function SimpleCard({
  title,
  line1,
  line2,
}: {
  title: string;
  line1: string;
  line2: string;
}) {
  return (
    <div className="w-[165px] rounded-lg border border-[var(--iberdrola-green)] bg-white p-2 shadow-sm">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--iberdrola-forest)]">
        {title}
      </div>

      <div className="space-y-1.5">
        <div className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[12px] text-[var(--iberdrola-forest)]">
          {line1}
        </div>
        <div className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[12px] text-[var(--iberdrola-forest)]">
          {line2}
        </div>
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
    <div className="w-[165px] rounded-lg border border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)]/35 p-2 shadow-sm">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--iberdrola-forest)]">
        Campeón
      </div>

      <div className="flex items-center justify-between text-[12px] font-semibold text-[var(--iberdrola-forest)]">
        <span>{champion ? `${champion.flag} ${champion.name}` : "Por definir"}</span>

        {points && points > 0 ? (
          <span className="rounded-full bg-[var(--iberdrola-green)] px-1.5 py-0.5 text-[10px] font-bold text-white">
            +{points}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--iberdrola-forest)]">
      {children}
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
  hitMap,
  realTeamsByRound,
}: Props) {
  const champion = teams.find((team) => team.id === championId) ?? null;

  const leftR32 = orderMatches(round32, [
    "r32-2",
    "r32-5",
    "r32-1",
    "r32-3",
    "r32-11",
    "r32-12",
    "r32-9",
    "r32-10",
  ]);

  const rightR32 = orderMatches(round32, [
    "r32-4",
    "r32-6",
    "r32-7",
    "r32-8",
    "r32-14",
    "r32-16",
    "r32-13",
    "r32-15",
  ]);

  const leftR16 = orderMatches(round16, ["r16-1", "r16-2", "r16-5", "r16-6"]);
  const rightR16 = orderMatches(round16, ["r16-3", "r16-4", "r16-7", "r16-8"]);

  const leftQF = orderMatches(quarterfinals, ["qf-1", "qf-2"]);
  const rightQF = orderMatches(quarterfinals, ["qf-3", "qf-4"]);

  const leftSF = orderMatches(semifinals, ["sf-1"]);
  const rightSF = orderMatches(semifinals, ["sf-2"]);

  const finalMatch = finals.find((m) => m.id === "final-1") ?? null;

  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-[var(--iberdrola-forest)] md:text-xl">
        {title}
      </h2>

      {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[1500px]">
          <div className="grid grid-cols-[1fr_180px_1fr] gap-x-8">
            <div className="grid grid-cols-4 gap-x-4">
              <div className="flex flex-col gap-6">
                <ColumnTitle>R32</ColumnTitle>
                {leftR32.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    teams={teams}
                    picks={picks}
                    onPick={onPick}
                    hitMap={hitMap}
                    realTeamsByRound={realTeamsByRound}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-[68px] pt-[64px]">
                <ColumnTitle>R16</ColumnTitle>
                {leftR16.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    teams={teams}
                    picks={picks}
                    onPick={onPick}
                    hitMap={hitMap}
                    realTeamsByRound={realTeamsByRound}
                    compact
                  />
                ))}
              </div>

              <div className="flex flex-col gap-[180px] pt-[135px]">
                <ColumnTitle>QF</ColumnTitle>
                {leftQF.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    teams={teams}
                    picks={picks}
                    onPick={onPick}
                    hitMap={hitMap}
                    realTeamsByRound={realTeamsByRound}
                    compact
                  />
                ))}
              </div>

              <div className="flex flex-col pt-[255px]">
                <ColumnTitle>SF</ColumnTitle>
                {leftSF.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    teams={teams}
                    picks={picks}
                    onPick={onPick}
                    hitMap={hitMap}
                    realTeamsByRound={realTeamsByRound}
                    compact
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center pt-[255px] gap-6">
              <ColumnTitle>Final</ColumnTitle>

              {finalMatch ? (
                <MatchCard
                  match={finalMatch}
                  teams={teams}
                  picks={picks}
                  onPick={onPick}
                  hitMap={hitMap}
                  realTeamsByRound={realTeamsByRound}
                  compact
                />
              ) : (
                <SimpleCard
                  title="Partido 104"
                  line1="Ganador partido 101"
                  line2="Ganador partido 102"
                />
              )}

              <SimpleCard
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

            <div className="grid grid-cols-4 gap-x-4">
              <div className="flex flex-col pt-[255px]">
                <ColumnTitle>SF</ColumnTitle>
                {rightSF.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    teams={teams}
                    picks={picks}
                    onPick={onPick}
                    hitMap={hitMap}
                    realTeamsByRound={realTeamsByRound}
                    compact
                  />
                ))}
              </div>

              <div className="flex flex-col gap-[180px] pt-[135px]">
                <ColumnTitle>QF</ColumnTitle>
                {rightQF.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    teams={teams}
                    picks={picks}
                    onPick={onPick}
                    hitMap={hitMap}
                    realTeamsByRound={realTeamsByRound}
                    compact
                  />
                ))}
              </div>

              <div className="flex flex-col gap-[68px] pt-[64px]">
                <ColumnTitle>R16</ColumnTitle>
                {rightR16.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    teams={teams}
                    picks={picks}
                    onPick={onPick}
                    hitMap={hitMap}
                    realTeamsByRound={realTeamsByRound}
                    compact
                  />
                ))}
              </div>

              <div className="flex flex-col gap-6">
                <ColumnTitle>R32</ColumnTitle>
                {rightR32.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    teams={teams}
                    picks={picks}
                    onPick={onPick}
                    hitMap={hitMap}
                    realTeamsByRound={realTeamsByRound}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}