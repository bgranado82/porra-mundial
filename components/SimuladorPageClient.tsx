"use client";

/**
 * Simulador de resultados (solo admin).
 *
 * Cómo funciona el aislamiento:
 * - Todos los "resultados hipotéticos" viven en useState de este componente.
 *   Nada se guarda en Supabase ni en localStorage: al recargar la página se
 *   pierde la simulación (es intencional).
 * - El árbol de eliminatorias se recalcula 100% en el cliente con
 *   buildRealKnockoutBracket (función pura), así que pinchar un ganador
 *   actualiza el resto del bracket al instante sin ir al servidor.
 * - Solo se llama al servidor (POST /api/admin/simulate) para recalcular la
 *   clasificación final, y esa llamada es de solo lectura: nunca escribe
 *   nada en la base de datos.
 * - Nadie más puede ver esto: no hay tabla compartida ni канal en tiempo real.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminSectionHeader from "@/components/AdminSectionHeader";
import AdminPoolSelector from "@/components/AdminPoolSelector";
import StandingsTable from "@/components/StandingsTableV2";
import { matches as initialMatches } from "@/data/matches";
import { teams } from "@/data/teams";
import { buildRealKnockoutBracket } from "@/lib/realKnockout";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";
import { Match } from "@/types";

type OfficialGroupRow = { match_id: string; home_goals: number | null; away_goals: number | null };
type OfficialKnockoutRow = { match_id: string; picked_team_id: string | null };
type OfficialExtraRow = { question_key: string; official_value: string };
type AdminTiebreakRow = { scope: string; scope_value: string; team_id: string; priority: number };

type RealData = {
  officialGroupRows: OfficialGroupRow[];
  officialKnockoutRows: OfficialKnockoutRow[];
  officialExtraRows: OfficialExtraRow[];
  adminTiebreakRows: AdminTiebreakRow[];
};

const ROUND_LABELS: Record<string, string> = {
  round32: "Dieciseisavos",
  round16: "Octavos",
  quarterfinals: "Cuartos",
  semifinals: "Semifinales",
  finals: "Final",
};

const EXTRA_QUESTION_LABELS: Record<string, string> = {
  first_goal_scorer_world: "Primer goleador Mundial",
  first_goal_scorer_spain: "Primer goleador España",
  golden_boot: "Bota de Oro",
  golden_ball: "Balón de Oro",
  best_young_player: "Mejor jugador joven",
  golden_glove: "Guante de Oro",
  top_spanish_scorer: "Máximo goleador español",
};

function teamById(teamId: string | null) {
  if (!teamId) return null;
  return teams.find((t) => t.id === teamId) ?? null;
}

export default function SimuladorPageClient() {
  const [poolId, setPoolId] = useState("");
  const [realData, setRealData] = useState<RealData | null>(null);
  const [loadingReal, setLoadingReal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Overrides — solo en memoria del navegador de este admin.
  const [knockoutOverrides, setKnockoutOverrides] = useState<Record<string, string | null>>({});
  const [extraOverrides, setExtraOverrides] = useState<Record<string, string>>({});
  const [showGroupOverrides, setShowGroupOverrides] = useState(false);
  const [groupOverrides, setGroupOverrides] = useState<Record<string, { homeGoals: number | null; awayGoals: number | null }>>({});

  const [simResult, setSimResult] = useState<{ days: number[]; standings: unknown[] } | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  // Cargar datos reales (una vez, no depende del pool: los resultados oficiales son globales)
  useEffect(() => {
    setLoadingReal(true);
    setError(null);
    fetch("/api/admin/simulate")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setRealData(d);
      })
      .catch(() => setError("Error cargando datos reales"))
      .finally(() => setLoadingReal(false));
  }, []);

  const groups = useMemo(
    () => [...new Set(teams.map((t) => t.group).filter(Boolean))] as string[],
    []
  );

  // Partidos de grupo reales + overrides de "qué hubiera pasado si..."
  const officialMatches: Match[] = useMemo(() => {
    if (!realData) return [];
    const groupMap = new Map(realData.officialGroupRows.map((r) => [r.match_id, r]));
    return initialMatches.map((match) => {
      if (match.stage !== "group") return match;
      const override = groupOverrides[match.id];
      if (override) {
        return { ...match, homeGoals: override.homeGoals, awayGoals: override.awayGoals };
      }
      const official = groupMap.get(match.id);
      return { ...match, homeGoals: official?.home_goals ?? null, awayGoals: official?.away_goals ?? null };
    });
  }, [realData, groupOverrides]);

  const { groupAdminTiebreaks, thirdPlaceAdminTiebreaks } = useMemo(() => {
    const groupTb: Record<string, Record<string, number>> = {};
    const thirdTb: Record<string, number> = {};
    (realData?.adminTiebreakRows ?? []).forEach((row) => {
      if (row.scope === "group") {
        if (!groupTb[row.scope_value]) groupTb[row.scope_value] = {};
        groupTb[row.scope_value][row.team_id] = row.priority;
      } else if (row.scope === "third_place") {
        thirdTb[row.team_id] = row.priority;
      }
    });
    return { groupAdminTiebreaks: groupTb, thirdPlaceAdminTiebreaks: thirdTb };
  }, [realData]);

  // Mapa de picks real + overrides -> se pasa al bracket, que propaga solo
  const knockoutPicksMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    (realData?.officialKnockoutRows ?? []).forEach((row) => { map[row.match_id] = row.picked_team_id; });
    Object.entries(knockoutOverrides).forEach(([matchId, teamId]) => { map[matchId] = teamId; });
    return map;
  }, [realData, knockoutOverrides]);

  const bracket = useMemo(() => {
    if (!realData) return null;
    return buildRealKnockoutBracket(teams, officialMatches, groups, knockoutPicksMap, {
      groupAdminTiebreaks,
      thirdPlaceAdminTiebreaks,
    });
  }, [realData, officialMatches, groups, knockoutPicksMap, groupAdminTiebreaks, thirdPlaceAdminTiebreaks]);

  const hasOverrides =
    Object.keys(knockoutOverrides).length > 0 ||
    Object.keys(extraOverrides).length > 0 ||
    Object.keys(groupOverrides).length > 0;

  // Lanza la simulación en el servidor (solo lectura) cada vez que cambian los overrides
  const runSimulation = useCallback(() => {
    if (!poolId) return;
    setSimLoading(true);
    fetch("/api/admin/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        poolId,
        groupOverrides: Object.entries(groupOverrides).map(([matchId, v]) => ({ matchId, ...v })),
        knockoutOverrides: Object.entries(knockoutOverrides).map(([matchId, pickedTeamId]) => ({ matchId, pickedTeamId })),
        extraOverrides: Object.entries(extraOverrides).map(([questionKey, value]) => ({ questionKey, value })),
      }),
    })
      .then((r) => r.json())
      .then((d) => { if (!d.error) setSimResult(d); })
      .finally(() => setSimLoading(false));
  }, [poolId, groupOverrides, knockoutOverrides, extraOverrides]);

  useEffect(() => {
    if (!poolId) { setSimResult(null); return; }
    const timeout = setTimeout(runSimulation, 300); // debounce
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolId, groupOverrides, knockoutOverrides, extraOverrides]);

  function pickWinner(matchId: string, teamId: string | null) {
    if (!teamId) return;
    setKnockoutOverrides((prev) => ({ ...prev, [matchId]: teamId }));
  }

  function resetAll() {
    setKnockoutOverrides({});
    setExtraOverrides({});
    setGroupOverrides({});
  }

  if (loadingReal) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--iberdrola-green)] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-700">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--iberdrola-green-light)]">
      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">
        <AdminPageHeader
          title="Simulador"
          icon="🧪"
          description="Prueba resultados hipotéticos y mira cómo cambiaría la clasificación. No afecta a los datos reales ni lo ve nadie más."
        />

        <div className="rounded-2xl border border-amber-400 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          ⚠️ Modo simulación — estos resultados son hipotéticos, solo tú los ves, y no se guardan en ningún sitio.
        </div>

        <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
          <AdminSectionHeader title="Pool" />
          <div className="flex items-center gap-3 p-4 sm:p-6">
            <AdminPoolSelector selectedPoolId={poolId} onChange={setPoolId} className="w-full sm:w-80" />
            {hasOverrides && (
              <button
                onClick={resetAll}
                className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                Restablecer a resultados reales
              </button>
            )}
          </div>
        </section>

        {bracket && (
          <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
            <AdminSectionHeader title="Eliminatorias — pincha el ganador" />
            <div className="space-y-6 p-4 sm:p-6">
              {(["round32", "round16", "quarterfinals", "semifinals", "finals"] as const).map((stage) => {
                const stageMatches = bracket[stage] ?? [];
                if (!stageMatches.length) return null;
                return (
                  <div key={stage}>
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/70">
                      {ROUND_LABELS[stage]}
                    </h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {stageMatches.map((m: any) => {
                        const home = teamById(m.homeTeamId);
                        const away = teamById(m.awayTeamId);
                        const winner = knockoutPicksMap[m.id] ?? null;
                        return (
                          <div key={m.id} className="rounded-xl border border-gray-200 p-2">
                            {[{ team: home, teamId: m.homeTeamId, label: m.homeLabel }, { team: away, teamId: m.awayTeamId, label: m.awayLabel }].map((side, i) => {
                              const isWinner = side.teamId && side.teamId === winner;
                              const disabled = !side.teamId;
                              return (
                                <button
                                  key={i}
                                  disabled={disabled}
                                  onClick={() => pickWinner(m.id, side.teamId)}
                                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                                    disabled
                                      ? "cursor-not-allowed text-gray-400"
                                      : isWinner
                                      ? "bg-[var(--iberdrola-green)] font-bold text-white"
                                      : "hover:bg-gray-100"
                                  }`}
                                >
                                  {side.team?.flagUrl && (
                                    <img src={side.team.flagUrl} alt="" className="h-4 w-6 object-cover" />
                                  )}
                                  <span>{side.team?.name ?? side.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
          <AdminSectionHeader title="Preguntas extra" />
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6">
            {EXTRA_QUESTIONS.map((q) => {
              const realRow = realData?.officialExtraRows.find((r) => r.question_key === q.key);
              const isPending = !realRow || !realRow.official_value;
              return (
                <label key={q.key} className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-[var(--iberdrola-forest)]">
                    {q.icon} {EXTRA_QUESTION_LABELS[q.key] ?? q.key}
                    {isPending && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-700">
                        pendiente
                      </span>
                    )}
                  </span>
                  <input
                    type="text"
                    placeholder={isPending ? "Aún sin resultado real — escribe tu hipótesis" : undefined}
                    defaultValue={extraOverrides[q.key] ?? realRow?.official_value ?? ""}
                    onBlur={(e) =>
                      setExtraOverrides((prev) => ({ ...prev, [q.key]: e.target.value }))
                    }
                    className="rounded-lg border border-gray-300 px-2 py-1.5"
                  />
                </label>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
          <AdminSectionHeader title="Resultados de grupo (avanzado)" />
          <div className="p-4 sm:p-6">
            <button
              onClick={() => setShowGroupOverrides((v) => !v)}
              className="text-sm font-semibold text-[var(--iberdrola-green)] underline"
            >
              {showGroupOverrides ? "Ocultar" : "Mostrar"} — cambiar también resultados de fase de grupos
            </button>
            {showGroupOverrides && (
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {initialMatches.filter((m) => m.stage === "group").map((m) => {
                  const home = teamById(m.homeTeamId);
                  const away = teamById(m.awayTeamId);
                  const real = realData?.officialGroupRows.find((r) => r.match_id === m.id);
                  const override = groupOverrides[m.id];
                  const homeVal = override?.homeGoals ?? real?.home_goals ?? "";
                  const awayVal = override?.awayGoals ?? real?.away_goals ?? "";
                  return (
                    <div key={m.id} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2 text-sm">
                      <span className="flex-1 truncate">{home?.name ?? "?"}</span>
                      <input
                        type="number"
                        min={0}
                        defaultValue={homeVal}
                        onBlur={(e) =>
                          setGroupOverrides((prev) => ({
                            ...prev,
                            [m.id]: {
                              homeGoals: e.target.value === "" ? null : Number(e.target.value),
                              awayGoals: prev[m.id]?.awayGoals ?? (typeof awayVal === "number" ? awayVal : null),
                            },
                          }))
                        }
                        className="w-14 rounded border border-gray-300 px-1 py-0.5 text-center"
                      />
                      <span>-</span>
                      <input
                        type="number"
                        min={0}
                        defaultValue={awayVal}
                        onBlur={(e) =>
                          setGroupOverrides((prev) => ({
                            ...prev,
                            [m.id]: {
                              homeGoals: prev[m.id]?.homeGoals ?? (typeof homeVal === "number" ? homeVal : null),
                              awayGoals: e.target.value === "" ? null : Number(e.target.value),
                            },
                          }))
                        }
                        className="w-14 rounded border border-gray-300 px-1 py-0.5 text-center"
                      />
                      <span className="flex-1 truncate text-right">{away?.name ?? "?"}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {simLoading && (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-[var(--iberdrola-green)] border-t-transparent" />
          </div>
        )}

        {simResult && !simLoading && (
          <section>
            <h2 className="mb-2 text-lg font-bold text-[var(--iberdrola-forest)]">Clasificación simulada</h2>
            <StandingsTable days={simResult.days} standings={simResult.standings as never} locale="es" />
          </section>
        )}

        {!poolId && (
          <div className="rounded-2xl border border-dashed border-[var(--iberdrola-green-mid)] bg-white p-12 text-center text-[var(--iberdrola-forest)]/50">
            Selecciona un pool para simular su clasificación
          </div>
        )}
      </main>
    </div>
  );
}
