"use client";

/**
 * StandingsTableV2 — Fase 1
 *
 * Vista de clasificación rediseñada:
 *   - Una sola pestaña (selector de orden en lugar de 2 tabs).
 *   - Top 3 destacado con gradiente oro/plata/bronce.
 *   - Fila propia siempre visible arriba ("TÚ ESTÁS AQUÍ").
 *   - 8 columnas en desktop: Var · # · Jugador · País · Grupos · KO · Extras · TOTAL.
 *   - En móvil, cards verticales apiladas con la misma información.
 *
 * Esta fase aún NO incluye drawer/expansión de detalle. Solo estructura.
 */

import React, { useMemo, useState } from "react";
import { Locale, messages } from "@/lib/i18n";
import { countryFlagUrl } from "@/lib/countryFlags";

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
  prev_group_position?: number | null;
  group_movement?: "up" | "down" | "same";
  group_movement_value?: number;
};

type Props = {
  days: number[];
  standings: Standing[];
  locale?: Locale;
  entryId?: string;
};

// ─── Utilidades ───────────────────────────────────────────────────────────
function fmtPts(value: number, locale: Locale = "es") {
  return value.toLocaleString(locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-ES");
}

// Variación con contraste fuerte (verde brillante / rojo brillante / gris)
function MovementChip({ movement, value }: { movement: "up" | "down" | "same"; value: number }) {
  if (movement === "up") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
        <span className="text-[9px]">▲</span>{value}
      </span>
    );
  }
  if (movement === "down") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-md bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
        <span className="text-[9px]">▼</span>{value}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
      =
    </span>
  );
}

// Bandera o placeholder neutro
function CountryFlag({ country }: { country?: string }) {
  const url = countryFlagUrl(country);
  if (!url) {
    return (
      <span
        className="inline-block h-4 w-6 rounded-sm bg-gray-200 align-middle"
        title={country || "—"}
        aria-label={country || ""}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={country || ""}
      title={country || ""}
      className="inline-block h-4 w-6 rounded-sm object-cover align-middle shadow-sm"
    />
  );
}

// Medalla para el top 3
function PodiumMedal({ position }: { position: number }) {
  if (position === 1) return <span className="text-xl">🥇</span>;
  if (position === 2) return <span className="text-xl">🥈</span>;
  if (position === 3) return <span className="text-xl">🥉</span>;
  return <span className="text-sm font-bold text-[var(--iberdrola-forest)]/60 tabular-nums">{position}</span>;
}

// Clases de fondo por podio
function podiumRowClasses(position: number) {
  if (position === 1) {
    return "bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50 border-yellow-200";
  }
  if (position === 2) {
    return "bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50 border-gray-200";
  }
  if (position === 3) {
    return "bg-gradient-to-r from-orange-50 via-amber-50/40 to-orange-50 border-orange-200";
  }
  return "";
}

// Heatmap de color: dado un valor y un máximo, devuelve un estilo inline
// con fondo degradado de rojo (peor) → ámbar (medio) → verde (mejor).
// Los pesos están pensados para que valores muy bajos no se vean alarmantes.
function heatStyle(value: number, max: number): React.CSSProperties {
  if (max <= 0 || value <= 0) {
    return { backgroundColor: "transparent" };
  }
  const ratio = Math.min(1, value / max);
  // ratio 0..1 → tres tramos: rojo→ámbar (0..0.5) y ámbar→verde (0.5..1)
  let r: number, g: number, b: number;
  if (ratio < 0.5) {
    const t = ratio * 2; // 0..1 dentro del tramo
    r = 239; g = Math.round(68 + (158 - 68) * t); b = Math.round(68 + (11 - 68) * t);
  } else {
    const t = (ratio - 0.5) * 2; // 0..1 dentro del tramo
    r = Math.round(245 + (16 - 245) * t);
    g = Math.round(158 + (185 - 158) * t);
    b = Math.round(11 + (129 - 11) * t);
  }
  // Alpha bajo para que el color sea sutil de fondo, no chillón
  const alpha = 0.10 + ratio * 0.20; // de 0.10 a 0.30
  return { backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})` };
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────
export default function StandingsTableV2({ standings, locale = "es", entryId }: Props) {
  const t = messages[locale];
  const [search, setSearch] = useState("");

  // Único orden: por total (lo que ya viene calculado del backend).
  const sortedStandings = useMemo(() => {
    return standings.map((row) => ({
      ...row,
      _displayPosition: row.position,
      _displayMovement: row.movement,
      _displayMovementValue: row.movement_value,
    }));
  }, [standings]);

  // Para el heatmap de color: máximos por columna (para escalar el degradado).
  const maxValues = useMemo(() => {
    let maxGroups = 0, maxKo = 0, maxExtras = 0, maxTotal = 0;
    standings.forEach((row) => {
      const groups = row.group_total + row.extra_group_points;
      const ko = row.r32_points + row.r16_points + row.qf_points + row.sf_points + row.third_points + row.final_points + row.champion_points;
      const extras = row.extra_total_points - row.extra_group_points;
      if (groups > maxGroups) maxGroups = groups;
      if (ko > maxKo) maxKo = ko;
      if (extras > maxExtras) maxExtras = extras;
      if (row.total_points > maxTotal) maxTotal = row.total_points;
    });
    return { maxGroups, maxKo, maxExtras, maxTotal };
  }, [standings]);

  // Filtrar por búsqueda
  const filteredStandings = useMemo(() => {
    if (!search.trim()) return sortedStandings;
    const q = search.trim().toLowerCase();
    return sortedStandings.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        (row.email ?? "").toLowerCase().includes(q) ||
        (row.company ?? "").toLowerCase().includes(q) ||
        (row.country ?? "").toLowerCase().includes(q)
    );
  }, [sortedStandings, search]);

  // Localizar la fila propia en el listado ordenado actual
  const ownRow = useMemo(() => {
    if (!entryId) return null;
    return sortedStandings.find((row) => row.entry_id === entryId) ?? null;
  }, [sortedStandings, entryId]);

  const top3 = filteredStandings.slice(0, 3);
  const rest = filteredStandings.slice(3);

  return (
    <section className="space-y-4">
      {/* CONTROLES: solo búsqueda */}
      <div className="flex justify-end">
        <div className="relative w-full sm:w-72">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--iberdrola-forest)]/40">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full rounded-full border border-[var(--iberdrola-green-mid)] bg-white py-2 pl-8 pr-4 text-sm text-[var(--iberdrola-forest)] placeholder:text-[var(--iberdrola-forest)]/40 focus:border-[var(--iberdrola-green)] focus:outline-none focus:ring-1 focus:ring-[var(--iberdrola-green)]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--iberdrola-forest)]/40 hover:text-[var(--iberdrola-forest)]"
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* TU FILA STICKY */}
      {ownRow && !search && (
        <OwnRowBanner row={ownRow} locale={locale} />
      )}

      {/* PODIO TOP 3 (solo si no hay búsqueda activa, para no descolocar) */}
      {!search && top3.length > 0 && (
        <div className="space-y-2">
          {top3.map((row) => (
            <PodiumRow key={row.entry_id} row={row} locale={locale} isOwn={row.entry_id === entryId} />
          ))}
        </div>
      )}

      {/* DESKTOP: tabla / MÓVIL: cards */}
      <div className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-[var(--iberdrola-green-light)]/40 text-[11px] font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/70">
              <tr>
                <th className="w-[70px] px-3 py-3 text-center">Var.</th>
                <th className="w-[50px] px-3 py-3 text-center">#</th>
                <th className="w-[40%] px-3 py-3 text-left">Jugador</th>
                <th className="px-3 py-3 text-right">Grupos</th>
                <th className="px-3 py-3 text-right">KO</th>
                <th className="px-3 py-3 text-right">Extras</th>
                <th className="w-[110px] border-l-2 border-[var(--iberdrola-green)]/20 bg-[var(--iberdrola-green)]/10 px-3 py-3 text-right text-[var(--iberdrola-green)]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(search ? filteredStandings : rest).map((row) => (
                <DesktopRow
                  key={row.entry_id}
                  row={row}
                  maxValues={maxValues}
                  locale={locale}
                  isOwn={row.entry_id === entryId}
                />
              ))}
              {filteredStandings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-[var(--iberdrola-forest)]/40">
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Móvil */}
        <div className="md:hidden divide-y divide-gray-100">
          {(search ? filteredStandings : rest).map((row) => (
            <MobileCard
              key={row.entry_id}
              row={row}
              maxValues={maxValues}
              locale={locale}
              isOwn={row.entry_id === entryId}
            />
          ))}
          {filteredStandings.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--iberdrola-forest)]/40">
              Sin resultados
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── SUB-COMPONENTES ───────────────────────────────────────────────────────

// Banner "tú estás aquí" — más sobrio, sin verde tan fuerte
function OwnRowBanner({
  row,
  locale,
}: {
  row: any;
  locale: Locale;
}) {
  return (
    <div className="rounded-xl border border-[var(--iberdrola-green)]/40 bg-white px-3 py-2">
      <div className="flex items-center gap-3">
        <div className="shrink-0 text-[9px] font-black uppercase tracking-wider text-[var(--iberdrola-green)]">
          Tú
        </div>
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <MovementChip movement={row._displayMovement} value={row._displayMovementValue} />
          <span className="shrink-0 text-sm font-black tabular-nums text-[var(--iberdrola-forest)]/70">#{row._displayPosition}</span>
          <span className="truncate text-sm font-semibold text-[var(--iberdrola-forest)]">{row.name}</span>
          <CountryFlag country={row.country} />
        </div>
        <div className="shrink-0 text-right">
          <span className="text-base font-black tabular-nums text-[var(--iberdrola-green)]">
            {fmtPts(row.total_points, locale)}
          </span>
          <span className="ml-1 text-[9px] uppercase tracking-wide text-[var(--iberdrola-forest)]/40">pts</span>
        </div>
      </div>
    </div>
  );
}

// Fila destacada del podio (top 3) — más compacta
function PodiumRow({
  row,
  locale,
  isOwn,
}: {
  row: any;
  locale: Locale;
  isOwn: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border-2 px-4 py-2 shadow-sm ${podiumRowClasses(row._displayPosition)} ${
        isOwn ? "ring-2 ring-[var(--iberdrola-green)] ring-offset-2" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-9 text-center">
          <PodiumMedal position={row._displayPosition} />
        </div>
        <div className="shrink-0 w-12 text-center">
          <MovementChip movement={row._displayMovement} value={row._displayMovementValue} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate text-base font-black text-[var(--iberdrola-forest)]">
              {row.name}
            </span>
            <CountryFlag country={row.country} />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-2xl font-black tabular-nums text-[var(--iberdrola-forest)]">
            {fmtPts(row.total_points, locale)}
          </span>
          <span className="ml-1 text-[10px] uppercase tracking-wide text-[var(--iberdrola-forest)]/40">pts</span>
        </div>
      </div>
    </div>
  );
}

// Fila desktop (tabla) con heatmap y TOTAL destacado en verde Iberdrola
function DesktopRow({
  row,
  maxValues,
  locale,
  isOwn,
}: {
  row: any;
  maxValues: { maxGroups: number; maxKo: number; maxExtras: number; maxTotal: number };
  locale: Locale;
  isOwn: boolean;
}) {
  const groupsValue = row.group_total + row.extra_group_points;
  const extrasValue = row.extra_total_points - row.extra_group_points;
  const koValue =
    row.r32_points + row.r16_points + row.qf_points + row.sf_points +
    row.third_points + row.final_points + row.champion_points;

  return (
    <tr className={`transition hover:bg-gray-50 ${isOwn ? "bg-[var(--iberdrola-green-light)]/30" : ""}`}>
      <td className="px-3 py-3 text-center">
        <MovementChip movement={row._displayMovement} value={row._displayMovementValue} />
      </td>
      <td className="px-3 py-3 text-center font-bold tabular-nums text-[var(--iberdrola-forest)]/70">
        {row._displayPosition}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate font-semibold text-[var(--iberdrola-forest)]">{row.name}</span>
          <CountryFlag country={row.country} />
          {isOwn && (
            <span className="shrink-0 rounded-md bg-[var(--iberdrola-green)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
              Tú
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-right tabular-nums" style={heatStyle(groupsValue, maxValues.maxGroups)}>
        <span className="font-semibold text-[var(--iberdrola-forest)]">{fmtPts(groupsValue, locale)}</span>
      </td>
      <td className="px-3 py-3 text-right tabular-nums" style={heatStyle(koValue, maxValues.maxKo)}>
        <span className="font-semibold text-[var(--iberdrola-forest)]">{fmtPts(koValue, locale)}</span>
      </td>
      <td className="px-3 py-3 text-right tabular-nums" style={heatStyle(extrasValue, maxValues.maxExtras)}>
        <span className="font-semibold text-[var(--iberdrola-forest)]">{fmtPts(extrasValue, locale)}</span>
      </td>
      <td
        className="px-3 py-3 text-right tabular-nums border-l-2 border-[var(--iberdrola-green)]/20"
        style={heatStyle(row.total_points, maxValues.maxTotal)}
      >
        <span className="text-base font-black text-[var(--iberdrola-green)]">
          {fmtPts(row.total_points, locale)}
        </span>
      </td>
    </tr>
  );
}

// Card móvil — nombre con todo el ancho disponible, métricas debajo
function MobileCard({
  row,
  maxValues,
  locale,
  isOwn,
}: {
  row: any;
  maxValues: { maxGroups: number; maxKo: number; maxExtras: number; maxTotal: number };
  locale: Locale;
  isOwn: boolean;
}) {
  const groupsValue = row.group_total + row.extra_group_points;
  const extrasValue = row.extra_total_points - row.extra_group_points;
  const koValue =
    row.r32_points + row.r16_points + row.qf_points + row.sf_points +
    row.third_points + row.final_points + row.champion_points;

  return (
    <div
      className={`px-3 py-2.5 ${isOwn ? "bg-[var(--iberdrola-green-light)]/30" : ""}`}
      style={heatStyle(row.total_points, maxValues.maxTotal)}
    >
      {/* Línea 1: posición + nombre + bandera + tú | total destacado */}
      <div className="flex items-center gap-2">
        <span className="shrink-0 w-7 text-center text-sm font-black tabular-nums text-[var(--iberdrola-forest)]/60">
          {row._displayPosition}
        </span>
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <span className="truncate text-sm font-bold text-[var(--iberdrola-forest)]">{row.name}</span>
          <CountryFlag country={row.country} />
          {isOwn && (
            <span className="shrink-0 rounded-md bg-[var(--iberdrola-green)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
              Tú
            </span>
          )}
        </div>
        <div className="shrink-0 text-right">
          <span className="text-base font-black tabular-nums text-[var(--iberdrola-green)]">
            {fmtPts(row.total_points, locale)}
          </span>
          <span className="ml-0.5 text-[9px] uppercase tracking-wide text-[var(--iberdrola-forest)]/40">pts</span>
        </div>
      </div>
      {/* Línea 2: variación + desglose pequeño */}
      <div className="mt-1 flex items-center gap-2 pl-9">
        <MovementChip movement={row._displayMovement} value={row._displayMovementValue} />
        <span className="text-[10px] text-[var(--iberdrola-forest)]/50 tabular-nums">
          G {fmtPts(groupsValue, locale)} · KO {fmtPts(koValue, locale)} · X {fmtPts(extrasValue, locale)}
        </span>
      </div>
    </div>
  );
}
