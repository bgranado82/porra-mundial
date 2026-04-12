"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Standing = {
  entry_id: string;
  pool_id: string;
  name: string;
  email: string;
  day_points: Record<string, number>;
  group_total: number;
  r32_points: number;
  r16_points: number;
  qf_points: number;
  sf_points: number;
  third_points: number;
  final_points: number;
  total_points: number;
  outcome_hits: number;
  exact_hits: number;
  outcome_percent: number;
  exact_percent: number;
  position: number;
  movement: "up" | "down" | "same";
  movement_value: number;
};

type Props = {
  days: number[];
  standings: Standing[];
};

type TabKey = "groups" | "general";

function MovementBadge({
  movement,
  movementValue,
}: {
  movement: Standing["movement"];
  movementValue: number;
}) {
  if (movement === "up") {
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-green-50 px-2.5 py-1 font-bold text-green-700">
        ▲ {movementValue}
      </span>
    );
  }

  if (movement === "down") {
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-red-50 px-2.5 py-1 font-bold text-red-700">
        ▼ -{movementValue}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-1 font-bold text-gray-600">
      =
    </span>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-[var(--iberdrola-green)] px-4 py-2 text-sm font-semibold text-white"
          : "rounded-full border border-[var(--iberdrola-green)] bg-white px-4 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
      }
    >
      {children}
    </button>
  );
}

export default function StandingsTable({ days, standings }: Props) {
  const [tab, setTab] = useState<TabKey>("groups");

  const hasGroupDays = days.length > 0;
  const sortedDays = useMemo(() => [...days].sort((a, b) => a - b), [days]);

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <TabButton active={tab === "groups"} onClick={() => setTab("groups")}>
            Fase de grupos
          </TabButton>

          <TabButton active={tab === "general"} onClick={() => setTab("general")}>
            General
          </TabButton>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--iberdrola-green)] bg-white shadow-sm">
        <div className="max-h-[70vh] overflow-auto rounded-3xl">
          {tab === "groups" ? (
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-20 bg-white shadow-sm">
                <tr>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-30 border-b border-gray-200 bg-white px-3 py-3 text-left font-bold"
                  >
                    #
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-30 border-b border-gray-200 bg-white px-3 py-3 text-left font-bold"
                  >
                    Jugador
                  </th>

                  <th
                    colSpan={hasGroupDays ? sortedDays.length + 1 : 1}
                    className="sticky top-0 z-30 border-b border-l border-gray-200 bg-green-50 px-3 py-2 text-center font-bold text-[var(--iberdrola-forest)]"
                  >
                    Puntos
                  </th>

                  <th
                    colSpan={4}
                    className="sticky top-0 z-30 border-b border-l border-gray-200 bg-blue-50 px-3 py-2 text-center font-bold text-slate-700"
                  >
                    Precisión
                  </th>

                  <th
                    rowSpan={2}
                    className="sticky top-0 z-30 border-b border-l border-gray-200 bg-amber-50 px-3 py-3 text-center font-bold text-slate-700"
                  >
                    Variación
                  </th>
                </tr>

                <tr>
                  {hasGroupDays ? (
                    <>
                      {sortedDays.map((day) => (
                        <th
                          key={day}
                          className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-green-50 px-3 py-3 text-center font-semibold whitespace-nowrap"
                        >
                          Día {day}
                        </th>
                      ))}
                      <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-green-50 px-3 py-3 text-center font-semibold whitespace-nowrap">
                        Grupos
                      </th>
                    </>
                  ) : (
                    <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-green-50 px-3 py-3 text-center font-semibold whitespace-nowrap">
                      Grupos
                    </th>
                  )}

                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-blue-50 px-3 py-3 text-center font-semibold whitespace-nowrap">
                    Aciertos
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-blue-50 px-3 py-3 text-center font-semibold whitespace-nowrap">
                    % acierto
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-blue-50 px-3 py-3 text-center font-semibold whitespace-nowrap">
                    Exactos
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-blue-50 px-3 py-3 text-center font-semibold whitespace-nowrap">
                    % exacto
                  </th>
                </tr>
              </thead>

              <tbody>
                {standings.map((row) => (
                  <tr key={row.entry_id} className="hover:bg-gray-50">
                    <td className="border-b border-gray-100 px-3 py-3 font-bold whitespace-nowrap">
                      {row.position}
                    </td>

                    <td className="border-b border-gray-100 px-3 py-3 font-medium whitespace-nowrap">
                      <Link href={`/entry/${row.entry_id}`} className="hover:underline">
                        {row.name || row.email || "Jugador"}
                      </Link>
                    </td>

                    {hasGroupDays ? (
                      <>
                        {sortedDays.map((day) => (
                          <td
                            key={day}
                            className="border-b border-l border-gray-100 px-3 py-3 text-center"
                          >
                            {row.day_points[String(day)] ?? 0}
                          </td>
                        ))}
                        <td className="border-b border-l border-gray-100 px-3 py-3 text-center font-semibold">
                          {row.group_total}
                        </td>
                      </>
                    ) : (
                      <td className="border-b border-l border-gray-100 px-3 py-3 text-center font-semibold">
                        {row.group_total}
                      </td>
                    )}

                    <td className="border-b border-l border-gray-100 px-3 py-3 text-center">
                      {row.outcome_hits}
                    </td>
                    <td className="border-b border-l border-gray-100 px-3 py-3 text-center">
                      {row.outcome_percent}%
                    </td>
                    <td className="border-b border-l border-gray-100 px-3 py-3 text-center">
                      {row.exact_hits}
                    </td>
                    <td className="border-b border-l border-gray-100 px-3 py-3 text-center">
                      {row.exact_percent}%
                    </td>

                    <td className="border-b border-l border-gray-100 px-3 py-3 text-center">
                      <MovementBadge
                        movement={row.movement}
                        movementValue={row.movement_value}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-20 bg-white shadow-sm">
                <tr>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-30 border-b border-gray-200 bg-white px-3 py-3 text-left font-bold"
                  >
                    #
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-30 border-b border-gray-200 bg-white px-3 py-3 text-left font-bold"
                  >
                    Jugador
                  </th>

                  <th
                    colSpan={7}
                    className="sticky top-0 z-30 border-b border-l border-gray-200 bg-green-50 px-3 py-2 text-center font-bold text-[var(--iberdrola-forest)]"
                  >
                    Puntos
                  </th>

                  <th
                    colSpan={4}
                    className="sticky top-0 z-30 border-b border-l border-gray-200 bg-blue-50 px-3 py-2 text-center font-bold text-slate-700"
                  >
                    Precisión
                  </th>

                  <th
                    rowSpan={2}
                    className="sticky top-0 z-30 border-b border-l border-gray-200 bg-amber-50 px-3 py-3 text-center font-bold text-slate-700"
                  >
                    Variación
                  </th>
                </tr>

                <tr>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-green-50 px-3 py-3 text-center font-semibold whitespace-nowrap">
                    Grupos
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-green-50 px-3 py-3 text-center font-semibold whitespace-nowrap">
                    32
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-green-50 px-3 py-3 text-center font-semibold whitespace-nowrap">
                    16
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-green-50 px-3 py-3 text-center font-semibold whitespace-nowrap">
                    QF
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-green-50 px-3 py-3 text-center font-semibold whitespace-nowrap">
                    SF
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-green-50 px-3 py-3 text-center font-semibold whitespace-nowrap">
                    3º
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-green-50 px-3 py-3 text-center font-semibold whitespace-nowrap">
                    Total
                  </th>

                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-blue-50 px-3 py-3 text-center font-semibold whitespace-nowrap">
                    Aciertos
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-blue-50 px-3 py-3 text-center font-semibold whitespace-nowrap">
                    % acierto
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-blue-50 px-3 py-3 text-center font-semibold whitespace-nowrap">
                    Exactos
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-blue-50 px-3 py-3 text-center font-semibold whitespace-nowrap">
                    % exacto
                  </th>
                </tr>
              </thead>

              <tbody>
                {standings.map((row) => (
                  <tr key={row.entry_id} className="hover:bg-gray-50">
                    <td className="border-b border-gray-100 px-3 py-3 font-bold whitespace-nowrap">
                      {row.position}
                    </td>

                    <td className="border-b border-gray-100 px-3 py-3 font-medium whitespace-nowrap">
                      <Link href={`/entry/${row.entry_id}`} className="hover:underline">
                        {row.name || row.email || "Jugador"}
                      </Link>
                    </td>

                    <td className="border-b border-l border-gray-100 px-3 py-3 text-center font-semibold">
                      {row.group_total}
                    </td>
                    <td className="border-b border-l border-gray-100 px-3 py-3 text-center">
                      {row.r32_points}
                    </td>
                    <td className="border-b border-l border-gray-100 px-3 py-3 text-center">
                      {row.r16_points}
                    </td>
                    <td className="border-b border-l border-gray-100 px-3 py-3 text-center">
                      {row.qf_points}
                    </td>
                    <td className="border-b border-l border-gray-100 px-3 py-3 text-center">
                      {row.sf_points}
                    </td>
                    <td className="border-b border-l border-gray-100 px-3 py-3 text-center">
                      {row.third_points}
                    </td>
                    <td className="border-b border-l border-gray-100 px-3 py-3 text-center font-bold">
                      {row.total_points}
                    </td>

                    <td className="border-b border-l border-gray-100 px-3 py-3 text-center">
                      {row.outcome_hits}
                    </td>
                    <td className="border-b border-l border-gray-100 px-3 py-3 text-center">
                      {row.outcome_percent}%
                    </td>
                    <td className="border-b border-l border-gray-100 px-3 py-3 text-center">
                      {row.exact_hits}
                    </td>
                    <td className="border-b border-l border-gray-100 px-3 py-3 text-center">
                      {row.exact_percent}%
                    </td>

                    <td className="border-b border-l border-gray-100 px-3 py-3 text-center">
                      <MovementBadge
                        movement={row.movement}
                        movementValue={row.movement_value}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}