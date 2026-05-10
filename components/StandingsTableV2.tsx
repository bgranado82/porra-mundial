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

import { useMemo, useState } from "react";
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

type SortKey = "total" | "groups" | "extras";

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

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────
export default function StandingsTableV2({ standings, locale = "es", entryId }: Props) {
  const t = messages[locale];
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [search, setSearch] = useState("");

  // Aplicar orden seleccionado y recalcular movement coherente con ese orden.
  // Para "groups" usamos prev_group_position (que ya viene del backend).
  // Para "total" usamos position/movement (ya vienen calculados).
  // Para "extras" no tenemos previo guardado, así que mostramos "=" en variación.
  const sortedStandings = useMemo(() => {
    if (sortKey === "groups") {
      const sorted = [...standings].sort((a, b) => {
        const aVal = a.group_total + a.extra_group_points;
        const bVal = b.group_total + b.extra_group_points;
        if (bVal !== aVal) return bVal - aVal;
        return a.name.localeCompare(b.name);
      });
      return sorted.map((row, idx) => {
        const currentPos = idx + 1;
        const prev = row.prev_group_position ?? currentPos;
        let movement: "up" | "down" | "same" = "same";
        let movement_value = 0;
        if (currentPos < prev) { movement = "up"; movement_value = prev - currentPos; }
        else if (currentPos > prev) { movement = "down"; movement_value = currentPos - prev; }
        return { ...row, _displayPosition: currentPos, _displayMovement: movement, _displayMovementValue: movement_value };
      });
    }
    if (sortKey === "extras") {
      const sorted = [...standings].sort((a, b) => {
        // Solo extras "totales" (los 7), excluyendo los de grupo que ya van en "Grupos".
        const aVal = a.extra_total_points - a.extra_group_points;
        const bVal = b.extra_total_points - b.extra_group_points;
        if (bVal !== aVal) return bVal - aVal;
        return a.name.localeCompare(b.name);
      });
      return sorted.map((row, idx) => ({
        ...row,
        _displayPosition: idx + 1,
        _displayMovement: "same" as const,
        _displayMovementValue: 0,
      }));
    }
    // total — usar lo que viene del backend
    return standings.map((row) => ({
      ...row,
      _displayPosition: row.position,
      _displayMovement: row.movement,
      _displayMovementValue: row.movement_value,
    }));
  }, [standings, sortKey]);

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
      {/* CONTROLES: orden + búsqueda */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-[var(--iberdrola-forest)]/50">
            Ordenar por
          </span>
          <div className="flex gap-1.5">
            <SortPill active={sortKey === "total"} onClick={() => setSortKey("total")} label="Total" />
            <SortPill active={sortKey === "groups"} onClick={() => setSortKey("groups")} label="Grupos" />
            <SortPill active={sortKey === "extras"} onClick={() => setSortKey("extras")} label="Extras" />
          </div>
        </div>

        <div className="relative w-full sm:w-64">
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
        <OwnRowBanner row={ownRow} sortKey={sortKey} locale={locale} />
      )}

      {/* PODIO TOP 3 (solo si no hay búsqueda activa, para no descolocar) */}
      {!search && top3.length > 0 && (
        <div className="space-y-2">
          {top3.map((row) => (
            <PodiumRow key={row.entry_id} row={row} sortKey={sortKey} locale={locale} isOwn={row.entry_id === entryId} />
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
                <th className="w-[80px] px-3 py-3 text-center">Var.</th>
                <th className="w-[60px] px-3 py-3 text-center">#</th>
                <th className="px-3 py-3 text-left">Jugador</th>
                <th className="w-[60px] px-3 py-3 text-center">País</th>
                <th className="w-[90px] px-3 py-3 text-right">Grupos</th>
                <th className="w-[90px] px-3 py-3 text-right">KO</th>
                <th className="w-[90px] px-3 py-3 text-right">Extras</th>
                <th className="w-[110px] px-3 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(search ? filteredStandings : rest).map((row) => (
                <DesktopRow
                  key={row.entry_id}
                  row={row}
                  sortKey={sortKey}
                  locale={locale}
                  isOwn={row.entry_id === entryId}
                />
              ))}
              {filteredStandings.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-[var(--iberdrola-forest)]/40">
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
              sortKey={sortKey}
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

function SortPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
        active
          ? "bg-[var(--iberdrola-green)] text-white shadow-sm"
          : "border border-[var(--iberdrola-green-mid)] bg-white text-[var(--iberdrola-forest)]/70 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

// Banner "tú estás aquí"
function OwnRowBanner({
  row,
  sortKey,
  locale,
}: {
  row: any;
  sortKey: SortKey;
  locale: Locale;
}) {
  const totalShown = sortKey === "groups"
    ? row.group_total + row.extra_group_points
    : sortKey === "extras"
    ? row.extra_total_points - row.extra_group_points
    : row.total_points;

  return (
    <div className="rounded-2xl border-2 border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)]/30 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="shrink-0 text-[10px] font-black uppercase tracking-wider text-[var(--iberdrola-green)]">
          Tu posición
        </div>
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <MovementChip movement={row._displayMovement} value={row._displayMovementValue} />
          <span className="text-lg font-black tabular-nums text-[var(--iberdrola-forest)]">#{row._displayPosition}</span>
          <span className="truncate text-sm font-bold text-[var(--iberdrola-forest)]">{row.name}</span>
          <CountryFlag country={row.country} />
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xl font-black tabular-nums text-[var(--iberdrola-green)]">
            {fmtPts(totalShown, locale)}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-[var(--iberdrola-forest)]/40">pts</div>
        </div>
      </div>
    </div>
  );
}

// Fila destacada del podio (top 3)
function PodiumRow({
  row,
  sortKey,
  locale,
  isOwn,
}: {
  row: any;
  sortKey: SortKey;
  locale: Locale;
  isOwn: boolean;
}) {
  const groupsValue = row.group_total + row.extra_group_points;
  const extrasValue = row.extra_total_points - row.extra_group_points;
  const koValue =
    row.r32_points + row.r16_points + row.qf_points + row.sf_points +
    row.third_points + row.final_points + row.champion_points;
  const totalShown = sortKey === "groups"
    ? groupsValue
    : sortKey === "extras"
    ? extrasValue
    : row.total_points;

  return (
    <div
      className={`rounded-2xl border-2 px-4 py-3 shadow-sm ${podiumRowClasses(row._displayPosition)} ${
        isOwn ? "ring-2 ring-[var(--iberdrola-green)] ring-offset-2" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-10 text-center">
          <PodiumMedal position={row._displayPosition} />
        </div>
        <div className="shrink-0 w-12 text-center">
          <MovementChip movement={row._displayMovement} value={row._displayMovementValue} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-black text-[var(--iberdrola-forest)] sm:text-base">
              {row.name}
            </span>
            <CountryFlag country={row.country} />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xl font-black tabular-nums text-[var(--iberdrola-forest)] sm:text-2xl">
            {fmtPts(totalShown, locale)}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-[var(--iberdrola-forest)]/40">pts</div>
        </div>
      </div>
    </div>
  );
}

// Fila desktop (tabla)
function DesktopRow({
  row,
  sortKey,
  locale,
  isOwn,
}: {
  row: any;
  sortKey: SortKey;
  locale: Locale;
  isOwn: boolean;
}) {
  const groupsValue = row.group_total + row.extra_group_points;
  const extrasValue = row.extra_total_points - row.extra_group_points;
  const koValue =
    row.r32_points + row.r16_points + row.qf_points + row.sf_points +
    row.third_points + row.final_points + row.champion_points;

  return (
    <tr className={`transition hover:bg-gray-50 ${isOwn ? "bg-[var(--iberdrola-green-light)]/40" : ""}`}>
      <td className="px-3 py-3 text-center">
        <MovementChip movement={row._displayMovement} value={row._displayMovementValue} />
      </td>
      <td className="px-3 py-3 text-center font-bold tabular-nums text-[var(--iberdrola-forest)]/70">
        {row._displayPosition}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate font-semibold text-[var(--iberdrola-forest)]">{row.name}</span>
          {isOwn && (
            <span className="shrink-0 rounded-md bg-[var(--iberdrola-green)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
              Tú
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-center">
        <CountryFlag country={row.country} />
      </td>
      <td className={`px-3 py-3 text-right tabular-nums ${sortKey === "groups" ? "font-bold" : "text-[var(--iberdrola-forest)]/65"}`}>
        {fmtPts(groupsValue, locale)}
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-[var(--iberdrola-forest)]/65">
        {fmtPts(koValue, locale)}
      </td>
      <td className={`px-3 py-3 text-right tabular-nums ${sortKey === "extras" ? "font-bold" : "text-[var(--iberdrola-forest)]/65"}`}>
        {fmtPts(extrasValue, locale)}
      </td>
      <td className={`px-3 py-3 text-right tabular-nums ${sortKey === "total" ? "text-base font-black text-[var(--iberdrola-forest)]" : "font-bold text-[var(--iberdrola-forest)]"}`}>
        {fmtPts(row.total_points, locale)}
      </td>
    </tr>
  );
}

// Card móvil
function MobileCard({
  row,
  sortKey,
  locale,
  isOwn,
}: {
  row: any;
  sortKey: SortKey;
  locale: Locale;
  isOwn: boolean;
}) {
  const groupsValue = row.group_total + row.extra_group_points;
  const extrasValue = row.extra_total_points - row.extra_group_points;
  const koValue =
    row.r32_points + row.r16_points + row.qf_points + row.sf_points +
    row.third_points + row.final_points + row.champion_points;
  const totalShown = sortKey === "groups"
    ? groupsValue
    : sortKey === "extras"
    ? extrasValue
    : row.total_points;

  return (
    <div className={`px-4 py-3 ${isOwn ? "bg-[var(--iberdrola-green-light)]/40" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-10 text-center">
          <span className="text-base font-black tabular-nums text-[var(--iberdrola-forest)]/60">
            {row._displayPosition}
          </span>
        </div>
        <div className="shrink-0">
          <MovementChip movement={row._displayMovement} value={row._displayMovementValue} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate text-sm font-bold text-[var(--iberdrola-forest)]">{row.name}</span>
            <CountryFlag country={row.country} />
            {isOwn && (
              <span className="shrink-0 rounded-md bg-[var(--iberdrola-green)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                Tú
              </span>
            )}
          </div>
          <div className="mt-0.5 flex gap-3 text-[11px] text-[var(--iberdrola-forest)]/50 tabular-nums">
            <span>G {fmtPts(groupsValue, locale)}</span>
            <span>KO {fmtPts(koValue, locale)}</span>
            <span>X {fmtPts(extrasValue, locale)}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-black tabular-nums text-[var(--iberdrola-forest)]">
            {fmtPts(totalShown, locale)}
          </div>
          <div className="text-[9px] uppercase tracking-wide text-[var(--iberdrola-forest)]/40">pts</div>
        </div>
      </div>
    </div>
  );
}
