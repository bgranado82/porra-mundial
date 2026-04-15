
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
import { createClient } from "@/utils/supabase/client";
import { teams } from "@/data/teams";

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

const CHART_COLORS = [
  "#00A443",
  "#6CC24A",
  "#009CDE",
  "#78BE20",
  "#A7D46F",
];

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

function ChampionDonutCard({
  title,
  items,
}: {
  title: string;
  items: StatsResponse["champion"]["items"];
}) {
  const topItems = items.slice(0, 5);
  const teamMap = new Map(teams.map((team) => [team.id, team]));

  const chartData = topItems.map((item) => ({
    name: item.label,
    value: item.count,
  }));

  return (
    <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
      <div className="border-b border-[var(--iberdrola-sky)] px-5 py-4">
        <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
          {title}
        </h2>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={105}
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
              Todavía no hay datos suficientes.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ExtraQuestionBarCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ key: string; label: string; count: number; percentage: number }>;
}) {
  const data = items.slice(0, 5).map((item) => ({
    name: item.label,
    percentage: Number(item.percentage.toFixed(1)),
  }));

  return (
    <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
      <div className="border-b border-[var(--iberdrola-sky)] px-5 py-4">
        <h3 className="text-base font-black text-[var(--iberdrola-forest)]">
          {title}
        </h3>
      </div>

      <div className="h-[280px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          >
            <CartesianGrid
              stroke="#d9e7dc"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={100} />
            <Tooltip
              formatter={(value) => [`${value}%`, "Porcentaje"]}
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #d9e7dc",
                borderRadius: 12,
              }}
            />
            <Bar
              dataKey="percentage"
              fill="#00A443"
              radius={[0, 8, 8, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function ExtraQuestionListCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ key: string; label: string; count: number; percentage: number }>;
}) {
  return (
    <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
      <div className="border-b border-[var(--iberdrola-sky)] px-5 py-4">
        <h3 className="text-base font-black text-[var(--iberdrola-forest)]">
          {title}
        </h3>
      </div>

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
            Todavía no hay datos suficientes.
          </div>
        )}
      </div>
    </section>
  );
}

function InsightsCard({ items }: { items: string[] }) {
  return (
    <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
      <div className="border-b border-[var(--iberdrola-sky)] px-5 py-4">
        <h3 className="text-base font-black text-[var(--iberdrola-forest)]">
          Insights del pool
        </h3>
      </div>

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
            Todavía no hay suficientes datos para generar insights.
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

  const supabase = createClient();
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[var(--iberdrola-green)] bg-white">
              <img
                src="/icon-512.png"
                alt="Porra Mundial 2026"
                className="h-11 w-11 object-contain"
              />
            </div>

            <div>
              <div className="text-sm font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                Estadísticas del pool
              </div>
              <h1 className="text-2xl font-black text-[var(--iberdrola-forest)]">
                {data.summary.poolName}
              </h1>
              <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
                Transparencia y tendencias del pool.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {poolId ? (
              <Link
                href={
                  poolSlug
                    ? `/standings?poolId=${poolId}&poolSlug=${poolSlug}&entryId=${entryId}`
                    : `/standings?poolId=${poolId}`
                }
                className="rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)]"
              >
                Ver clasificación
              </Link>
            ) : null}

            <Link
              href={backHref}
              className="rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)]"
            >
              Volver a la porra
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Participantes" value={data.summary.participants} />
        <KpiCard label="Países" value={data.summary.countries} />
        <KpiCard
          label="Bote total"
          value={formatEuro(data.summary.potTotal)}
        />
        <PrizesCard
          loserRefund={data.summary.loserRefund}
          firstPrize={data.summary.firstPrize}
          secondPrize={data.summary.secondPrize}
          thirdPrize={data.summary.thirdPrize}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ChampionDonutCard
          title="Favoritos al campeón"
          items={data.champion.items}
        />
        <ExtraQuestionBarCard
          title={
            extraMap.get("first_goal_scorer_world")?.title ??
            "Primer goleador del Mundial"
          }
          items={extraMap.get("first_goal_scorer_world")?.items ?? []}
        />
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <ExtraQuestionBarCard
          title={
            extraMap.get("first_goal_scorer_spain")?.title ??
            "Primer goleador de España"
          }
          items={extraMap.get("first_goal_scorer_spain")?.items ?? []}
        />
        <ExtraQuestionBarCard
          title={extraMap.get("golden_boot")?.title ?? "Bota de Oro"}
          items={extraMap.get("golden_boot")?.items ?? []}
        />
        <ExtraQuestionListCard
          title={extraMap.get("golden_ball")?.title ?? "Balón de Oro"}
          items={extraMap.get("golden_ball")?.items ?? []}
        />
        <ExtraQuestionListCard
          title={
            extraMap.get("best_young_player")?.title ?? "Mejor jugador joven"
          }
          items={extraMap.get("best_young_player")?.items ?? []}
        />
        <ExtraQuestionBarCard
          title={extraMap.get("golden_glove")?.title ?? "Guante de Oro"}
          items={extraMap.get("golden_glove")?.items ?? []}
        />
        <ExtraQuestionBarCard
          title={
            extraMap.get("top_spanish_scorer")?.title ??
            "Máximo goleador de España"
          }
          items={extraMap.get("top_spanish_scorer")?.items ?? []}
        />
      </section>

      <InsightsCard items={data.insights} />
    </main>
  );
}