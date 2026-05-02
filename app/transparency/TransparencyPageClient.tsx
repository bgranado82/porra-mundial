"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Locale, Messages, messages } from "@/lib/i18n";
import { teams } from "@/data/teams";
import { matches as initialMatches } from "@/data/matches";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";
import { calculatePredictedStandings } from "@/lib/standings";
import { buildUserKnockoutBracket } from "@/lib/knockoutBracket";
import { buildRealKnockoutBracket } from "@/lib/realKnockout";
import GroupMatchCompactRow from "@/components/GroupMatchCompactRow";
import GroupMatchRow from "@/components/GroupMatchRow";
import GroupStandingsTable from "@/components/GroupStandingsTable";
import KnockoutBracket from "@/components/KnockoutBracket";
import { Match, KnockoutPredictionMap } from "@/types";
import { scoreSettings } from "@/data/settings";
import { calculateMatchPredictionScore } from "@/lib/scoring";

type TransparencyEntryListItem = {
  id: string;
  name: string | null;
  company: string | null;
  country: string | null;
};

type TransparencyEntryResponse = {
  entry: {
    id: string;
    name: string | null;
    company: string | null;
    country: string | null;
    status: string | null;
  };
  groupPredictions: Array<{
    match_id: string;
    home_goals: number | null;
    away_goals: number | null;
  }>;
  knockoutPredictions: Array<{
    match_id: string;
    picked_team_id: string | null;
  }>;
  extraPredictions: Array<{
    question_key: string;
    predicted_value: string | null;
  }>;
  officialGroup: Array<{
    match_id: string;
    home_goals: number | null;
    away_goals: number | null;
  }>;
  officialKO: Array<{
    match_id: string;
    picked_team_id: string | null;
  }>;
  officialExtraResults: Array<{
  question_key: string;
  official_value: string | null;
}>;
  adminTiebreaks: Array<{
    scope: string;
    scope_value: string;
    team_id: string;
    priority: number;
  }>;
  entryTiebreaks: Array<{
    scope: string;
    scope_value: string;
    team_id: string;
    priority: number;
  }>;
};

type PredictionMap = Record<
  string,
  { homeGoals: number | null; awayGoals: number | null }
>;

function getExtraLabels(t: Messages): Record<string, string> {
  return {
    first_goal_scorer_world: `🥇 ${t.extras.first_goal_scorer_world}`,
    first_goal_scorer_spain: `🇪🇸 ${t.extras.first_goal_scorer_spain}`,
    golden_boot: `👟 ${t.extras.golden_boot}`,
    golden_ball: `🏆 ${t.extras.golden_ball}`,
    best_young_player: `🌟 ${t.extras.best_young_player}`,
    golden_glove: `🧤 ${t.extras.golden_glove}`,
    top_spanish_scorer: `⚽ ${t.extras.top_spanish_scorer}`,
  };
}

const LOCALE_KEY = "porra-mundial-locale";

function getTeamsInRound(
  matches: Array<{ homeTeamId: string | null; awayTeamId: string | null }>
) {
  const set = new Set<string>();
  matches.forEach((match) => {
    if (match.homeTeamId) set.add(match.homeTeamId);
    if (match.awayTeamId) set.add(match.awayTeamId);
  });
  return set;
}
function normalizeExtraValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}


export default function TransparencyPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const poolId = searchParams.get("poolId") ?? "";
  const poolSlug = searchParams.get("poolSlug") ?? "";
  const entryId = searchParams.get("entryId") ?? "";
  const selectedEntryIdParam =
    searchParams.get("selectedEntryId") ?? entryId;

  const [participants, setParticipants] = useState<TransparencyEntryListItem[]>(
    []
  );
  const [selectedEntryId, setSelectedEntryId] =
    useState(selectedEntryIdParam);
  const [data, setData] = useState<TransparencyEntryResponse | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingEntry, setLoadingEntry] = useState(true);
  const [error, setError] = useState("");
  const [locale, setLocale] = useState<Locale>("es");

  const teamMap = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    []
  );

  const groups = useMemo(
    () => [...new Set(teams.map((t) => t.group).filter(Boolean))] as string[],
    []
  );

  useEffect(() => {
    setSelectedEntryId(selectedEntryIdParam);
  }, [selectedEntryIdParam]);

  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_KEY) as Locale | null;
    if (saved && ["es", "en", "pt"].includes(saved)) setLocale(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    async function loadParticipants() {
      if (!poolId) {
        setError("Falta el poolId.");
        setLoadingList(false);
        return;
      }

      try {
        setLoadingList(true);
        setError("");

        const res = await fetch(`/api/transparency-entries?poolId=${poolId}`, {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Error cargando participantes");
        }

        const items = (json.items ?? []) as TransparencyEntryListItem[];
        setParticipants(items);

        if (!selectedEntryIdParam && items.length > 0) {
          const firstId = items[0].id;
          setSelectedEntryId(firstId);

          const params = new URLSearchParams(searchParams.toString());
          params.set("selectedEntryId", firstId);
          router.replace(`/transparency?${params.toString()}`);
        }
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la lista de participantes.");
      } finally {
        setLoadingList(false);
      }
    }

    loadParticipants();
  }, [poolId, selectedEntryIdParam, router, searchParams]);

  useEffect(() => {
    async function loadEntry() {
      if (!poolId || !selectedEntryId) {
        setLoadingEntry(false);
        return;
      }

      try {
        setLoadingEntry(true);
        setError("");

        const res = await fetch(
          `/api/transparency-entry?poolId=${poolId}&entryId=${selectedEntryId}`,
          { cache: "no-store" }
        );

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Error cargando transparencia");
        }

        setData(json as TransparencyEntryResponse);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la predicción seleccionada.");
      } finally {
        setLoadingEntry(false);
      }
    }

    loadEntry();
  }, [poolId, selectedEntryId]);

  const predictions = useMemo<PredictionMap>(() => {
    const map: PredictionMap = {};
    (data?.groupPredictions ?? []).forEach((row) => {
      map[row.match_id] = {
        homeGoals: row.home_goals,
        awayGoals: row.away_goals,
      };
    });
    return map;
  }, [data]);

  const knockoutPredictions = useMemo<KnockoutPredictionMap>(() => {
    const map: KnockoutPredictionMap = {};
    (data?.knockoutPredictions ?? []).forEach((row) => {
      map[row.match_id] = row.picked_team_id;
    });
    return map;
  }, [data]);

  const groupUserTiebreaks = useMemo<Record<string, Record<string, number>>>(() => {
    const result: Record<string, Record<string, number>> = {};
    (data?.entryTiebreaks ?? []).forEach((row) => {
      if (row.scope === "group") {
        if (!result[row.scope_value]) result[row.scope_value] = {};
        result[row.scope_value][row.team_id] = row.priority;
      }
    });
    return result;
  }, [data]);

  const groupAdminTiebreaks = useMemo<Record<string, Record<string, number>>>(() => {
    const result: Record<string, Record<string, number>> = {};
    (data?.adminTiebreaks ?? []).forEach((row) => {
      if (row.scope === "group") {
        if (!result[row.scope_value]) result[row.scope_value] = {};
        result[row.scope_value][row.team_id] = row.priority;
      }
    });
    return result;
  }, [data]);

  const thirdPlaceAdminTiebreaks = useMemo<Record<string, number>>(() => {
    const result: Record<string, number> = {};
    (data?.adminTiebreaks ?? []).forEach((row) => {
      if (row.scope === "third_place") {
        result[row.team_id] = row.priority;
      }
    });
    return result;
  }, [data]);

  const realKnockoutPredictions = useMemo<KnockoutPredictionMap>(() => {
    const map: KnockoutPredictionMap = {};
    (data?.officialKO ?? []).forEach((row) => {
      map[row.match_id] = row.picked_team_id;
    });
    return map;
  }, [data]);

  const officialExtraMap = useMemo(() => {
  const map: Record<string, string> = {};

  (data?.officialExtraResults ?? []).forEach((row) => {
    map[row.question_key] = row.official_value ?? "";
  });

  return map;
}, [data]);

  const officialMatches = useMemo<Match[]>(() => {
    return initialMatches.map((match) => {
      if (match.stage !== "group") return match;

      const official = (data?.officialGroup ?? []).find(
        (row) => row.match_id === match.id
      );

      return {
        ...match,
        homeGoals: official?.home_goals ?? null,
        awayGoals: official?.away_goals ?? null,
      };
    });
  }, [data]);

  const orderedGroupMatches = useMemo(
    () =>
      officialMatches
        .filter((match) => match.stage === "group")
        .sort((a, b) => {
          if ((a.order ?? 0) !== (b.order ?? 0)) {
            return (a.order ?? 0) - (b.order ?? 0);
          }
          return (a.matchNumber ?? 0) - (b.matchNumber ?? 0);
        }),
    [officialMatches]
  );

  const standingsByGroup = useMemo(
    () =>
      groups.map((groupCode) => ({
        groupCode,
        rows: calculatePredictedStandings(
          teams,
          officialMatches,
          predictions,
          groupCode,
          undefined,
          groupUserTiebreaks[groupCode]
        ),
      })),
    [groups, officialMatches, predictions, groupUserTiebreaks]
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
    [groups, knockoutPredictions, officialMatches, predictions]
  );

  const realBracket = useMemo(
    () =>
      buildRealKnockoutBracket(
        teams,
        officialMatches,
        groups,
        realKnockoutPredictions,
        { groupAdminTiebreaks, thirdPlaceAdminTiebreaks }
      ),
    [groups, officialMatches, realKnockoutPredictions, groupAdminTiebreaks, thirdPlaceAdminTiebreaks]
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

  const backToStatsHref =
    poolId && poolSlug && entryId
      ? `/stats?poolId=${poolId}&poolSlug=${poolSlug}&entryId=${entryId}`
      : `/stats?poolId=${poolId}`;

  const backToPredictionHref =
    poolSlug && entryId
      ? `/pool/${poolSlug}/entry/${entryId}`
      : "/dashboard";

  const selectedParticipant = participants.find((p) => p.id === selectedEntryId);

  const t = messages[locale];
  const extraLabels = getExtraLabels(t);

  if (loadingList || loadingEntry) {
    return (
      <main className="page-bg">
      <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-6">
        <div className="skeleton h-28 rounded-3xl" />
        <div className="skeleton h-16 rounded-3xl" />
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
          </div>
          <div className="skeleton h-96 rounded-3xl" />
        </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="page-bg">
      <div className="mx-auto max-w-[1600px] px-4 py-6 fade-in">
        <section className="rounded-3xl border border-[var(--iberdrola-green-mid)] card-glass p-6 shadow-sm">
          <div className="text-sm font-semibold text-[var(--iberdrola-forest)]">
            {error || t.transparencyNoData}
          </div>
        </section>
      </div>
      </main>
    );
  }

  return (
    <main className="page-bg">
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 fade-in">
      <section className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3">
              <img
                src="/icon-512.png"
                alt="Porra Mundial 2026"
                className="h-12 w-12 rounded-xl object-contain sm:h-14 sm:w-14"
              />
            </div>

            <div>
              <div className="text-sm font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                {t.transparencyEyebrow}
              </div>
              <h1 className="text-2xl font-black text-[var(--iberdrola-forest)]">
                {t.transparencyTitle}
              </h1>
              <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
                {t.transparencySubtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2">
            <LanguageSwitcher
              locale={locale}
              onChange={setLocale}
              label={t.language}
            />
            <div className="flex flex-wrap gap-2">
              <Link
                href={backToStatsHref}
                className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white/80 px-3 py-2 text-xs font-bold text-[var(--iberdrola-forest)] transition hover:border-[var(--iberdrola-green)] hover:bg-white"
              >
                {t.banquillo.backToStats}
              </Link>

              <Link
                href={backToPredictionHref}
                className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white/80 px-3 py-2 text-xs font-bold text-[var(--iberdrola-forest)] transition hover:border-[var(--iberdrola-green)] hover:bg-white"
              >
                {t.banquillo.backToPrediction}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
        <div className="grid gap-4 p-5 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
              {t.transparencyParticipantLabel}
            </label>
            <select
              value={selectedEntryId}
              onChange={(e) => {
                const nextId = e.target.value;
                setSelectedEntryId(nextId);

                const params = new URLSearchParams(searchParams.toString());
                params.set("selectedEntryId", nextId);

                if (entryId) {
                  params.set("entryId", entryId);
                }

                router.replace(`/transparency?${params.toString()}`);
              }}
              className="w-full rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
            >
              {participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name || t.banquillo.participantFallback}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                {t.name}
              </div>
              <div className="mt-1 text-sm font-bold text-[var(--iberdrola-forest)]">
                {selectedParticipant?.name || data.entry.name || "-"}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                {t.company}
              </div>
              <div className="mt-1 text-sm font-bold text-[var(--iberdrola-forest)]">
                {data.entry.company || "-"}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                {t.country}
              </div>
              <div className="mt-1 text-sm font-bold text-[var(--iberdrola-forest)]">
                {data.entry.country || "-"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.65fr_0.95fr]">
        <section className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <span className="text-xl">🌍</span>
            <div>
              <h2 className="text-base font-black text-[var(--iberdrola-forest)]">{t.groupStageSection}</h2>
              <p className="text-xs text-[var(--iberdrola-forest)]/55">{t.transparencyGroupStageSubtitle}</p>
            </div>
          </div>

          <div className="p-4">
            <div className="hidden xl:block overflow-hidden rounded-2xl border border-[var(--iberdrola-sky)] bg-white">
              <div className="grid grid-cols-[132px_minmax(0,1fr)_82px] gap-2 bg-[var(--iberdrola-sand)]/35 px-3 py-3 text-[11px] font-black uppercase tracking-wide text-[var(--iberdrola-forest)]/75">
                <div>{t.transparencyMatchDateHeader}</div>
                <div className="text-center">{t.predictionHeader}</div>
                <div className="text-right">Info</div>
              </div>

              {orderedGroupMatches.map((match) => {
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
                  <GroupMatchCompactRow
    key={match.id}
    day={match.day}
    group={match.group ?? null}
    kickoff={match.kickoff ?? null}
    homeTeam={homeTeam}
    awayTeam={awayTeam}
    homePrediction={prediction.homeGoals}
    awayPrediction={prediction.awayGoals}
    officialHomeGoals={match.homeGoals}
    officialAwayGoals={match.awayGoals}
    points={score.points}
    onChangeHome={() => {}}
    onChangeAway={() => {}}
    officialLabel={t.transparencyOfficialLabel}
    pointsShortLabel={t.pointsShort}
  />
                );
              })}
            </div>

            <div className="space-y-2 xl:hidden">
              {orderedGroupMatches.map((match) => {
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
                  <GroupMatchRow
    key={match.id}
    day={match.day}
    group={match.group ?? null}
    matchNumber={match.matchNumber ?? 0}
    kickoff={match.kickoff ?? null}
    homeTeam={homeTeam}
    awayTeam={awayTeam}
    homePrediction={prediction.homeGoals}
    awayPrediction={prediction.awayGoals}
    officialHomeGoals={match.homeGoals}
    officialAwayGoals={match.awayGoals}
    points={score.points}
    pointsShortLabel="pts"
    officialLabel={t.transparencyOfficialLabel}
    officialPendingLabel={t.officialPending}
    matchLabel={t.matchLabel}
    onChangeHome={() => {}}
    onChangeAway={() => {}}
  />
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm xl:sticky xl:top-4 self-start">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <span className="text-xl">📊</span>
            <div>
              <h2 className="text-base font-black text-[var(--iberdrola-forest)]">{t.groupStandingsSection}</h2>
              <p className="text-xs text-[var(--iberdrola-forest)]/55">{t.transparencyStandingsSubtitle}</p>
            </div>
          </div>

          <div className="space-y-3 p-4">
            {standingsByGroup.map(({ groupCode, rows }) => (
              <div
                key={groupCode}
                className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-3"
              >
                <GroupStandingsTable
  title={`${t.group} ${groupCode}`}
  groupCode={groupCode}
  rows={rows}
  tiebreaks={{}} // aquí vacío porque es solo visualización
  showTiebreak={false} // importante: aquí no quieres editar
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
    tiebreak: "TB",
  }}
/>
              </div>
            ))}
          </div>
        </section>
      </div>

      <KnockoutBracket
  title={t.knockoutBracket}
  subtitle={t.transparencyKnockoutSubtitle}
  round32={userBracket.round32}
  round16={userBracket.round16}
  quarterfinals={userBracket.quarterfinals}
  semifinals={userBracket.semifinals}
  finals={userBracket.finals}
  championId={userBracket.championId}
  teams={teams}
  picks={knockoutPredictions}
  realTeamsByRound={realTeamsByRound}
  labels={{
    matchLabel: t.matchLabel,
    championLabel: t.champion,
    undefinedLabel: t.undefinedLabel,
    invalidLabel: t.invalidLabel,
    leftSideLabel: t.leftSideLabel,
    rightSideLabel: t.rightSideLabel,
    round32Label: t.round32,
    round16Label: t.round16,
    quarterfinalsLabel: t.quarterfinals,
    semifinalsLabel: t.semifinals,
    finalLabel: t.finalLabel,
  }}
/>

      <section className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
          <span className="text-xl">✨</span>
          <div>
            <h2 className="text-base font-black text-[var(--iberdrola-forest)]">{t.extraQuestionsRulesTitle}</h2>
            <p className="text-xs text-[var(--iberdrola-forest)]/55">{t.transparencyExtraSubtitle}</p>
          </div>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
          {EXTRA_QUESTIONS.map((question: any) => {
  const answer =
    data.extraPredictions.find(
      (row: any) => row.question_key === question.key
    )?.predicted_value ?? "-";

  const officialValue = officialExtraMap[question.key] ?? "";

  const isCorrect =
    !!officialValue &&
    answer !== "-" &&
    normalizeExtraValue(answer) === normalizeExtraValue(officialValue);

  const points =
    isCorrect
      ? ((scoreSettings[
          question.pointsKey as keyof typeof scoreSettings
        ] as number) ?? 0)
      : 0;

  return (
    <div
      key={question.key}
      className={`rounded-2xl border p-4 ${
        isCorrect
          ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)]/60"
          : "border-[var(--iberdrola-green-mid)] bg-white"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg leading-none">{question.icon}</span>
        {question.flagUrl ? <img src={question.flagUrl} alt="" className="h-5 w-7 rounded-[3px] border border-gray-100 object-cover shadow-sm" /> : null}
        <span className="text-sm font-bold text-[var(--iberdrola-forest)]">
          {t.extras[question.key as keyof typeof t.extras] || question.key}
        </span>
      </div>

      <div className="rounded-xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)]/30 px-3 py-3 text-sm font-semibold text-[var(--iberdrola-forest)]">
        {answer}
      </div>

      {officialValue ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="text-xs text-[var(--iberdrola-forest)]/65">
            {t.transparencyOfficialLabel}: {officialValue}
          </div>

          <span
            className={`rounded-full px-2 py-1 text-xs font-black ${
              points > 0
                ? "bg-[var(--iberdrola-green)] text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {points > 0 ? `+${points}` : "0"}
          </span>
        </div>
      ) : null}
    </div>
  );
})}
        </div>
      </section>
      </div>
    </main>
  );
}