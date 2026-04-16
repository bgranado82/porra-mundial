
import { Suspense } from "react";
import TransparencyPageClient from "./TransparencyPageClient";

export const dynamic = "force-dynamic";

export default function TransparencyPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando transparencia...</div>}>
      <TransparencyPageClient />
    </Suspense>
  );
}