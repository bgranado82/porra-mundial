
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Resultados" },
  { href: "/admin/participants", label: "Participantes y pagos" },
  { href: "/admin/settings", label: "Configuración" },
];

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
              isActive
                ? "bg-[var(--iberdrola-green)] text-white"
                : "border border-[var(--iberdrola-sky)] bg-white text-[var(--iberdrola-forest)] hover:bg-[var(--iberdrola-sand)]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}