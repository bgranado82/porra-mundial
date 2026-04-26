import StandingsPageClient from "@/components/StandingsPageClient";

type PageProps = {
  searchParams: Promise<{
    poolId?: string;
    entryId?: string;
    poolSlug?: string;
  }>;
};

export default async function StandingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const poolId = params.poolId ?? "";
  const entryId = params.entryId;
  const poolSlug = params.poolSlug;

  const backHref =
    entryId && poolSlug
      ? `/pool/${poolSlug}/entry/${entryId}`
      : "/dashboard";

  return <StandingsPageClient poolId={poolId} backHref={backHref} />;
}
