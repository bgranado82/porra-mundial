
"use client";

import { useEffect, useMemo, useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { matches as initialMatches } from "@/data/matches";
import { scoreSettings } from "@/data/settings";
import { teams } from "@/data/teams";
import { realKnockoutPredictions as initialRealKnockoutPredictions } from "@/data/realKnockoutPredictions";
import { calculateMatchPredictionScore } from "@/lib/scoring";
import { calculatePredictedStandings } from "@/lib/standings";
import { buildUserKnockoutBracket } from "@/lib/knockoutBracket";
import { buildRealKnockoutBracket } from "@/lib/realKnockout";
import {
  calculateKnockoutHitMap,
  calculateKnockoutScore,
} from "@/lib/knockoutScoring";
import { getBestThirdPlacedTeams } from "@/lib/thirdPlace";
import { Locale, messages } from "@/lib/i18n";
import { TIMEZONE_OPTIONS, TimezoneValue, formatKickoff } from "@/lib/timezone";
import { KnockoutPredictionMap, Match, Team } from "@/types";
import { createClient } from "@/utils/supabase/client";

type PredictionMap = Record<
  string,
  { homeGoals: number | null; awayGoals: number | null }
>;

type OfficialGroupRow = {
  match_id: string;
  home_goals: number | null;
  away_goals: number | null;
};

type OfficialKnockoutRow = {
  match_id: string;
  picked_team_id: string | null;
};

const LOCALE_KEY = "porra-mundial-locale";
const TIMEZONE_KEY = "porra-mundial-timezone";

type Props = {
  entryId: string;
};

function getTeamsInRound(
  matches: { homeTeamId: string | null; awayTeamId: string | null }[]
) {
  const set = new Set<string>();
  for (const match of matches) {
    if (match.homeTeamId) set.add(match.homeTeamId);
    if (match.awayTeamId) set.add(match.awayTeamId);
  }
  return set;
}

function getStagePoints(stage: string) {
  if (stage === "round32") return scoreSettings.round32QualifiedPoints;
  if (stage === "round16") return scoreSettings.round16QualifiedPoints;
  if (stage === "quarterfinal") return scoreSettings.quarterfinalQualifiedPoints;
  if (stage === "semifinal") return scoreSettings.semifinalQualifiedPoints;
  if (stage === "final") return scoreSettings.finalQualifiedPoints;
  return 0;
}

function getRoundSetKey(stage: string) {
  if (stage === "round32") return "round32";
  if (stage === "round16") return "round16";
  if (stage === "quarterfinal") return "quarterfinals";
  if (stage === "semifinal") return "semifinals";
  return "finals";
}

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

function SectionCard({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)] px-4 py-3">
        <h2 className="text-base font-bold text-[var(--iberdrola-forest)] sm:text-lg">
          {title}
        </h2>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-3 text-center shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--iberdrola-forest)]/70">
        {label}
      </div>
      <div className="mt-1 text-xl font-extrabold text-[var(--iberdrola-green)]">
        {value}
      </div>
    </div>
  );
}

function CompactRule({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)] px-3 py-2">
      <div className="text-[11px] font-semibold text-[var(--iberdrola-forest)]/75">
        {label}
      </div>
      <div className="text-sm font-bold text-[var(--iberdrola-forest)]">
        {value}
      </div>
    </div>
  );
}

function ScoreInput({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      className="h-11 w-12 rounded-xl border border-[var(--iberdrola-sky)] bg-white text-center text-base font-bold text-[var(--iberdrola-forest)] outline-none transition focus:border-[var(--iberdrola-green)] disabled:cursor-not-allowed disabled:bg-gray-100"
    />
  );
}

function MatchCard({
  match,
  homeTeam,
  awayTeam,
  timeZone,
  prediction,
  officialHomeGoals,
  officialAwayGoals,
  points,
  officialLabel,
  officialPendingLabel,
  disabled,
  onChangeHome,
  onChangeAway,
}: {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  timeZone: string;
  prediction: { homeGoals: number | null; awayGoals: number | null };
  officialHomeGoals: number | null;
  officialAwayGoals: number | null;
  points: number;
  officialLabel: string;
  officialPendingLabel: string;
  disabled: boolean;
  onChangeHome: (value: number | null) => void;
  onChangeAway: (value: number | null) => void;
}) {
  const kickoffInfo = formatKickoff(match.kickoff, timeZone);
  const officialText =
    officialHomeGoals !== null && officialAwayGoals !== null
      ? `${officialHomeGoals}-${officialAwayGoals}`
      : officialPendingLabel;

  return (
    <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-[var(--iberdrola-forest)]/70">
          Partido {match.matchNumber ?? "-"}
          {kickoffInfo.short ? ` · ${kickoffInfo.short}` : ""}
        </div>
        <div className="rounded-full bg-[var(--iberdrola-green)] px-2.5 py-1 text-xs font-bold text-white">
          {points} pts
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="min-w-0 text-sm font-semibold text-[var(--iberdrola-forest)]">
            <span className="mr-2">{homeTeam.flag}</span>
            <span className="break-words">{homeTeam.name}</span>
          </div>
          <ScoreInput
            value={prediction.homeGoals}
            onChange={onChangeHome}
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="min-w-0 text-sm font-semibold text-[var(--iberdrola-forest)]">
            <span className="mr-2">{awayTeam.flag}</span>
            <span className="break-words">{awayTeam.name}</span>
          </div>
          <ScoreInput
            value={prediction.awayGoals}
            onChange={onChangeAway}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="mt-3 border-t border-dashed border-[var(--iberdrola-sky)] pt-3 text-xs text-[var(--iberdrola-forest)]/75">
        {officialLabel}: <span className="font-semibold">{officialText}</span>
      </div>
    </div>
  );
}

function StandingsMiniTable({
  rows,
  labels,
}: {
  rows: Array<{
    teamId: string;
    teamName?: string;
    teamFlag?: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
  }>;
  labels: {
    team: string;
    played: string;
    won: string;
    drawn: string;
    lost: string;
    goalsFor: string;
    goalsAgainst: string;
    goalDifference: string;
    pointsShort: string;
  };
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--iberdrola-sky)]">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--iberdrola-sand)] text-[var(--iberdrola-forest)]">
          <tr>
            <th className="px-3 py-2 text-left font-bold">#</th>
            <th className="px-3 py-2 text-left font-bold">{labels.team}</th>
            <th className="px-2 py-2 text-center font-bold">{labels.played}</th>
            <th className="px-2 py-2 text-center font-bold">{labels.won}</th>
            <th className="px-2 py-2 text-center font-bold">{labels.drawn}</th>
            <th className="px-2 py-2 text-center font-bold">{labels.lost}</th>
            <th className="px-2 py-2 text-center font-bold">{labels.goalsFor}</th>
            <th className="px-2 py-2 text-center font-bold">
              {labels.goalsAgainst}
            </th>
            <th className="px-2 py-2 text-center font-bold">
              {labels.goalDifference}
            </th>
            <th className="px-3 py-2 text-center font-bold">
              {labels.pointsShort}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.teamId}
              className="border-t border-[var(--iberdrola-sky)] text-[var(--iberdrola-forest)]"
            >
              <td className="px-3 py-2 font-semibold">{index + 1}</td>
              <td className="px-3 py-2 font-semibold whitespace-nowrap">
                {row.teamFlag ?? ""} {row.teamName ?? row.teamId}
              </td>
              <td className="px-2 py-2 text-center">{row.played}</td>
              <td className="px-2 py-2 text-center">{row.won}</td>
              <td className="px-2 py-2 text-center">{row.drawn}</td>
              <td className="px-2 py-2 text-center">{row.lost}</td>
              <td className="px-2 py-2 text-center">{row.goalsFor}</td>
              <td className="px-2 py-2 text-center">{row.goalsAgainst}</td>
              <td className="px-2 py-2 text-center">{row.goalDifference}</td>
              <td className="px-3 py-2 text-center font-bold">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ThirdPlaceCompact({
  title,
  subtitle,
  rows,
  labels,
}: {
  title: string;
  subtitle: string;
  rows: Array<{
    teamId: string;
    teamName: string;
    teamFlag: string;
    group: string | null;
    points: number;
    goalDifference: number;
    goalsFor: number;
    qualifies: boolean;
  }>;
  labels: {
    qualified: string;
    eliminated: string;
  };
}) {
  return (
    <SectionCard title={title}>
      <p className="mb-3 text-sm text-[var(--iberdrola-forest)]/75">{subtitle}</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((row, index) => (
          <div
            key={row.teamId}
            className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-3 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-sm font-bold text-[var(--iberdrola-forest)]">
                #{index + 1}
              </div>
              <div
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  row.qualifies
                    ? "bg-[var(--iberdrola-green)] text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {row.qualifies ? labels.qualified : labels.eliminated}
              </div>
            </div>

            <div className="text-sm font-semibold text-[var(--iberdrola-forest)]">
              {row.teamFlag} {row.teamName}
            </div>
            <div className="mt-1 text-xs text-[var(--iberdrola-forest)]/70">
              Grupo {row.group ?? "-"}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-[var(--iberdrola-sand)] px-2 py-2">
                <div className="text-[10px] font-semibold text-[var(--iberdrola-forest)]/70">
                  PTS
                </div>
                <div className="text-sm font-bold text-[var(--iberdrola-forest)]">
                  {row.points}
                </div>
              </div>
              <div className="rounded-xl bg-[var(--iberdrola-sand)] px-2 py-2">
                <div className="text-[10px] font-semibold text-[var(--iberdrola-forest)]/70">
                  DG
                </div>
                <div className="text-sm font-bold text-[var(--iberdrola-forest)]">
                  {row.goalDifference}
                </div>
              </div>
              <div className="rounded-xl bg-[var(--iberdrola-sand)] px-2 py-2">
                <div className="text-[10px] font-semibold text-[var(--iberdrola-forest)]/70">
                  GF
                </div>
                <div className="text-sm font-bold text-[var(--iberdrola-forest)]">
                  {row.goalsFor}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function KnockoutTeamButton({
  team,
  fallbackLabel,
  selected,
  disabled,
  hit,
  points,
  onClick,
}: {
  team: Team | null;
  fallbackLabel?: string;
  selected: boolean;
  disabled: boolean;
  hit: boolean;
  points: number;
  onClick: () => void;
}) {
  const label = team ? `${team.flag} ${team.name}` : fallbackLabel ?? "Por definir";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !team}
      className={`w-full rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
        selected
          ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green)]/10 text-[var(--iberdrola-forest)]"
          : "border-[var(--iberdrola-sky)] bg-white text-[var(--iberdrola-forest)]"
      } ${disabled || !team ? "cursor-default opacity-80" : "hover:bg-[var(--iberdrola-sand)]"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 break-words">{label}</span>
        <span className="shrink-0 text-right">
          {hit && points > 0 ? (
            <span className="rounded-full bg-[var(--iberdrola-green)] px-2 py-1 text-[10px] font-bold text-white">
              +{points}
            </span>
          ) : null}
          {selected ? (
            <span className="ml-2 rounded-full bg-[var(--iberdrola-forest)] px-2 py-1 text-[10px] font-bold text-white">
              ✓
            </span>
          ) : null}
        </span>
      </div>
    </button>
  );
}

function KnockoutStageSection({
  title,
  matches,
  teams,
  picks,
  onPick,
  realTeamsByRound,
}: {
  title: string;
  matches: Array<{
    id: string;
    stage: string;
    homeTeamId: string | null;
    awayTeamId: string | null;
    homeLabel?: string;
    awayLabel?: string;
  }>;
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
}) {
  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 rounded-xl bg-[var(--iberdrola-sand)] px-3 py-2 text-sm font-extrabold text-[var(--iberdrola-forest)]">
        {title}
      </div>

      {matches.map((match) => {
        const homeTeam = teams.find((t) => t.id === match.homeTeamId) ?? null;
        const awayTeam = teams.find((t) => t.id === match.awayTeamId) ?? null;
        const selected = picks[match.id] ?? null;
        const officialNumber = getOfficialMatchNumber(match.id);
        const points = getStagePoints(match.stage);
        const roundKey = getRoundSetKey(match.stage) as
          | "round32"
          | "round16"
          | "quarterfinals"
          | "semifinals"
          | "finals";

        const homeHit =
          !!homeTeam && !!realTeamsByRound && realTeamsByRound[roundKey].has(homeTeam.id);
        const awayHit =
          !!awayTeam && !!realTeamsByRound && realTeamsByRound[roundKey].has(awayTeam.id);

        const disabled = !onPick;

        return (
          <div
            key={match.id}
            className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-3 shadow-sm"
          >
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--iberdrola-forest)]/65">
              {officialNumber ? `Partido ${officialNumber}` : match.id}
            </div>

            <div className="space-y-2">
              <KnockoutTeamButton
                team={homeTeam}
                fallbackLabel={match.homeLabel}
                selected={selected === homeTeam?.id}
                disabled={disabled}
                hit={homeHit}
                points={points}
                onClick={() => onPick?.(match.id, selected === homeTeam?.id ? null : homeTeam?.id ?? null)}
              />
              <KnockoutTeamButton
                team={awayTeam}
                fallbackLabel={match.awayLabel}
                selected={selected === awayTeam?.id}
                disabled={disabled}
                hit={awayHit}
                points={points}
                onClick={() => onPick?.(match.id, selected === awayTeam?.id ? null : awayTeam?.id ?? null)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChampionCompact({
  championId,
  teams,
  championPoints,
}: {
  championId: string | null;
  teams: Team[];
  championPoints: number;
}) {
  const champion = teams.find((t) => t.id === championId) ?? null;

  return (
    <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)] p-4 text-center shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--iberdrola-forest)]/70">
        Campeón
      </div>
      <div className="mt-2 text-lg font-extrabold text-[var(--iberdrola-forest)]">
        {champion ? `${champion.flag} ${champion.name}` : "Por definir"}
      </div>
      {champion ? (
        <div className="mt-2 inline-flex rounded-full bg-[var(--iberdrola-green)] px-3 py-1 text-xs font-bold text-white">
          +{championPoints}
        </div>
      ) : null}
    </div>
  );
}

export default function PredictionsPageClient({ entryId }: Props) {
  const supabase = createClient();

  const [predictions, setPredictions] = useState<PredictionMap>({});
  const [knockoutPredictions, setKnockoutPredictions] =
    useState<KnockoutPredictionMap>({});
  const [realKnockoutPredictions, setRealKnockoutPredictions] =
    useState(initialRealKnockoutPredictions);
  const [officialMatches, setOfficialMatches] = useState<Match[]>(initialMatches);
  const [locale, setLocale] = useState<Locale>("es");
  const [timeZone, setTimeZone] = useState<TimezoneValue>("local");
  const [authUserEmail, setAuthUserEmail] = useState("");
  const [authUserName, setAuthUserName] = useState("");
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [entryStatus, setEntryStatus] = useState<"draft" | "submitted">("draft");
  const [entryNumber, setEntryNumber] = useState<number | null>(null);
  const [poolName, setPoolName] = useState("");
  const [loadingEntry, setLoadingEntry] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_KEY) as Locale | null;
    if (savedLocale === "es" || savedLocale === "en" || savedLocale === "pt") {
      setLocale(savedLocale);
    }

    const savedTimeZone = localStorage.getItem(TIMEZONE_KEY) as TimezoneValue | null;
    if (savedTimeZone) {
      setTimeZone(savedTimeZone);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    localStorage.setItem(TIMEZONE_KEY, timeZone);
  }, [timeZone]);

  useEffect(() => {
    async function loadFromSupabase() {
      setLoadingEntry(true);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) console.error(authError);

        if (!user) {
          window.location.href = "/";
          return;
        }

        setAuthUserEmail(user.email ?? "");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) console.error(profileError);

        setAuthUserName(
          profile?.full_name ||
            user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            ""
        );

        const { data: rawEntry, error: entryError } = await supabase
          .from("entries")
          .select(
            `
            id,
            status,
            user_id,
            pool_id,
            entry_number,
            created_at,
            pools ( name, slug )
          `
          )
          .eq("id", entryId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (entryError) console.error(entryError);

        const entry = rawEntry;

        if (!entry) {
          setActiveEntryId(null);
          setEntryStatus("draft");
          setPredictions({});
          setKnockoutPredictions({});
          setSubmitMessage("No se ha encontrado la porra seleccionada.");
          setLoadingEntry(false);
          return;
        }

        const pool = Array.isArray(entry.pools) ? entry.pools[0] : entry.pools;

        setActiveEntryId(entry.id);
        setEntryStatus((entry.status ?? "draft") as "draft" | "submitted");
        setEntryNumber(entry.entry_number ?? null);
        setPoolName(pool?.name ?? "");

        const { data: groupRows, error: groupError } = await supabase
          .from("entry_group_predictions")
          .select("entry_id, match_id, home_goals, away_goals")
          .eq("entry_id", entry.id);

        if (groupError) console.error(groupError);

        const nextPredictions: PredictionMap = {};
        (groupRows ?? []).forEach((row) => {
          nextPredictions[row.match_id] = {
            homeGoals: row.home_goals,
            awayGoals: row.away_goals,
          };
        });
        setPredictions(nextPredictions);

        const { data: koRows, error: koError } = await supabase
          .from("entry_knockout_predictions")
          .select("entry_id, match_id, picked_team_id")
          .eq("entry_id", entry.id);

        if (koError) console.error(koError);

        const nextKo: KnockoutPredictionMap = {};
        (koRows ?? []).forEach((row) => {
          nextKo[row.match_id] = row.picked_team_id;
        });
        setKnockoutPredictions(nextKo);

        const { data: officialGroupRows, error: officialGroupError } = await supabase
          .from("official_group_results")
          .select("match_id, home_goals, away_goals");

        if (officialGroupError) console.error(officialGroupError);

        const mergedMatches = initialMatches.map((match) => {
          if (match.stage !== "group") return match;

          const officialRow = (officialGroupRows as OfficialGroupRow[] | null)?.find(
            (row) => row.match_id === match.id
          );

          return {
            ...match,
            homeGoals: officialRow?.home_goals ?? null,
            awayGoals: officialRow?.away_goals ?? null,
          };
        });

        setOfficialMatches(mergedMatches);

        const { data: officialKnockoutRows, error: officialKnockoutError } =
          await supabase
            .from("official_knockout_results")
            .select("match_id, picked_team_id");

        if (officialKnockoutError) console.error(officialKnockoutError);

        const nextRealKo: KnockoutPredictionMap = {
          ...initialRealKnockoutPredictions,
        };

        (officialKnockoutRows as OfficialKnockoutRow[] | null)?.forEach((row) => {
          if (row.picked_team_id) {
            nextRealKo[row.match_id] = row.picked_team_id;
          }
        });

        setRealKnockoutPredictions(nextRealKo);
      } catch (err) {
        console.error(err);
        setSubmitMessage("Error cargando la porra.");
      } finally {
        setLoadingEntry(false);
      }
    }

    loadFromSupabase();
  }, [entryId, supabase]);

  function updatePrediction(
    matchId: string,
    side: "homeGoals" | "awayGoals",
    value: number | null
  ) {
    if (entryStatus === "submitted") return;

    setPredictions((current) => ({
      ...current,
      [matchId]: {
        homeGoals: current[matchId]?.homeGoals ?? null,
        awayGoals: current[matchId]?.awayGoals ?? null,
        [side]: value,
      },
    }));
  }

  function updateKnockoutPrediction(matchId: string, teamId: string | null) {
    if (entryStatus === "submitted") return;

    setKnockoutPredictions((current) => ({
      ...current,
      [matchId]: teamId,
    }));
  }

  async function handleSaveEntry() {
    if (!activeEntryId) {
      setSubmitMessage("No hay entry activa.");
      return;
    }

    setSaveLoading(true);
    setSubmitMessage("");

    try {
      const { error: deleteGroupError } = await supabase
        .from("entry_group_predictions")
        .delete()
        .eq("entry_id", activeEntryId);

      if (deleteGroupError) throw deleteGroupError;

      const { error: deleteKoError } = await supabase
        .from("entry_knockout_predictions")
        .delete()
        .eq("entry_id", activeEntryId);

      if (deleteKoError) throw deleteKoError;

      const groupRows = Object.entries(predictions).map(([matchId, value]) => ({
        entry_id: activeEntryId,
        match_id: matchId,
        home_goals: value.homeGoals,
        away_goals: value.awayGoals,
      }));

      if (groupRows.length > 0) {
        const { error: insertGroupError } = await supabase
          .from("entry_group_predictions")
          .insert(groupRows);

        if (insertGroupError) throw insertGroupError;
      }

      const knockoutRows = Object.entries(knockoutPredictions)
        .filter(([, teamId]) => !!teamId)
        .map(([matchId, teamId]) => ({
          entry_id: activeEntryId,
          match_id: matchId,
          picked_team_id: teamId,
        }));

      if (knockoutRows.length > 0) {
        const { error: insertKoError } = await supabase
          .from("entry_knockout_predictions")
          .insert(knockoutRows);

        if (insertKoError) throw insertKoError;
      }

      setSubmitMessage("Porra guardada correctamente.");
    } catch (err) {
      console.error(err);
      setSubmitMessage("Error guardando la porra.");
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleSubmitEntry() {
    if (!activeEntryId) {
      setSubmitMessage("No se ha encontrado la entry activa.");
      return;
    }

    const confirmed = window.confirm(
      "¿Seguro que quieres enviar la porra? Después no podrás modificarla."
    );

    if (!confirmed) return;

    setSubmitLoading(true);
    setSubmitMessage("");

    try {
      await handleSaveEntry();

      const res = await fetch("/api/submit-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entryId: activeEntryId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitMessage(data.error || "No se pudo enviar la porra.");
        return;
      }

      setEntryStatus("submitted");
      setSubmitMessage("Porra enviada correctamente.");
    } catch (err) {
      console.error(err);
      setSubmitMessage("Error de conexión al enviar.");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const t = messages[locale];
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const groups = [...new Set(teams.map((team) => team.group).filter(Boolean))] as string[];

  const groupPointsTotal = officialMatches
    .filter((match) => match.stage === "group")
    .reduce((sum, match) => {
      const prediction = predictions[match.id] ?? {
        homeGoals: null,
        awayGoals: null,
      };

      const score = calculateMatchPredictionScore(
        match.homeGoals,
        match.awayGoals,
        prediction.homeGoals,
        prediction.awayGoals,
        scoreSettings
      );

      return sum + score.points;
    }, 0);

  const predictedGroupMatches = useMemo(
    () =>
      officialMatches.map((match) => {
        if (match.stage !== "group") return match;
        return {
          ...match,
          homeGoals: predictions[match.id]?.homeGoals ?? null,
          awayGoals: predictions[match.id]?.awayGoals ?? null,
        };
      }),
    [officialMatches, predictions]
  );

  const predictedThirdPlaced = useMemo(
    () => getBestThirdPlacedTeams(teams, predictedGroupMatches, groups, 8),
    [predictedGroupMatches, groups]
  );

  const userBracket = useMemo(
    () =>
      buildUserKnockoutBracket(
        teams,
        officialMatches,
        groups,
        predictions,
        knockoutPredictions
      ),
    [officialMatches, groups, predictions, knockoutPredictions]
  );

  const realBracket = useMemo(
    () => buildRealKnockoutBracket(teams, officialMatches, groups, realKnockoutPredictions),
    [officialMatches, groups, realKnockoutPredictions]
  );

  const knockoutScore = useMemo(
    () => calculateKnockoutScore(scoreSettings, userBracket, realBracket),
    [userBracket, realBracket]
  );

  const knockoutHitMap = useMemo(
    () => calculateKnockoutHitMap(scoreSettings, userBracket, realBracket),
    [userBracket, realBracket]
  );

  const realTeamsByRound = useMemo(
    () => ({
      round32: getTeamsInRound(realBracket.round32),
      round16: getTeamsInRound(realBracket.round16),
      quarterfinals: getTeamsInRound(realBracket.quarterfinals),
      semifinals: getTeamsInRound(realBracket.semifinals),
      finals: getTeamsInRound(realBracket.finals),
      champion: realBracket.championId,
    }),
    [realBracket]
  );

  const totalPoints = groupPointsTotal + knockoutScore.total;
  const greetingName = authUserName?.trim() || authUserEmail?.trim() || "Jugador";

  if (loadingEntry) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-6 text-center text-sm font-semibold text-[var(--iberdrola-forest)] shadow-sm">
          Cargando porra...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="space-y-4">
        <section className="overflow-hidden rounded-3xl border border-[var(--iberdrola-sky)] bg-gradient-to-r from-white to-[var(--iberdrola-sand)] shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-3">
                  <img
                    src="/ibeworldcup-logo.png"
                    alt="Ibe World Cup"
                    className="h-12 w-12 rounded-2xl object-contain shadow-sm sm:h-14 sm:w-14"
                  />
                  <div>
                    <h1 className="text-xl font-extrabold text-[var(--iberdrola-forest)] sm:text-2xl">
                      {t.appTitle}
                    </h1>
                    <p className="text-sm text-[var(--iberdrola-forest)]/75">
                      {poolName ? `${poolName} · ` : ""}
                      Porra {entryNumber ?? "-"} ·{" "}
                      {entryStatus === "submitted" ? "Enviada" : "Borrador"}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-sm text-[var(--iberdrola-forest)]/70">
                    Bienvenido
                  </p>
                  <p className="text-xl font-black tracking-tight text-[var(--iberdrola-green)] sm:text-2xl">
                    {greetingName}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <LanguageSwitcher
                  locale={locale}
                  onChange={setLocale}
                  label={t.language}
                />

                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value as TimezoneValue)}
                  className="rounded-full border border-[var(--iberdrola-green)] bg-white px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
                >
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatPill label={t.totalPoints} value={totalPoints} />
              <StatPill label="Grupos" value={groupPointsTotal} />
              <StatPill label="Knockouts" value={knockoutScore.total} />
              <StatPill
                label="Estado"
                value={entryStatus === "submitted" ? "Enviada" : "Borrador"}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={handleSaveEntry}
                disabled={saveLoading || entryStatus === "submitted"}
                className="rounded-2xl border border-[var(--iberdrola-forest)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:bg-[var(--iberdrola-sand)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveLoading ? "Guardando..." : "Guardar porra"}
              </button>

              <button
                type="button"
                onClick={handleSubmitEntry}
                disabled={submitLoading || entryStatus === "submitted"}
                className="rounded-2xl bg-[var(--iberdrola-green)] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {entryStatus === "submitted"
                  ? "Porra enviada"
                  : submitLoading
                  ? "Enviando..."
                  : "Enviar porra"}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50"
              >
                Cerrar sesión
              </button>
            </div>

            {submitMessage ? (
              <div className="mt-4 rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-3 text-sm font-semibold text-[var(--iberdrola-forest)]">
                {submitMessage}
              </div>
            ) : null}
          </div>
        </section>

        <SectionCard title={t.scoringRules}>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <CompactRule
              label={t.exactScoreRule}
              value={`${scoreSettings.exactScore} ${t.points}`}
            />
            <CompactRule
              label={t.outcomeRule}
              value={`${scoreSettings.outcome} ${t.points}`}
            />
            <CompactRule
              label={t.homeGoalsRule}
              value={`${scoreSettings.homeGoals} ${t.points}`}
            />
            <CompactRule
              label={t.awayGoalsRule}
              value={`${scoreSettings.awayGoals} ${t.points}`}
            />
            <CompactRule
              label={t.champion}
              value={`${scoreSettings.championPoints} ${t.points}`}
            />
          </div>

          <p className="mt-3 text-sm text-[var(--iberdrola-forest)]/75">
            {t.scoringNote}
          </p>
        </SectionCard>

        <div className="space-y-4">
          {groups.map((groupCode) => {
            const groupMatches = officialMatches.filter(
              (match) => match.stage === "group" && match.group === groupCode
            );

            const predictedStandings = calculatePredictedStandings(
              teams,
              officialMatches,
              predictions,
              groupCode
            );

            return (
              <SectionCard
                key={groupCode}
                title={`${t.group} ${groupCode}`}
                right={
                  <span className="rounded-full bg-[var(--iberdrola-green)] px-3 py-1 text-xs font-bold text-white">
                    {groupMatches.length} partidos
                  </span>
                }
              >
                <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
                  <div className="space-y-3">
                    {groupMatches.map((match) => {
                      const homeTeam = teamMap.get(match.homeTeamId ?? "");
                      const awayTeam = teamMap.get(match.awayTeamId ?? "");

                      if (!homeTeam || !awayTeam) return null;

                      const prediction = predictions[match.id] ?? {
                        homeGoals: null,
                        awayGoals: null,
                      };

                      const score = calculateMatchPredictionScore(
                        match.homeGoals,
                        match.awayGoals,
                        prediction.homeGoals,
                        prediction.awayGoals,
                        scoreSettings
                      );

                      return (
                        <MatchCard
                          key={match.id}
                          match={match}
                          homeTeam={homeTeam}
                          awayTeam={awayTeam}
                          timeZone={timeZone}
                          prediction={prediction}
                          officialHomeGoals={match.homeGoals}
                          officialAwayGoals={match.awayGoals}
                          points={score.points}
                          officialLabel={t.officialLabel}
                          officialPendingLabel={t.officialPending}
                          disabled={entryStatus === "submitted"}
                          onChangeHome={(value) =>
                            updatePrediction(match.id, "homeGoals", value)
                          }
                          onChangeAway={(value) =>
                            updatePrediction(match.id, "awayGoals", value)
                          }
                        />
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-3 shadow-sm">
                      <div className="mb-3 text-sm font-extrabold text-[var(--iberdrola-forest)]">
                        {t.predictedStandings}
                      </div>
                      <StandingsMiniTable
                        rows={predictedStandings.map((row) => ({
                          teamId: row.teamId,
                          teamName: row.teamName,
                          teamFlag: row.teamFlag,
                          played: row.played,
                          won: row.won,
                          drawn: row.drawn,
                          lost: row.lost,
                          goalsFor: row.goalsFor,
                          goalsAgainst: row.goalsAgainst,
                          goalDifference: row.goalDifference,
                          points: row.points,
                        }))}
                        labels={{
                          team: t.team,
                          played: t.played,
                          won: t.won,
                          drawn: t.drawn,
                          lost: t.lost,
                          goalsFor: t.goalsFor,
                          goalsAgainst: t.goalsAgainst,
                          goalDifference: t.goalDifference,
                          pointsShort: t.pointsShort,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>

        <ThirdPlaceCompact
          title={t.bestThirdPlaced}
          subtitle={t.bestThirdPlacedSubtitle}
          rows={predictedThirdPlaced.map((row) => ({
            teamId: row.teamId,
            teamName: row.teamName,
            teamFlag: row.teamFlag,
            group: row.group,
            points: row.points,
            goalDifference: row.goalDifference,
            goalsFor: row.goalsFor,
            qualifies: row.qualifies,
          }))}
          labels={{
            qualified: t.qualified,
            eliminated: t.eliminated,
          }}
        />

        <SectionCard title={t.knockoutBracket}>
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <KnockoutStageSection
                title={t.round32}
                matches={userBracket.round32}
                teams={teams}
                picks={knockoutPredictions}
                onPick={entryStatus === "submitted" ? undefined : updateKnockoutPrediction}
                realTeamsByRound={realTeamsByRound}
              />

              <KnockoutStageSection
                title={t.round16}
                matches={userBracket.round16}
                teams={teams}
                picks={knockoutPredictions}
                onPick={entryStatus === "submitted" ? undefined : updateKnockoutPrediction}
                realTeamsByRound={realTeamsByRound}
              />

              <KnockoutStageSection
                title={t.quarterfinals}
                matches={userBracket.quarterfinals}
                teams={teams}
                picks={knockoutPredictions}
                onPick={entryStatus === "submitted" ? undefined : updateKnockoutPrediction}
                realTeamsByRound={realTeamsByRound}
              />

              <KnockoutStageSection
                title={t.semifinals}
                matches={userBracket.semifinals}
                teams={teams}
                picks={knockoutPredictions}
                onPick={entryStatus === "submitted" ? undefined : updateKnockoutPrediction}
                realTeamsByRound={realTeamsByRound}
              />

              <div className="space-y-3">
                <KnockoutStageSection
                  title={t.finalLabel}
                  matches={userBracket.finals}
                  teams={teams}
                  picks={knockoutPredictions}
                  onPick={entryStatus === "submitted" ? undefined : updateKnockoutPrediction}
                  realTeamsByRound={realTeamsByRound}
                />
                <ChampionCompact
                  championId={userBracket.championId}
                  teams={teams}
                  championPoints={scoreSettings.championPoints}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)] px-4 py-3 text-sm text-[var(--iberdrola-forest)]/80">
              {t.realBracketPending}
            </div>
          </div>
        </SectionCard>
      </div>
    </main>
  );
}