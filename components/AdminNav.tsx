"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/admin/results",
    label: "Resultados",
    icon: "⚽",
    description: "Marcadores y knockout",
    aliases: ["/admin", "/admin/results"],
  },
  {
    href: "/admin/participants",
    label: "Participantes",
    icon: "👥",
    description: "Pagos y porras",
    aliases: ["/admin/participants"],
  },
  {
    href: "/admin/settings",
    label: "Configuración",
    icon: "⚙️",
    description: "Pools y visibilidad",
    aliases: ["/admin/settings", "/admin/pools"],
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
      {items.map((item) => {
        const active = item.aliases.includes(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex min-w-0 shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold shadow-sm transition-all sm:gap-3 sm:px-5 sm:py-3 ${
              active
                ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green)] text-white"
                : "border-[var(--iberdrola-green-mid)] bg-white text-[var(--iberdrola-forest)] hover:border-[var(--iberdrola-green)] hover:bg-[var(--iberdrola-green-light)]"
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
