
"use client";

import Link from "next/link";

export default function AdminHomePageClient() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white p-6 shadow-sm">
        <div className="text-sm font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
          Administración
        </div>
        <h1 className="mt-2 text-3xl font-black text-[var(--iberdrola-forest)]">
          Panel admin
        </h1>
        <p className="mt-2 text-sm text-[var(--iberdrola-forest)]/70">
          Accede a resultados, participantes/pagos y configuración de pools.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/results"
          className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white p-6 shadow-sm transition hover:bg-[var(--iberdrola-sand)]/30"
        >
          <div className="text-lg font-black text-[var(--iberdrola-forest)]">
            Resultados
          </div>
          <div className="mt-2 text-sm text-[var(--iberdrola-forest)]/70">
            Fase de grupos, knockout y preguntas extra.
          </div>
        </Link>

        <Link
          href="/admin/participants"
          className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white p-6 shadow-sm transition hover:bg-[var(--iberdrola-sand)]/30"
        >
          <div className="text-lg font-black text-[var(--iberdrola-forest)]">
            Participantes y pagos
          </div>
          <div className="mt-2 text-sm text-[var(--iberdrola-forest)]/70">
            Revisión de pagos, estado de porras y reapertura.
          </div>
        </Link>

        <Link
          href="/admin/settings"
          className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white p-6 shadow-sm transition hover:bg-[var(--iberdrola-sand)]/30"
        >
          <div className="text-lg font-black text-[var(--iberdrola-forest)]">
            Configuración
          </div>
          <div className="mt-2 text-sm text-[var(--iberdrola-forest)]/70">
            Inscripción, visibilidad y cierre por pool.
          </div>
        </Link>
      </div>
    </main>
  );
}