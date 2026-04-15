
import StatsPageClient from "@/components/StatsPageClient";

type Props = {
  searchParams: {
    poolId?: string;
    poolSlug?: string;
  };
};

export default function StatsPage({ searchParams }: Props) {
  return (
    <StatsPageClient
      poolId={searchParams.poolId ?? ""}
      poolSlug={searchParams.poolSlug ?? ""}
    />
  );
}