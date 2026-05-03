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
          <h1 className="mb-4 text-lg font-bold text-[var(--iberdrola-forest)]">🔍 Predicciones</h1>
          <div className="flex items-end gap-3">
            <div className="flex-1 sm:max-w-xs">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Pool</label>
              <AdminPoolSelector selectedPoolId={poolId} onChange={setPoolId} className="w-full" />
            </div>
            <button
              onClick={handleGo}
              disabled={!poolId}
              className="rounded-2xl bg-[var(--iberdrola-green)] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
            >
              Ver →
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-[var(--iberdrola-green-mid)] bg-white p-12 text-center text-[var(--iberdrola-forest)]/50">
          Selecciona un pool y pulsa "Ver" para abrir la página de predicciones
        </div>
      </div>
    </div>
  );
}
