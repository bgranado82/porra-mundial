"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Locale, messages } from "@/lib/i18n";

const LOCALE_KEY = "porra-mundial-locale";

type EntryResult = { entry_id: string; name: string; email: string; value: string };
type GroupedResult = { value: string; entries: EntryResult[]; flagUrl: string | null };

const QUESTION_KEYS = ["champion", ...EXTRA_QUESTIONS.map((q) => q.key)];

type Props = {
  poolId: string;
  poolSlug: string;
  entryId: string;
  backHref: string;
};

export default function ExplorerPageClient({ poolId, poolSlug, entryId, backHref }: Props) {
  const [locale, setLocale] = useState<Locale>("es");
  const [filterKey, setFilterKey] = useState("champion");
  const [results, setResults] = useState<GroupedResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const t = messages[locale];

  const QUESTION_LABELS: Record<string, string> = {
    champion: `🏆 ${t.champion}`,
    first_goal_scorer_world: `🥇⚽ ${t.extras.first_goal_scorer_world}`,
    first_goal_scorer_spain: `🥇⚽ ${t.extras.first_goal_scorer_spain}`,
    golden_boot: `👟✨ ${t.extras.golden_boot}`,
    golden_ball: `🏆🌟 ${t.extras.golden_ball}`,
    best_young_player: `🧒🔥 ${t.extras.best_young_player}`,
    golden_glove: `🧤🥇 ${t.extras.golden_glove}`,
    top_spanish_scorer: `🎯 ${t.extras.top_spanish_scorer}`,
  };

  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_KEY) as Locale | null;
    if (saved && ["es", "en", "pt"].includes(saved)) setLocale(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    if (!poolId) return;
    loadData();
  }, [poolId, filterKey]);

  async function loadData() {
    setLoading(true);
    setError(null);
    setResults([]);
    setSearchValue("");
    try {
      const res = await fetch(`/api/explorer?poolId=${poolId}&filterKey=${filterKey}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error"); setLoading(false); return; }
      setResults(data.results ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError("Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  const filteredResults = useMemo(() => {
    if (!searchValue.trim()) return results;
    return results.filter((g) =>
      g.value.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [results, searchValue]);

  return (
    <main className="page-bg">
      <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-6">

        {/* HEADER */}
        <section className="rounded-3xl card-glass p-5 shadow-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <img src="/icon-512.png" alt="Porra Mundial 2026" className="h-12 w-12 rounded-xl object-contain sm:h-14 sm:w-14" />
              <div>
                <h1 className="text-2xl font-bold text-[var(--iberdrola-forest)]">
                  {t.stats.viewExplorer}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Consulta quién apostó por cada resultado
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <LanguageSwitcher locale={locale} onChange={setLocale} label={t.language} />
              <div className="flex flex-wrap gap-2">
                <Link
                  href={poolId && poolSlug && entryId ? `/stats?poolId=${poolId}&poolSlug=${poolSlug}&entryId=${entryId}` : `/stats?poolId=${poolId}`}
                  className="rounded-2xl border border-[var(--iberdrola-green)]/40 bg-white/80 px-3 py-2 text-xs font-bold text-[var(--iberdrola-forest)] transition hover:border-[var(--iberdrola-green)] hover:bg-white"
                >
                  {t.banquillo.backToStats}
                </Link>
                <Link
                  href={poolId && poolSlug && entryId ? `/standings?poolId=${poolId}&poolSlug=${poolSlug}&entryId=${entryId}` : `/standings?poolId=${poolId}`}
                  className="rounded-2xl border border-[var(--iberdrola-green)]/40 bg-white/80 px-3 py-2 text-xs font-bold text-[var(--iberdrola-forest)] transition hover:border-[var(--iberdrola-green)] hover:bg-white"
                >
                  {t.stats.viewStandings}
                </Link>
                <Link
                  href={poolId && poolSlug && entryId ? `/transparency?poolId=${poolId}&poolSlug=${poolSlug}&entryId=${entryId}` : `/transparency?poolId=${poolId}`}
                  className="rounded-2xl border border-[var(--iberdrola-green)]/40 bg-white/80 px-3 py-2 text-xs font-bold text-[var(--iberdrola-forest)] transition hover:border-[var(--iberdrola-green)] hover:bg-white"
                >
                  {t.stats.viewTransparency}
                </Link>
                <Link
                  href={poolSlug && entryId ? `/banquillo?poolId=${poolId}&poolSlug=${poolSlug}&entryId=${entryId}` : `/banquillo`}
                  className="rounded-2xl bg-[var(--iberdrola-green)] px-3 py-2 text-xs font-black text-white shadow-sm transition hover:brightness-110"
                >
                  {t.banquillo.title}
                </Link>
                <Link
                  href={backHref}
                  className="rounded-2xl bg-[var(--iberdrola-green)] px-3 py-2 text-xs font-black text-white shadow-sm transition hover:brightness-110"
                >
                  {t.stats.backToPrediction}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SELECTOR CATEGORÍA */}
        <section className="rounded-3xl card-glass p-5 shadow-sm">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
            Categoría
          </label>
          <select
            value={filterKey}
            onChange={(e) => { setFilterKey(e.target.value); setSearchValue(""); }}
            className="w-full rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--iberdrola-forest)] focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)]"
          >
            {QUESTION_KEYS.map((key) => (
              <option key={key} value={key}>{QUESTION_LABELS[key] ?? key}</option>
            ))}
          </select>
          {total > 0 && !loading && (
            <p className="mt-3 text-sm text-[var(--iberdrola-forest)]/60">
              <span className="font-semibold text-[var(--iberdrola-forest)]">{total}</span> respuestas ·{" "}
              <span className="font-semibold text-[var(--iberdrola-forest)]">{results.length}</span> valores distintos
            </p>
          )}
        </section>

        {/* LOADING */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--iberdrola-green)] border-t-transparent" />
          </div>
        )}

        {/* ERROR */}
        {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {/* RESULTADOS */}
        {!loading && results.length > 0 && (
          <div className="space-y-3">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={`Buscar en "${QUESTION_LABELS[filterKey] ?? filterKey}"...`}
              className="w-full rounded-xl border border-[var(--iberdrola-green-mid)] bg-white px-4 py-2.5 text-sm text-[var(--iberdrola-forest)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)]"
            />

            {filteredResults.map((group) => {
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
                    {group.entries.map((e) => (
                      <div key={e.entry_id} className="px-5 py-2.5">
                        <span className="text-sm font-medium text-[var(--iberdrola-forest)]">{e.name}</span>
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

        {!loading && !error && results.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--iberdrola-green-mid)] bg-white p-12 text-center text-sm text-[var(--iberdrola-forest)]/50">
            Nadie ha respondido esta pregunta todavía
          </div>
        )}

      </div>
    </main>
  );
}
