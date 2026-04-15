
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { matches as initialMatches } from "@/data/matches";
import { teams } from "@/data/teams";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";
import { buildRealKnockoutBracket } from "@/lib/realKnockout";
import {
  KnockoutPredictionMap,
  Match,
  KnockoutBracketMatch,
} from "@/types";

type GroupResultMap = Record<
  string,
  { homeGoals: string; awayGoals: string }
>;

type OfficialExtraResultMap = Record<string, string>;

type VisibilityMode = "hidden" | "after_submit" | "always";

type PoolSettingsRow = {
  id: string;
  name: string;
  slug: string;
  is_registration_open: boolean;
  is_predictions_editable: boolean;
  is_submission_enabled: boolean;
  is_pool_visible: boolean;
  classification_visibility: VisibilityMode;
  statistics_visibility: VisibilityMode;
  transparency_visibility: VisibilityMode;
  submission_deadline: string | null;
  admin_note: string | null;
};

type PoolRow = PoolSettingsRow;


const EXTRA_LABELS: Record<string, string> = {
  first_goal_scorer_world: "🥇 Primer goleador del Mundial",
  first_goal_scorer_spain: "🇪🇸 Primer goleador de España",
  golden_boot: "👟 Bota de Oro",
  golden_ball: "🏆 Balón de Oro",
  best_young_player: "🌟 Mejor jugador joven",
  golden_glove: "🧤 Guante de Oro",
  top_spanish_scorer: "🇪🇸 Máximo goleador de España",
};

function getDateKeySpain(kickoff: string | null | undefined) {
  if (!kickoff) return null;

  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatKickoffSpain(kickoff: string | null | undefined) {
  if (!kickoff) return "-";

  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateHeaderSpain(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  const date = new Date(`${year}-${month}-${day}T12:00:00+02:00`);

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "Europe/Madrid",
  }).format(date);
}

function RoundSection({
  title,
  matches,
  picks,
  onPick,
  teamMap,
}: {
  title: string;
  matches: KnockoutBracketMatch[];
  picks: KnockoutPredictionMap;
  onPick: (matchId: string, teamId: string) => void;
teamMap: Map<string, { id: string; name: string; flag?: string; flagUrl?: string }>;
}) {
  if (matches.length === 0) return null;

  return (
    <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
      <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
        <h3 className="text-lg font-black text-[var(--iberdrola-forest)]">
          {title}
        </h3>
      </div>

      <div className="p-4">
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {matches.map((match) => {
            const home = match.homeTeamId ? teamMap.get(match.homeTeamId) : null;
            const away = match.awayTeamId ? teamMap.get(match.awayTeamId) : null;

            const homeLabel =
              home?.name || match.homeLabel || "Pendiente de definir";
            const awayLabel =
              away?.name || match.awayLabel || "Pendiente de definir";

            const hasOptions = !!home || !!away;

            return (
              <div
                key={match.id}
                className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-4"
              >
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                  {match.id}
                </div>

                <div className="mb-3 space-y-1 text-sm font-semibold text-[var(--iberdrola-forest)]">
                  <div>{home ? `${home.flag} ${homeLabel}` : homeLabel}</div>
                  <div className="text-xs text-[var(--iberdrola-forest)]/45">
                    vs
                  </div>
                  <div>{away ? `${away.flag} ${awayLabel}` : awayLabel}</div>
                </div>

                <select
                  value={picks[match.id] ?? ""}
                  onChange={(e) => onPick(match.id, e.target.value)}
                  disabled={!hasOptions}
                  className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Selecciona ganador</option>
                  {home ? (
                    <option value={home.id}>
                      {home.flag} {home.name}
                    </option>
                  ) : null}
                  {away ? (
                    <option value={away.id}>
                      {away.flag} {away.name}
                    </option>
                  ) : null}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function AdminPageClient() {
  const supabase = createClient();

  const [pools, setPools] = useState<PoolRow[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [selectedPoolSlug, setSelectedPoolSlug] = useState("");

  const [savingPoolSettings, setSavingPoolSettings] = useState(false);
  const [poolSettingsMessage, setPoolSettingsMessage] = useState("");

  const [poolSettings, setPoolSettings] = useState<{
    is_registration_open: boolean;
    is_predictions_editable: boolean;
    is_submission_enabled: boolean;
    is_pool_visible: boolean;
    classification_visibility: VisibilityMode;
    statistics_visibility: VisibilityMode;
    transparency_visibility: VisibilityMode;
    submission_deadline: string;
    admin_note: string;
  }>({
    is_registration_open: true,
    is_predictions_editable: true,
    is_submission_enabled: true,
    is_pool_visible: true,
    classification_visibility: "after_submit",
    statistics_visibility: "hidden",
    transparency_visibility: "hidden",
    submission_deadline: "",
    admin_note: "",
  });

  const [groupResults, setGroupResults] = useState<GroupResultMap>({});
  const [knockoutResults, setKnockoutResults] =
    useState<KnockoutPredictionMap>({});
  const [officialExtras, setOfficialExtras] = useState<OfficialExtraResultMap>(
    {}
  );

  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [message, setMessage] = useState("");

  const teamMap = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    []
  );

  const groups = useMemo(
    () =>
      [...new Set(teams.map((team) => team.group).filter(Boolean))] as string[],
    []
  );

  const groupMatches = useMemo(
    () =>
      initialMatches
        .filter((match) => match.stage === "group")
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    []
  );

  const groupedMatchesByDate = useMemo(() => {
    const map = new Map<string, Match[]>();

    groupMatches.forEach((match) => {
      const key = getDateKeySpain(match.kickoff);
      if (!key) return;

      const current = map.get(key) ?? [];
      current.push(match);
      map.set(key, current);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, matches], index) => ({
        dateKey,
        matchday: index + 1,
        label: formatDateHeaderSpain(dateKey),
        matches,
      }));
  }, [groupMatches]);

  const officialMatches = useMemo<Match[]>(() => {
    return initialMatches.map((match) => {
      if (match.stage !== "group") return match;

      const official = groupResults[match.id];

      return {
        ...match,
        homeGoals:
          official?.homeGoals !== undefined && official.homeGoals !== ""
            ? Number(official.homeGoals)
            : null,
        awayGoals:
          official?.awayGoals !== undefined && official.awayGoals !== ""
            ? Number(official.awayGoals)
            : null,
      };
    });
  }, [groupResults]);

  const realBracket = useMemo(
    () => buildRealKnockoutBracket(teams, officialMatches, groups, knockoutResults),
    [officialMatches, groups, knockoutResults]
  );

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setMessage("");

      try {
        const { data: poolRows, error: poolError } = await supabase
          .from("pools")
          .select(`
            id,
            name,
            slug,
            is_registration_open,
            is_predictions_editable,
            is_submission_enabled,
            is_pool_visible,
            classification_visibility,
            statistics_visibility,
            transparency_visibility,
            submission_deadline,
            admin_note
          `)
          .order("name", { ascending: true });

        if (poolError) throw poolError;

        const nextPools = (poolRows ?? []) as PoolRow[];
        setPools(nextPools);

        if (nextPools.length > 0) {
          setSelectedPoolId((current) => current || nextPools[0].id);
          setSelectedPoolSlug((current) => current || nextPools[0].slug);
        }

        const { data: groupRows, error: groupError } = await supabase
          .from("official_group_results")
          .select("match_id, home_goals, away_goals");

        if (groupError) throw groupError;

        const nextGroup: GroupResultMap = {};
        (groupRows ?? []).forEach((row) => {
          nextGroup[row.match_id] = {
            homeGoals: row.home_goals !== null ? String(row.home_goals) : "",
            awayGoals: row.away_goals !== null ? String(row.away_goals) : "",
          };
        });
        setGroupResults(nextGroup);

        const { data: koRows, error: koError } = await supabase
          .from("official_knockout_results")
          .select("match_id, picked_team_id");

        if (koError) throw koError;

        const nextKO: KnockoutPredictionMap = {};
        (koRows ?? []).forEach((row) => {
          nextKO[row.match_id] = row.picked_team_id ?? "";
        });
        setKnockoutResults(nextKO);

        const { data: extraRows, error: extraError } = await supabase
          .from("official_extra_results")
          .select("question_key, official_value");

        if (extraError) throw extraError;

        const nextExtras: OfficialExtraResultMap = {};
        (extraRows ?? []).forEach((row) => {
          nextExtras[row.question_key] = row.official_value ?? "";
        });
        setOfficialExtras(nextExtras);
      } catch (err) {
        console.error(err);
        setMessage("Error cargando resultados.");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [supabase]);

  useEffect(() => {
    const currentPool = pools.find((pool) => pool.id === selectedPoolId);
    setSelectedPoolSlug(currentPool?.slug ?? "");
  }, [selectedPoolId, pools]);

  useEffect(() => {
    const currentPool = pools.find((pool) => pool.id === selectedPoolId);
    if (!currentPool) return;

    setPoolSettings({
      is_registration_open: currentPool.is_registration_open,
      is_predictions_editable: currentPool.is_predictions_editable,
      is_submission_enabled: currentPool.is_submission_enabled,
      is_pool_visible: currentPool.is_pool_visible,
      classification_visibility: currentPool.classification_visibility,
      statistics_visibility: currentPool.statistics_visibility,
      transparency_visibility: currentPool.transparency_visibility,
      submission_deadline: currentPool.submission_deadline
        ? currentPool.submission_deadline.slice(0, 16)
        : "",
      admin_note: currentPool.admin_note ?? "",
    });
  }, [selectedPoolId, pools]);


  function updateGroupResult(
    matchId: string,
    side: "homeGoals" | "awayGoals",
    value: string
  ) {
    if (!/^\d*$/.test(value)) return;

    setGroupResults((prev) => ({
      ...prev,
      [matchId]: {
        homeGoals: prev[matchId]?.homeGoals ?? "",
        awayGoals: prev[matchId]?.awayGoals ?? "",
        [side]: value,
      },
    }));
  }

  function updateKnockoutResult(matchId: string, teamId: string) {
    setKnockoutResults((prev) => ({
      ...prev,
      [matchId]: teamId,
    }));
  }

  function updateOfficialExtra(questionKey: string, value: string) {
    setOfficialExtras((prev) => ({
      ...prev,
      [questionKey]: value,
    }));
  }

  function updatePoolSetting<K extends keyof typeof poolSettings>(
    key: K,
    value: (typeof poolSettings)[K]
  ) {
    setPoolSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSavePoolSettings() {
    if (!selectedPoolId) return;

    setSavingPoolSettings(true);
    setPoolSettingsMessage("");

    try {
      const payload = {
        is_registration_open: poolSettings.is_registration_open,
        is_predictions_editable: poolSettings.is_predictions_editable,
        is_submission_enabled: poolSettings.is_submission_enabled,
        is_pool_visible: poolSettings.is_pool_visible,
        classification_visibility: poolSettings.classification_visibility,
        statistics_visibility: poolSettings.statistics_visibility,
        transparency_visibility: poolSettings.transparency_visibility,
        submission_deadline: poolSettings.submission_deadline
          ? new Date(poolSettings.submission_deadline).toISOString()
          : null,
        admin_note: poolSettings.admin_note.trim() || null,
      };

      const { error } = await supabase
        .from("pools")
        .update(payload)
        .eq("id", selectedPoolId);

      if (error) {
        console.error(error);
        setPoolSettingsMessage("Error guardando configuración del pool.");
        return;
      }

      setPools((prev) =>
        prev.map((pool) =>
          pool.id === selectedPoolId
            ? {
                ...pool,
                ...payload,
                submission_deadline: payload.submission_deadline ?? null,
                admin_note: payload.admin_note ?? null,
              }
            : pool
        )
      );

      setPoolSettingsMessage("Configuración del pool guardada.");
    } catch (err) {
      console.error(err);
      setPoolSettingsMessage("Error guardando configuración del pool.");
    } finally {
      setSavingPoolSettings(false);
    }
  }

  async function handleSaveAllResults() {
    setSavingAll(true);
    setMessage("");

    try {
      const groupRows = Object.entries(groupResults)
        .filter(([, value]) => value.homeGoals !== "" && value.awayGoals !== "")
        .map(([matchId, value]) => ({
          match_id: matchId,
          home_goals: Number(value.homeGoals),
          away_goals: Number(value.awayGoals),
        }));

      const knockoutRows = Object.entries(knockoutResults)
        .filter(([, teamId]) => !!teamId)
        .map(([matchId, pickedTeamId]) => ({
          match_id: matchId,
          picked_team_id: pickedTeamId,
        }));

      const extraRows = EXTRA_QUESTIONS.map((question) => {
        const value = (officialExtras[question.key] ?? "").trim();
        return value
          ? {
              question_key: question.key,
              official_value: value,
            }
          : null;
      }).filter(Boolean) as Array<{
        question_key: string;
        official_value: string;
      }>;

      const { error: extrasError } = await supabase
        .from("official_extra_results")
        .upsert(extraRows, { onConflict: "question_key" });

      if (extrasError) {
        console.error(extrasError);
        setMessage("Error guardando resultados extra.");
        return;
      }

      const res = await fetch("/api/admin/update-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupResults: groupRows,
          knockoutResults: knockoutRows,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Error guardando resultados.");
        return;
      }

      setMessage("Resultados guardados y clasificación recalculada.");
    } catch (err) {
      console.error(err);
      setMessage("Error guardando resultados.");
    } finally {
      setSavingAll(false);
    }
  }

  if (loading) {
    return <div className="p-6">Cargando admin...</div>;
  }

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-4 sm:px-6">
      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
  <div>
    <div className="text-sm font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
      Administración
    </div>
    <h1 className="text-2xl font-black text-[var(--iberdrola-forest)]">
      Panel de resultados del Mundial
    </h1>
    <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
      Gestiona configuración del pool, resultados oficiales, knockout y preguntas extra.
    </p>
  </div>

  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
    <div className="flex flex-wrap gap-2">
      <Link
        href="/admin/participants"
        className="inline-flex items-center justify-center rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:bg-[var(--iberdrola-sand)]"
      >
        Participantes y pagos
      </Link>

      {selectedPoolId ? (
        <Link
          href={
            selectedPoolSlug
              ? `/standings?poolId=${selectedPoolId}&poolSlug=${selectedPoolSlug}`
              : `/standings?poolId=${selectedPoolId}`
          }
          className="inline-flex items-center justify-center rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:bg-[var(--iberdrola-sand)]"
        >
          Ver clasificación del pool
        </Link>
      ) : null}
    </div>

    <button
      onClick={handleSaveAllResults}
      disabled={savingAll}
      className="rounded-2xl bg-[var(--iberdrola-green)] px-5 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-50"
    >
      {savingAll ? "Guardando..." : "Guardar y recalcular todo"}
    </button>
  </div>
</div>

          {message ? (
            <div className="mt-4 rounded-2xl border border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)] px-4 py-3 text-sm font-semibold text-[var(--iberdrola-forest)]">
              {message}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
          <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
            Configuración del pool
          </h2>
          <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
            Controla inscripción, edición, envío final y visibilidad.
          </p>
        </div>

        <div className="space-y-5 p-4">
          <div className="max-w-[320px]">
  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
    Pool seleccionado
  </label>
  <select
    value={selectedPoolId}
    onChange={(e) => setSelectedPoolId(e.target.value)}
    className="w-full rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
  >
    {pools.map((pool) => (
      <option key={pool.id} value={pool.id}>
        {pool.name}
      </option>
    ))}
  </select>
</div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex items-center justify-between rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3">
              <span className="text-sm font-bold text-[var(--iberdrola-forest)]">
                Inscripción abierta
              </span>
              <input
                type="checkbox"
                checked={poolSettings.is_registration_open}
                onChange={(e) =>
                  updatePoolSetting("is_registration_open", e.target.checked)
                }
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3">
              <span className="text-sm font-bold text-[var(--iberdrola-forest)]">
                Predicciones editables
              </span>
              <input
                type="checkbox"
                checked={poolSettings.is_predictions_editable}
                onChange={(e) =>
                  updatePoolSetting("is_predictions_editable", e.target.checked)
                }
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3">
              <span className="text-sm font-bold text-[var(--iberdrola-forest)]">
                Envío final habilitado
              </span>
              <input
                type="checkbox"
                checked={poolSettings.is_submission_enabled}
                onChange={(e) =>
                  updatePoolSetting("is_submission_enabled", e.target.checked)
                }
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3">
              <span className="text-sm font-bold text-[var(--iberdrola-forest)]">
                Pool visible
              </span>
              <input
                type="checkbox"
                checked={poolSettings.is_pool_visible}
                onChange={(e) =>
                  updatePoolSetting("is_pool_visible", e.target.checked)
                }
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[var(--iberdrola-sky)] p-4">
              <label className="mb-2 block text-sm font-bold text-[var(--iberdrola-forest)]">
                Visibilidad clasificación
              </label>
              <select
                value={poolSettings.classification_visibility}
                onChange={(e) =>
                  updatePoolSetting(
                    "classification_visibility",
                    e.target.value as VisibilityMode
                  )
                }
                className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
              >
                <option value="hidden">Oculta</option>
                <option value="after_submit">Visible tras enviar</option>
                <option value="always">Visible siempre</option>
              </select>
            </div>

            <div className="rounded-2xl border border-[var(--iberdrola-sky)] p-4">
              <label className="mb-2 block text-sm font-bold text-[var(--iberdrola-forest)]">
                Visibilidad estadísticas
              </label>
              <select
                value={poolSettings.statistics_visibility}
                onChange={(e) =>
                  updatePoolSetting(
                    "statistics_visibility",
                    e.target.value as VisibilityMode
                  )
                }
                className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
              >
                <option value="hidden">Ocultas</option>
                <option value="after_submit">Visibles tras enviar</option>
                <option value="always">Visibles siempre</option>
              </select>
            </div>

            <div className="rounded-2xl border border-[var(--iberdrola-sky)] p-4">
              <label className="mb-2 block text-sm font-bold text-[var(--iberdrola-forest)]">
                Visibilidad transparencia
              </label>
              <select
                value={poolSettings.transparency_visibility}
                onChange={(e) =>
                  updatePoolSetting(
                    "transparency_visibility",
                    e.target.value as VisibilityMode
                  )
                }
                className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
              >
                <option value="hidden">Oculta</option>
                <option value="after_submit">Visible tras enviar</option>
                <option value="always">Visible siempre</option>
              </select>
            </div>

            <div className="rounded-2xl border border-[var(--iberdrola-sky)] p-4">
              <label className="mb-2 block text-sm font-bold text-[var(--iberdrola-forest)]">
                Fecha límite de envío
              </label>
              <input
                type="datetime-local"
                value={poolSettings.submission_deadline}
                onChange={(e) =>
                  updatePoolSetting("submission_deadline", e.target.value)
                }
                className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--iberdrola-sky)] p-4">
            <label className="mb-2 block text-sm font-bold text-[var(--iberdrola-forest)]">
              Nota interna del admin
            </label>
            <textarea
              value={poolSettings.admin_note}
              onChange={(e) => updatePoolSetting("admin_note", e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
              placeholder="Notas internas sobre el estado del pool, pagos, pruebas, etc."
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[var(--iberdrola-forest)]/65">
              Estas opciones afectan al pool seleccionado y luego se usarán
              para condicionar el frontend.
            </div>

            <button
              type="button"
              onClick={handleSavePoolSettings}
              disabled={savingPoolSettings || !selectedPoolId}
              className="rounded-2xl bg-[var(--iberdrola-green)] px-5 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-50"
            >
              {savingPoolSettings
                ? "Guardando..."
                : "Guardar configuración del pool"}
            </button>
          </div>

          {poolSettingsMessage ? (
            <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)] px-4 py-3 text-sm font-semibold text-[var(--iberdrola-forest)]">
              {poolSettingsMessage}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
          <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
            Resultados de la fase de grupos
          </h2>
          <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
            Partidos ordenados cronológicamente y agrupados por jornada lógica
            de España.
          </p>
        </div>

        <div className="space-y-5 p-4">
          {groupedMatchesByDate.map((block) => (
            <section
              key={block.dateKey}
              className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white"
            >
              <div className="flex flex-col gap-1 border-b border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)]/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-black capitalize text-[var(--iberdrola-forest)]">
                  {block.label}
                </div>
                <div className="text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                  Jornada {block.matchday}
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[760px]">
                  <div className="grid grid-cols-[90px_1fr_110px] gap-3 border-b border-[var(--iberdrola-sky)] px-4 py-3 text-xs font-black uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                    <div>J/G/Hora</div>
                    <div>Partido</div>
                    <div className="text-center">Resultado</div>
                  </div>

                  {block.matches.map((match) => {
                    const home = teamMap.get(match.homeTeamId ?? "");
                    const away = teamMap.get(match.awayTeamId ?? "");

                    if (!home || !away) return null;

                    return (
                      <div
                        key={match.id}
                        className="grid grid-cols-[90px_1fr_110px] items-center gap-3 border-b border-[var(--iberdrola-sky)]/60 px-4 py-3"
                      >
                        <div className="text-sm font-bold text-[var(--iberdrola-forest)]">
                          <div>J{block.matchday}</div>
                          <div className="text-[11px] font-semibold text-[var(--iberdrola-forest)]/60">
                            {match.group} · {formatKickoffSpain(match.kickoff)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
  <span className="flex items-center gap-1">
    <img src={home.flagUrl} className="h-4 w-6 rounded-[2px]" />
    {home.name}
  </span>

  <span className="mx-2 text-[var(--iberdrola-forest)]/60">vs</span>

  <span className="flex items-center gap-1">
    <img src={away.flagUrl} className="h-4 w-6 rounded-[2px]" />
    {away.name}
  </span>
</div>

                        <div className="flex items-center justify-center gap-2">
                          <input
                            value={groupResults[match.id]?.homeGoals ?? ""}
                            onChange={(e) =>
                              updateGroupResult(
                                match.id,
                                "homeGoals",
                                e.target.value
                              )
                            }
                            className="w-10 rounded-xl border border-[var(--iberdrola-green)] px-2 py-2 text-center text-sm font-bold text-[var(--iberdrola-forest)]"
                          />

                          <span className="font-bold text-[var(--iberdrola-forest)]/60">
                            -
                          </span>

                          <input
                            value={groupResults[match.id]?.awayGoals ?? ""}
                            onChange={(e) =>
                              updateGroupResult(
                                match.id,
                                "awayGoals",
                                e.target.value
                              )
                            }
                            className="w-10 rounded-xl border border-[var(--iberdrola-green)] px-2 py-2 text-center text-sm font-bold text-[var(--iberdrola-forest)]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <RoundSection
          title="Round of 32"
          matches={realBracket.round32}
          picks={knockoutResults}
          onPick={updateKnockoutResult}
          teamMap={teamMap}
        />

        <RoundSection
          title="Octavos"
          matches={realBracket.round16}
          picks={knockoutResults}
          onPick={updateKnockoutResult}
          teamMap={teamMap}
        />

        <RoundSection
          title="Cuartos"
          matches={realBracket.quarterfinals}
          picks={knockoutResults}
          onPick={updateKnockoutResult}
          teamMap={teamMap}
        />

        <RoundSection
          title="Semifinales"
          matches={realBracket.semifinals}
          picks={knockoutResults}
          onPick={updateKnockoutResult}
          teamMap={teamMap}
        />
      </div>

      <RoundSection
        title="Final"
        matches={realBracket.finals}
        picks={knockoutResults}
        onPick={updateKnockoutResult}
        teamMap={teamMap}
      />

      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
          <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
            Preguntas extra
          </h2>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {EXTRA_QUESTIONS.map((question) => (
            <div
              key={question.key}
              className="rounded-2xl border border-[var(--iberdrola-sky)] p-4"
            >
              <label className="mb-2 block text-sm font-bold text-[var(--iberdrola-forest)]">
                {EXTRA_LABELS[question.key] ?? question.key}
              </label>

              <input
                type="text"
                value={officialExtras[question.key] ?? ""}
                onChange={(e) =>
                  updateOfficialExtra(question.key, e.target.value)
                }
                placeholder="Resultado oficial"
                className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}