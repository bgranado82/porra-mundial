
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Inicio admin" },
  { href: "/admin/results", label: "Resultados" },
  { href: "/admin/participants", label: "Participantes y pagos" },
  { href: "/admin/settings", label: "Configuración" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href === "/admin/results" && pathname === "/admin");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold shadow-sm transition ${
              active
                ? "border border-[var(--iberdrola-green)] bg-[var(--iberdrola-green)] text-white"
                : "border border-[var(--iberdrola-green)] bg-white text-[var(--iberdrola-forest)] hover:bg-[var(--iberdrola-sand)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}