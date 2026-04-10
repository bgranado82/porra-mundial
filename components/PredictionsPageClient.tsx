"use client";

import { useEffect, useMemo, useState } from "react";
import GroupMatchRow from "@/components/GroupMatchRow";
import GroupStandingsTable from "@/components/GroupStandingsTable";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import KnockoutBracket from "@/components/KnockoutBracket";
import ThirdPlaceTable from "@/components/ThirdPlaceTable";

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
import { KnockoutPredictionMap, Match } from "@/types";
import { TIMEZONE_OPTIONS, TimezoneValue } from "@/lib/timezone";
import { createClient } from "@/utils/supabase/client";

type PredictionMap = Record<
  string,
  { homeGoals: number | null; awayGoals: number | null }
>;

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

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-base font-bold text-[var(--iberdrola-forest)]">
        {value}
      </div>
    </div>
  );
}

type Props = {
  entryId: string;
};

export default function PredictionsPageClient({ entryId }: Props) {
  const supabase = createClient();

  const [predictions, setPredictions] = useState<PredictionMap>({});
  const [knockoutPredictions, setKnockoutPredictions] =
    useState<KnockoutPredictionMap>({});
  const [realKnockoutPredictions] = useState<KnockoutPredictionMap>(
    initialRealKnockoutPredictions
  );
  const [officialMatches] = useState<Match[]>(initialMatches);

  const [locale, setLocale] = useState<Locale>("es");
  const [timeZone, setTimeZone] = useState<TimezoneValue>("local");

  const [authUserEmail, setAuthUserEmail] = useState("");
  const [authUserName, setAuthUserName] = useState("");

  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [entryStatus, setEntryStatus] = useState("draft");
  const [entryNumber, setEntryNumber] = useState<number | null>(null);
  const [poolName, setPoolName] = useState("");
  const [poolSlug, setPoolSlug] = useState("");
  const [canCreateSecondEntry, setCanCreateSecondEntry] = useState(false);

  const [loadingEntry, setLoadingEntry] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [createSecondLoading, setCreateSecondLoading] = useState(false);
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

        if (authError) {
          console.error(authError);
        }

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

        if (profileError) {
          console.error(profileError);
        }

        setAuthUserName(
          profile?.full_name ||
            user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            ""
        );

        const { data: rawEntry, error: entryError } = await supabase
          .from("entries")
          .select(`
            id,
            status,
            user_id,
            pool_id,
            entry_number,
            created_at,
            pools (
              name,
              slug
            )
          `)
          .eq("id", entryId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (entryError) {
          console.error(entryError);
        }

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
        setEntryStatus(entry.status ?? "draft");
        setEntryNumber(entry.entry_number ?? null);
        setPoolName(pool?.name ?? "");
        setPoolSlug(pool?.slug ?? "");

        const { count, error: countError } = await supabase
          .from("entries")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("pool_id", entry.pool_id);

        if (countError) {
          console.error(countError);
        }

        setCanCreateSecondEntry((count ?? 0) < 2);

        const { data: groupRows, error: groupError } = await supabase
          .from("entry_group_predictions")
          .select("entry_id, match_id, home_goals, away_goals")
          .eq("entry_id", entry.id);

        if (groupError) {
          console.error(groupError);
        }

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

        if (koError) {
          console.error(koError);
        }

        const nextKo: KnockoutPredictionMap = {};
        (koRows ?? []).forEach((row) => {
          nextKo[row.match_id] = row.picked_team_id;
        });
        setKnockoutPredictions(nextKo);
      } catch (err) {
        console.error(err);
        setSubmitMessage("Error cargando la porra.");
      } finally {
        setLoadingEntry(false);
      }
    }

    loadFromSupabase();
  }, [entryId]);

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

  async function handleCreateSecondEntry() {
    if (!activeEntryId) {
      setSubmitMessage("No se ha encontrado la porra activa.");
      return;
    }

    setCreateSecondLoading(true);
    setSubmitMessage("");

    try {
      console.log("activeEntryId", activeEntryId);
      console.log("poolSlug", poolSlug);
      console.log("entryNumber", entryNumber);
      
      const res = await fetch("/api/create-second-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entryId: activeEntryId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitMessage(data.error || "No se pudo crear la Porra 2.");
        return;
      }

      if (!poolSlug || !data.entryId) {
        setSubmitMessage("Se creó la Porra 2, pero no se pudo abrir automáticamente.");
        return;
      }

      window.location.href = `/pool/${poolSlug}/entry/${data.entryId}`;
    } catch (err) {
      console.error(err);
      setSubmitMessage("Error creando la Porra 2.");
    } finally {
      setCreateSecondLoading(false);
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

  const greetingName =
    authUserName?.trim() ||
    authUserEmail?.trim() ||
    "Jugador";

  if (loadingEntry) {
    return (
      <main className="min-h-screen bg-[var(--iberdrola-green-light)] p-6">
        <div className="mx-auto max-w-7xl rounded-3xl border border-[var(--iberdrola-green)] bg-white p-6">
          Cargando porra...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--iberdrola-green-light)] p-3 md:p-4">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-4 shadow-sm md:p-5">
          <div className="grid gap-4 xl:grid-cols-[1.25fr_220px_220px_auto] xl:items-stretch">
            <div className="flex items-start gap-4">
              <img
                src="/logo.png"
                alt="Ibe World Cup"
                className="h-16 w-16 rounded-2xl shadow-md"
              />

              <div className="min-w-0">
                <h1 className="text-2xl font-bold leading-tight text-[var(--iberdrola-forest)] md:text-3xl">
                  {t.appTitle}
                </h1>

                <p className="mt-1 text-sm font-medium text-[var(--iberdrola-green)] md:text-base">
                  Bienvenido “{greetingName}”
                </p>

                <div className="mt-2 flex flex-wrap gap-2 text-xs md:text-sm">
                  {poolName ? (
                    <span className="rounded-full border border-[var(--iberdrola-green)] px-3 py-1 font-medium text-[var(--iberdrola-forest)]">
                      {poolName}
                    </span>
                  ) : null}

                  <span className="rounded-full border border-[var(--iberdrola-green)] px-3 py-1 font-medium text-[var(--iberdrola-forest)]">
                    Porra {entryNumber ?? "-"}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
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

            <div className="flex min-h-[132px] flex-col items-center justify-center rounded-2xl border border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)]/35 px-4 py-4 text-center">
              <div className="text-sm font-medium text-[var(--iberdrola-forest)] md:text-base">
                Puntos totales
              </div>
              <div className="mt-2 text-5xl font-bold leading-none text-[var(--iberdrola-green)] md:text-6xl">
                {totalPoints}
              </div>
            </div>

            <div className="flex min-h-[132px] flex-col items-center justify-center rounded-2xl border border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)]/35 px-4 py-4 text-center">
              <div className="text-sm font-medium text-[var(--iberdrola-forest)] md:text-base">
                Clasificación
              </div>
              <div className="mt-2 text-5xl font-bold leading-none text-[var(--iberdrola-green)] md:text-6xl">
                -
              </div>
              <div className="mt-2 text-xs text-gray-500">=</div>
            </div>

            <div className="flex flex-col items-start gap-3 xl:items-end xl:justify-between">
              <div className="text-sm text-[var(--iberdrola-forest)]">
                <strong>Estado:</strong>{" "}
                {entryStatus === "submitted" ? "Enviada" : "Borrador"}
              </div>

              <div className="flex flex-wrap gap-2 xl:justify-end">
                {entryNumber === 1 && canCreateSecondEntry ? (
                  <button
                    type="button"
                    onClick={handleCreateSecondEntry}
                    disabled={createSecondLoading}
                    className="rounded-xl border border-[var(--iberdrola-green)] bg-white px-5 py-2 font-semibold text-[var(--iberdrola-forest)] disabled:opacity-50"
                  >
                    {createSecondLoading ? "Creando..." : "Crear Porra 2"}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleSaveEntry}
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
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-gray-500 underline"
              >
                Cerrar sesión
              </button>
            </div>
          </div>

          {submitMessage ? (
            <p className="mt-3 text-sm text-[var(--iberdrola-forest)]">
              {submitMessage}
            </p>
          ) : null}
        </section>

        <section className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-4 shadow-sm md:p-5">
          <h2 className="text-xl font-semibold text-[var(--iberdrola-forest)]">
            Sistema de puntuación
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Chip label="Resultado exacto" value={`${scoreSettings.exactScore} pts`} />
            <Chip label="Ganador / empate" value={`${scoreSettings.outcome} pts`} />
            <Chip label="Goles local" value={`${scoreSettings.homeGoals} pt`} />
            <Chip label="Goles visitante" value={`${scoreSettings.awayGoals} pt`} />

            <Chip label="Round of 32" value={`${scoreSettings.round32QualifiedPoints} pts`} />
            <Chip label="Octavos" value={`${scoreSettings.round16QualifiedPoints} pts`} />
            <Chip label="Cuartos" value={`${scoreSettings.quarterfinalQualifiedPoints} pts`} />
            <Chip label="Semis" value={`${scoreSettings.semifinalQualifiedPoints} pts`} />

            <Chip label="Final" value={`${scoreSettings.finalQualifiedPoints} pts`} />
            <Chip label="Campeón" value={`${scoreSettings.championPoints} pts`} />
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Los puntos de grupos se suman por partido. En eliminatorias se puntúa por acertar qué equipo avanza.
          </p>
        </section>

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
                className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-4 shadow-sm md:p-5"
              >
                <h2 className="mb-4 text-2xl font-semibold text-[var(--iberdrola-forest)]">
                  {t.group} {groupCode}
                </h2>

                <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
                  <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 md:px-4">
                    <div className="grid grid-cols-[minmax(110px,1fr)_88px_minmax(110px,1fr)_34px] gap-2 border-b border-[var(--iberdrola-sky)] px-1 py-3 text-[11px] font-medium text-[var(--iberdrola-forest)] md:grid-cols-[minmax(140px,1fr)_96px_minmax(140px,1fr)_40px]">
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

                  <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white p-3 md:p-4">
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
            subtitle="Selecciona qué equipo pasa en cada cruce."
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