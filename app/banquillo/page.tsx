
import BanquilloPageClient from "@/components/BanquilloPageClient";

type PageProps = {
  searchParams: Promise<{
    poolId?: string;
    poolSlug?: string;
    entryId?: string;
  }>;
};

export default async function BanquilloPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const poolId = params.poolId ?? "";

  if (!poolId) {
    return (
      <main className="mx-auto max-w-[1100px] px-4 py-6">
        <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-[var(--iberdrola-forest)]">
            Falta el poolId en la URL.
          </div>
        </section>
      </main>
    );
  }

  return <BanquilloPageClient />;
}