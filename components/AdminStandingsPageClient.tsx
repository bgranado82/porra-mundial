"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
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
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <AdminNav />

        <div className="mt-6 rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white p-5 shadow-sm">
          <h1 className="mb-4 text-lg font-bold text-[var(--iberdrola-forest)]">📊 Clasificación</h1>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Pool</label>
            <AdminPoolSelector selectedPoolId={poolId} onChange={setPoolId} className="w-full sm:w-72" />
          </div>
        </div>

        {!poolId && (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--iberdrola-green-mid)] bg-white p-12 text-center text-[var(--iberdrola-forest)]/50">
            Selecciona un pool para ver la clasificación
          </div>
        )}

        {loading && (
          <div className="mt-8 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--iberdrola-green)] border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {data && !loading && (
          <div className="mt-6">
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
          </div>
        )}
      </div>
    </div>
  );
}
