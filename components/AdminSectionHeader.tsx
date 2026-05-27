"use client";

// Header de sección reutilizable para las páginas del admin.
// Patrón: <h2> con borde inferior, opcionalmente con subtítulo y acción a la derecha.

import React from "react";

export default function AdminSectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-black text-[var(--iberdrola-forest)]">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[var(--iberdrola-forest)]/55">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
