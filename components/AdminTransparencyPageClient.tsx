"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
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
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <AdminNav />

        <div className="mt-6 rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-bold text-[var(--iberdrola-forest)]">🔍 Predicciones</h1>
              <p className="text-sm text-[var(--iberdrola-forest)]/60">Selecciona un pool para ver las predicciones de cada participante</p>
            </div>
            <div className="flex items-center gap-3">
              <AdminPoolSelector selectedPoolId={poolId} onChange={setPoolId} />
              <button
                onClick={handleGo}
                disabled={!poolId}
                className="rounded-xl bg-[var(--iberdrola-green)] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
              >
                Ver →
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-[var(--iberdrola-green-mid)] bg-white p-12 text-center text-[var(--iberdrola-forest)]/50">
          Selecciona un pool y pulsa "Ver" para abrir la página de predicciones
        </div>
      </div>
    </div>
  );
}
