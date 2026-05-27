"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminSectionHeader from "@/components/AdminSectionHeader";
import AdminPoolSelector from "@/components/AdminPoolSelector";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";

type EntryResult = { entry_id: string; name: string; email: string; value: string };
type GroupedResult = { value: string; entries: EntryResult[]; flagUrl: string | null };

const QUESTION_LABELS: Record<string, string> = {
  champion: "🏆 Campeón",
  first_goal_scorer_world: "🥇⚽ Primer goleador del Mundial",
  first_goal_scorer_spain: "🥇⚽ Primer goleador de España",
  golden_boot: "👟✨ Bota de Oro",
  golden_ball: "🏆🌟 Balón de Oro",
  best_young_player: "🧒🔥 Mejor jugador joven",
  golden_glove: "🧤🥇 Guante de Oro",
  top_spanish_scorer: "🎯 Máximo goleador español",
};

const FILTER_KEYS = ["champion", ...EXTRA_QUESTIONS.map((q) => q.key)];

export default function AdminExplorerPageClient() {
  const [poolId, setPoolId] = useState("");
  const [filterKey, setFilterKey] = useState("champion");
  const [results, setResults] = useState<GroupedResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (!poolId) { setResults([]); setTotal(0); return; }
    loadData();
  }, [poolId, filterKey]);

  async function loadData() {
    setLoading(true);
    setError(null);
    setResults([]);
    setSearchValue("");

    const res = await fetch(`/api/admin/explorer?poolId=${poolId}&filterKey=${filterKey}`);
    const data = await res.json();

    if (!res.ok) { setError(data.error ?? "Error cargando datos"); setLoading(false); return; }

    setResults(data.results ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }

  const filteredResults = useMemo(() => {
    if (!searchValue.trim()) return results;
    return results.filter((g: GroupedResult) =>
      g.value.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [results, searchValue]);

  return (
    <div className="min-h-screen bg-[var(--iberdrola-green-light)]">
      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">

        <AdminPageHeader
          title="Explorador"
          icon="🔎"
          description="Filtra por campeón o extra y mira quién ha puesto cada respuesta."
        />

        <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
          <AdminSectionHeader title="Filtros" />
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Pool</label>
                <AdminPoolSelector selectedPoolId={poolId} onChange={(id) => { setPoolId(id); setSearchValue(""); }} className="w-full" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Categoría</label>
                <select
                  value={filterKey}
                  onChange={(e: { target: { value: string } }) => { setFilterKey(e.target.value); setSearchValue(""); }}
                  className="w-full rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--iberdrola-forest)] focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)]"
                >
                  {FILTER_KEYS.map((key) => (
                    <option key={key} value={key}>{QUESTION_LABELS[key] ?? key}</option>
                  ))}
                </select>
              </div>
            </div>
            {poolId && total > 0 && !loading && (
              <p className="mt-3 text-sm text-[var(--iberdrola-forest)]/60">
                <span className="font-semibold text-[var(--iberdrola-forest)]">{total}</span> respuestas ·{" "}
                <span className="font-semibold text-[var(--iberdrola-forest)]">{results.length}</span> valores distintos
              </p>
            )}
          </div>
        </section>

        {!poolId && (
          <div className="rounded-2xl border border-dashed border-[var(--iberdrola-green-mid)] bg-white p-12 text-center text-sm text-[var(--iberdrola-forest)]/50">
            Selecciona un pool para explorar predicciones
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--iberdrola-green)] border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {!loading && poolId && results.length > 0 && (
          <div className="space-y-3">
            <input
              type="text"
              value={searchValue}
              onChange={(e: { target: { value: string } }) => setSearchValue(e.target.value)}
              placeholder={`Buscar en "${QUESTION_LABELS[filterKey] ?? filterKey}"...`}
              className="w-full rounded-xl border border-[var(--iberdrola-green-mid)] bg-white px-4 py-2.5 text-sm text-[var(--iberdrola-forest)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)]"
            />

            {filteredResults.map((group: GroupedResult) => {
              const pct = Math.round((group.entries.length / total) * 100);
              return (
                <div key={group.value} className="overflow-hidden rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--iberdrola-green-mid)]/30 bg-[var(--iberdrola-green-light)] px-5 py-3">
                    <div className="flex items-center gap-2">
                      {group.flagUrl && <img src={group.flagUrl} alt="" className="h-5 w-7 rounded-sm object-cover shadow-sm" />}
                      <span className="font-bold text-[var(--iberdrola-forest)]">{group.value}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--iberdrola-forest)]/50">{pct}%</span>
                      <span className="rounded-full bg-[var(--iberdrola-green)] px-3 py-0.5 text-xs font-bold text-white">
                        {group.entries.length} {group.entries.length === 1 ? "participante" : "participantes"}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {group.entries.map((e: EntryResult) => (
                      <div key={e.entry_id} className="flex items-center justify-between px-5 py-2.5">
                        <span className="text-sm font-medium text-[var(--iberdrola-forest)]">{e.name}</span>
                        <span className="text-xs text-[var(--iberdrola-forest)]/50">{e.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredResults.length === 0 && (
              <div className="rounded-xl bg-white p-8 text-center text-sm text-[var(--iberdrola-forest)]/50">
                Sin resultados para "{searchValue}"
              </div>
            )}
          </div>
        )}

        {!loading && poolId && results.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-[var(--iberdrola-green-mid)] bg-white p-12 text-center text-sm text-[var(--iberdrola-forest)]/50">
            Nadie ha respondido esta pregunta en este pool todavía
          </div>
        )}

      </main>
    </div>
  );
}
