"use client";

import { useEffect, useMemo, useState } from "react";
import GroupMatchRow from "@/components/GroupMatchRow";
import GroupStandingsTable from "@/components/GroupStandingsTable";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ScoringRulesCard from "@/components/ScoringRulesCard";
import TotalPointsCard from "@/components/TotalPointsCard";
import KnockoutBracket from "@/components/KnockoutBracket";
import ThirdPlaceTable from "@/components/ThirdPlaceTable";

import { matches as initialMatches } from "@/data/matches";
import { scoreSettings } from "@/data/settings";
import { teams } from "@/data/teams";
import { userPredictions } from "@/data/userPredictions";
import { userKnockoutPredictions } from "@/data/userKnockoutPredictions";
import { realKnockoutPredictions as initialRealKnockoutPredictions } from "@/data/realKnockoutPredictions";

import { calculateMatchPredictionScore } from "@/lib/scoring";
import { calculatePredictedStandings } from "@/lib/standings";
import { calculateDailyPoints } from "@/lib/dailyPoints";
import { buildUserKnockoutBracket } from "@/lib/knockoutBracket";
import { buildRealKnockoutBracket } from "@/lib/realKnockout";
import {
  calculateKnockoutHitMap,
  calculateKnockoutScore,
} from "@/lib/knockoutScoring";
import { getBestThirdPlacedTeams } from "@/lib/thirdPlace";
import { Locale, messages } from "@/lib/i18n";
import { KnockoutPredictionMap, Match } from "@/types";
import { TIMEZONE_OPTIONS, TimezoneValue } from "@/lib/timezone";

type PredictionMap = Record<
  string,
  { homeGoals: number | null; awayGoals: number | null }
>;

const STORAGE_KEY = "porra-mundial-local";
const LOCALE_KEY = "porra-mundial-locale";
const TIMEZONE_KEY = "porra-mundial-timezone";

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

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<PredictionMap>(userPredictions);
  const [knockoutPredictions, setKnockoutPredictions] =
    useState<KnockoutPredictionMap>(userKnockoutPredictions);
  const [realKnockoutPredictions, setRealKnockoutPredictions] =
    useState<KnockoutPredictionMap>(initialRealKnockoutPredictions);
  const [officialMatches, setOfficialMatches] = useState<Match[]>(initialMatches);
  const [locale, setLocale] = useState<Locale>("es");
  const [timeZone, setTimeZone] = useState<TimezoneValue>("local");

  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [participantCompany, setParticipantCompany] = useState("");
  const [participantCountry, setParticipantCountry] = useState("");

  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [activePoolSlug, setActivePoolSlug] = useState<string | null>(null);

  const [entryStatus, setEntryStatus] = useState("draft");
  const [saveLoading, setSaveLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const [authUserEmail, setAuthUserEmail] = useState("");

  function persistToStorage(next?: {
    predictions?: PredictionMap;
    knockoutPredictions?: KnockoutPredictionMap;
    realKnockoutPredictions?: KnockoutPredictionMap;
    officialMatches?: Match[];
    name?: string;
    email?: string;
    company?: string;
    country?: string;
  }) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        predictions: next?.predictions ?? predictions,
        knockoutPredictions: next?.knockoutPredictions ?? knockoutPredictions,
        realKnockoutPredictions:
          next?.realKnockoutPredictions ?? realKnockoutPredictions,
        officialMatches: next?.officialMatches ?? officialMatches,
        name: next?.name ?? participantName,
        email: next?.email ?? participantEmail,
        company: next?.company ?? participantCompany,
        country: next?.country ?? participantCountry,
      })
    );
  }

  function loadFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const parsed = JSON.parse(saved);

    setPredictions(parsed.predictions || userPredictions);
    setKnockoutPredictions(parsed.knockoutPredictions || userKnockoutPredictions);
    setRealKnockoutPredictions(
      parsed.realKnockoutPredictions || initialRealKnockoutPredictions
    );
    setOfficialMatches(parsed.officialMatches || initialMatches);
    setParticipantName(parsed.name || "");
    setParticipantEmail(parsed.email || "");
    setParticipantCompany(parsed.company || "");
    setParticipantCountry(parsed.country || "");
  }

  useEffect(() => {
    loadFromStorage();

    const savedLocale = localStorage.getItem(LOCALE_KEY) as Locale | null;
    if (savedLocale === "es" || savedLocale === "en" || savedLocale === "pt") {
      setLocale(savedLocale);
    }

    const savedTimeZone = localStorage.getItem(TIMEZONE_KEY) as TimezoneValue | null;
    if (savedTimeZone) {
      setTimeZone(savedTimeZone);
    }

    const savedEntryId = localStorage.getItem("active_entry_id");
    const savedPoolSlug = localStorage.getItem("active_pool_slug");

    setActiveEntryId(savedEntryId);
    setActivePoolSlug(savedPoolSlug);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) loadFromStorage();

      if (event.key === LOCALE_KEY) {
        const nextLocale = localStorage.getItem(LOCALE_KEY) as Locale | null;
        if (nextLocale === "es" || nextLocale === "en" || nextLocale === "pt") {
          setLocale(nextLocale);
        }
      }

      if (event.key === TIMEZONE_KEY) {
        const nextTimeZone = localStorage.getItem(TIMEZONE_KEY) as TimezoneValue | null;
        if (nextTimeZone) {
          setTimeZone(nextTimeZone);
        }
      }

      if (event.key === "active_entry_id") {
        setActiveEntryId(localStorage.getItem("active_entry_id"));
      }

      if (event.key === "active_pool_slug") {
        setActivePoolSlug(localStorage.getItem("active_pool_slug"));
      }
    };

    const handleFocus = () => loadFromStorage();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    async function loadEntryStatus() {
      const entryId = localStorage.getItem("active_entry_id");
      if (!entryId) return;

      try {
        const res = await fetch(`/api/entry-status?entryId=${entryId}`);
        const data = await res.json();

        if (res.ok && data.status) {
          setEntryStatus(data.status);
        }
      } catch {
        // silencio
      }
    }

    loadEntryStatus();
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    localStorage.setItem(TIMEZONE_KEY, timeZone);
  }, [timeZone]);

  useEffect(() => {
    persistToStorage();
  }, [
    predictions,
    knockoutPredictions,
    realKnockoutPredictions,
    officialMatches,
    participantName,
    participantEmail,
    participantCompany,
    participantCountry,
  ]);

  useEffect(() => {
  async function loadAuthUser() {
    try {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        setAuthUserEmail(user.email);
      }
    } catch {
      // silencio
    }
  }

  loadAuthUser();
}, []);

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

  async function handleSaveDraft() {
    if (entryStatus === "submitted") return;

    setSaveLoading(true);
    setSubmitMessage("");

    try {
      persistToStorage();
      setSubmitMessage("Porra guardada correctamente.");
    } catch {
      setSubmitMessage("Error al guardar la porra.");
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleLogout() {
  const { createClient } = await import("@/utils/supabase/client");
  const supabase = createClient();

  await supabase.auth.signOut();
  window.location.href = "/join";
}

  async function handleSubmitEntry() {
    const entryId = localStorage.getItem("active_entry_id");

    if (!entryId) {
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
      persistToStorage();

      const res = await fetch("/api/submit-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entryId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitMessage(data.error || "No se pudo enviar la porra.");
        setSubmitLoading(false);
        return;
      }

      setEntryStatus("submitted");
      setSubmitMessage("Porra enviada correctamente.");
    } catch {
      setSubmitMessage("Error de conexión al enviar.");
    } finally {
      setSubmitLoading(false);
    }
  }

  const t = messages[locale];
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const groups = [...new Set(teams.map((team) => team.group).filter(Boolean))] as string[];

  const dailyPointsRows = calculateDailyPoints(
    officialMatches,
    predictions,
    scoreSettings,
    timeZone
  );

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
    () =>
      buildRealKnockoutBracket(
        teams,
        officialMatches,
        groups,
        realKnockoutPredictions
      ),
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
  const greetingName = authUserEmail?.trim() || "Jugador";

  const rankingPosition = 0;
  const rankingTotalPlayers = 0;
  const rankingMovement = 0;

  return (
    <main className="min-h-screen bg-[var(--iberdrola-green-light)] p-3">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 rounded-3xl border border-[var(--iberdrola-green)] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Ibe World Cup"
                className="h-16 w-16 rounded-2xl shadow-md"
              />

              <div className="flex flex-col justify-center">
                <h1 className="m-0 text-2xl font-bold leading-tight text-[var(--iberdrola-forest)] md:text-3xl">
                  {t.appTitle}
                </h1>

                <p className="text-sm font-medium text-[var(--iberdrola-green)]">
                  Hola, {greetingName}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <LanguageSwitcher
                    locale={locale}
                    onChange={setLocale}
                    label={t.language}
                  />

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--iberdrola-forest)]">
                      Huso horario
                    </span>
                    <select
                      value={timeZone}
                      onChange={(e) => setTimeZone(e.target.value as TimezoneValue)}
                      className="rounded-full border border-[var(--iberdrola-green)] bg-white px-3 py-1 text-sm text-[var(--iberdrola-forest)]"
                    >
                      {TIMEZONE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:min-w-[430px]">
              <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)]/35 p-4 text-center">
                <div className="text-sm font-medium text-[var(--iberdrola-forest)]">
                  Puntos totales
                </div>
                <div className="mt-1 text-3xl font-bold text-[var(--iberdrola-green)]">
                  {totalPoints}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)]/35 p-4 text-center">
                <div className="text-sm font-medium text-[var(--iberdrola-forest)]">
                  Clasificación
                </div>
                <div className="mt-1 text-3xl font-bold text-[var(--iberdrola-green)]">
                  {rankingTotalPlayers > 0
                    ? `${rankingPosition}/${rankingTotalPlayers}`
                    : "-"}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {rankingMovement > 0
                    ? `▲ +${rankingMovement}`
                    : rankingMovement < 0
                    ? `▼ ${rankingMovement}`
                    : "="}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 xl:items-end">
              <div className="text-sm text-[var(--iberdrola-forest)]">
                <strong>Estado:</strong>{" "}
                {entryStatus === "submitted" ? "Enviada" : "Borrador"}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={entryStatus === "submitted" || saveLoading}
                  className="rounded-xl border border-[var(--iberdrola-green)] bg-white px-5 py-2 font-semibold text-[var(--iberdrola-forest)] disabled:opacity-50"
                >
                  {saveLoading ? "Guardando..." : "Guardar porra"}
                </button>

                <button
                  type="button"
                  onClick={handleSubmitEntry}
                  disabled={entryStatus === "submitted" || submitLoading}
                  className="rounded-xl bg-[var(--iberdrola-green)] px-5 py-2 font-semibold text-white disabled:opacity-50"
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
  className="text-sm text-gray-500 underline"
>
  Cerrar sesión
</button>
              </div>

              {submitMessage ? (
                <p className="text-sm text-[var(--iberdrola-forest)]">
                  {submitMessage}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <ScoringRulesCard
            settings={scoreSettings}
            title={t.scoringRules}
            exactScoreLabel={t.exactScoreRule}
            outcomeLabel={t.outcomeRule}
            homeGoalsLabel={t.homeGoalsRule}
            awayGoalsLabel={t.awayGoalsRule}
            round32Label={t.round32}
            round16Label={t.round16}
            quarterfinalLabel={t.quarterfinals}
            semifinalLabel={t.semifinals}
            finalLabel={t.finalLabel}
            championLabel={t.champion}
            noteLabel={t.scoringNote}
            pointsLabel={t.points}
          />

          <div className="flex flex-col gap-3">
            <TotalPointsCard title={t.totalPoints} points={totalPoints} />

            <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white p-4">
              <h3 className="mb-3 text-xl font-semibold text-[var(--iberdrola-forest)]">
                {t.dailyEvolution}
              </h3>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {dailyPointsRows.map((row) => (
                  <div
                    key={row.dateKey}
                    className="rounded-xl bg-[var(--iberdrola-green-light)]/45 px-3 py-2"
                  >
                    <div className="text-sm text-[var(--iberdrola-forest)]">
                      {row.label}
                    </div>
                    <div className="text-lg font-semibold text-[var(--iberdrola-green)]">
                      {row.points} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white p-4">
              <h3 className="mb-3 text-xl font-semibold text-[var(--iberdrola-forest)]">
                Eliminatorias
              </h3>

              <div className="grid gap-2 text-sm text-[var(--iberdrola-forest)] sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
                  <span>{t.round32}</span>
                  <strong>{knockoutScore.round32}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
                  <span>{t.round16}</span>
                  <strong>{knockoutScore.round16}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
                  <span>{t.quarterfinals}</span>
                  <strong>{knockoutScore.quarterfinals}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
                  <span>{t.semifinals}</span>
                  <strong>{knockoutScore.semifinals}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
                  <span>{t.finalLabel}</span>
                  <strong>{knockoutScore.final}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
                  <span>{t.champion}</span>
                  <strong>{knockoutScore.champion}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
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
              <section
                key={groupCode}
                className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-4 shadow-sm"
              >
                <h2 className="mb-4 text-2xl font-semibold text-[var(--iberdrola-forest)]">
                  {t.group} {groupCode}
                </h2>

                <div className="grid gap-4 xl:grid-cols-[3.2fr_1fr]">
                  <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 md:px-4">
                    <div className="grid grid-cols-[minmax(0,1fr)_74px_minmax(0,1fr)_24px] gap-2 border-b border-[var(--iberdrola-sky)] px-1 py-2 text-[11px] text-[var(--iberdrola-forest)] md:grid-cols-[minmax(0,1fr)_86px_minmax(0,1fr)_28px] md:gap-2">
                      <div>{t.home}</div>
                      <div className="text-center">{t.yourPrediction}</div>
                      <div className="text-right">{t.away}</div>
                      <div className="text-right">{t.pointsShort}</div>
                    </div>

                    <div className="divide-y divide-gray-100">
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
                          <GroupMatchRow
                            key={match.id}
                            matchNumber={match.matchNumber ?? null}
                            kickoff={match.kickoff ?? null}
                            timeZone={timeZone}
                            homeTeam={{ name: homeTeam.name, flag: homeTeam.flag }}
                            awayTeam={{ name: awayTeam.name, flag: awayTeam.flag }}
                            homePrediction={prediction.homeGoals}
                            awayPrediction={prediction.awayGoals}
                            officialHomeGoals={match.homeGoals}
                            officialAwayGoals={match.awayGoals}
                            points={score.points}
                            pointsShortLabel={t.pointsShort}
                            officialLabel={t.officialLabel}
                            officialPendingLabel={t.officialPending}
                            onChangeHome={
                              entryStatus === "submitted"
                                ? () => {}
                                : (value) =>
                                    updatePrediction(match.id, "homeGoals", value)
                            }
                            onChangeAway={
                              entryStatus === "submitted"
                                ? () => {}
                                : (value) =>
                                    updatePrediction(match.id, "awayGoals", value)
                            }
                          />
                        );
                      })}
                    </div>
                  </div>

                  <GroupStandingsTable
                    title={t.predictedStandings}
                    rows={predictedStandings}
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
              </section>
            );
          })}

          <ThirdPlaceTable
            title={t.bestThirdPlaced}
            subtitle="Tus mejores terceros según tus pronósticos."
            rows={predictedThirdPlaced}
            labels={{
              position: t.position,
              group: t.group,
              team: t.team,
              played: t.played,
              won: t.won,
              drawn: t.drawn,
              lost: t.lost,
              goalsFor: t.goalsFor,
              goalsAgainst: t.goalsAgainst,
              goalDifference: t.goalDifference,
              pointsShort: t.pointsShort,
              status: t.status,
              qualified: t.qualified,
              eliminated: t.eliminated,
            }}
          />

          <KnockoutBracket
            title={t.yourKnockoutBracket}
            subtitle="Selecciona quién pasa en cada cruce. El equipo elegido queda resaltado y, si aciertas, se muestran los puntos."
            round32={userBracket.round32}
            round16={userBracket.round16}
            quarterfinals={userBracket.quarterfinals}
            semifinals={userBracket.semifinals}
            finals={userBracket.finals}
            championId={userBracket.championId}
            teams={teams}
            picks={knockoutPredictions}
            onPick={entryStatus === "submitted" ? undefined : updateKnockoutPrediction}
            hitMap={knockoutHitMap}
            realTeamsByRound={realTeamsByRound}
          />
        </div>
      </div>
    </main>
  );
}