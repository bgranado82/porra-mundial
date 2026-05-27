"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminSectionHeader from "@/components/AdminSectionHeader";
import AdminPoolSelector from "@/components/AdminPoolSelector";
import StandingsTable from "@/components/StandingsTableV2";

export default function AdminStandingsPageClient() {
  const [poolId, setPoolId] = useState("");
  const [data, setData] = useState<{ days: number[]; standings: unknown[]; lastUpdate: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!poolId) { setData(null); return; }
    setLoading(true);
    setError(null);
    fetch(`/api/standings?poolId=${poolId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Error cargando clasificación"); setLoading(false); });
  }, [poolId]);

  return (
    <div className="min-h-screen bg-[var(--iberdrola-green-light)]">
      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">

        <AdminPageHeader
          title="Clasificación"
          icon="📊"
          description="Clasificación general o por fase de grupos de cualquier pool."
        />

        {/* Selector de pool */}
        <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
          <AdminSectionHeader title="Pool" />
          <div className="p-4 sm:p-6">
            <AdminPoolSelector selectedPoolId={poolId} onChange={setPoolId} className="w-full sm:w-80" />
          </div>
        </section>

        {!poolId && (
          <div className="rounded-2xl border border-dashed border-[var(--iberdrola-green-mid)] bg-white p-12 text-center text-[var(--iberdrola-forest)]/50">
            Selecciona un pool para ver la clasificación
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--iberdrola-green)] border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {data && !loading && (
          <section>
            {data.lastUpdate && (
              <p className="mb-3 text-right text-xs text-[var(--iberdrola-forest)]/50">
                <span className="font-semibold">Actualizado:</span>{" "}
                {new Intl.DateTimeFormat("es-ES", {
                  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                  hour12: false, timeZone: "Europe/Madrid",
                }).format(new Date(data.lastUpdate))}
              </p>
            )}
            <StandingsTable
              days={data.days}
              standings={data.standings as never}
              locale="es"
            />
          </section>
        )}

      </main>
    </div>
  );
}
