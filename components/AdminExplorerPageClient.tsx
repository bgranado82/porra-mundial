"use client";

import { useEffect, useState } from "react";
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

const FILTER_OPTIONS = [
  { key: "champion", label: "🏆 Campeón", isExtra: false },
  ...EXTRA_QUESTIONS.map((q) => ({
    key: q.key,
    label: `${q.icon ?? "✨"} ${q.key.replace(/_/g, " ")}`,
    isExtra: true,
  })),
];

const QUESTION_LABELS: Record<string, string> = {
  first_goal_scorer_world: "Primer goleador del Mundial",
  first_goal_scorer_spain: "Primer goleador de España",
  golden_boot: "Bota de Oro",
  golden_ball: "Balón de Oro",
  best_young_player: "Mejor jugador joven",
  golden_glove: "Guante de Oro",
  top_spanish_scorer: "Máximo goleador español",
  champion: "Campeón",
};

export default function AdminExplorerPageClient() {
  const supabase = createClient();
  const [poolId, setPoolId] = useState("");
  const [filterKey, setFilterKey] = useState("champion");
  const [results, setResults] = useState<EntryResult[]>([]);
  const [grouped, setGrouped] = useState<Record<string, EntryResult[]>>({} as Record<string, EntryResult[]>);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (!poolId) { setResults([]); setGrouped({}); return; }
    setLoading(true);
    loadData();
  }, [poolId, filterKey]);

  async function loadData() {
    setLoading(true);

    // Get entries for this pool
    const { data: entries } = await supabase
      .from("entries")
      .select("id, name, email")
      .eq("pool_id", poolId)
      .eq("status", "submitted");

    if (!entries || entries.length === 0) {
      setResults([]);
      setGrouped({});
      setLoading(false);
      return;
    }

    const entryIds = entries.map((e: any) => e.id);
    const entryMap = new Map(entries.map((e: any) => [String(e.id), e]));

    let rows: EntryResult[] = [];

    if (filterKey === "champion") {
      // Champion = picked_team_id for match "final-1"
      const { data: preds } = await supabase
        .from("entry_knockout_predictions")
        .select("entry_id, picked_team_id")
        .in("entry_id", entryIds)
        .eq("match_id", "final-1");

      rows = (preds ?? []).map((p: any) => {
        const entry = entryMap.get(String(p.entry_id)) as any;
        const team = teams.find((t) => t.id === p.picked_team_id);
        return {
          entry_id: String(p.entry_id),
          name: entry?.name || entry?.email || "–",
          email: entry?.email || "",
          value: team ? `${team.flagUrl ? "" : ""}${team.name}` : (p.picked_team_id ?? "–"),
        };
      }).filter((r: EntryResult) => r.value !== "–" && r.value !== "");
    } else {
      // Extra question
      const { data: preds } = await supabase
        .from("entry_extra_predictions")
        .select("entry_id, predicted_value")
        .in("entry_id", entryIds)
        .eq("question_key", filterKey);

      rows = (preds ?? [])
        .filter((p: any) => p.predicted_value?.trim())
        .map((p: any) => {
          const entry = entryMap.get(String(p.entry_id)) as any;
          return {
            entry_id: String(p.entry_id),
            name: entry?.name || entry?.email || "–",
            email: entry?.email || "",
            value: p.predicted_value ?? "",
          };
        });
    }

    // Group by value
    const grouped: Record<string, EntryResult[]> = {};
    rows.forEach((r) => {
      const key = r.value;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    // Sort groups by count desc
    const sortedGrouped: Record<string, EntryResult[]> = {};
    Object.entries(grouped)
      .sort((a, b) => (b[1] as EntryResult[]).length - (a[1] as EntryResult[]).length)
      .forEach(([k, v]) => { sortedGrouped[k] = v as EntryResult[]; });

    setResults(rows);
    setGrouped(sortedGrouped);
    setLoading(false);
  }

  const filteredGrouped = searchValue.trim()
    ? Object.fromEntries(
        Object.entries(grouped).filter(([key]) =>
          key.toLowerCase().includes(searchValue.toLowerCase())
        )
      )
    : grouped;

  const totalWithAnswer = results.length;

  return (
    <div className="min-h-screen bg-[var(--iberdrola-green-light)]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <AdminNav />

        {/* Header */}
        <div className="mt-6 rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-lg font-bold text-[var(--iberdrola-forest)]">🔎 Explorador de predicciones</h1>
              <p className="text-sm text-[var(--iberdrola-forest)]/60">Filtra por pool, categoría y valor para ver quién puso qué</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <AdminPoolSelector selectedPoolId={poolId} onChange={(id) => { setPoolId(id); setSearchValue(""); }} />
              <select
                value={filterKey}
                onChange={(e: { target: { value: string } }) => { setFilterKey(e.target.value); setSearchValue(""); }}
                className="rounded-xl border border-[var(--iberdrola-green-mid)] bg-white px-4 py-2 text-sm font-semibold text-[var(--iberdrola-forest)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)]"
              >
                {FILTER_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {QUESTION_LABELS[o.key] ?? o.label}
                  </option>
                ))}
              </select>
              {poolId && totalWithAnswer > 0 && (
                <span className="rounded-full bg-[var(--iberdrola-green-light)] px-3 py-1 text-xs font-semibold text-[var(--iberdrola-forest)]">
                  {totalWithAnswer} respuestas
                </span>
              )}
            </div>
          </div>
        </div>

        {/* No pool selected */}
        {!poolId && (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--iberdrola-green-mid)] bg-white p-12 text-center text-[var(--iberdrola-forest)]/50">
            Selecciona un pool para explorar predicciones
          </div>
        )}

        {/* Loading */}
        {loading && poolId && (
          <div className="mt-8 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--iberdrola-green)] border-t-transparent" />
          </div>
        )}

        {/* Results */}
        {!loading && poolId && Object.keys(grouped).length > 0 && (
          <div className="mt-6 space-y-4">
            {/* Search filter */}
            <input
              type="text"
              value={searchValue}
              onChange={(e: { target: { value: string } }) => setSearchValue(e.target.value)}
              placeholder={`Buscar en "${QUESTION_LABELS[filterKey] ?? filterKey}"...`}
              className="w-full rounded-xl border border-[var(--iberdrola-green-mid)] bg-white px-4 py-2 text-sm text-[var(--iberdrola-forest)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)]"
            />

            {Object.entries(filteredGrouped).map(([value, groupEntries]) => {
              const team = filterKey === "champion"
                ? teams.find((t) => t.name === value)
                : null;

              return (
                <div
                  key={value}
                  className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm overflow-hidden"
                >
                  {/* Group header */}
                  <div className="flex items-center justify-between border-b border-[var(--iberdrola-green-mid)]/40 bg-[var(--iberdrola-green-light)] px-5 py-3">
                    <div className="flex items-center gap-2">
                      {team?.flagUrl && (
                        <img src={team.flagUrl} alt="" className="h-5 w-7 rounded-sm object-cover shadow-sm" />
                      )}
                      <span className="font-bold text-[var(--iberdrola-forest)]">{value}</span>
                    </div>
                    <span className="rounded-full bg-[var(--iberdrola-green)] px-3 py-0.5 text-xs font-bold text-white">
                      {(groupEntries as EntryResult[]).length} {(groupEntries as EntryResult[]).length === 1 ? "participante" : "participantes"}
                    </span>
                  </div>

                  {/* Participants list */}
                  <div className="divide-y divide-gray-50">
                    {(groupEntries as EntryResult[]).map((e: EntryResult) => (
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

        {/* No answers */}
        {!loading && poolId && Object.keys(grouped).length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--iberdrola-green-mid)] bg-white p-12 text-center text-[var(--iberdrola-forest)]/50">
            Nadie ha respondido esta pregunta en este pool todavía
          </div>
        )}
      </div>
    </div>
  );
}
