"use client";

import Link from "next/link";
import AdminPageHeader from "@/components/AdminPageHeader";

// Tarjetas del panel de control, agrupadas por flujo de trabajo:
// 1) Acción diaria (resultados, participantes)
// 2) Visualización (clasificación, estadísticas)
// 3) Herramientas (predicciones, explorador, normalizar)
// 4) Configuración (configuración, frase del día)

const groups = [
  {
    title: "Acción",
    cards: [
      {
        href: "/admin/results",
        icon: "⚽",
        title: "Resultados",
        desc: "Introduce marcadores, knockouts y extras. Recalcula la clasificación.",
      },
      {
        href: "/admin/participants",
        icon: "👥",
        title: "Participantes",
        desc: "Gestiona pagos, estados de envío y reapertura de porras.",
      },
    ],
  },
  {
    title: "Visualización",
    cards: [
      {
        href: "/admin/standings",
        icon: "📊",
        title: "Clasificación",
        desc: "Clasificación general o por fase de grupos de cualquier pool.",
      },
      {
        href: "/admin/stats",
        icon: "📈",
        title: "Estadísticas",
        desc: "Bote, premios, favoritos al campeón y popularidad de los extras.",
      },
    ],
  },
  {
    title: "Herramientas",
    cards: [
      {
        href: "/admin/transparency",
        icon: "🔍",
        title: "Predicciones",
        desc: "Predicciones de un participante concreto en cualquier pool.",
      },
      {
        href: "/admin/explorer",
        icon: "🔎",
        title: "Explorador",
        desc: "Filtra por campeón o extra y mira quién apostó qué.",
      },
      {
        href: "/admin/normalize",
        icon: "🔤",
        title: "Normalizar",
        desc: "Corrige variantes de respuesta en los extras sin tocar lo que escribió el participante.",
      },
    ],
  },
  {
    title: "Configuración",
    cards: [
      {
        href: "/admin/settings",
        icon: "⚙️",
        title: "Configuración",
        desc: "Registro, deadlines, visibilidad y nota del administrador.",
      },
      {
        href: "/admin/quote",
        icon: "💬",
        title: "Frase del día",
        desc: "Frase que aparece en la clasificación, en los tres idiomas.",
      },
    ],
  },
];

export default function AdminHomePageClient() {
  return (
    <div className="min-h-screen bg-[var(--iberdrola-green-light)]">
      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">

        <AdminPageHeader
          title="Panel de control"
          description="Gestiona resultados, participantes y la configuración de los pools."
        />

        {/* Grupos de tarjetas */}
        {groups.map((group) => (
          <section key={group.title}>
            <div className="mb-3 px-1 text-[11px] font-bold uppercase tracking-widest text-[var(--iberdrola-forest)]/50">
              {group.title}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.cards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group flex flex-col rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white p-5 shadow-sm transition hover:border-[var(--iberdrola-green)] hover:shadow-md"
                >
                  <div className="mb-3 text-3xl leading-none">{card.icon}</div>
                  <div className="text-base font-black text-[var(--iberdrola-forest)] transition-colors group-hover:text-[var(--iberdrola-green)]">
                    {card.title}
                  </div>
                  <div className="mt-1 flex-1 text-sm text-[var(--iberdrola-forest)]/60">
                    {card.desc}
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-green)]">
                    Abrir →
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

      </main>
    </div>
  );
}
