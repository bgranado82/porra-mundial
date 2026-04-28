"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { teams } from "@/data/teams";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Locale, messages } from "@/lib/i18n";

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
      flag?: string | null;
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

const LOCALE_KEY = "porra-mundial-locale";

const CHART_COLORS = ["#00A443", "#6CC24A", "#009CDE", "#78BE20", "#A7D46F", "#B0BEC5"];
const NO_ANSWER_KEY = "__no_answer__";
const NO_ANSWER_COLOR = "#D1D5DB";

const EXTRA_ICONS: Record<string, string> = {
  first_goal_scorer_world: "🥇",
  first_goal_scorer_spain: "",
  golden_boot: "👟",
  golden_ball: "🏆",
  best_young_player: "🌟",
  golden_glove: "🧤",
  top_spanish_scorer: "⚽",
};

const SPAIN_FLAG = "https://flagcdn.com/es.svg";

function formatEuro(value: number) {
  return `${value.toLocaleString("es-ES")}€`;
}

// ─── KPI CARD ────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white p-6 shadow-sm transition hover:shadow-md text-center">
      <span className="text-2xl leading-none mb-2">{icon}</span>
      <div className="text-6xl font-black tracking-tight text-[var(--iberdrola-forest)] leading-none">
        {value}
      </div>
      <div className="mt-2 text-[11px] font-bold uppercase tracking-widest text-[var(--iberdrola-forest)]/50">
        {label}
      </div>
      <div className="absolute bottom-0 left-0 h-1 w-full rounded-b-3xl bg-gradient-to-r from-[var(--iberdrola-green)] to-[var(--iberdrola-sky)]" />
    </div>
  );
}

// ─── PRIZES CARD ─────────────────────────────────────────────────────────────
function PrizesCard({
  loserRefund,
  firstPrize,
  secondPrize,
  thirdPrize,
  potTotal,
  labels,
}: {
  loserRefund: number;
  firstPrize: number;
  secondPrize: number;
  thirdPrize: number;
  potTotal: number;
  labels: {
    prizes: string;
    firstPlace: string;
    secondPlace: string;
    thirdPlace: string;
    lastPlace: string;
    potTotal: string;
  };
}) {
  const prizes = [
    { emoji: "🥇", label: labels.firstPlace, amount: firstPrize, highlight: true },
    { emoji: "🥈", label: labels.secondPlace, amount: secondPrize, highlight: false },
    { emoji: "🥉", label: labels.thirdPlace, amount: thirdPrize, highlight: false },
    { emoji: "🔙", label: labels.lastPlace, amount: loserRefund, highlight: false },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[var(--iberdrola-forest)] p-5 shadow-md">
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[var(--iberdrola-green)] opacity-15 blur-2xl" />
      <div className="relative">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-white/40">
          {labels.potTotal}
        </div>
        <div className="text-3xl font-black tracking-tight text-white">
          {formatEuro(potTotal)}
        </div>
        <div className="mt-4 space-y-2">
          {prizes.map((p) => (
            <div key={p.label} className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${p.highlight ? "text-white" : "text-white/60"}`}>
                {p.emoji} {p.label}
              </span>
              <span className={`text-sm font-black ${p.highlight ? "text-[var(--iberdrola-green)]" : "text-white/70"}`}>
                {formatEuro(p.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-1 w-full rounded-b-3xl bg-gradient-to-r from-[var(--iberdrola-green)] to-[var(--iberdrola-sky)]" />
    </div>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
function SectionHeader({
  title,
  icon,
  flagImg,
}: {
  title: string;
  icon?: string;
  flagImg?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
      {flagImg ? (
        <img src={flagImg} alt="" className="h-5 w-7 rounded-[3px] border border-gray-200 object-cover shadow-sm" />
      ) : icon ? (
        <span className="text-xl leading-none">{icon}</span>
      ) : null}
      <span className="text-base font-black text-[var(--iberdrola-forest)]">{title}</span>
    </div>
  );
}

// ─── CHAMPION DONUT ───────────────────────────────────────────────────────────
function ChampionDonutCard({
  title,
  items,
  notEnoughDataLabel,
  picksUnit,
  picksLabel,
  othersLabel,
  noAnswerLabel,
}: {
  title: string;
  items: StatsResponse["champion"]["items"];
  notEnoughDataLabel: string;
  picksUnit: string;
  picksLabel: string;
  othersLabel: string;
  noAnswerLabel: string;
}) {
  const topItems = items.slice(0, 5);
  const otherItems = items.slice(5);
  const othersCount = otherItems.reduce((sum, item) => sum + item.count, 0);
  const othersPercentage = otherItems.reduce((sum, item) => sum + item.percentage, 0);
  const teamMap = new Map(teams.map((team) => [team.id, team]));

  const chartData = [
    ...topItems.map((item) => ({
      name: item.key === NO_ANSWER_KEY ? noAnswerLabel : item.label,
      value: item.count,
    })),
    ...(othersCount > 0 ? [{ name: othersLabel, value: othersCount }] : []),
  ];

  const legendItems = [
    ...topItems.map((item, idx) => ({
      label: item.key === NO_ANSWER_KEY ? noAnswerLabel : item.label,
      percentage: item.percentage,
      count: item.count,
      teamId: item.key === NO_ANSWER_KEY ? null : (item.teamId ?? null),
      color: item.key === NO_ANSWER_KEY ? NO_ANSWER_COLOR : CHART_COLORS[idx % CHART_COLORS.length],
    })),
    ...(othersCount > 0 ? [{
      label: othersLabel,
      percentage: othersPercentage,
      count: othersCount,
      teamId: null as string | null,
      color: CHART_COLORS[topItems.length % CHART_COLORS.length],
    }] : []),
  ];

  return (
    <section className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
      <SectionHeader title={title} />
      <div className="grid items-center gap-4 p-5 lg:grid-cols-[1fr_1fr]">
        {/* Donut */}
        <div className="mx-auto h-[280px] w-full max-w-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={72}
                outerRadius={112}
                paddingAngle={3}
                strokeWidth={0}
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={
                    topItems[index]?.key === NO_ANSWER_KEY
                      ? NO_ANSWER_COLOR
                      : CHART_COLORS[index % CHART_COLORS.length]
                  } />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} ${picksUnit}`, name as string]}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 700,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {legendItems.length > 0 ? (
            legendItems.map((item, index) => {
              const team = item.teamId ? teamMap.get(item.teamId) : null;
              const isTop = index === 0;
              return (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded-2xl px-3 py-2.5 transition ${
                    isTop
                      ? "bg-[var(--iberdrola-green-light)] border border-[var(--iberdrola-green)]/30"
                      : "border border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {team?.flagUrl ? (
                      <img src={team.flagUrl} alt={team.name} className="h-4 w-5 rounded-[2px] border border-gray-200 object-cover" />
                    ) : null}
                    <span className={`truncate text-sm font-bold ${isTop ? "text-[var(--iberdrola-forest)]" : "text-[var(--iberdrola-forest)]/80"}`}>
                      {item.label}
                    </span>
                  </div>
                  <div className="shrink-0 pl-2 text-right">
                    <span className={`text-base font-black ${isTop ? "text-[var(--iberdrola-green)]" : "text-[var(--iberdrola-forest)]/70"}`}>
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-[var(--iberdrola-forest)]/45">
              {notEnoughDataLabel}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── BAR CARD ────────────────────────────────────────────────────────────────
function ExtraQuestionBarCard({
  title,
  icon,
  flagImg,
  items,
  othersLabel,
  noAnswerLabel,
  picksUnit,
}: {
  title: string;
  icon?: string;
  flagImg?: string;
  items: Array<{ key: string; label: string; count: number; percentage: number }>;
  othersLabel: string;
  noAnswerLabel: string;
  picksUnit: string;
}) {
  const topItems = items.slice(0, 5);
  const otherItems = items.slice(5);
  const othersCount = otherItems.reduce((sum, item) => sum + item.count, 0);
  const othersPercentage = otherItems.reduce((sum, item) => sum + item.percentage, 0);

  const data = [
    ...topItems.map((item) => ({
      name: item.key === NO_ANSWER_KEY ? noAnswerLabel : item.label,
      percentage: Number(item.percentage.toFixed(1)),
      count: item.count,
      isNoAnswer: item.key === NO_ANSWER_KEY,
    })),
    ...(othersCount > 0 ? [{ name: othersLabel, percentage: Number(othersPercentage.toFixed(1)), count: othersCount, isNoAnswer: false }] : []),
  ];

  return (
    <section className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
      <SectionHeader title={title} icon={icon} flagImg={flagImg} />
      <div className="p-4 pt-3">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 36, left: 8, bottom: 0 }}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis
                type="number"
                domain={[0, (dataMax: number) => Math.min(100, Math.ceil(dataMax * 1.2))]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 11, fill: "#374151", fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value, _name, props) => [`${value}% · ${props.payload.count} ${picksUnit}`, ""]}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                cursor={{ fill: "rgba(0,164,67,0.04)" }}
              />
              <Bar dataKey="percentage" radius={[0, 6, 6, 0]} maxBarSize={20}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.isNoAnswer ? NO_ANSWER_COLOR : CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

// ─── LIST CARD ────────────────────────────────────────────────────────────────
function ExtraQuestionListCard({
  title,
  icon,
  items,
  notEnoughDataLabel,
  noAnswerLabel,
  othersLabel,
  picksUnit,
}: {
  title: string;
  icon?: string;
  items: Array<{ key: string; label: string; count: number; percentage: number }>;
  notEnoughDataLabel: string;
  noAnswerLabel: string;
  othersLabel: string;
  picksUnit: string;
}) {
  const noAnswerItem = items.find((i) => i.key === NO_ANSWER_KEY);
  const realItems = items.filter((i) => i.key !== NO_ANSWER_KEY);
  const top5 = realItems.slice(0, 5);
  const otherItems = realItems.slice(5);
  const othersCount = otherItems.reduce((sum, i) => sum + i.count, 0);
  const othersPercentage = otherItems.reduce((sum, i) => sum + i.percentage, 0);

  // Bar widths relative to the top item for visual clarity
  const maxPct = top5[0]?.percentage ?? 1;

  const displayItems: Array<{
    key: string;
    label: string;
    percentage: number;
    isSpecial: boolean;
    rank: number;
  }> = [
    ...top5.map((item, i) => ({ key: item.key, label: item.label, percentage: item.percentage, isSpecial: false, rank: i })),
    ...(othersCount > 0 ? [{ key: "__others__", label: othersLabel, percentage: othersPercentage, isSpecial: true, rank: -1 }] : []),
    ...(noAnswerItem ? [{ key: NO_ANSWER_KEY, label: noAnswerLabel, percentage: noAnswerItem.percentage, isSpecial: true, rank: -2 }] : []),
  ];

  // Bar color opacity steps per rank — more contrast between positions
  const barBgColors = [
    "rgba(0,164,67,0.18)",
    "rgba(0,164,67,0.11)",
    "rgba(0,164,67,0.07)",
    "rgba(0,164,67,0.05)",
    "rgba(0,164,67,0.03)",
  ];

  return (
    <section className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
      <SectionHeader title={title} icon={icon} />
      <div className="p-4">
        {displayItems.length > 0 ? (
          <div className="space-y-0.5">
            {displayItems.map((item, index) => {
              const isFirst = item.rank === 0;
              // Bar width relative to top item for real items, absolute for special
              const barWidth = item.isSpecial
                ? Math.round(item.percentage)
                : Math.round((item.percentage / maxPct) * 100);
              const barBg = item.isSpecial
                ? "rgba(0,0,0,0.04)"
                : barBgColors[item.rank] ?? "rgba(0,164,67,0.03)";

              return (
                <div key={item.key}>
                  {item.isSpecial && !displayItems[index - 1]?.isSpecial ? (
                    <div className="mt-2 mb-1 border-t border-dashed border-gray-100" />
                  ) : null}
                  <div className={`relative overflow-hidden rounded-xl px-3 ${item.isSpecial ? "py-1" : "py-2"}`}>
                    {/* proportional background bar */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-xl"
                      style={{ width: `${barWidth}%`, backgroundColor: barBg }}
                    />
                    <div className="relative flex items-center gap-2">
                      {/* rank number */}
                      <span className={`w-4 shrink-0 text-right font-black leading-none ${
                        item.isSpecial ? "text-[10px] text-gray-300" :
                        isFirst ? "text-sm text-[var(--iberdrola-green)]" :
                        "text-xs text-[var(--iberdrola-forest)]/30"
                      }`}>
                        {item.isSpecial ? "·" : item.rank + 1}
                      </span>
                      {/* label */}
                      <span className={`min-w-0 flex-1 truncate font-semibold ${
                        item.isSpecial ? "text-xs text-gray-400" :
                        isFirst ? "text-sm font-bold text-[var(--iberdrola-forest)]" :
                        "text-sm text-[var(--iberdrola-forest)]/70"
                      }`}>
                        {item.label}
                      </span>
                      {/* percentage */}
                      <span className={`shrink-0 font-black tabular-nums ${
                        item.isSpecial ? "text-xs text-gray-400" :
                        isFirst ? "text-sm text-[var(--iberdrola-green)]" :
                        "text-xs text-[var(--iberdrola-forest)]/55"
                      }`}>
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-[var(--iberdrola-forest)]/45">
            {notEnoughDataLabel}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── INSIGHTS CARD ────────────────────────────────────────────────────────────
const INSIGHT_ICONS = ["💡", "🔥", "📊", "🎯"];

function InsightsCard({
  items,
  title,
  notEnoughInsightsLabel,
}: {
  items: string[];
  title: string;
  notEnoughInsightsLabel: string;
}) {
  return (
    <section className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
      <SectionHeader title={title} icon="💡" />
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-[var(--iberdrola-green-light)] to-white p-4 border border-[var(--iberdrola-green)]/10"
            >
              <span className="mt-0.5 shrink-0 text-lg leading-none">{INSIGHT_ICONS[index % INSIGHT_ICONS.length]}</span>
              <p className="text-sm font-semibold leading-relaxed text-[var(--iberdrola-forest)]/80">{item}</p>
            </div>
          ))
        ) : (
          <div className="col-span-2 rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-[var(--iberdrola-forest)]/45">
            {notEnoughInsightsLabel}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function StatsPageClient() {
  const searchParams = useSearchParams();
  const poolId = searchParams.get("poolId") ?? "";
  const poolSlug = searchParams.get("poolSlug") ?? "";
  const entryId = searchParams.get("entryId") ?? "";

  const [locale, setLocale] = useState<Locale>("es");
  const t = messages[locale];
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_KEY) as Locale | null;
    if (savedLocale === "es" || savedLocale === "en" || savedLocale === "pt") {
      setLocale(savedLocale);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        if (!poolId) {
          setError(t.stats.missingPoolId);
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/pool-stats?poolId=${poolId}&locale=${locale}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || t.stats.loadError);
        setData(json as StatsResponse);
      } catch (err) {
        console.error(err);
        setError(t.stats.loadError);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [poolId, locale]);

  const extraMap = useMemo(() => {
    const map = new Map<string, StatsResponse["extras"][number]>();
    (data?.extras ?? []).forEach((item) => map.set(item.questionKey, item));
    return map;
  }, [data]);

  const dynamicInsights = useMemo(() => {
    if (!data) return [];
    return data.insights.slice(0, 4);
  }, [data]);

  const backHref = entryId && poolSlug ? `/pool/${poolSlug}/entry/${entryId}` : "/dashboard";

  // ── Loading skeleton
  if (loading) {
    return (
      <main className="page-bg">
        <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6">
          <div className="skeleton h-24 rounded-3xl" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-3xl" />)}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
            <div className="skeleton h-80 rounded-3xl" />
            <div className="skeleton h-80 rounded-3xl" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-64 rounded-3xl" />)}
          </div>
        </div>
      </main>
    );
  }

  // ── Error
  if (error || !data) {
    return (
      <main className="page-bg">
        <div className="mx-auto max-w-[1600px] px-4 py-6">
          <div className="rounded-3xl card-glass p-6 text-sm font-semibold text-[var(--iberdrola-forest)]">
            {error || t.stats.noData}
          </div>
        </div>
      </main>
    );
  }

  // ── Main render
  return (
    <main className="page-bg">
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 fade-in">

        {/* ── HEADER */}
        <section className="rounded-3xl card-glass shadow-md">
          <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-[var(--iberdrola-green)] opacity-10 blur-lg scale-110" />
                <img src="/icon-512.png" alt={t.stats.title} className="relative h-12 w-12 rounded-2xl object-contain shadow-sm sm:h-14 sm:w-14" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--iberdrola-forest)]/45">
                  {t.stats.sectionEyebrow}
                </div>
                <h1 className="text-2xl font-black tracking-tight text-[var(--iberdrola-forest)]">
                  {t.stats.title}
                </h1>
                <p className="mt-0.5 text-sm text-[var(--iberdrola-forest)]/55">
                  {t.stats.subtitle}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 lg:items-end">
              <LanguageSwitcher locale={locale} onChange={setLocale} label={t.language} />
              <div className="flex flex-wrap gap-2">
                {poolId ? (
                  <Link
                    href={poolSlug ? `/standings?poolId=${poolId}&poolSlug=${poolSlug}&entryId=${entryId}` : `/standings?poolId=${poolId}&entryId=${entryId}`}
                    className="rounded-2xl border border-[var(--iberdrola-green)]/40 bg-white/80 px-3 py-2 text-xs font-bold text-[var(--iberdrola-forest)] transition hover:border-[var(--iberdrola-green)] hover:bg-white"
                  >
                    {t.stats.viewStandings}
                  </Link>
                ) : null}
                <Link
                  href={poolId ? `/transparency?poolId=${poolId}&poolSlug=${poolSlug}&entryId=${entryId}` : "/transparency"}
                  className="rounded-2xl border border-[var(--iberdrola-green)]/40 bg-white/80 px-3 py-2 text-xs font-bold text-[var(--iberdrola-forest)] transition hover:border-[var(--iberdrola-green)] hover:bg-white"
                >
                  {t.stats.viewTransparency}
                </Link>
                <Link
                  href={poolId ? `/banquillo?poolId=${poolId}&poolSlug=${poolSlug}&entryId=${entryId}` : "/banquillo"}
                  className="rounded-2xl border border-[var(--iberdrola-green)]/40 bg-white/80 px-3 py-2 text-xs font-bold text-[var(--iberdrola-forest)] transition hover:border-[var(--iberdrola-green)] hover:bg-white"
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

        {/* ── KPIs + PRIZES */}
        <section className="grid gap-4 md:grid-cols-3">
          <KpiCard label={t.stats.participants} value={data.summary.participants} icon="👥" />
          <KpiCard label={t.stats.countries} value={data.summary.countries} icon="🌍" />
          <PrizesCard
            loserRefund={data.summary.loserRefund}
            firstPrize={data.summary.firstPrize}
            secondPrize={data.summary.secondPrize}
            thirdPrize={data.summary.thirdPrize}
            potTotal={data.summary.potTotal}
            labels={{
              prizes: t.stats.prizes,
              firstPlace: t.stats.firstPlace,
              secondPlace: t.stats.secondPlace,
              thirdPlace: t.stats.thirdPlace,
              lastPlace: t.stats.lastPlace,
              potTotal: t.stats.potTotal,
            }}
          />
        </section>

        {/* ── CHAMPION + GOLDEN BALL */}
        <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
          <ChampionDonutCard
            title={t.stats.championFavorites}
            items={data.champion.items}
            notEnoughDataLabel={t.stats.notEnoughData}
            picksUnit={t.stats.picksUnit}
            picksLabel={t.stats.picksLabel}
            othersLabel={t.stats.others}
            noAnswerLabel={t.stats.noAnswer}
          />
          <ExtraQuestionListCard
            icon={EXTRA_ICONS.golden_ball}
            title={t.extras.golden_ball}
            items={extraMap.get("golden_ball")?.items ?? []}
            notEnoughDataLabel={t.stats.notEnoughData}
            noAnswerLabel={t.stats.noAnswer}
            othersLabel={t.stats.others}
            picksUnit={t.stats.picksUnit}
          />
        </section>

        {/* ── BOOTS + GLOVE + BEST YOUNG */}
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <ExtraQuestionBarCard
            icon={EXTRA_ICONS.golden_boot}
            title={t.extras.golden_boot}
            items={extraMap.get("golden_boot")?.items ?? []}
            othersLabel={t.stats.others}
            noAnswerLabel={t.stats.noAnswer}
            picksUnit={t.stats.picksUnit}
          />
          <ExtraQuestionBarCard
            icon={EXTRA_ICONS.golden_glove}
            title={t.extras.golden_glove}
            items={extraMap.get("golden_glove")?.items ?? []}
            othersLabel={t.stats.others}
            noAnswerLabel={t.stats.noAnswer}
            picksUnit={t.stats.picksUnit}
          />
          <ExtraQuestionListCard
            icon={EXTRA_ICONS.best_young_player}
            title={t.extras.best_young_player}
            items={extraMap.get("best_young_player")?.items ?? []}
            notEnoughDataLabel={t.stats.notEnoughData}
            noAnswerLabel={t.stats.noAnswer}
            othersLabel={t.stats.others}
            picksUnit={t.stats.picksUnit}
          />
        </section>

        {/* ── SCORERS */}
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <ExtraQuestionBarCard
            icon={EXTRA_ICONS.first_goal_scorer_world}
            title={t.extras.first_goal_scorer_world}
            items={extraMap.get("first_goal_scorer_world")?.items ?? []}
            othersLabel={t.stats.others}
            noAnswerLabel={t.stats.noAnswer}
            picksUnit={t.stats.picksUnit}
          />
          <ExtraQuestionBarCard
            icon={EXTRA_ICONS.first_goal_scorer_spain}
            flagImg={SPAIN_FLAG}
            title={t.extras.first_goal_scorer_spain}
            items={extraMap.get("first_goal_scorer_spain")?.items ?? []}
            othersLabel={t.stats.others}
            noAnswerLabel={t.stats.noAnswer}
            picksUnit={t.stats.picksUnit}
          />
          <ExtraQuestionBarCard
            icon={EXTRA_ICONS.top_spanish_scorer}
            title={t.extras.top_spanish_scorer}
            items={extraMap.get("top_spanish_scorer")?.items ?? []}
            othersLabel={t.stats.others}
            noAnswerLabel={t.stats.noAnswer}
            picksUnit={t.stats.picksUnit}
          />
        </section>

        {/* ── INSIGHTS */}
        <InsightsCard
          items={dynamicInsights}
          title={t.stats.insightsTitle}
          notEnoughInsightsLabel={t.stats.notEnoughInsights}
        />

      </div>
    </main>
  );
}
