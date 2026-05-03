"use client";

import Link from "next/link";
import AdminNav from "@/components/AdminNav";

const cards = [
  {
    href: "/admin/results",
    icon: "⚽",
    title: "Resultados",
    desc: "Introduce marcadores de fase de grupos, ganadores del knockout y preguntas extra. Recalcula la clasificación.",
    cta: "Ir a resultados",
  },
  {
    href: "/admin/standings",
    icon: "📊",
    title: "Clasificación",
    desc: "Consulta la clasificación general o por fase de grupos de cualquier pool.",
    cta: "Ir a clasificación",
  },
  {
    href: "/admin/transparency",
    icon: "🔍",
    title: "Predicciones",
    desc: "Ve las predicciones de cualquier participante de cualquier pool.",
    cta: "Ir a predicciones",
  },
  {
    href: "/admin/explorer",
    icon: "🔎",
    title: "Explorador",
    desc: "Filtra por campeón o extra questions y ve quién ha puesto cada respuesta.",
    cta: "Ir al explorador",
  },
  {
    href: "/admin/participants",
    icon: "👥",
    title: "Participantes",
    desc: "Revisa quién ha enviado su porra, gestiona pagos, reábre porras y marca envíos manuales.",
    cta: "Ir a participantes",
  },
  {
    href: "/admin/settings",
    icon: "⚙️",
    title: "Configuración",
    desc: "Controla apertura de registro, deadlines, visibilidad de clasificación y estadísticas por pool.",
    cta: "Ir a configuración",
  },
  {
    href: "/admin/quote",
    icon: "💬",
    title: "Quote of the day",
    desc: "Gestiona la frase del día que aparece en la clasificación.",
    cta: "Ir a quotes",
  },
];

export default function AdminHomePageClient() {
  return (
    <div className="min-h-screen bg-[var(--iberdrola-green-light)]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">

        {/* Header */}
        <div className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--iberdrola-forest)]/45">
            Administración · Ibe World Cup 2026
          </div>
          <h1 className="mt-1 text-2xl font-black text-[var(--iberdrola-forest)]">
            Panel de control
          </h1>
          <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/60">
            Gestiona resultados, participantes y la configuración de los pools.
          </p>
          <div className="mt-5">
            <AdminNav />
          </div>
        </div>

        {/* Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white p-5 shadow-sm transition hover:border-[var(--iberdrola-green)] hover:shadow-md"
            >
              <div className="mb-3 text-3xl">{card.icon}</div>
              <div className="text-base font-bold text-[var(--iberdrola-forest)] transition-colors group-hover:text-[var(--iberdrola-green)]">
                {card.title}
              </div>
              <div className="mt-1 text-sm text-[var(--iberdrola-forest)]/60">
                {card.desc}
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-green)]">
                {card.cta} →
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
