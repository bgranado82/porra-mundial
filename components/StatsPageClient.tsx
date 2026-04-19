
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

const CHART_COLORS = ["#00A443", "#6CC24A", "#009CDE", "#78BE20", "#A7D46F"];

const EXTRA_ICONS: Record<string, string> = {
  first_goal_scorer_world: "🥇",
  first_goal_scorer_spain: "🇪🇸",
  golden_boot: "👟",
  golden_ball: "🏆",
  best_young_player: "🌟",
  golden_glove: "🧤",
  top_spanish_scorer: "⚽",
};

function formatEuro(value: number) {
  return `${value.toLocaleString("es-ES")}€`;
}

function KpiCard({
  label,
  value,
  subvalue,
}: {
  label: string;
  value: string | number;
  subvalue?: string;
}) {
  return (
    <div className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white p-5 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
        {label}
      </div>
      <div className="mt-2 text-3xl font-black text-[var(--iberdrola-green)]">
        {value}
      </div>
      {subvalue ? (
        <div className="mt-2 text-sm text-[var(--iberdrola-forest)]/65">
          {subvalue}
        </div>
      ) : null}
    </div>
  );
}

function PrizesCard({
  loserRefund,
  firstPrize,
  secondPrize,
  thirdPrize,
}: {
  loserRefund: number;
  firstPrize: number;
  secondPrize: number;
  thirdPrize: number;
}) {
  return (
    <div className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white p-5 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
        Premios
      </div>
      <div className="mt-3 grid gap-2 text-sm font-semibold text-[var(--iberdrola-forest)]">
        <div className="flex items-center justify-between">
          <span>🥇 1º</span>
          <span className="font-black text-[var(--iberdrola-green)]">
            {formatEuro(firstPrize)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>🥈 2º</span>
          <span className="font-black text-[var(--iberdrola-green)]">
            {formatEuro(secondPrize)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>🥉 3º</span>
          <span className="font-black text-[var(--iberdrola-green)]">
            {formatEuro(thirdPrize)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>🔙 Último</span>
          <span className="font-black text-[var(--iberdrola-forest)]">
            {formatEuro(loserRefund)}
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  icon,
}: {
  title: string;
  icon?: string;
}) {
  return (
    <div className="border-b border-[var(--iberdrola-sky)] px-5 py-4">
      <div className="flex items-start gap-2 text-base font-black text-[var(--iberdrola-forest)]">
        {icon ? <span className="text-lg leading-none">{icon}</span> : null}
        <span>{title}</span>
      </div>
    </div>
  );
}

function ChampionDonutCard({
  title,
  items,
  notEnoughDataLabel,
}: {
  title: string;
  items: StatsResponse["champion"]["items"];
  notEnoughDataLabel: string;
}) {
  const topItems = items.slice(0, 5);
  const teamMap = new Map(teams.map((team) => [team.id, team]));

  const chartData = topItems.map((item) => ({
    name: item.label,
    value: item.count,
  }));

  return (
    <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
      <SectionHeader title={title} />
      <div className="grid items-center gap-6 p-5 lg:grid-cols-[1fr_0.95fr]">
        <div className="mx-auto h-[300px] w-full max-w-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={78}
                outerRadius={118}
                paddingAngle={3}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} picks`, "Picks"]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d9e7dc",
                  borderRadius: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {topItems.length > 0 ? (
            topItems.map((item) => {
              const team = item.teamId ? teamMap.get(item.teamId) : null;

              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 truncate text-sm font-bold text-[var(--iberdrola-forest)]">
                      {team?.flagUrl ? (
                        <img
                          src={team.flagUrl}
                          alt={team.name}
                          className="h-4 w-6 rounded-[2px] border border-gray-200 object-cover"
                        />
                      ) : null}
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div className="text-xs text-[var(--iberdrola-forest)]/60">
                      {item.count} picks
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-lg font-black text-[var(--iberdrola-green)]">
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-4 text-sm text-[var(--iberdrola-forest)]/65">
              {notEnoughDataLabel}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ExtraQuestionBarCard({
  title,
  icon,
  items,
}: {
  title: string;
  icon?: string;
  items: Array<{ key: string; label: string; count: number; percentage: number }>;
}) {
  const topItems = items.slice(0, 5);
  const otherItems = items.slice(5);

  const othersCount = otherItems.reduce((sum, item) => sum + item.count, 0);
  const othersPercentage = otherItems.reduce(
    (sum, item) => sum + item.percentage,
    0
  );

  const data = [
    ...topItems.map((item) => ({
      name: item.label,
      percentage: Number(item.percentage.toFixed(1)),
      count: item.count,
    })),
    ...(othersCount > 0
      ? [
          {
            name: "Otros",
            percentage: Number(othersPercentage.toFixed(1)),
            count: othersCount,
          },
        ]
      : []),
  ];

  return (
    <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
      <SectionHeader title={title} icon={icon} />
      <div className="flex h-[340px] items-center justify-center p-4">
        <div className="h-[250px] w-full max-w-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                stroke="#d9e7dc"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis type="category" dataKey="name" width={140} />
              <Tooltip
                formatter={(value, _name, props) => {
                  const count = props.payload.count;
                  return [`${value}% · ${count} picks`, ""];
                }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d9e7dc",
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="percentage" radius={[0, 8, 8, 0]}>
                {data.map((_, index) => (
                  <Cell
                    key={index}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function ExtraQuestionListCard({
  title,
  icon,
  items,
  notEnoughDataLabel,
}: {
  title: string;
  icon?: string;
  items: Array<{ key: string; label: string; count: number; percentage: number }>;
  notEnoughDataLabel: string;
}) {
  return (
    <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
      <SectionHeader title={title} icon={icon} />
      <div className="space-y-3 p-5">
        {items.slice(0, 5).length > 0 ? (
          items.slice(0, 5).map((item, index) => (
            <div
              key={item.key}
              className="rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/45">
                    #{index + 1}
                  </div>
                  <div className="truncate text-sm font-bold text-[var(--iberdrola-forest)]">
                    {item.label}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-[var(--iberdrola-green)]">
                    {item.percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-[var(--iberdrola-forest)]/55">
                    {item.count} picks
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-[var(--iberdrola-forest)]/65">
            {notEnoughDataLabel}
          </div>
        )}
      </div>
    </section>
  );
}

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
    <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
      <SectionHeader title={title} />
      <div className="space-y-3 p-5">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)]/25 px-4 py-3 text-sm font-semibold text-[var(--iberdrola-forest)]"
            >
              {item}
            </div>
          ))
        ) : (
          <div className="text-sm text-[var(--iberdrola-forest)]/65">
            {notEnoughInsightsLabel}
          </div>
        )}
      </div>
    </section>
  );
}

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
          setError("Falta el poolId.");
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/pool-stats?poolId=${poolId}`, {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Error cargando estadísticas");
        }

        setData(json as StatsResponse);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las estadísticas.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [poolId]);

  const extraMap = useMemo(() => {
    const map = new Map<string, StatsResponse["extras"][number]>();
    (data?.extras ?? []).forEach((item) => map.set(item.questionKey, item));
    return map;
  }, [data]);

  const dynamicInsights = useMemo(() => {
  if (!data) return [];
  return data.insights.slice(0, 4);
}, [data]);

  const backHref =
    entryId && poolSlug
      ? `/pool/${poolSlug}/entry/${entryId}`
      : "/dashboard";

  if (loading) {
    return (
      <main className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white p-6 text-sm font-semibold text-[var(--iberdrola-forest)]">
          Cargando estadísticas...
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white p-6 text-sm font-semibold text-[var(--iberdrola-forest)]">
          {error || "No hay datos disponibles."}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6">
      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3">
              <img
                src="/icon-512.png"
                alt="Porra Mundial 2026"
                 className="h-12 w-12 rounded-xl object-contain sm:h-14 sm:w-14"
              />
            </div>

            <div>
              <div className="text-sm font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                Estadísticas del pool
              </div>
              <h1 className="text-2xl font-black text-[var(--iberdrola-forest)]">
                Porra Mundial 2026
              </h1>
              <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
                Transparencia y tendencias del pool.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
  <LanguageSwitcher
    locale={locale}
    onChange={setLocale}
    label={t.language}
  />

  {poolId ? (
    <Link
      href={
        poolSlug
          ? `/standings?poolId=${poolId}&poolSlug=${poolSlug}&entryId=${entryId}`
          : `/standings?poolId=${poolId}&entryId=${entryId}`
      }
      className="rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)]"
    >
      {t.stats.viewStandings}
    </Link>
  ) : null}

  <Link
    href={
      poolId
        ? `/transparency?poolId=${poolId}&poolSlug=${poolSlug}&entryId=${entryId}`
        : "/transparency"
    }
    className="rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)]"
  >
    {t.stats.viewTransparency}
  </Link>

  <Link
    href={backHref}
    className="rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)]"
  >
    {t.stats.backToPrediction}
  </Link>
</div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t.stats.participants} value={data.summary.participants} />
        <KpiCard label={t.stats.countries} value={data.summary.countries} />
        <KpiCard label={t.stats.potTotal} value={formatEuro(data.summary.potTotal)} />
        <PrizesCard
          loserRefund={data.summary.loserRefund}
          firstPrize={data.summary.firstPrize}
          secondPrize={data.summary.secondPrize}
          thirdPrize={data.summary.thirdPrize}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <ChampionDonutCard
          title={t.stats.championFavorites}
          items={data.champion.items}
          notEnoughDataLabel={t.stats.notEnoughData}
        />

        <ExtraQuestionListCard
          icon={EXTRA_ICONS.golden_ball}
          title={extraMap.get("golden_ball")?.title ?? "Balón de Oro"}
          items={extraMap.get("golden_ball")?.items ?? []}
          notEnoughDataLabel={t.stats.notEnoughData}

        />
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <ExtraQuestionBarCard
          icon={EXTRA_ICONS.golden_boot}
          title={extraMap.get("golden_boot")?.title ?? "Bota de Oro"}
          items={extraMap.get("golden_boot")?.items ?? []}
        />

        <ExtraQuestionBarCard
          icon={EXTRA_ICONS.golden_glove}
          title={extraMap.get("golden_glove")?.title ?? "Guante de Oro"}
          items={extraMap.get("golden_glove")?.items ?? []}
        />

        <ExtraQuestionListCard
          icon={EXTRA_ICONS.best_young_player}
          title={
            extraMap.get("best_young_player")?.title ?? "Mejor jugador joven"
          }
          items={extraMap.get("best_young_player")?.items ?? []}
          notEnoughDataLabel={t.stats.notEnoughData}

        />
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <ExtraQuestionBarCard
          icon={EXTRA_ICONS.first_goal_scorer_world}
          title={
            extraMap.get("first_goal_scorer_world")?.title ??
            "Primer goleador del Mundial"
          }
          items={extraMap.get("first_goal_scorer_world")?.items ?? []}
        />

        <ExtraQuestionBarCard
          icon={EXTRA_ICONS.first_goal_scorer_spain}
          title={
            extraMap.get("first_goal_scorer_spain")?.title ??
            "Primer goleador de España"
          }
          items={extraMap.get("first_goal_scorer_spain")?.items ?? []}
        />

        <ExtraQuestionBarCard
          icon={EXTRA_ICONS.top_spanish_scorer}
          title={
            extraMap.get("top_spanish_scorer")?.title ??
            "Máximo goleador de España"
          }
          items={extraMap.get("top_spanish_scorer")?.items ?? []}
        />
      </section>

      <InsightsCard
  items={dynamicInsights}
  title={t.stats.insightsTitle}
  notEnoughInsightsLabel={t.stats.notEnoughInsights}
/>
    </main>
  );
}