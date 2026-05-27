"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import AdminNav from "@/components/AdminNav";
import AdminPoolSelector from "@/components/AdminPoolSelector";
import { teams } from "@/data/teams";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";
import { HALL_OF_FAME, HallOfFameEntry } from "@/data/settings";

type StatsResponse = {
  summary: {
    poolId: string;
    poolName: string;
    participants: number;
    countries: number;
    potTotal: number;
    loserRefund: number;
    firstPrize: number;
    secondPrize: number;
    thirdPrize: number;
  };
  champion: {
    total: number;
    items: Array<{
      key: string;
      label: string;
      count: number;
      percentage: number;
      teamId?: string | null;
      flagUrl?: string | null;
    }>;
  };
  extras: Array<{
    questionKey: string;
    title: string;
    total: number;
    items: Array<{
      key: string;
      label: string;
      count: number;
      percentage: number;
    }>;
  }>;
  insights: string[];
};

const CHART_COLORS = ["#00A443", "#6CC24A", "#009CDE", "#78BE20", "#A7D46F", "#B0BEC5"];
const NO_ANSWER_KEY = "__no_answer__";
const NO_ANSWER_COLOR = "#D1D5DB";

// Admin solo va en español. Separador "." explícito para evitar el NBSP que
// toLocaleString("es-ES") inserta y que con font-black grande se ve invisible.
function formatEuro(value: number) {
  const formatted = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted}€`;
}

// ─── KPI CARD ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white p-6 shadow-sm text-center">
      <span className="text-2xl leading-none mb-2">{icon}</span>
      <div className="text-5xl font-black tracking-tight text-[var(--iberdrola-forest)] leading-none">{value}</div>
      <div className="mt-2 text-[11px] font-bold uppercase tracking-widest text-[var(--iberdrola-forest)]/50">{label}</div>
      <div className="absolute bottom-0 left-0 h-1 w-full rounded-b-3xl bg-gradient-to-r from-[var(--iberdrola-green)] to-[var(--iberdrola-sky)]" />
    </div>
  );
}

// ─── HALL OF FAME CARD (Admin) ────────────────────────────────────────────────
function HallOfFameCard({ entries }: { entries: HallOfFameEntry[] }) {
  const sorted = [...entries].sort((a, b) => b.year - a.year);
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[var(--iberdrola-forest)] p-5 shadow-md">
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-amber-400 opacity-15 blur-2xl" />
      <div className="relative">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/40">🎖️ Cuadro de Honor</div>
        <div className="space-y-0">
          {sorted.map((entry, i) => {
            const tournamentLabel = entry.tournament === "Euro" ? "Eurocopa" : "Mundial";
            const tournamentIcon = entry.tournament === "Euro" ? "⭐" : "⚽";
            return (
              <div key={`${entry.tournament}-${entry.year}`} className={`flex items-center gap-2.5 py-2 ${i > 0 ? "border-t border-white/10" : ""}`}>
                <span className="w-10 shrink-0 text-[11px] font-black text-white/40 tabular-nums">{entry.year}</span>
                <span className="shrink-0 text-[10px]">{tournamentIcon}</span>
                <span className="w-16 shrink-0 text-[9px] font-black uppercase tracking-wider text-white/40">{tournamentLabel}</span>
                <img src="https://flagcdn.com/w20/es.webp" alt="es" className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover shadow-sm" />
                <span className="truncate text-xs font-bold text-white">{entry.winner}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-1 w-full rounded-b-3xl bg-gradient-to-r from-amber-400 to-yellow-300" />
    </div>
  );
}

// ─── PRIZES CARD ─────────────────────────────────────────────────────────────
function PrizesCard({ loserRefund, firstPrize, secondPrize, thirdPrize, potTotal }: {
  loserRefund: number; firstPrize: number; secondPrize: number; thirdPrize: number; potTotal: number;
}) {
  const prizes = [
    { emoji: "🥇", label: "1er Premio", amount: firstPrize, highlight: true },
    { emoji: "🥈", label: "2º Premio", amount: secondPrize, highlight: false },
    { emoji: "🥉", label: "3er Premio", amount: thirdPrize, highlight: false },
    { emoji: "🔙", label: "Último (devolución)", amount: loserRefund, highlight: false },
  ].filter((p) => p.amount > 0);
  return (
    <div className="relative flex flex-col justify-center overflow-hidden rounded-3xl bg-[var(--iberdrola-forest)] p-6 shadow-md">
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[var(--iberdrola-green)] opacity-15 blur-2xl" />
      <div className="relative flex flex-col items-center text-center">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-white/40">Bote total</div>
        <div className="text-5xl font-black text-white leading-none">{formatEuro(potTotal)}</div>
        <div className="mt-5 w-full space-y-2.5">
          {prizes.map((p) => (
            <div key={p.label} className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${p.highlight ? "text-white" : "text-white/60"}`}>{p.emoji} {p.label}</span>
              <span className={`text-sm font-black ${p.highlight ? "text-[var(--iberdrola-green)]" : "text-white/70"}`}>{formatEuro(p.amount)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-1 w-full rounded-b-3xl bg-gradient-to-r from-[var(--iberdrola-green)] to-[var(--iberdrola-sky)]" />
    </div>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
function SectionHeader({ title, icon, flagImg }: { title: string; icon?: string; flagImg?: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
      {icon && <span className="text-xl leading-none">{icon}</span>}
      {flagImg && <img src={flagImg} alt="" className="h-5 w-7 rounded-[3px] border border-gray-200 object-cover shadow-sm" />}
      <span className="text-base font-black text-[var(--iberdrola-forest)]">{title}</span>
    </div>
  );
}

// ─── CHAMPION DONUT ───────────────────────────────────────────────────────────
function ChampionDonutCard({ items }: { items: StatsResponse["champion"]["items"] }) {
  const topItems = items.filter((i) => i.key !== NO_ANSWER_KEY).slice(0, 5);
  const otherItems = items.filter((i) => i.key !== NO_ANSWER_KEY).slice(5);
  const noAnswer = items.find((i) => i.key === NO_ANSWER_KEY);
  const othersCount = otherItems.reduce((s, i) => s + i.count, 0);
  const othersPercentage = otherItems.reduce((s, i) => s + i.percentage, 0);
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const chartData = [
    ...topItems.map((item, idx) => ({
      name: item.label,
      value: item.count,
      color: CHART_COLORS[idx % CHART_COLORS.length],
      flagUrl: item.flagUrl ?? teamMap.get(item.teamId ?? "")?.flagUrl ?? null,
    })),
    ...(othersCount > 0 ? [{ name: "Otros", value: othersCount, color: CHART_COLORS[5], flagUrl: null }] : []),
    ...(noAnswer ? [{ name: "Sin respuesta", value: noAnswer.count, color: NO_ANSWER_COLOR, flagUrl: null }] : []),
  ];

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
        <SectionHeader title="🏆 Campeón favorito" />
        <div className="p-8 text-center text-sm text-[var(--iberdrola-forest)]/45">Sin datos suficientes</div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
      <SectionHeader title="🏆 Campeón favorito" />
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
        <div className="h-48 w-full lg:h-56 lg:w-56 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" dataKey="value" paddingAngle={2}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} votos`]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {topItems.map((item, idx) => {
            const flagUrl = item.flagUrl ?? teamMap.get(item.teamId ?? "")?.flagUrl ?? null;
            return (
              <div key={item.key} className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full shrink-0" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                {flagUrl && <img src={flagUrl} alt="" className="h-4 w-6 rounded-[2px] border border-gray-200 object-cover shrink-0" />}
                <span className="flex-1 text-sm font-semibold text-[var(--iberdrola-forest)] truncate">{item.label}</span>
                <span className="text-sm font-black text-[var(--iberdrola-forest)]">{item.count}</span>
                <span className="w-12 text-right text-xs text-[var(--iberdrola-forest)]/50">{item.percentage.toFixed(1)}%</span>
              </div>
            );
          })}
          {othersCount > 0 && (
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full shrink-0" style={{ background: CHART_COLORS[5] }} />
              <span className="flex-1 text-sm text-[var(--iberdrola-forest)]/60">Otros</span>
              <span className="text-sm font-black text-[var(--iberdrola-forest)]">{othersCount}</span>
              <span className="w-12 text-right text-xs text-[var(--iberdrola-forest)]/50">{othersPercentage.toFixed(1)}%</span>
            </div>
          )}
          {noAnswer && noAnswer.count > 0 && (
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full shrink-0" style={{ background: NO_ANSWER_COLOR }} />
              <span className="flex-1 text-sm text-[var(--iberdrola-forest)]/40">Sin respuesta</span>
              <span className="text-sm font-black text-[var(--iberdrola-forest)]/40">{noAnswer.count}</span>
              <span className="w-12 text-right text-xs text-[var(--iberdrola-forest)]/30">{noAnswer.percentage.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EXTRA BAR CARD ───────────────────────────────────────────────────────────
function ExtraBarCard({ title, icon, flagImg, items }: {
  title: string; icon?: string; flagImg?: string;
  items: Array<{ key: string; label: string; count: number; percentage: number }>;
}) {
  const real = items.filter((i) => i.key !== NO_ANSWER_KEY);
  // El gráfico muestra el top 6 (legibilidad). La lista de abajo muestra TODOS.
  const visible = real.slice(0, 6);
  return (
    <div className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
      <SectionHeader title={title} icon={icon} flagImg={flagImg} />
      <div className="p-5">
        {visible.length === 0 ? (
          <div className="py-6 text-center text-sm text-[var(--iberdrola-forest)]/45">Sin datos</div>
        ) : (
          <>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visible} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 11, fill: "#1a3a2a" }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => [`${v} votos`]} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {visible.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <FullPickList items={real} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── EXTRA LIST CARD ──────────────────────────────────────────────────────────
function ExtraListCard({ title, icon, items }: {
  title: string; icon?: string;
  items: Array<{ key: string; label: string; count: number; percentage: number }>;
}) {
  const real = items.filter((i) => i.key !== NO_ANSWER_KEY);
  // Admin: top 8 con barra de % + lista completa scrollable debajo para normalizar.
  const visible = real.slice(0, 8);
  return (
    <div className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
      <SectionHeader title={title} icon={icon} />
      <div className="divide-y divide-gray-50 p-2">
        {visible.length === 0 ? (
          <div className="py-6 text-center text-sm text-[var(--iberdrola-forest)]/45">Sin datos</div>
        ) : (
          visible.map((item, idx) => (
            <div key={item.key} className="flex items-center gap-3 px-3 py-2.5">
              <span className="w-5 shrink-0 text-center text-xs font-black text-[var(--iberdrola-forest)]/30">{idx + 1}</span>
              <span className="flex-1 text-sm font-semibold text-[var(--iberdrola-forest)] truncate">{item.label}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-[var(--iberdrola-green)]" style={{ width: `${Math.min(item.percentage, 100)}%` }} />
                </div>
                <span className="w-10 text-right text-xs font-black text-[var(--iberdrola-forest)]">{item.percentage.toFixed(1)}%</span>
              </div>
            </div>
          ))
        )}
      </div>
      {real.length > 0 && <div className="px-2 pb-2"><FullPickList items={real} /></div>}
    </div>
  );
}

// ─── FULL PICK LIST (solo admin) ──────────────────────────────────────────────
// Lista de TODAS las variantes escritas para un extra, ordenadas por nº de votos.
// Resalta los picks con 1 voto: son los candidatos típicos a normalizar.
function FullPickList({ items }: {
  items: Array<{ key: string; label: string; count: number; percentage: number }>;
}) {
  const [open, setOpen] = useState(false);
  const distinct = items.length;
  const toNormalize = items.filter((i) => i.count === 1).length;

  if (distinct <= 6) return null; // si caben en el gráfico, no hace falta la lista

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl bg-[var(--iberdrola-green-light)] px-3 py-2 text-left"
      >
        <span className="text-xs font-bold text-[var(--iberdrola-forest)]">
          Ver las {distinct} variantes
          {toNormalize > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
              {toNormalize} con 1 voto
            </span>
          )}
        </span>
        <span className="text-xs font-black text-[var(--iberdrola-forest)]/50">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-2 max-h-64 space-y-0.5 overflow-y-auto rounded-xl border border-gray-100 p-1">
          {items.map((item) => (
            <div
              key={item.key}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${item.count === 1 ? "bg-amber-50" : ""}`}
            >
              <span className="flex-1 truncate text-xs font-medium text-[var(--iberdrola-forest)]">{item.label}</span>
              <span className="shrink-0 text-[10px] text-[var(--iberdrola-forest)]/45">{item.percentage.toFixed(1)}%</span>
              <span className="w-7 shrink-0 text-right text-xs font-black text-[var(--iberdrola-forest)] tabular-nums">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── INSIGHTS CARD ────────────────────────────────────────────────────────────
function InsightsCard({ items }: { items: string[] }) {
  const icons = ["💡", "🔥", "📊", "🎯"];
  if (items.length === 0) return null;
  return (
    <div className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
      <SectionHeader title="Insights" icon="💡" />
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-[var(--iberdrola-green-light)] to-white p-4 border border-[var(--iberdrola-green)]/10">
            <span className="mt-0.5 shrink-0 text-lg leading-none">{icons[idx % icons.length]}</span>
            <p className="text-sm font-semibold leading-relaxed text-[var(--iberdrola-forest)]/80">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminStatsPageClient() {
  const [poolId, setPoolId] = useState("");
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!poolId) { setData(null); return; }
    setLoading(true);
    setError(null);
    fetch(`/api/pool-stats?poolId=${poolId}&locale=es&full=1`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Error cargando estadísticas"); setLoading(false); });
  }, [poolId]);

  const extraMap = useMemo(() => {
    const map = new Map<string, StatsResponse["extras"][number]>();
    (data?.extras ?? []).forEach((item) => map.set(item.questionKey, item));
    return map;
  }, [data]);

  return (
    <div className="min-h-screen bg-[var(--iberdrola-green-light)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        <AdminNav />

        {/* Pool selector */}
        <div className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white p-5 shadow-sm">
          <h1 className="mb-4 text-lg font-bold text-[var(--iberdrola-forest)]">📈 Estadísticas</h1>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Pool</label>
            <AdminPoolSelector selectedPoolId={poolId} onChange={setPoolId} className="w-full sm:w-72" />
          </div>
        </div>

        {/* Empty state */}
        {!poolId && (
          <div className="rounded-2xl border border-dashed border-[var(--iberdrola-green-mid)] bg-white p-12 text-center text-[var(--iberdrola-forest)]/50">
            Selecciona un pool para ver las estadísticas
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--iberdrola-green)] border-t-transparent" />
          </div>
        )}

        {/* Error */}
        {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {/* Stats */}
        {data && !loading && (
          <>
            {/* KPIs + Premios */}
            <section className="grid gap-4 md:grid-cols-3">
              {/* Card 1: Cuadro de Honor */}
              {(() => {
                const hof = HALL_OF_FAME.find((h) => h.poolId === poolId);
                return hof ? <HallOfFameCard entries={hof.entries} /> : <div className="hidden md:block" />;
              })()}
              {/* Card 2: Participantes + Países */}
              <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white p-6 shadow-sm text-center gap-4">
                <div className="flex w-full justify-around">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl leading-none mb-1">👥</span>
                    <div className="text-5xl font-black tracking-tight text-[var(--iberdrola-forest)] leading-none">{data.summary.participants}</div>
                    <div className="mt-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--iberdrola-forest)]/50">Participantes</div>
                  </div>
                  <div className="w-px bg-[var(--iberdrola-forest)]/10 self-stretch" />
                  <div className="flex flex-col items-center">
                    <span className="text-2xl leading-none mb-1">🌍</span>
                    <div className="text-5xl font-black tracking-tight text-[var(--iberdrola-forest)] leading-none">{data.summary.countries}</div>
                    <div className="mt-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--iberdrola-forest)]/50">Países</div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 h-1 w-full rounded-b-3xl bg-gradient-to-r from-[var(--iberdrola-green)] to-[var(--iberdrola-sky)]" />
              </div>
              {/* Card 3: Premios */}
              <PrizesCard
                loserRefund={data.summary.loserRefund}
                firstPrize={data.summary.firstPrize}
                secondPrize={data.summary.secondPrize}
                thirdPrize={data.summary.thirdPrize}
                potTotal={data.summary.potTotal}
              />
            </section>

            {/* Campeón + Balón de Oro */}
            <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
              <ChampionDonutCard items={data.champion.items} />
              <ExtraListCard
                icon={EXTRA_QUESTIONS.find((q) => q.key === "golden_ball")?.icon}
                title={extraMap.get("golden_ball")?.title ?? "Balón de Oro"}
                items={extraMap.get("golden_ball")?.items ?? []}
              />
            </section>

            {/* Bota + Guante + Mejor joven */}
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <ExtraBarCard
                icon={EXTRA_QUESTIONS.find((q) => q.key === "golden_boot")?.icon}
                title={extraMap.get("golden_boot")?.title ?? "Bota de Oro"}
                items={extraMap.get("golden_boot")?.items ?? []}
              />
              <ExtraBarCard
                icon={EXTRA_QUESTIONS.find((q) => q.key === "golden_glove")?.icon}
                title={extraMap.get("golden_glove")?.title ?? "Guante de Oro"}
                items={extraMap.get("golden_glove")?.items ?? []}
              />
              <ExtraListCard
                icon={EXTRA_QUESTIONS.find((q) => q.key === "best_young_player")?.icon}
                title={extraMap.get("best_young_player")?.title ?? "Mejor joven"}
                items={extraMap.get("best_young_player")?.items ?? []}
              />
            </section>

            {/* Goleadores */}
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <ExtraBarCard
                icon={EXTRA_QUESTIONS.find((q) => q.key === "first_goal_scorer_world")?.icon}
                title={extraMap.get("first_goal_scorer_world")?.title ?? "Primer goleador del Mundial"}
                items={extraMap.get("first_goal_scorer_world")?.items ?? []}
              />
              <ExtraBarCard
                icon={EXTRA_QUESTIONS.find((q) => q.key === "first_goal_scorer_spain")?.icon}
                flagImg={EXTRA_QUESTIONS.find((q) => q.key === "first_goal_scorer_spain")?.flagUrl}
                title={extraMap.get("first_goal_scorer_spain")?.title ?? "Primer goleador de España"}
                items={extraMap.get("first_goal_scorer_spain")?.items ?? []}
              />
              <ExtraBarCard
                icon={EXTRA_QUESTIONS.find((q) => q.key === "top_spanish_scorer")?.icon}
                flagImg={EXTRA_QUESTIONS.find((q) => q.key === "top_spanish_scorer")?.flagUrl}
                title={extraMap.get("top_spanish_scorer")?.title ?? "Máximo goleador de España"}
                items={extraMap.get("top_spanish_scorer")?.items ?? []}
              />
            </section>

            {/* Insights */}
            <InsightsCard items={data.insights} />
          </>
        )}
      </div>
    </div>
  );
}
