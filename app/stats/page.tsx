import { Suspense } from "react";
import StatsPageClient from "@/components/StatsPageClient";

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando estadísticas...</div>}>
      <StatsPageClient />
    </Suspense>
  );
}