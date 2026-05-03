"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import AdminNav from "@/components/AdminNav";
import AdminPoolSelector from "@/components/AdminPoolSelector";
import { teams } from "@/data/teams";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";

type EntryResult = {
  entry_id: string;
  name: string;
  email: string;
  value: string;
};

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
  const supabase = useMemo(() => createClient(), []);
  const [poolId, setPoolId] = useState("");
  const [filterKey, setFilterKey] = useState("champion");
  const [grouped, setGrouped] = useState<Record<string, EntryResult[]>>({});
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (!poolId) { setGrouped({}); setTotalAnswers(0); return; }
    loadData();
  }, [poolId, filterKey]);

  async function loadData() {
    setLoading(true);
    setGrouped({});
    setSearchValue("");

    const { data: entries } = await supabase
      .from("entries")
      .select("id, name, email")
      .eq("pool_id", poolId)
      .eq("status", "submitted");

    if (!entries || entries.length === 0) {
      setLoading(false);
      return;
    }

    const entryIds = entries.map((e: any) => e.id);
    const entryMap = new Map<string, { name: string; email: string }>(entries.map((e: any) => [String(e.id), e as { name: string; email: string }]));

    let rows: EntryResult[] = [];

    if (filterKey === "champion") {
      const { data: preds } = await supabase
        .from("entry_knockout_predictions")
        .select("entry_id, picked_team_id")
        .in("entry_id", entryIds)
        .eq("match_id", "final-1");

      rows = (preds ?? [])
        .filter((p: any) => !!p.picked_team_id)
        .map((p: any): EntryResult => {
          const entry = entryMap.get(String(p.entry_id));
          const team = teams.find((t) => t.id === p.picked_team_id);
          return {
            entry_id: String(p.entry_id),
            name: entry?.name || entry?.email || "–",
            email: entry?.email || "",
            value: team?.name ?? p.picked_team_id,
          };
        });
    } else {
      const { data: preds } = await supabase
        .from("entry_extra_predictions")
        .select("entry_id, predicted_value")
        .in("entry_id", entryIds)
        .eq("question_key", filterKey);

      rows = (preds ?? [])
        .filter((p: any) => p.predicted_value?.trim())
        .map((p: any): EntryResult => {
          const entry = entryMap.get(String(p.entry_id));
          return {
            entry_id: String(p.entry_id),
            name: entry?.name || entry?.email || "–",
            email: entry?.email || "",
            value: (p.predicted_value as string).trim(),
          };
        });
    }

    const g: Record<string, EntryResult[]> = {};
    rows.forEach((r) => {
      if (!g[r.value]) g[r.value] = [];
      g[r.value].push(r);
    });
    const sorted: Record<string, EntryResult[]> = {};
    Object.entries(g)
      .sort(([, a], [, b]) => b.length - a.length)
      .forEach(([k, v]) => { sorted[k] = v; });

    setGrouped(sorted);
    setTotalAnswers(rows.length);
    setLoading(false);
  }

  const filteredGrouped = useMemo((): Record<string, EntryResult[]> => {
    if (!searchValue.trim()) return grouped;
    return Object.fromEntries(
      Object.entries(grouped).filter(([key]) =>
        key.toLowerCase().includes(searchValue.toLowerCase())
      )
    ) as Record<string, EntryResult[]>;
  }, [grouped, searchValue]);

  return (
    <div className="min-h-screen bg-[var(--iberdrola-green-light)]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <AdminNav />

        <div className="mt-6 rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white p-5 shadow-sm">
          <h1 className="mb-4 text-lg font-bold text-[var(--iberdrola-forest)]">🔎 Explorador de predicciones</h1>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Pool</label>
              <AdminPoolSelector
                selectedPoolId={poolId}
                onChange={(id) => { setPoolId(id); setSearchValue(""); }}
                className="w-full"
              />
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
          {poolId && totalAnswers > 0 && !loading && (
            <p className="mt-3 text-sm text-[var(--iberdrola-forest)]/60">
              <span className="font-semibold text-[var(--iberdrola-forest)]">{totalAnswers}</span> respuestas ·{" "}
              <span className="font-semibold text-[var(--iberdrola-forest)]">{Object.keys(grouped).length}</span> valores distintos
            </p>
          )}
        </div>

        {!poolId && (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--iberdrola-green-mid)] bg-white p-12 text-center text-sm text-[var(--iberdrola-forest)]/50">
            Selecciona un pool para explorar predicciones
          </div>
        )}

        {loading && (
          <div className="mt-8 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--iberdrola-green)] border-t-transparent" />
          </div>
        )}

        {!loading && poolId && Object.keys(grouped).length > 0 && (
          <div className="mt-6 space-y-3">
            <input
              type="text"
              value={searchValue}
              onChange={(e: { target: { value: string } }) => setSearchValue(e.target.value)}
              placeholder={`Buscar en "${QUESTION_LABELS[filterKey] ?? filterKey}"...`}
              className="w-full rounded-xl border border-[var(--iberdrola-green-mid)] bg-white px-4 py-2.5 text-sm text-[var(--iberdrola-forest)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)]"
            />

            {Object.entries(filteredGrouped).map(([value, ge]) => {
              const groupEntries = ge as EntryResult[];
              const team = filterKey === "champion" ? teams.find((t) => t.name === value) : null;
              const pct = Math.round((groupEntries.length / totalAnswers) * 100);
              return (
                <div key={value} className="overflow-hidden rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--iberdrola-green-mid)]/30 bg-[var(--iberdrola-green-light)] px-5 py-3">
                    <div className="flex items-center gap-2">
                      {team?.flagUrl && <img src={team.flagUrl} alt="" className="h-5 w-7 rounded-sm object-cover shadow-sm" />}
                      <span className="font-bold text-[var(--iberdrola-forest)]">{value}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--iberdrola-forest)]/50">{pct}%</span>
                      <span className="rounded-full bg-[var(--iberdrola-green)] px-3 py-0.5 text-xs font-bold text-white">
                        {groupEntries.length} {groupEntries.length === 1 ? "participante" : "participantes"}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {groupEntries.map((e) => (
                      <div key={e.entry_id} className="flex items-center justify-between px-5 py-2.5">
                        <span className="text-sm font-medium text-[var(--iberdrola-forest)]">{e.name}</span>
                        <span className="text-xs text-[var(--iberdrola-forest)]/50">{e.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {Object.keys(filteredGrouped).length === 0 && (
              <div className="rounded-xl bg-white p-8 text-center text-sm text-[var(--iberdrola-forest)]/50">
                Sin resultados para "{searchValue}"
              </div>
            )}
          </div>
        )}

        {!loading && poolId && Object.keys(grouped).length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--iberdrola-green-mid)] bg-white p-12 text-center text-sm text-[var(--iberdrola-forest)]/50">
            Nadie ha respondido esta pregunta en este pool todavía
          </div>
        )}
      </div>
    </div>
  );
}
