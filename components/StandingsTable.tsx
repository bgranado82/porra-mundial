
"use client";

import { useMemo, useState } from "react";
import { Locale, messages } from "@/lib/i18n";

type ExtraPointsMap = {
  first_goal_scorer_world: number;
  first_goal_scorer_spain: number;
  golden_boot: number;
  golden_ball: number;
  best_young_player: number;
  golden_glove: number;
  top_spanish_scorer: number;
};

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
  champion_points: number;
  extra_group_points: number;
  extra_total_points: number;
  extra_points: ExtraPointsMap;
  total_points: number;
  outcome_hits: number;
  exact_hits: number;
  outcome_percent: number;
  exact_percent: number;
  ko_r32_hits: number; ko_r32_total: number;
  ko_r16_hits: number; ko_r16_total: number;
  ko_qf_hits: number; ko_qf_total: number;
  ko_sf_hits: number; ko_sf_total: number;
  ko_final_hits: number; ko_final_total: number;
  ko_champ_hits: number; ko_champ_total: number;
  position: number;
  movement: "up" | "down" | "same";
  movement_value: number;
};

type Props = {
  days: number[];
  standings: Standing[];
  locale?: Locale;
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


function getMedal(position: number): string | null {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return null;
}

export default function StandingsTable({ days, standings, locale = "es" }: Props) {
  const [tab, setTab] = useState<TabKey>("groups");
  const t = messages[locale];

  const hasGroupDays = days.length > 0;
  const sortedDays = useMemo(() => [...days].sort((a, b) => a - b), [days]);
  const totalRows = standings.length;

  return (
    <section className="space-y-4">
      {/* BOTONES */}
    <div className="flex gap-2">
      <button
        onClick={() => setTab("groups")}
        className={`rounded-full px-4 py-2 text-sm font-semibold ${
          tab === "groups"
            ? "bg-[var(--iberdrola-green)] text-white"
            : "border border-[var(--iberdrola-green)] bg-white text-[var(--iberdrola-forest)]"
        }`}
      >
        {t.groupStage}
      </button>

      <button
        onClick={() => setTab("general")}
        className={`rounded-full px-4 py-2 text-sm font-semibold ${
          tab === "general"
            ? "bg-[var(--iberdrola-green)] text-white"
            : "border border-[var(--iberdrola-green)] bg-white text-[var(--iberdrola-forest)]"
        }`}
      >
        {t.standingsTabGeneral}
      </button>
    </div>
        
      <div className="rounded-3xl border border-[var(--iberdrola-green)] bg-white shadow-sm">
        <div className="overflow-x-auto overflow-y-auto rounded-3xl" style={{ maxHeight: "75vh" }}>
          {tab === "groups" ? (
            <table className="min-w-[2200px] w-max border-separate border-spacing-0 text-[11px] md:text-sm">
              <thead className="sticky top-0 z-20 bg-white shadow-sm">
                <tr>
                  <th
                    rowSpan={2}
                    className="sticky left-0 top-0 z-30 w-[95px] border-b border-gray-200 bg-white px-1 py-3 text-center font-bold md:px-2"
                  >
                    {t.standingsColVariation}
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky left-[95px] top-0 z-30 w-[60px] border-b border-gray-200 bg-white px-1 py-3 text-center font-bold md:px-2"
                  >
                    #
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky left-[155px] top-0 z-30 w-[190px] border-b border-gray-200 bg-white px-1 py-3 text-left font-bold md:px-2"
                  >
                    {t.playerFallback}
                  </th>
                  <th
                    rowSpan={2}
                    className="top-0 z-30 w-[140px] border-b border-gray-200 bg-white px-1 py-3 text-left font-bold md:px-2"
                  >
                    {t.company}
                  </th>
                  <th
                    rowSpan={2}
                    className="top-0 z-30 w-[110px] border-b border-gray-200 bg-white px-1 py-3 text-left font-bold md:px-2"
                  >
                    {t.country}
                  </th>

                  <th
  colSpan={hasGroupDays ? sortedDays.length + 4 : 4}
  className="top-0 z-30 border-b border-l border-gray-200 bg-[var(--iberdrola-green)] px-1 py-2 text-center font-bold text-white md:px-2"
>
  {t.points}
</th>

                  <th
                    colSpan={4}
                    className="top-0 z-30 border-b border-l border-gray-200 bg-slate-50 px-1 py-2 text-center font-semibold text-slate-700 md:px-2"
                  >
                    {t.standingsColAccuracy}
                  </th>
                </tr>

                <tr>
  {hasGroupDays ? (
    <>
      {sortedDays.map((day) => (
        <th
          key={day}
          className="top-[44px] z-30 w-[64px] border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold whitespace-nowrap md:px-2"
        >
          J{day}
        </th>
      ))}
    </>
  ) : null}

  {/* ✅ NUEVO: TOTAL JORNADAS */}
  <th className="top-[44px] z-30 min-w-[95px] border-b border-l border-gray-200 bg-sky-50 px-2 py-3 text-center font-semibold leading-tight whitespace-nowrap">
  {t.standingsColTotalMatchdays}
</th>

<th className="top-[44px] z-30 min-w-[95px] border-b border-l border-gray-200 bg-green-50 px-2 py-3 text-center font-semibold whitespace-nowrap">
  {t.standingsColFirstGoalWorld}
</th>

<th className="top-[44px] z-30 min-w-[120px] border-b border-l border-gray-200 bg-green-50 px-2 py-3 text-center font-semibold leading-tight whitespace-nowrap">
  {t.standingsColFirstGoalSpain}
</th>

<th className="top-[44px] z-30 min-w-[110px] border-b border-l border-gray-200 bg-[var(--iberdrola-green)] px-2 py-3 text-center font-bold text-white whitespace-nowrap">
  {t.standingsColTotalGroups}
</th>

<th className="top-[44px] z-30 min-w-[90px] border-b border-l border-gray-200 bg-slate-50 px-2 py-2 text-center font-medium whitespace-nowrap">
  {t.standingsColOutcomeHits}
</th>

<th className="top-[44px] z-30 min-w-[95px] border-b border-l border-gray-200 bg-slate-50 px-2 py-2 text-center font-medium whitespace-nowrap">
  {t.standingsColOutcomePercent}
</th>

<th className="top-[44px] z-30 min-w-[90px] border-b border-l border-gray-200 bg-slate-50 px-2 py-2 text-center font-medium whitespace-nowrap">
  {t.standingsColExactHits}
</th>

<th className="top-[44px] z-30 min-w-[95px] border-b border-l border-gray-200 bg-slate-50 px-2 py-2 text-center font-medium whitespace-nowrap">
  {t.standingsColExactPercent}
</th>
</tr>
              </thead>

              <tbody>
                {standings.map((row) => {
                  const heatClass = getRankHeatClass(row.position, totalRows);

                  return (
                    <tr key={row.entry_id} className={`transition ${
                      row.position === 1 ? "bg-amber-50/60 hover:bg-amber-50" :
                      row.position === 2 ? "bg-gray-50/80 hover:bg-gray-100/60" :
                      row.position === 3 ? "bg-orange-50/40 hover:bg-orange-50/60" :
                      "hover:bg-gray-50"
                    }`}>
                      <td className={`sticky left-0 z-10 border-b border-gray-100 px-1 py-3 text-center md:px-2 ${
                        row.position <= 3 ? "bg-transparent" : "bg-white"
                      }`}>
                        <MovementBadge
                          movement={row.movement}
                          movementValue={row.movement_value}
                        />
                      </td>

                      <td className={`sticky left-[95px] z-10 border-b border-gray-100 px-1 py-3 text-center font-bold whitespace-nowrap md:px-2 ${
                        row.position <= 3 ? "bg-transparent" : "bg-white"
                      }`}>
                        {getMedal(row.position) ?? row.position}
                      </td>

                      <td className={`sticky left-[155px] z-10 border-b border-gray-100 px-1 py-3 font-medium md:px-2 ${
                        row.position === 1 ? "bg-amber-50/60" :
                        row.position === 2 ? "bg-gray-50/80" :
                        row.position === 3 ? "bg-orange-50/40" :
                        "bg-white"
                      }`}>
                        <div className="truncate">
                          <span title={row.name || row.email || t.playerFallback}>
                            {row.name || row.email || t.playerFallback}
                          </span>
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
  </>
) : null}

<td className="min-w-[95px] border-b border-l border-gray-100 px-2 py-3 text-center font-semibold">
  {row.group_total}
</td>

<td className="min-w-[95px] border-b border-l border-gray-100 px-2 py-3 text-center">
  {row.extra_points.first_goal_scorer_world}
</td>

<td className="min-w-[120px] border-b border-l border-gray-100 px-2 py-3 text-center">
  {row.extra_points.first_goal_scorer_spain}
</td>

<td
  className={`min-w-[110px] border-b border-l border-gray-100 px-2 py-3 text-center font-bold ${heatClass}`}
>
  {row.group_total + row.extra_group_points}
</td>

<td className="min-w-[90px] border-b border-l border-gray-100 px-2 py-3 text-center text-slate-700">
  {row.outcome_hits}
</td>

<td className="min-w-[95px] border-b border-l border-gray-100 px-2 py-3 text-center text-slate-700">
  {row.outcome_percent}%
</td>

<td className="min-w-[90px] border-b border-l border-gray-100 px-2 py-3 text-center text-slate-700">
  {row.exact_hits}
</td>

<td className="min-w-[95px] border-b border-l border-gray-100 px-2 py-3 text-center text-slate-700">
  {row.exact_percent}%
</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="min-w-[1880px] w-full table-fixed border-separate border-spacing-0 text-[11px] md:text-sm">
              <thead className="sticky top-0 z-20 bg-white shadow-sm">
                <tr>
                  <th
                    rowSpan={2}
                    className="sticky left-0 top-0 z-30 w-[95px] border-b border-gray-200 bg-white px-1 py-3 text-center font-bold md:px-2"
                  >
                    {t.standingsColVariation}
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky left-[95px] top-0 z-30 w-[60px] border-b border-gray-200 bg-white px-1 py-3 text-center font-bold md:px-2"
                  >
                    #
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky left-[155px] top-0 z-30 w-[190px] border-b border-gray-200 bg-white px-1 py-3 text-left font-bold md:px-2"
                  >
                    {t.playerFallback}
                  </th>

                  <th
                    rowSpan={2}
                    className="top-0 z-30 w-[140px] border-b border-gray-200 bg-white px-1 py-3 text-left font-bold md:px-2"
                  >
                    {t.company}
                  </th>
                  <th
                    rowSpan={2}
                    className="top-0 z-30 w-[110px] border-b border-gray-200 bg-white px-1 py-3 text-left font-bold md:px-2"
                  >
                    {t.country}
                  </th>

                  <th
  colSpan={15}
  className="top-0 z-30 border-b border-l border-gray-200 bg-[var(--iberdrola-green)] px-1 py-2 text-center font-bold text-white md:px-2"
>
  {t.points}
</th>
                  <th
                    colSpan={10}
                    className="top-0 z-30 border-b border-l border-gray-200 bg-slate-50 px-1 py-2 text-center font-semibold text-slate-700 md:px-2"
                  >
                    {t.standingsColKoPrecision}
                  </th>
                </tr>

                <tr>
                  <th className="top-[44px] z-30 w-[80px] border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold whitespace-nowrap md:px-2">
                    {t.standingsColGroups}
                  </th>
                  <th className="top-[44px] z-30 w-[80px] border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold whitespace-nowrap md:px-2">
                    R32
                  </th>
                  <th className="top-[44px] z-30 w-[80px] border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold whitespace-nowrap md:px-2">
                    R16
                  </th>
                  <th className="top-[44px] z-30 w-[80px] border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold whitespace-nowrap md:px-2">
                    {t.quarterfinals}
                  </th>
                  <th className="top-[44px] z-30 w-[96px] border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold whitespace-nowrap md:px-2">
                    {t.semifinals}
                  </th>
                  <th className="top-[44px] z-30 w-[80px] border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold whitespace-nowrap md:px-2">
                    {t.finalLabel}
                  </th>
                  <th className="top-[44px] z-30 w-[80px] border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold whitespace-nowrap md:px-2">
                    {t.champion}
                  </th>

                  <th className="top-[44px] z-30 w-[120px] border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold leading-tight md:px-2">
                    {t.standingsColFirstGoalWorldLong}
                  </th>
                  <th className="top-[44px] z-30 w-[138px] border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold leading-tight md:px-2">
                    {t.standingsColFirstGoalSpainLong}
                  </th>
                  <th className="top-[44px] z-30 w-[110px] border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold leading-tight md:px-2">
                    {t.standingsColGoldenBoot}
                  </th>
                  <th className="top-[44px] z-30 w-[110px] border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold leading-tight md:px-2">
                    {t.standingsColGoldenBall}
                  </th>
                  <th className="top-[44px] z-30 w-[120px] border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold leading-tight md:px-2">
                    {t.standingsColBestYoungPlayer}
                  </th>
                  <th className="top-[44px] z-30 w-[110px] border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold leading-tight md:px-2">
                    {t.standingsColGoldenGlove}
                  </th>
                  <th className="top-[44px] z-30 w-[140px] border-b border-l border-gray-200 bg-green-50 px-1 py-3 text-center font-semibold leading-tight md:px-2">
                    {t.standingsColTopSpanishScorer}
                  </th>
                  <th className="top-[44px] z-30 w-[90px] border-b border-l border-gray-200 bg-[var(--iberdrola-green)] px-1 py-3 text-center font-bold whitespace-nowrap text-white md:px-2">
                    {t.standingsColTotal}
                  </th>
                  <th className="top-[44px] z-30 w-[60px] border-b border-l border-gray-200 bg-slate-50 px-1 py-2 text-center text-[11px] font-semibold whitespace-nowrap text-slate-700">R32</th>
                  <th className="top-[44px] z-30 w-[55px] border-b border-l border-gray-200 bg-slate-50 px-1 py-2 text-center text-[11px] font-medium whitespace-nowrap text-slate-500">%</th>
                  <th className="top-[44px] z-30 w-[60px] border-b border-l border-gray-200 bg-slate-50 px-1 py-2 text-center text-[11px] font-semibold whitespace-nowrap text-slate-700">R16</th>
                  <th className="top-[44px] z-30 w-[55px] border-b border-l border-gray-200 bg-slate-50 px-1 py-2 text-center text-[11px] font-medium whitespace-nowrap text-slate-500">%</th>
                  <th className="top-[44px] z-30 w-[55px] border-b border-l border-gray-200 bg-slate-50 px-1 py-2 text-center text-[11px] font-semibold whitespace-nowrap text-slate-700">QF</th>
                  <th className="top-[44px] z-30 w-[55px] border-b border-l border-gray-200 bg-slate-50 px-1 py-2 text-center text-[11px] font-medium whitespace-nowrap text-slate-500">%</th>
                  <th className="top-[44px] z-30 w-[55px] border-b border-l border-gray-200 bg-slate-50 px-1 py-2 text-center text-[11px] font-semibold whitespace-nowrap text-slate-700">SF</th>
                  <th className="top-[44px] z-30 w-[55px] border-b border-l border-gray-200 bg-slate-50 px-1 py-2 text-center text-[11px] font-medium whitespace-nowrap text-slate-500">%</th>
                  <th className="top-[44px] z-30 w-[65px] border-b border-l border-gray-200 bg-slate-50 px-1 py-2 text-center text-[11px] font-semibold whitespace-nowrap text-slate-700">{t.standingsColKoFinal}</th>
                  <th className="top-[44px] z-30 w-[55px] border-b border-l border-gray-200 bg-slate-50 px-1 py-2 text-center text-[11px] font-medium whitespace-nowrap text-slate-500">%</th>
                </tr>
              </thead>

              <tbody>
                {standings.map((row) => {
                  const heatClass = getRankHeatClass(row.position, totalRows);

                  return (
                    <tr key={row.entry_id} className={`transition ${
                      row.position === 1 ? "bg-amber-50/60 hover:bg-amber-50" :
                      row.position === 2 ? "bg-gray-50/80 hover:bg-gray-100/60" :
                      row.position === 3 ? "bg-orange-50/40 hover:bg-orange-50/60" :
                      "hover:bg-gray-50"
                    }`}>
                      <td className={`sticky left-0 z-10 border-b border-gray-100 px-1 py-3 text-center md:px-2 ${
                        row.position <= 3 ? "bg-transparent" : "bg-white"
                      }`}>
                        <MovementBadge
                          movement={row.movement}
                          movementValue={row.movement_value}
                        />
                      </td>

                      <td className={`sticky left-[95px] z-10 border-b border-gray-100 px-1 py-3 text-center font-bold whitespace-nowrap md:px-2 ${
                        row.position <= 3 ? "bg-transparent" : "bg-white"
                      }`}>
                        {getMedal(row.position) ?? row.position}
                      </td>

                      <td className={`sticky left-[155px] z-10 border-b border-gray-100 px-1 py-3 font-medium md:px-2 ${
                        row.position === 1 ? "bg-amber-50/60" :
                        row.position === 2 ? "bg-gray-50/80" :
                        row.position === 3 ? "bg-orange-50/40" :
                        "bg-white"
                      }`}>
                        <div className="truncate">
                          <span title={row.name || row.email || t.playerFallback}>
                            {row.name || row.email || t.playerFallback}
                          </span>
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
                        {row.final_points}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center md:px-2">
                        {row.champion_points}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center md:px-2">
  {row.extra_points.first_goal_scorer_world}
</td>

<td className="border-b border-l border-gray-100 px-1 py-3 text-center md:px-2">
  {row.extra_points.first_goal_scorer_spain}
</td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center md:px-2">
                        {row.extra_points.golden_boot}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center md:px-2">
                        {row.extra_points.golden_ball}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center md:px-2">
                        {row.extra_points.best_young_player}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center md:px-2">
                        {row.extra_points.golden_glove}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-3 text-center md:px-2">
                        {row.extra_points.top_spanish_scorer}
                      </td>

                      <td
                        className={`border-b border-l border-gray-100 px-1 py-3 text-center font-bold md:px-2 ${heatClass}`}
                      >
                        {row.total_points}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-2 text-center text-xs font-medium text-slate-600">
                        {row.ko_r32_total > 0 ? `${row.ko_r32_hits}/${row.ko_r32_total}` : "—"}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-2 text-center text-xs text-slate-500">
                        {row.ko_r32_total > 0 ? `${Math.round((row.ko_r32_hits / row.ko_r32_total) * 100)}%` : "—"}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-2 text-center text-xs font-medium text-slate-600">
                        {row.ko_r16_total > 0 ? `${row.ko_r16_hits}/${row.ko_r16_total}` : "—"}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-2 text-center text-xs text-slate-500">
                        {row.ko_r16_total > 0 ? `${Math.round((row.ko_r16_hits / row.ko_r16_total) * 100)}%` : "—"}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-2 text-center text-xs font-medium text-slate-600">
                        {row.ko_qf_total > 0 ? `${row.ko_qf_hits}/${row.ko_qf_total}` : "—"}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-2 text-center text-xs text-slate-500">
                        {row.ko_qf_total > 0 ? `${Math.round((row.ko_qf_hits / row.ko_qf_total) * 100)}%` : "—"}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-2 text-center text-xs font-medium text-slate-600">
                        {row.ko_sf_total > 0 ? `${row.ko_sf_hits}/${row.ko_sf_total}` : "—"}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-2 text-center text-xs text-slate-500">
                        {row.ko_sf_total > 0 ? `${Math.round((row.ko_sf_hits / row.ko_sf_total) * 100)}%` : "—"}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-2 text-center text-xs font-medium text-slate-600">
                        {row.ko_final_total > 0 ? `${row.ko_final_hits}/${row.ko_final_total}` : "—"}
                      </td>
                      <td className="border-b border-l border-gray-100 px-1 py-2 text-center text-xs text-slate-500">
                        {row.ko_final_total > 0 ? `${Math.round((row.ko_final_hits / row.ko_final_total) * 100)}%` : "—"}
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