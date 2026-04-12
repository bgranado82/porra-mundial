import StandingsTable from "@/components/StandingsTable";
import { headers } from "next/headers";

type PageProps = {
  searchParams: Promise<{
    poolId?: string;
  }>;
};

async function getStandings(poolId: string) {
  const host = (await headers()).get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(
    `${baseUrl}/api/standings?poolId=${poolId}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Error cargando standings");
  }

  return res.json();
}

export default async function StandingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const poolId = params.poolId;

  if (!poolId) {
    return (
      <main className="min-h-screen bg-[var(--iberdrola-green-light)] p-4">
        <div className="mx-auto max-w-7xl space-y-4">
          <section className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-[var(--iberdrola-forest)]">
              Clasificación
            </h1>
            <p className="mt-2 text-sm text-red-600">
              Falta el poolId en la URL.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const data = await getStandings(poolId);

  return (
    <main className="min-h-screen bg-[var(--iberdrola-green-light)] p-4">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-[var(--iberdrola-forest)]">
            Clasificación
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Puntos por días de grupos, rondas eliminatorias y total acumulado.
          </p>
        </section>

        <StandingsTable days={data.days} standings={data.standings} />
      </div>
    </main>
  );
}