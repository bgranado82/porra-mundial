
import Link from "next/link";
import StandingsTable from "@/components/StandingsTable";
import { headers } from "next/headers";

type PageProps = {
  searchParams: Promise<{
    poolId?: string;
    entryId?: string;
    poolSlug?: string;
  }>;
};

async function getStandings(poolId: string) {
  const host = (await headers()).get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/standings?poolId=${poolId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error cargando standings");
  }

  return res.json();
}

export default async function StandingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const poolId = params.poolId;
  const entryId = params.entryId;
  const poolSlug = params.poolSlug;

  const backHref =
    entryId && poolSlug
      ? `/pool/${poolSlug}/entry/${entryId}`
      : "/dashboard";

  if (!poolId) {
    return (
      <main className="min-h-screen bg-[var(--iberdrola-green-light)] p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <section className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[var(--iberdrola-forest)]">
                  Clasificación Porra Mundial 2026
                </h1>
                <p className="mt-2 text-sm text-red-600">
                  Falta el poolId en la URL.
                </p>
              </div>

              <Link
                href={backHref}
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:bg-[var(--iberdrola-green-light)]"
              >
                Volver a la porra
              </Link>
            </div>
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[var(--iberdrola-green)] bg-white">
                <img
                  src="/icon-512.png"
                  alt="Porra Mundial 2026"
                  className="h-11 w-11 object-contain"
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-[var(--iberdrola-forest)] md:text-3xl">
                  Clasificación Porra Mundial 2026
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Consulta la clasificación por jornadas de grupos o la
                  clasificación general acumulada.
                </p>
              </div>
            </div>

            <Link
              href={backHref}
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:bg-[var(--iberdrola-green-light)]"
            >
              Volver a la porra
            </Link>
          </div>
        </section>

        <StandingsTable days={data.days} standings={data.standings} />
      </div>
    </main>
  );
}