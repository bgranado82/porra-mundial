import { Suspense } from "react";
import ExplorerPageClient from "@/components/ExplorerPageClient";

type PageProps = {
  searchParams: Promise<{
    poolId?: string;
    entryId?: string;
    poolSlug?: string;
  }>;
};

export default async function ExplorerPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const poolId = params.poolId ?? "";
  const entryId = params.entryId ?? "";
  const poolSlug = params.poolSlug ?? "";

  const backHref =
    entryId && poolSlug
      ? `/pool/${poolSlug}/entry/${entryId}`
      : "/dashboard";

  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <ExplorerPageClient
        poolId={poolId}
        poolSlug={poolSlug}
        entryId={entryId}
        backHref={backHref}
      />
    </Suspense>
  );
}
