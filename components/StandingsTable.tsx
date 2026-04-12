
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Standing = {
  entry_id: string;
  pool_id: string;
  name: string;
  email: string;
  company?: string;
  country?: string;
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
      <span className="inline-flex items-center justify-center rounded-full bg-green-50 px-2 py-1 font-bold text-green-700">
        ▲ {movementValue}
      </span>
    );
  }

  if (movement === "down") {
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-red-50 px-2 py-1 font-bold text-red-700">
        ▼ -{movementValue}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2 py-1 font-bold text-gray-600">
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

function getRankHeatClass(position: number, totalRows: number) {
  if (totalRows <= 1) {
    return "bg-green-50 text-green-800";
  }

  const ratio = (position - 1) / (totalRows - 1);

  if (ratio <= 0.2) return "bg-green-100 text-green-900";
  if (ratio <= 0.4) return "bg-lime-100 text-lime-900";
  if (ratio <= 0.6) return "bg-yellow-100 text-yellow-900";
  if (ratio <= 0.8) return "bg-orange-100 text-orange-900";
  return "bg-red-100 text-red-900";
}

export default function StandingsTable({ days, standings }: Props) {
  const [tab, setTab] = useState<TabKey>("groups");

  const hasGroupDays = days.length > 0;
  const sortedDays = useMemo(() => [...days].sort((a, b) => a - b), [days]);
  const totalRows = standings.length;

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
        <div className="overflow-x-hidden rounded-3xl">
          {tab === "groups" ? (
            <table className="w-full table-fixed border-separate border-spacing-0 text-xs md:text-sm">
              <thead className="sticky top-0 z-20 bg-white shadow-sm">
                <tr>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-30 w-[6%] border-b border-gray-200 bg-white px-1 py-3 text-left font-bold md:px-2"
                  >
                    #
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-30 w-[16%] border-b border-gray-200 bg-white px-1 py-3 text-left font-bold md:px-2"
                  >
                    Jugador
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-30 w-[14%] border-b border-gray-200 bg-white px-1 py-3 text-left font-bold md:px-2"
                  >
                    Empresa
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-30 w-[10%] border-b border-gray-200 bg-white px-1 py-3 text-left font-bold md:px-2"
                  >
                    País
                  </th>

                  <th
                    colSpan={hasGroupDays ? sortedDays.length + 1 : 1}
                    className="sticky top-0 z-30 border-b border-l border-gray-200 bg-green-50 px-1 py-2 text-center font-bold text-[var(--iberdrola-forest)] md:px-2"
                  >
                    Puntos
                  </th>

                  <th
                    colSpan={4}
                    className="sticky top-0 z-30 border-b border-l border-gray-200 bg-slate-50 px-1 py-2 text-center font-semibold text-slate-700 md:px-2"
                  >
                    Precisión
                  </th>

                  <th
                    rowSpan={2}
                    className="sticky top-0 z-30 w-[10%] border-b border-l border-gray-200 bg-amber-50 px-1 py-3 text-center font-bold text-slate-700 md:px-2"
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
                          className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold whitespace-nowrap md:px-2"
                        >
                          Día {day}
                        </th>
                      ))}
                      <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-[var(--iberdrola-green)] px-1 py-3 text-center font-bold whitespace-nowrap text-white md:px-2">
                        Grupos
                      </th>
                    </>
                  ) : (
                    <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-[var(--iberdrola-green)] px-1 py-3 text-center font-bold whitespace-nowrap text-white md:px-2">
                      Grupos
                    </th>
                  )}

                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-slate-50 px-1 py-3 text-center font-medium whitespace-nowrap md:px-2">
                    Aciertos
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-slate-50 px-1 py-3 text-center font-medium whitespace-nowrap md:px-2">
                    % acierto
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-slate-50 px-1 py-3 text-center font-medium whitespace-nowrap md:px-2">
                    Exactos
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-slate-50 px-1 py-3 text-center font-medium whitespace-nowrap md:px-2">
                    % exacto
                  </th>
                </tr>
              </thead>

              <tbody>
                {standings.map((row) => {
                  const heatClass = getRankHeatClass(row.position, totalRows);

                  return (
                    <tr key={row.entry_id} className="hover:bg-gray-50">
                      <td className="border-b border-gray-100 px-1 py-3 text-center font-bold whitespace-nowrap md:px-2">
                        {row.position}
                      </td>

                      <td className="border-b border-gray-100 px-1 py-3 font-medium md:px-2">
                        <div className="truncate">
                          <Link
                            href={`/entry/${row.entry_id}`}
                            className="hover:underline"
                            title={row.name || row.email || "Jugador"}
                          >
                            {row.name || row.email || "Jugador"}
                          </Link>
                        </div>
                      </td>

                      <td className="border-b border-gray-100 px-1 py-3 md:px-2">
                        <div className="truncate" title={row.company || "-"}>
                          {row.company || "-"}
                        </div>
                      </td>

                      <td className="border-b border-gray-100 px-1 py-3 md:px-2">
                        <div className="truncate" title={row.country || "-"}>
                          {row.country || "-"}
                        </div>
                      </td>

                      {hasGroupDays ? (
                        <>
                          {sortedDays.map((day) => (
                            <td
                              key={day}
                              className="border-b border-l border-gray-100 px-1 py-3 text-center md:px-2"
                            >
                              {row.day_points[String(day)] ?? 0}
                            </td>
                          ))}
                          <td
                            className={`border-b border-l border-gray-100 px-1 py-3 text-center font-bold md:px-2 ${heatClass}`}
                          >
                            {row.group_total}
                          </td>
                        </>
                      ) : (
                        <td
                          className={`border-b border-l border-gray-100 px-1 py-3 text-center font-bold md:px-2 ${heatClass}`}
                        >
                          {row.group_total}
                        </td>
                      )}

                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center text-slate-700 md:px-2">
                        {row.outcome_hits}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center text-slate-700 md:px-2">
                        {row.outcome_percent}%
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center text-slate-700 md:px-2">
                        {row.exact_hits}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center text-slate-700 md:px-2">
                        {row.exact_percent}%
                      </td>

                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center md:px-2">
                        <MovementBadge
                          movement={row.movement}
                          movementValue={row.movement_value}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full table-fixed border-separate border-spacing-0 text-xs md:text-sm">
              <thead className="sticky top-0 z-20 bg-white shadow-sm">
                <tr>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-30 w-[6%] border-b border-gray-200 bg-white px-1 py-3 text-left font-bold md:px-2"
                  >
                    #
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-30 w-[16%] border-b border-gray-200 bg-white px-1 py-3 text-left font-bold md:px-2"
                  >
                    Jugador
                  </th>

                  <th
                    rowSpan={2}
                    className="sticky top-0 z-30 w-[14%] border-b border-gray-200 bg-white px-1 py-3 text-left font-bold md:px-2"
                  >
                    Empresa
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky top-0 z-30 w-[10%] border-b border-gray-200 bg-white px-1 py-3 text-left font-bold md:px-2"
                  >
                    País
                  </th>

                  <th
                    colSpan={7}
                    className="sticky top-0 z-30 border-b border-l border-gray-200 bg-green-50 px-1 py-2 text-center font-bold text-[var(--iberdrola-forest)] md:px-2"
                  >
                    Puntos
                  </th>

                  <th
                    colSpan={4}
                    className="sticky top-0 z-30 border-b border-l border-gray-200 bg-slate-50 px-1 py-2 text-center font-semibold text-slate-700 md:px-2"
                  >
                    Precisión
                  </th>

                  <th
                    rowSpan={2}
                    className="sticky top-0 z-30 w-[10%] border-b border-l border-gray-200 bg-amber-50 px-1 py-3 text-center font-bold text-slate-700 md:px-2"
                  >
                    Variación
                  </th>
                </tr>

                <tr>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold whitespace-nowrap md:px-2">
                    Grupos
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold whitespace-nowrap md:px-2">
                    32
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold whitespace-nowrap md:px-2">
                    16
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold whitespace-nowrap md:px-2">
                    QF
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold whitespace-nowrap md:px-2">
                    SF
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold whitespace-nowrap md:px-2">
                    3º
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-[var(--iberdrola-green)] px-1 py-3 text-center font-bold whitespace-nowrap text-white md:px-2">
                    Total
                  </th>

                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-slate-50 px-1 py-3 text-center font-medium whitespace-nowrap md:px-2">
                    Aciertos
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-slate-50 px-1 py-3 text-center font-medium whitespace-nowrap md:px-2">
                    % acierto
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-slate-50 px-1 py-3 text-center font-medium whitespace-nowrap md:px-2">
                    Exactos
                  </th>
                  <th className="sticky top-[44px] z-30 border-b border-l border-gray-200 bg-slate-50 px-1 py-3 text-center font-medium whitespace-nowrap md:px-2">
                    % exacto
                  </th>
                </tr>
              </thead>

              <tbody>
                {standings.map((row) => {
                  const heatClass = getRankHeatClass(row.position, totalRows);

                  return (
                    <tr key={row.entry_id} className="hover:bg-gray-50">
                      <td className="border-b border-gray-100 px-1 py-3 text-center font-bold whitespace-nowrap md:px-2">
                        {row.position}
                      </td>

                      <td className="border-b border-gray-100 px-1 py-3 font-medium md:px-2">
                        <div className="truncate">
                          <Link
                            href={`/entry/${row.entry_id}`}
                            className="hover:underline"
                            title={row.name || row.email || "Jugador"}
                          >
                            {row.name || row.email || "Jugador"}
                          </Link>
                        </div>
                      </td>

                      <td className="border-b border-gray-100 px-1 py-3 md:px-2">
                        <div className="truncate" title={row.company || "-"}>
                          {row.company || "-"}
                        </div>
                      </td>
                      <td className="border-b border-gray-100 px-1 py-3 md:px-2">
                        <div className="truncate" title={row.country || "-"}>
                          {row.country || "-"}
                        </div>
                      </td>

                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center font-semibold md:px-2">
                        {row.group_total}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center md:px-2">
                        {row.r32_points}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center md:px-2">
                        {row.r16_points}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center md:px-2">
                        {row.qf_points}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center md:px-2">
                        {row.sf_points}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center md:px-2">
                        {row.third_points}
                      </td>

                      <td
                        className={`border-b border-l border-gray-100 px-1 py-3 text-center font-bold md:px-2 ${heatClass}`}
                      >
                        {row.total_points}
                      </td>

                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center text-slate-700 md:px-2">
                        {row.outcome_hits}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center text-slate-700 md:px-2">
                        {row.outcome_percent}%
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center text-slate-700 md:px-2">
                        {row.exact_hits}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center text-slate-700 md:px-2">
                        {row.exact_percent}%
                      </td>

                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center md:px-2">
                        <MovementBadge
                          movement={row.movement}
                          movementValue={row.movement_value}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}