"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminSectionHeader from "@/components/AdminSectionHeader";
import AdminPoolSelector, { useAdminPools } from "@/components/AdminPoolSelector";

export default function AdminTransparencyPageClient() {
  const [poolId, setPoolId] = useState("");
  const { pools } = useAdminPools();
  const router = useRouter();

  function handleGo() {
    if (!poolId) return;
    const pool = pools.find((p: { id: string; name: string; slug: string }) => p.id === poolId);
    router.push(`/transparency?poolId=${poolId}&poolSlug=${pool?.slug ?? ""}`);
  }

  return (
    <div className="min-h-screen bg-[var(--iberdrola-green-light)]">
      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">

        <AdminPageHeader
          title="Predicciones por participante"
          icon="🔍"
          description="Abre la página pública de transparencia de cualquier pool."
        />

        <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
          <AdminSectionHeader title="Pool" />
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 sm:max-w-sm">
                <AdminPoolSelector selectedPoolId={poolId} onChange={setPoolId} className="w-full" />
              </div>
              <button
                onClick={handleGo}
                disabled={!poolId}
                className="rounded-2xl bg-[var(--iberdrola-green)] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
              >
                Abrir →
              </button>
            </div>
          </div>
        </section>

        {!poolId && (
          <div className="rounded-2xl border border-dashed border-[var(--iberdrola-green-mid)] bg-white p-12 text-center text-[var(--iberdrola-forest)]/50">
            Selecciona un pool para continuar
          </div>
        )}

      </main>
    </div>
  );
}
