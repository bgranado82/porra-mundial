import StandingsTable from "@/components/StandingsTable";
import { headers } from "next/headers";
import Image from "next/image";

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
      <main className="min-h-screen bg-[var(--iberdrola-green-light)] p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <section className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-[var(--iberdrola-forest)]">
              Clasificación Porra Mundial 2026
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
    <main className="min-h-screen bg-[var(--iberdrola-green-light)] p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[var(--iberdrola-green)] bg-white">
              <Image
                src="/icon-512.png"
                alt="Porra Mundial 2026"
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[var(--iberdrola-forest)] md:text-3xl">
                Clasificación Porra Mundial 2026
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Consulta la clasificación por días de grupos o la clasificación general acumulada.
              </p>
            </div>
          </div>
        </section>

        <StandingsTable days={data.days} standings={data.standings} />
      </div>
    </main>
  );
}