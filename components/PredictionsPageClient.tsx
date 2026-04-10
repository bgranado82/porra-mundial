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

function HeaderPill({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 shadow-sm ${
        accent
          ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green)] text-white"
          : "border-[var(--iberdrola-sky)] bg-white text-[var(--iberdrola-forest)]"
      }`}
    >
      <div
        className={`text-[11px] font-bold uppercase tracking-wide ${
          accent ? "text-white/85" : "text-[var(--iberdrola-forest)]/65"
        }`}
      >
        {label}
      </div>
      <div className={`mt-1 ${accent ? "text-4xl sm:text-5xl" : "text-2xl"} font-black`}>
        {value}
      </div>
    </div>
  );
}

function RulePill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--iberdrola-sky)] bg-white px-3 py-2">
      <div className="text-[11px] font-semibold text-[var(--iberdrola-forest)]/65">
        {label}
      </div>
      <div className="text-sm font-extrabold text-[var(--iberdrola-forest)]">
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

    const savedTimeZone = localStorage.getItem(
      TIMEZONE_KEY
    ) as TimezoneValue | null;

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
            pools ( name, slug )
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
        setEntryStatus((entry.status ?? "draft") as "draft" | "submitted");
        setEntryNumber(entry.entry_number ?? null);
        setPoolName(pool?.name ?? "");

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

        const { data: officialGroupRows, error: officialGroupError } =
          await supabase
            .from("official_group_results")
            .select("match_id, home_goals, away_goals");

        if (officialGroupError) {
          console.error(officialGroupError);
        }

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

        if (officialKnockoutError) {
          console.error(officialKnockoutError);
        }

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
    <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-4 sm:py-6">
      <div className="space-y-4">
        <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="Porra Mundial"
                    className="h-12 w-12 rounded-xl object-contain sm:h-14 sm:w-14"
                  />

                  <div className="min-w-0">
                    <h1 className="truncate text-xl font-black text-[var(--iberdrola-forest)] sm:text-2xl">
                      {t.appTitle}
                    </h1>
                    <p className="text-sm text-[var(--iberdrola-forest)]/70">
                      {poolName ? `${poolName} · ` : ""}
                      Porra {entryNumber ?? "-"} ·{" "}
                      {entryStatus === "submitted" ? "Enviada" : "Borrador"}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-semibold text-[var(--iberdrola-forest)]/65">
                    Bienvenido
                  </div>
                  <div className="text-2xl font-black tracking-tight text-[var(--iberdrola-green)] sm:text-3xl">
                    {greetingName}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 xl:min-w-[260px] xl:items-end">
                <LanguageSwitcher
                  locale={locale}
                  onChange={setLocale}
                  label={t.language}
                />

                <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                  <label className="text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/65">
                    Huso horario
                  </label>
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
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1.3fr_0.8fr_auto]">
              <HeaderPill
                label={t.totalPoints}
                value={totalPoints}
                accent
              />

              <HeaderPill
                label="Clasificación"
                value="-"
              />

              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
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
            </div>

            {submitMessage ? (
              <div className="mt-4 rounded-2xl border border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)] px-4 py-3 text-sm font-semibold text-[var(--iberdrola-forest)]">
                {submitMessage}
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
          <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
            <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
              {t.scoringRules}
            </h2>
          </div>

          <div className="p-4">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              <RulePill
                label={t.exactScoreRule}
                value={`${scoreSettings.exactScore} ${t.points}`}
              />
              <RulePill
                label={t.outcomeRule}
                value={`${scoreSettings.outcome} ${t.points}`}
              />
              <RulePill
                label={t.homeGoalsRule}
                value={`${scoreSettings.homeGoals} ${t.points}`}
              />
              <RulePill
                label={t.awayGoalsRule}
                value={`${scoreSettings.awayGoals} ${t.points}`}
              />
              <RulePill
                label={t.champion}
                value={`${scoreSettings.championPoints} ${t.points}`}
              />
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              <RulePill
                label={t.round32}
                value={`${scoreSettings.round32QualifiedPoints} ${t.points}`}
              />
              <RulePill
                label={t.round16}
                value={`${scoreSettings.round16QualifiedPoints} ${t.points}`}
              />
              <RulePill
                label={t.quarterfinals}
                value={`${scoreSettings.quarterfinalQualifiedPoints} ${t.points}`}
              />
              <RulePill
                label={t.semifinals}
                value={`${scoreSettings.semifinalQualifiedPoints} ${t.points}`}
              />
              <RulePill
                label={t.finalLabel}
                value={`${scoreSettings.finalQualifiedPoints} ${t.points}`}
              />
            </div>

            <p className="mt-3 text-sm text-[var(--iberdrola-forest)]/75">
              {t.scoringNote}
            </p>
          </div>
        </section>

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
              <section
                key={groupCode}
                className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm"
              >
                <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
                  <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
                    {t.group} {groupCode}
                  </h2>
                </div>

                <div className="grid gap-4 p-4 xl:grid-cols-[1.45fr_1fr]">
                  <div className="space-y-2">
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
                          matchNumber={match.matchNumber}
                          kickoff={match.kickoff ?? null}
                          timeZone={timeZone}
                          homeTeam={homeTeam}
                          awayTeam={awayTeam}
                          homePrediction={prediction.homeGoals}
                          awayPrediction={prediction.awayGoals}
                          officialHomeGoals={match.homeGoals}
                          officialAwayGoals={match.awayGoals}
                          points={score.points}
                          pointsShortLabel={t.pointsShort}
                          officialLabel={t.officialLabel}
                          officialPendingLabel={t.officialPending}
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

                  <div className="min-w-0">
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
        </div>

        <ThirdPlaceTable
          title={`${t.group} I · ${t.bestThirdPlaced}`}
          subtitle={t.bestThirdPlacedSubtitle}
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
          title={t.knockoutBracket}
          subtitle={t.realBracketPending}
          round32={userBracket.round32}
          round16={userBracket.round16}
          quarterfinals={userBracket.quarterfinals}
          semifinals={userBracket.semifinals}
          finals={userBracket.finals}
          championId={userBracket.championId}
          teams={teams}
          picks={knockoutPredictions}
          onPick={entryStatus === "submitted" ? undefined : updateKnockoutPrediction}
          realTeamsByRound={realTeamsByRound}
        />
      </div>
    </main>
  );
}