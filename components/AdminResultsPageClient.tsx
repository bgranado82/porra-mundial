
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { matches as initialMatches } from "@/data/matches";
import { teams } from "@/data/teams";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";
import { buildRealKnockoutBracket } from "@/lib/realKnockout";
import { calculateStandings } from "@/lib/standings";
import { getBestThirdPlacedTeams } from "@/lib/thirdPlace";
import AdminGroupStandingsTable from "@/components/AdminGroupStandingsTable";
import AdminThirdPlaceTable from "@/components/AdminThirdPlaceTable";
import AdminGroupMatchCompactRow from "@/components/AdminGroupMatchCompactRow";
import AdminGroupMatchRow from "@/components/AdminGroupMatchRow";
import {
  KnockoutPredictionMap,
  Match,
  KnockoutBracketMatch,
} from "@/types";

type GroupResultMap = Record<string, { homeGoals: string; awayGoals: string }>;
type OfficialExtraResultMap = Record<string, string>;
type AdminTiebreakMap = Record<string, number>;

type PoolRow = {
  id: string;
  name: string;
  slug: string;
};

type AdminTiebreakRow = {
  scope: "group" | "third_place";
  scope_value: string;
  team_id: string;
  priority: number;
};

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

function formatDateHeaderSpain(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  const date = new Date(`${year}-${month}-${day}T12:00:00+02:00}`);

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "Europe/Madrid",
  }).format(date);
}

function getTiebreakKey(
  scope: "group" | "third_place",
  scopeValue: string,
  teamId: string
) {
  return `${scope}:${scopeValue}:${teamId}`;
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
  teamMap: Map<
    string,
    { id: string; name: string; flag?: string; flagUrl?: string }
  >;
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

                <div className="mb-3 space-y-2 text-sm font-semibold text-[var(--iberdrola-forest)]">
                  <div className="flex items-center gap-2">
                    {home?.flagUrl ? (
                      <img
                        src={home.flagUrl}
                        alt={home.name}
                        className="h-4 w-6 rounded-[2px] border border-gray-200 object-cover"
                      />
                    ) : null}
                    <span>{homeLabel}</span>
                  </div>

                  <div className="text-xs text-[var(--iberdrola-forest)]/45">vs</div>

                  <div className="flex items-center gap-2">
                    {away?.flagUrl ? (
                      <img
                        src={away.flagUrl}
                        alt={away.name}
                        className="h-4 w-6 rounded-[2px] border border-gray-200 object-cover"
                      />
                    ) : null}
                    <span>{awayLabel}</span>
                  </div>
                </div>

                <select
                  value={picks[match.id] ?? ""}
                  onChange={(e) => onPick(match.id, e.target.value)}
                  disabled={!hasOptions}
                  className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Selecciona ganador</option>
                  {home ? <option value={home.id}>{home.name}</option> : null}
                  {away ? <option value={away.id}>{away.name}</option> : null}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function AdminResultsPageClient() {
  const supabase = createClient();

  const [pools, setPools] = useState<PoolRow[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [selectedPoolSlug, setSelectedPoolSlug] = useState("");

  const [groupResults, setGroupResults] = useState<GroupResultMap>({});
  const [knockoutResults, setKnockoutResults] =
    useState<KnockoutPredictionMap>({});
  const [officialExtras, setOfficialExtras] = useState<OfficialExtraResultMap>(
    {}
  );
  const [adminTiebreaks, setAdminTiebreaks] = useState<AdminTiebreakMap>({});

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
        .sort((a, b) => {
          if ((a.order ?? 0) !== (b.order ?? 0)) {
            return (a.order ?? 0) - (b.order ?? 0);
          }
          return (a.matchNumber ?? 0) - (b.matchNumber ?? 0);
        }),
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

  const groupAdminTiebreaks = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};

    groups.forEach((groupCode) => {
      result[groupCode] = {};

      teams
        .filter((team) => team.group === groupCode)
        .forEach((team) => {
          const key = getTiebreakKey("group", groupCode, team.id);
          const value = adminTiebreaks[key];

          if (typeof value === "number") {
            result[groupCode][team.id] = value;
          }
        });
    });

    return result;
  }, [groups, adminTiebreaks]);

  const thirdPlaceAdminTiebreaks = useMemo(() => {
    const result: Record<string, number> = {};

    teams.forEach((team) => {
      const key = getTiebreakKey("third_place", "overall", team.id);
      const value = adminTiebreaks[key];

      if (typeof value === "number") {
        result[team.id] = value;
      }
    });

    return result;
  }, [adminTiebreaks]);

  const standingsByGroup = useMemo(
    () =>
      groups.map((groupCode) => ({
        groupCode,
        rows: calculateStandings(
          teams,
          officialMatches,
          groupCode,
          undefined,
          groupAdminTiebreaks[groupCode]
        ),
      })),
    [groups, officialMatches, groupAdminTiebreaks]
  );

  const thirdPlaceRows = useMemo(
    () =>
      getBestThirdPlacedTeams(
        teams,
        officialMatches,
        groups,
        8,
        undefined,
        thirdPlaceAdminTiebreaks,
        groupAdminTiebreaks
      ),
    [teams, officialMatches, groups, thirdPlaceAdminTiebreaks, groupAdminTiebreaks]
  );

  const realBracket = useMemo(
    () =>
      buildRealKnockoutBracket(teams, officialMatches, groups, knockoutResults, {
        groupAdminTiebreaks,
        thirdPlaceAdminTiebreaks,
      }),
    [
      officialMatches,
      groups,
      knockoutResults,
      groupAdminTiebreaks,
      thirdPlaceAdminTiebreaks,
    ]
  );

useEffect(() => {
  function sanitizePick(
  currentValue: string | null | undefined,
  match: KnockoutBracketMatch
) {
  if (!currentValue) return "";

  const validOptions = new Set(
    [match.homeTeamId, match.awayTeamId].filter(Boolean) as string[]
  );

  return validOptions.has(currentValue) ? currentValue : "";
}

  setKnockoutResults((prev) => {
    const next = { ...prev };
    let changed = false;

    const allMatches = [
      ...realBracket.round32,
      ...realBracket.round16,
      ...realBracket.quarterfinals,
      ...realBracket.semifinals,
      ...realBracket.finals,
    ];

    for (const match of allMatches) {
      const sanitized = sanitizePick(prev[match.id], match);

      if ((prev[match.id] ?? "") !== sanitized) {
        next[match.id] = sanitized;
        changed = true;
      }
    }

    return changed ? next : prev;
  });
}, [realBracket]);

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setMessage("");

      try {
        const { data: poolRows, error: poolError } = await supabase
          .from("pools")
          .select("id, name, slug")
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

        const { data: tbRows, error: tbError } = await supabase
          .from("admin_tiebreaks")
          .select("scope, scope_value, team_id, priority");

        if (tbError) throw tbError;

        const nextTiebreaks: AdminTiebreakMap = {};
        ((tbRows ?? []) as AdminTiebreakRow[]).forEach((row) => {
          nextTiebreaks[
            getTiebreakKey(row.scope, row.scope_value, row.team_id)
          ] = row.priority;
        });
        setAdminTiebreaks(nextTiebreaks);
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
  setKnockoutResults((prev) => {
    const next = {
      ...prev,
      [matchId]: teamId || "",
    };

    const clearMatches = (ids: string[]) => {
      ids.forEach((id) => {
        next[id] = "";
      });
    };

    if (matchId.startsWith("r32-")) {
      const n = Number(matchId.replace("r32-", ""));

      if ([1, 2, 3, 5].includes(n)) clearMatches(["r16-1", "r16-2", "qf-1", "sf-1", "final-1"]);
      if ([4, 6, 7, 8].includes(n)) clearMatches(["r16-3", "r16-4", "qf-3", "sf-2", "final-1"]);
      if ([9, 10, 11, 12].includes(n)) clearMatches(["r16-5", "r16-6", "qf-2", "sf-1", "final-1"]);
      if ([13, 14, 15, 16].includes(n)) clearMatches(["r16-7", "r16-8", "qf-4", "sf-2", "final-1"]);
    }

    if (matchId.startsWith("r16-")) {
      const n = Number(matchId.replace("r16-", ""));

      if ([1, 2].includes(n)) clearMatches(["qf-1", "sf-1", "final-1"]);
      if ([5, 6].includes(n)) clearMatches(["qf-2", "sf-1", "final-1"]);
      if ([3, 4].includes(n)) clearMatches(["qf-3", "sf-2", "final-1"]);
      if ([7, 8].includes(n)) clearMatches(["qf-4", "sf-2", "final-1"]);
    }

    if (matchId.startsWith("qf-")) {
      const n = Number(matchId.replace("qf-", ""));

      if ([1, 2].includes(n)) clearMatches(["sf-1", "final-1"]);
      if ([3, 4].includes(n)) clearMatches(["sf-2", "final-1"]);
    }

    if (matchId.startsWith("sf-")) {
      clearMatches(["final-1"]);
    }

    return next;
  });
}

  function updateOfficialExtra(questionKey: string, value: string) {
    setOfficialExtras((prev) => ({
      ...prev,
      [questionKey]: value,
    }));
  }

  function updateGroupTiebreak(groupCode: string, teamId: string, value: string) {
    if (!/^\d*$/.test(value)) return;

    const key = getTiebreakKey("group", groupCode, teamId);

    setAdminTiebreaks((prev) => {
      const next = { ...prev };

      if (value === "") {
        delete next[key];
      } else {
        next[key] = Number(value);
      }

      return next;
    });
  }

  function updateThirdPlaceTiebreak(teamId: string, value: string) {
    if (!/^\d*$/.test(value)) return;

    const key = getTiebreakKey("third_place", "overall", teamId);

    setAdminTiebreaks((prev) => {
      const next = { ...prev };

      if (value === "") {
        delete next[key];
      } else {
        next[key] = Number(value);
      }

      return next;
    });
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
      }).filter(Boolean);

      const tiebreakRows: AdminTiebreakRow[] = Object.entries(adminTiebreaks).map(
        ([key, priority]) => {
          const [scope, scopeValue, teamId] = key.split(":");
          return {
            scope: scope as "group" | "third_place",
            scope_value: scopeValue,
            team_id: teamId,
            priority,
          };
        }
      );

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
          extraResults: extraRows,
          adminTiebreaks: tiebreakRows,
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
    <main className="mx-auto max-w-[1600px] space-y-6 overflow-x-hidden px-4 py-4 sm:px-6">
      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                Administración
              </div>
              <h1 className="text-2xl font-black text-[var(--iberdrola-forest)]">
                Resultados oficiales
              </h1>
              <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
                Gestiona fase de grupos, knockout, desempates y preguntas extra.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full min-w-0 sm:w-[260px]">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                  Pool para clasificación
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

              <button
                onClick={handleSaveAllResults}
                disabled={savingAll}
                className="rounded-2xl bg-[var(--iberdrola-green)] px-5 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-50"
              >
                {savingAll ? "Guardando..." : "Guardar y recalcular todo"}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="rounded-xl border border-[var(--iberdrola-sky)] bg-white px-3 py-2 text-sm font-bold text-[var(--iberdrola-forest)]"
            >
              Inicio admin
            </Link>

            <Link
              href="/admin/participants"
              className="rounded-xl border border-[var(--iberdrola-sky)] bg-white px-3 py-2 text-sm font-bold text-[var(--iberdrola-forest)]"
            >
              Participantes y pagos
            </Link>

            {selectedPoolId ? (
              <Link
                href={
                  selectedPoolSlug
                    ? `/stats?poolId=${selectedPoolId}&poolSlug=${selectedPoolSlug}`
                    : `/stats?poolId=${selectedPoolId}`
                }
                className="rounded-xl border border-[var(--iberdrola-green)] bg-white px-3 py-2 text-sm font-bold text-[var(--iberdrola-forest)]"
              >
                Ver estadísticas
              </Link>
            ) : null}
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl border border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)] px-4 py-3 text-sm font-semibold text-[var(--iberdrola-forest)]">
              {message}
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_0.15fr]">
  <section className="min-w-0 rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
          <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
            <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
              Resultados de la fase de grupos
            </h2>
            <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
              Partidos ordenados cronológicamente y agrupados por jornada lógica de España.
            </p>
          </div>

          <div className="p-4 space-y-5">
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

                <div className="hidden lg:block overflow-hidden rounded-b-2xl bg-white">
                  <div className="grid grid-cols-[140px_minmax(0,1fr)_90px] gap-3 border-b border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)]/35 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-[var(--iberdrola-forest)]/75">
                    <div>J / G / Fecha</div>
                    <div className="text-center">Resultado oficial</div>
                    <div className="text-right">Estado</div>
                  </div>

                  {block.matches.map((match) => {
                    const homeTeam = teamMap.get(match.homeTeamId ?? "");
                    const awayTeam = teamMap.get(match.awayTeamId ?? "");

                    if (!homeTeam || !awayTeam) return null;

                    const homeValue = groupResults[match.id]?.homeGoals ?? "";
                    const awayValue = groupResults[match.id]?.awayGoals ?? "";

                    return (
                      <AdminGroupMatchCompactRow
                        key={match.id}
                        day={match.day}
                        group={match.group ?? null}
                        kickoff={match.kickoff ?? null}
                        homeTeam={homeTeam}
                        awayTeam={awayTeam}
                        homeValue={homeValue}
                        awayValue={awayValue}
                        onChangeHome={(value) =>
                          updateGroupResult(match.id, "homeGoals", value)
                        }
                        onChangeAway={(value) =>
                          updateGroupResult(match.id, "awayGoals", value)
                        }
                      />
                    );
                  })}
                </div>

                <div className="space-y-2 p-3 lg:hidden">
                  {block.matches.map((match) => {
                    const homeTeam = teamMap.get(match.homeTeamId ?? "");
                    const awayTeam = teamMap.get(match.awayTeamId ?? "");

                    if (!homeTeam || !awayTeam) return null;

                    const homeValue = groupResults[match.id]?.homeGoals ?? "";
                    const awayValue = groupResults[match.id]?.awayGoals ?? "";

                    return (
                      <AdminGroupMatchRow
                        key={match.id}
                        day={match.day}
                        group={match.group ?? null}
                        matchNumber={match.matchNumber ?? 0}
                        kickoff={match.kickoff ?? null}
                        homeTeam={homeTeam}
                        awayTeam={awayTeam}
                        homeValue={homeValue}
                        awayValue={awayValue}
                        onChangeHome={(value) =>
                          updateGroupResult(match.id, "homeGoals", value)
                        }
                        onChangeAway={(value) =>
                          updateGroupResult(match.id, "awayGoals", value)
                        }
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="min-w-0 rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm lg:sticky lg:top-4 self-start">
          <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
            <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
              Clasificaciones
            </h2>
            <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
              Clasificación actualizada por grupo según resultados oficiales.
            </p>
          </div>

          <div className="space-y-3 p-4">
            {standingsByGroup.map(({ groupCode, rows }) => (
              <div
                key={groupCode}
                className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-3"
              >
                <AdminGroupStandingsTable
                  title={`Grupo ${groupCode}`}
                  groupCode={groupCode}
                  rows={rows}
                  tiebreaks={adminTiebreaks}
                  onChangeTiebreak={updateGroupTiebreak}
                  labels={{
                    team: "Equipo",
                    played: "PJ",
                    won: "PG",
                    drawn: "PE",
                    lost: "PP",
                    goalsFor: "GF",
                    goalsAgainst: "GC",
                    goalDifference: "DG",
                    pointsShort: "Pts",
                    tiebreak: "TB",
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

 <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
  <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
    <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
      Mejores terceros
    </h2>
    <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
      Desempate manual solo si siguen empatados a todo.
    </p>
  </div>

  <div className="p-4">
    <AdminThirdPlaceTable
      title="Ranking de terceros"
      rows={thirdPlaceRows}
      tiebreaks={adminTiebreaks}
      onChangeTiebreak={updateThirdPlaceTiebreak}
      labels={{
        position: "#",
        group: "Grupo",
        team: "Equipo",
        played: "PJ",
        won: "PG",
        drawn: "PE",
        lost: "PP",
        goalsFor: "GF",
        goalsAgainst: "GC",
        goalDifference: "DG",
        pointsShort: "Pts",
        status: "Estado",
        qualified: "Clasifica",
        eliminated: "Fuera",
        tiebreak: "TB",
      }}
    />
  </div>
</section>

      <div className="grid gap-6 lg:grid-cols-2">
        <RoundSection
          title="Round of 32"
          matches={realBracket.round32}
          picks={knockoutResults}
          onPick={updateKnockoutResult}
          teamMap={teamMap}
        />

        <RoundSection
          title="Round of 16"
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

        <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
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