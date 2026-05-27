"use client";

import AdminNav from "@/components/AdminNav";

// Header reutilizable de las páginas del admin. Centraliza el patrón
// "eyebrow + h1 + descripción + nav" para que todas las páginas del panel
// de control tengan la misma cara y se eviten derivas de diseño.
//
// Uso:
//   <AdminPageHeader title="Estadísticas" description="..." />
//   <AdminPageHeader title="Resultados" icon="⚽" description="..." />
//
// Si en el futuro se quiere cambiar la tipografía, el eyebrow o el lugar
// del nav, se cambia aquí una sola vez.

export default function AdminPageHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: string;
}) {
  return (
    <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
      <div className="p-4 sm:p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-[var(--iberdrola-forest)]/45">
          Administración · Ibe World Cup 2026
        </div>
        <h1 className="mt-1.5 flex items-center gap-2 text-2xl font-black text-[var(--iberdrola-forest)]">
          {icon && <span className="text-2xl leading-none">{icon}</span>}
          <span>{title}</span>
        </h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/65">{description}</p>
        )}
        <div className="mt-4">
          <AdminNav />
        </div>
      </div>
    </section>
  );
}
