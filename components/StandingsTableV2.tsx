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
import { countryFlagEmoji } from "@/lib/countryFlags";

// Traducciones locales del componente (no toco lib/i18n.ts para no contaminar
// el sistema global con cosas específicas de esta vista).
const T: Record<Locale, Record<string, string>> = {
  es: {
    you: "Tú",
    yourPosition: "Tu posición",
    search: "Buscar...",
    noResults: "Sin resultados",
    var: "Var.",
    pos: "#",
    player: "Jugador",
    groups: "Grupos",
    total: "TOTAL",
    detailByMatchdays: "Detalle por jornadas de fase de grupos",
    matchday: "Jornada",
    outcomeHits: "Resultados acertados",
    exactHits: "Marcadores exactos",
    company: "Empresa",
    koHits: "Aciertos en eliminatorias",
    showDetail: "Ver detalle",
    hideDetail: "Ocultar detalle",
    expandAll: "Desplegar todo",
    collapseAll: "Contraer todo",
    // tooltips iconos extras
    extraGoalWorld: "Primer goleador del Mundial",
    extraGoalSpain: "Primer goleador de España",
    extraBoot: "Bota de Oro",
    extraBall: "Balón de Oro",
    extraGlove: "Guante de Oro",
    extraYoung: "Mejor jugador joven",
    extraTopSpain: "Máximo goleador español",
    // tooltips KO
    r32: "Octavos de final",
    r16: "Cuartos de final",
    qf: "Cuartos",
    sf: "Semifinales",
    final: "Final",
    champ: "Campeón",
  },
  en: {
    you: "You",
    yourPosition: "Your position",
    search: "Search...",
    noResults: "No results",
    var: "Var.",
    pos: "#",
    player: "Player",
    groups: "Groups",
    total: "TOTAL",
    detailByMatchdays: "Group stage detail by matchday",
    matchday: "Matchday",
    outcomeHits: "Correct outcomes",
    exactHits: "Exact scores",
    company: "Company",
    koHits: "Knockout round hits",
    showDetail: "Show detail",
    hideDetail: "Hide detail",
    expandAll: "Expand all",
    collapseAll: "Collapse all",
    extraGoalWorld: "First goal scorer of the World Cup",
    extraGoalSpain: "First goal scorer for Spain",
    extraBoot: "Golden Boot",
    extraBall: "Golden Ball",
    extraGlove: "Golden Glove",
    extraYoung: "Best young player",
    extraTopSpain: "Top Spanish scorer",
    r32: "Round of 32",
    r16: "Round of 16",
    qf: "Quarter-finals",
    sf: "Semi-finals",
    final: "Final",
    champ: "Champion",
  },
  pt: {
    you: "Você",
    yourPosition: "Sua posição",
    search: "Buscar...",
    noResults: "Sem resultados",
    var: "Var.",
    pos: "#",
    player: "Jogador",
    groups: "Grupos",
    total: "TOTAL",
    detailByMatchdays: "Detalhe por rodada da fase de grupos",
    matchday: "Rodada",
    outcomeHits: "Resultados acertados",
    exactHits: "Placares exatos",
    company: "Empresa",
    koHits: "Acertos nos mata-mata",
    showDetail: "Ver detalhe",
    hideDetail: "Ocultar detalhe",
    expandAll: "Expandir tudo",
    collapseAll: "Contrair tudo",
    extraGoalWorld: "Primeiro gol da Copa",
    extraGoalSpain: "Primeiro gol da Espanha",
    extraBoot: "Chuteira de Ouro",
    extraBall: "Bola de Ouro",
    extraGlove: "Luva de Ouro",
    extraYoung: "Melhor jovem jogador",
    extraTopSpain: "Artilheiro espanhol",
    r32: "Oitavas de final",
    r16: "Quartas de final",
    qf: "Quartas",
    sf: "Semifinais",
    final: "Final",
    champ: "Campeão",
  },
};

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

// Variación: pastilla coloreada llamativa.
// Verde brillante para subir, rojo brillante para bajar, gris para igual.
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

// Bandera emoji (renderizado nativo, sin URL externa)
function CountryFlag({ country }: { country?: string }) {
  const emoji = countryFlagEmoji(country);
  if (!emoji) {
    return (
      <span
        className="inline-block h-4 w-5 rounded-sm bg-gray-200 align-middle"
        title={country || "—"}
        aria-label={country || ""}
      />
    );
  }
  return (
    <span
      className="text-base leading-none align-middle"
      title={country || ""}
      aria-label={country || ""}
    >
      {emoji}
    </span>
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

// Heatmap por posición (idéntico al componente antiguo): tramos discretos
// según ratio (position-1)/(totalRows-1). Verde = arriba, rojo = abajo.
function getRankHeatClass(position: number, totalRows: number): string {
  if (totalRows <= 1) return "bg-green-50 text-green-900";
  const ratio = (position - 1) / (totalRows - 1);
  if (ratio <= 0.2) return "bg-green-100 text-green-900";
  if (ratio <= 0.4) return "bg-lime-100 text-lime-900";
  if (ratio <= 0.6) return "bg-yellow-100 text-yellow-900";
  if (ratio <= 0.8) return "bg-orange-100 text-orange-900";
  return "bg-red-100 text-red-900";
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────
export default function StandingsTableV2({ days, standings, locale = "es", entryId }: Props) {
  const t = messages[locale];
  const tBase = T[locale];
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Jornadas ordenadas (las que tengan al menos 1 punto en algún jugador, o todas si días viene)
  const sortedDays = useMemo(() => [...(days ?? [])].sort((a, b) => a - b), [days]);

  // Único orden: por total (lo que ya viene calculado del backend).
  const sortedStandings = useMemo(() => {
    return standings.map((row) => ({
      ...row,
      _displayPosition: row.position,
      _displayMovement: row.movement,
      _displayMovementValue: row.movement_value,
    }));
  }, [standings]);

  const totalRows = sortedStandings.length;

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

  // Estado: si todas las filas visibles están expandidas o no
  const expandableIds = useMemo(() => (search ? filteredStandings : filteredStandings).map((r) => r.entry_id), [filteredStandings, search]);
  const allExpanded = expandableIds.length > 0 && expandableIds.every((id) => expandedIds.has(id));

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(expandableIds));
    }
  };

  return (
    <section className="space-y-4">
      {/* CONTROLES: botón desplegar/contraer (izquierda) + búsqueda (derecha) */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleAll}
          className="shrink-0 rounded-full border border-[var(--iberdrola-green-mid)] bg-white px-3 py-2 text-xs font-bold text-[var(--iberdrola-forest)]/70 transition hover:border-[var(--iberdrola-green)] hover:text-[var(--iberdrola-green)]"
          title={allExpanded ? tBase.collapseAll : tBase.expandAll}
        >
          {allExpanded ? `− ${tBase.collapseAll}` : `+ ${tBase.expandAll}`}
        </button>
        <div className="relative flex-1 sm:max-w-72 sm:ml-auto sm:flex-none">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--iberdrola-forest)]/40">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tBase.search}
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

      {/* DESKTOP: tabla / MÓVIL: cards */}
      <div className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block max-h-[75vh] overflow-auto">
          <table className="w-full text-[12px]" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 60 }} />{/* Var */}
              <col style={{ width: 36 }} />{/* # */}
              <col style={{ width: 28 }} />{/* Bandera */}
              <col style={{ width: 160 }} />{/* Jugador */}
              <col />{/* Grupos */}
              <col />{/* R32 */}
              <col />{/* R16 */}
              <col />{/* QF */}
              <col />{/* SF */}
              <col />{/* Final */}
              <col />{/* Camp. */}
              <col />{/* X1 */}
              <col />{/* X2 */}
              <col />{/* X3 */}
              <col />{/* X4 */}
              <col />{/* X5 */}
              <col />{/* X6 */}
              <col />{/* X7 */}
              <col style={{ width: 70 }} />{/* Total */}
            </colgroup>
            <thead className="sticky top-0 z-10 bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/60 shadow-sm">
              <tr>
                <th className="px-1 py-3 text-center">{tBase.var}</th>
                <th className="px-1 py-3 text-center">{tBase.pos}</th>
                <th className="px-1 py-3 text-center"></th>
                <th className="px-2 py-3 text-left">{tBase.player}</th>
                <th className="px-1 py-3 text-center" title={tBase.groups}>{tBase.groups}</th>
                <th className="px-1 py-3 text-center" title={tBase.r32}>R32</th>
                <th className="px-1 py-3 text-center" title={tBase.r16}>R16</th>
                <th className="px-1 py-3 text-center" title={tBase.qf}>QF</th>
                <th className="px-1 py-3 text-center" title={tBase.sf}>SF</th>
                <th className="px-1 py-3 text-center" title={tBase.final}>F</th>
                <th className="px-1 py-3 text-center" title={tBase.champ}>C</th>
                <th className="px-1 py-3 text-center" title={tBase.extraGoalWorld}>🥇⚽</th>
                <th className="px-1 py-3 text-center" title={tBase.extraGoalSpain}>🥇⚽</th>
                <th className="px-1 py-3 text-center" title={tBase.extraBoot}>👟✨</th>
                <th className="px-1 py-3 text-center" title={tBase.extraBall}>🏆🌟</th>
                <th className="px-1 py-3 text-center" title={tBase.extraGlove}>🧤🥇</th>
                <th className="px-1 py-3 text-center" title={tBase.extraYoung}>🧒🔥</th>
                <th className="px-1 py-3 text-center" title={tBase.extraTopSpain}>🎯</th>
                <th className="bg-[var(--iberdrola-green)]/10 px-1 py-3 text-center font-black text-[var(--iberdrola-green)]">{tBase.total}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStandings.map((row) => (
                <DesktopRow
                  key={row.entry_id}
                  row={row}
                  totalRows={totalRows}
                  sortedDays={sortedDays}
                  isExpanded={expandedIds.has(row.entry_id)}
                  onToggleExpand={() => toggleExpanded(row.entry_id)}
                  locale={locale}
                  isOwn={row.entry_id === entryId}
                />
              ))}
              {filteredStandings.length === 0 && (
                <tr>
                  <td colSpan={19} className="px-3 py-8 text-center text-sm text-[var(--iberdrola-forest)]/40">
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Móvil */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredStandings.map((row) => (
            <MobileCard
              key={row.entry_id}
              row={row}
              totalRows={totalRows}
              sortedDays={sortedDays}
              isExpanded={expandedIds.has(row.entry_id)}
              onToggleExpand={() => toggleExpanded(row.entry_id)}
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
  const tx = T[locale];
  return (
    <div className="rounded-xl border border-[var(--iberdrola-green)]/40 bg-white px-3 py-2">
      <div className="flex items-center gap-3">
        <div className="shrink-0 text-[9px] font-black uppercase tracking-wider text-[var(--iberdrola-green)]">
          {tx.you}
        </div>
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <MovementChip movement={row._displayMovement} value={row._displayMovementValue} />
          <span className="shrink-0 text-sm font-black tabular-nums text-[var(--iberdrola-forest)]/70">#{row._displayPosition}</span>
          <CountryFlag country={row.country} />
          <span className="truncate text-sm font-semibold text-[var(--iberdrola-forest)]">{row.name}</span>
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

// Fila desktop: principal + (opcional) fila de detalle expandida con jornadas
function DesktopRow({
  row,
  totalRows,
  sortedDays,
  isExpanded,
  onToggleExpand,
  locale,
  isOwn,
}: {
  row: any;
  totalRows: number;
  sortedDays: number[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  locale: Locale;
  isOwn: boolean;
}) {
  const tx = T[locale];
  const groupsValue = row.group_total + row.extra_group_points;

  // Celda numérica: blanca, sólo el número (gris claro si 0)
  const numCell = (value: number) => (
    <td className="px-1 py-2.5 text-center tabular-nums">
      <span className={value > 0 ? "font-semibold text-[var(--iberdrola-forest)]" : "text-[var(--iberdrola-forest)]/25"}>
        {fmtPts(value, locale)}
      </span>
    </td>
  );

  const totalHeatClass = getRankHeatClass(row._displayPosition, totalRows);
  // Fondo de medalla en top 3 (oro/plata/bronce) que prevalece sobre el isOwn
  const podiumBg = podiumRowClasses(row._displayPosition);
  const rowBgClass = podiumBg
    ? podiumBg
    : isOwn
    ? "bg-[var(--iberdrola-green-light)]/30"
    : "";

  return (
    <>
      <tr className={`transition hover:bg-gray-50 ${rowBgClass}`}>
        <td className="px-1 py-2.5 text-center">
          <MovementChip movement={row._displayMovement} value={row._displayMovementValue} />
        </td>
        <td className="px-1 py-2.5 text-center font-bold tabular-nums text-[var(--iberdrola-forest)]/70">
          {row._displayPosition <= 3 ? (
            <PodiumMedal position={row._displayPosition} />
          ) : (
            row._displayPosition
          )}
        </td>
        <td className="px-1 py-2.5 text-center">
          <CountryFlag country={row.country} />
        </td>
        <td className="px-2 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate font-semibold text-[var(--iberdrola-forest)]">{row.name}</span>
            {isOwn && (
              <span className="shrink-0 rounded-md bg-[var(--iberdrola-green)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                Tú
              </span>
            )}
          </div>
        </td>
        {/* Grupos con botón + para expandir detalle por jornadas */}
        <td className="px-1 py-2.5 text-center tabular-nums">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={onToggleExpand}
              className={`flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-black transition ${
                isExpanded
                  ? "bg-[var(--iberdrola-green)] text-white"
                  : "border border-[var(--iberdrola-green)]/30 text-[var(--iberdrola-green)] hover:bg-[var(--iberdrola-green-light)]/40"
              }`}
              aria-label={isExpanded ? "Ocultar detalle" : "Ver detalle por jornadas"}
              title={isExpanded ? "Ocultar detalle" : "Ver detalle por jornadas"}
            >
              {isExpanded ? "−" : "+"}
            </button>
            <span className={groupsValue > 0 ? "font-semibold text-[var(--iberdrola-forest)]" : "text-[var(--iberdrola-forest)]/25"}>
              {fmtPts(groupsValue, locale)}
            </span>
          </div>
        </td>
        {numCell(row.r32_points)}
        {numCell(row.r16_points)}
        {numCell(row.qf_points)}
        {numCell(row.sf_points)}
        {numCell(row.final_points)}
        {numCell(row.champion_points)}
        {numCell(row.extra_points?.first_goal_scorer_world ?? 0)}
        {numCell(row.extra_points?.first_goal_scorer_spain ?? 0)}
        {numCell(row.extra_points?.golden_boot ?? 0)}
        {numCell(row.extra_points?.golden_ball ?? 0)}
        {numCell(row.extra_points?.golden_glove ?? 0)}
        {numCell(row.extra_points?.best_young_player ?? 0)}
        {numCell(row.extra_points?.top_spanish_scorer ?? 0)}
        {/* TOTAL con heatmap por posición */}
        <td className={`border-l-2 border-[var(--iberdrola-green)]/20 px-1 py-2.5 text-center tabular-nums ${totalHeatClass}`}>
          <span className="text-base font-black">
            {fmtPts(row.total_points, locale)}
          </span>
        </td>
      </tr>

      {/* Fila expandida: detalle por jornadas + aciertos KO */}
      {isExpanded && (
        <tr className={isOwn ? "bg-[var(--iberdrola-green-light)]/15" : "bg-gray-50/60"}>
          <td colSpan={19} className="px-4 py-3">
            <div className="space-y-3">
              <div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--iberdrola-forest)]/50">
                  {tx.detailByMatchdays}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sortedDays.map((day) => {
                    const pts = row.day_points?.[String(day)] ?? 0;
                    let cellClass = "bg-gray-100 text-gray-400";
                    if (pts >= 5) cellClass = "bg-green-200 text-green-900 font-bold";
                    else if (pts >= 3) cellClass = "bg-lime-100 text-lime-900 font-semibold";
                    else if (pts >= 1) cellClass = "bg-yellow-50 text-yellow-800";
                    return (
                      <div
                        key={day}
                        className={`flex min-w-[44px] flex-col items-center rounded-md px-2 py-1 text-[10px] tabular-nums ${cellClass}`}
                        title={`${tx.matchday} ${day}: ${pts} pts`}
                      >
                        <span className="text-[9px] uppercase opacity-60">J{day}</span>
                        <span className="text-sm font-black">{fmtPts(pts, locale)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--iberdrola-forest)]/65">
                <span>{tx.outcomeHits}: <strong>{row.outcome_hits}</strong> ({row.outcome_percent}%)</span>
                <span>{tx.exactHits}: <strong>{row.exact_hits}</strong> ({row.exact_percent}%)</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--iberdrola-forest)]/50">
                  {tx.koHits}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--iberdrola-forest)]/75">
                  <KoStat label={tx.r32} hits={row.ko_r32_hits} total={row.ko_r32_total} />
                  <KoStat label={tx.r16} hits={row.ko_r16_hits} total={row.ko_r16_total} />
                  <KoStat label={tx.qf} hits={row.ko_qf_hits} total={row.ko_qf_total} />
                  <KoStat label={tx.sf} hits={row.ko_sf_hits} total={row.ko_sf_total} />
                  <KoStat label={tx.final} hits={row.ko_final_hits} total={row.ko_final_total} />
                  <KoStat label={tx.champ} hits={row.ko_champ_hits} total={row.ko_champ_total} />
                </div>
              </div>
              {row.company && (
                <div className="border-t border-gray-200 pt-2 text-[11px] text-[var(--iberdrola-forest)]/50">
                  {tx.company}: <strong className="text-[var(--iberdrola-forest)]/75">{row.company}</strong>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Helper para los stats KO del detalle expandido
function KoStat({ label, hits, total }: { label: string; hits: number; total: number }) {
  if (!total || total === 0) {
    return (
      <span className="text-[var(--iberdrola-forest)]/30">
        {label}: —
      </span>
    );
  }
  return (
    <span>
      {label}: <strong>{hits ?? 0}</strong>/{total}
    </span>
  );
}

// Card móvil
function MobileCard({
  row,
  totalRows,
  sortedDays,
  isExpanded,
  onToggleExpand,
  locale,
  isOwn,
}: {
  row: any;
  totalRows: number;
  sortedDays: number[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  locale: Locale;
  isOwn: boolean;
}) {
  const tx = T[locale];
  const groupsValue = row.group_total + row.extra_group_points;
  const extrasValue = row.extra_total_points - row.extra_group_points;
  const koValue =
    row.r32_points + row.r16_points + row.qf_points + row.sf_points +
    row.third_points + row.final_points + row.champion_points;
  const totalHeatClass = getRankHeatClass(row._displayPosition, totalRows);
  const podiumBg = podiumRowClasses(row._displayPosition);
  const cardBgClass = podiumBg
    ? podiumBg
    : isOwn
    ? "bg-[var(--iberdrola-green-light)]/30"
    : "";

  return (
    <div className={`px-3 py-2.5 ${cardBgClass}`}>
      {/* Línea 1: posición (con medalla en top 3) + bandera + nombre + tú | total con heatmap */}
      <div className="flex items-center gap-2">
        <span className="shrink-0 w-7 text-center text-sm font-black tabular-nums text-[var(--iberdrola-forest)]/60">
          {row._displayPosition <= 3 ? <PodiumMedal position={row._displayPosition} /> : row._displayPosition}
        </span>
        <CountryFlag country={row.country} />
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <span className="truncate text-sm font-bold text-[var(--iberdrola-forest)]">{row.name}</span>
          {isOwn && (
            <span className="shrink-0 rounded-md bg-[var(--iberdrola-green)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
              {tx.you}
            </span>
          )}
        </div>
        <div className={`shrink-0 rounded-md px-2 py-0.5 ${totalHeatClass}`}>
          <span className="text-base font-black tabular-nums">
            {fmtPts(row.total_points, locale)}
          </span>
          <span className="ml-0.5 text-[9px] uppercase tracking-wide opacity-60">pts</span>
        </div>
      </div>
      {/* Línea 2: variación + desglose pequeño + botón expandir */}
      <div className="mt-1 flex items-center gap-2 pl-9">
        <MovementChip movement={row._displayMovement} value={row._displayMovementValue} />
        <span className="text-[10px] text-[var(--iberdrola-forest)]/50 tabular-nums">
          G {fmtPts(groupsValue, locale)} · KO {fmtPts(koValue, locale)} · X {fmtPts(extrasValue, locale)}
        </span>
        <button
          onClick={onToggleExpand}
          className={`ml-auto flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-black transition ${
            isExpanded
              ? "bg-[var(--iberdrola-green)] text-white"
              : "border border-[var(--iberdrola-green)]/30 text-[var(--iberdrola-green)]"
          }`}
          aria-label={isExpanded ? tx.hideDetail : tx.showDetail}
        >
          {isExpanded ? "−" : "+"}
        </button>
      </div>
      {/* Detalle expandido */}
      {isExpanded && (
        <div className="mt-3 rounded-xl bg-white/70 p-3 space-y-3">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--iberdrola-forest)]/50 mb-1.5">
              {tx.detailByMatchdays}
            </div>
            <div className="flex flex-wrap gap-1">
              {sortedDays.map((day) => {
                const pts = row.day_points?.[String(day)] ?? 0;
                let cellClass = "bg-gray-100 text-gray-400";
                if (pts >= 5) cellClass = "bg-green-200 text-green-900 font-bold";
                else if (pts >= 3) cellClass = "bg-lime-100 text-lime-900 font-semibold";
                else if (pts >= 1) cellClass = "bg-yellow-50 text-yellow-800";
                return (
                  <div
                    key={day}
                    className={`flex min-w-[36px] flex-col items-center rounded-md px-1.5 py-1 text-[9px] tabular-nums ${cellClass}`}
                  >
                    <span className="text-[8px] uppercase opacity-60">J{day}</span>
                    <span className="text-xs font-black">{fmtPts(pts, locale)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[var(--iberdrola-forest)]/65">
            <span>{tx.outcomeHits}: <strong>{row.outcome_hits}</strong> ({row.outcome_percent}%)</span>
            <span>{tx.exactHits}: <strong>{row.exact_hits}</strong> ({row.exact_percent}%)</span>
          </div>
          <div className="border-t border-gray-200 pt-2">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--iberdrola-forest)]/50 mb-1.5">
              {tx.koHits}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[var(--iberdrola-forest)]/75">
              <KoStat label={tx.r32} hits={row.ko_r32_hits} total={row.ko_r32_total} />
              <KoStat label={tx.r16} hits={row.ko_r16_hits} total={row.ko_r16_total} />
              <KoStat label={tx.qf} hits={row.ko_qf_hits} total={row.ko_qf_total} />
              <KoStat label={tx.sf} hits={row.ko_sf_hits} total={row.ko_sf_total} />
              <KoStat label={tx.final} hits={row.ko_final_hits} total={row.ko_final_total} />
              <KoStat label={tx.champ} hits={row.ko_champ_hits} total={row.ko_champ_total} />
            </div>
          </div>
          {row.company && (
            <div className="border-t border-gray-200 pt-2 text-[10px] text-[var(--iberdrola-forest)]/50">
              {tx.company}: <strong className="text-[var(--iberdrola-forest)]/75">{row.company}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
