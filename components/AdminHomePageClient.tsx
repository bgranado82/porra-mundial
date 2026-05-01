"use client";

import Link from "next/link";
import AdminNav from "@/components/AdminNav";

export default function AdminHomePageClient() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Header */}
      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="p-5 sm:p-6">
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--iberdrola-forest)]/45">
            Administración · Ibe World Cup 2026
          </div>
          <h1 className="mt-2 text-3xl font-black text-[var(--iberdrola-forest)]">
            Panel de control
          </h1>
          <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/65">
            Gestiona resultados, participantes y la configuración de los pools.
          </p>
          <div className="mt-5">
            <AdminNav />
          </div>
        </div>
      </section>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/results"
          className="group rounded-3xl border border-[var(--iberdrola-sky)] bg-white p-6 shadow-sm transition hover:border-[var(--iberdrola-green)] hover:shadow-md"
        >
          <div className="text-3xl mb-3">⚽</div>
          <div className="text-lg font-black text-[var(--iberdrola-forest)] group-hover:text-[var(--iberdrola-green)] transition-colors">
            Resultados
          </div>
          <div className="mt-1 text-sm text-[var(--iberdrola-forest)]/65">
            Introduce marcadores de fase de grupos, ganadores del knockout y preguntas extra. Recalcula la clasificación.
          </div>
          <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--iberdrola-green)] uppercase tracking-wide">
            Ir a resultados →
          </div>
        </Link>

        <Link
          href="/admin/participants"
          className="group rounded-3xl border border-[var(--iberdrola-sky)] bg-white p-6 shadow-sm transition hover:border-[var(--iberdrola-green)] hover:shadow-md"
        >
          <div className="text-3xl mb-3">👥</div>
          <div className="text-lg font-black text-[var(--iberdrola-forest)] group-hover:text-[var(--iberdrola-green)] transition-colors">
            Participantes
          </div>
          <div className="mt-1 text-sm text-[var(--iberdrola-forest)]/65">
            Revisa quién ha enviado su porra, gestiona pagos, reábre porras y marca envíos manuales.
          </div>
          <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--iberdrola-green)] uppercase tracking-wide">
            Ir a participantes →
          </div>
        </Link>

        <Link
          href="/admin/settings"
          className="group rounded-3xl border border-[var(--iberdrola-sky)] bg-white p-6 shadow-sm transition hover:border-[var(--iberdrola-green)] hover:shadow-md"
        >
          <div className="text-3xl mb-3">⚙️</div>
          <div className="text-lg font-black text-[var(--iberdrola-forest)] group-hover:text-[var(--iberdrola-green)] transition-colors">
            Configuración
          </div>
          <div className="mt-1 text-sm text-[var(--iberdrola-forest)]/65">
            Controla apertura de registro, deadlines, visibilidad de clasificación y estadísticas por pool.
          </div>
          <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--iberdrola-green)] uppercase tracking-wide">
            Ir a configuración →
          </div>
        </Link>
      </div>
    </main>
  );
}
