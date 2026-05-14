"use client";

import { useCallback, useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import { EXTRA_QUESTIONS, ExtraQuestionKey } from "@/lib/extraQuestions";

// ─── Types ────────────────────────────────────────────────────────────────────

type EntryInfo = {
  entry_id: string;
  name: string;
  email: string;
  entry_number: number | null;
};

type Variant = {
  value: string;
  count: number;
  entries: EntryInfo[];
};

// ─── Labels ───────────────────────────────────────────────────────────────────

const EXTRA_LABELS: Record<ExtraQuestionKey, string> = {
  first_goal_scorer_world: "🥇 Primer goleador del Mundial",
  first_goal_scorer_spain: "🇪🇸 Primer goleador de España",
  golden_boot: "👟 Bota de Oro",
  golden_ball: "🏆 Balón de Oro",
  best_young_player: "🌟 Mejor jugador joven",
  golden_glove: "🧤 Guante de Oro",
  top_spanish_scorer: "🇪🇸 Máximo goleador de España",
};

// ─── Small helpers ─────────────────────────────────────────────────────────────

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Returns true when two variant values would be considered equal by the scoring engine. */
function wouldMatch(a: string, b: string) {
  return normalize(a) === normalize(b);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VariantRow({
  variant,
  selected,
  onToggle,
  onRenameAll,
  officialValue,
  questionKey,
}: {
  variant: Variant;
  selected: boolean;
  onToggle: () => void;
  onRenameAll: (entryIds: string[], newValue: string) => void;
  officialValue: string;
  questionKey: ExtraQuestionKey;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState(variant.value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isHit = officialValue ? wouldMatch(variant.value, officialValue) : false;
  const entryIds = variant.entries.map((e) => e.entry_id);

  async function handleSaveEdit() {
    if (!editValue.trim() || editValue.trim() === variant.value) {
      setEditMode(false);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/normalize-extra", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionKey, entryIds, newValue: editValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      onRenameAll(entryIds, editValue.trim());
      setEditMode(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isHit
          ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)]"
          : selected
          ? "border-[var(--iberdrola-sky)] bg-blue-50"
          : "border-[var(--iberdrola-sky)] bg-white"
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Checkbox for bulk selection */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-4 w-4 rounded border-gray-300 accent-[var(--iberdrola-green)]"
          title="Seleccionar para renombrar en bloque"
        />

        {/* Value display / edit */}
        <div className="min-w-0 flex-1">
          {editMode ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") setEditMode(false);
                }}
                className="min-w-0 flex-1 rounded-xl border border-[var(--iberdrola-green)] px-3 py-1.5 text-sm font-semibold text-[var(--iberdrola-forest)] focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)]"
              />
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="shrink-0 rounded-xl bg-[var(--iberdrola-green)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {saving ? "..." : "Guardar"}
              </button>
              <button
                onClick={() => { setEditMode(false); setEditValue(variant.value); }}
                className="shrink-0 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-500"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <span className="text-sm font-bold text-[var(--iberdrola-forest)]">
              {variant.value}
            </span>
          )}
          {error ? (
            <div className="mt-1 text-xs font-semibold text-red-600">{error}</div>
          ) : null}
        </div>

        {/* Badge: hit indicator */}
        {isHit && (
          <span className="shrink-0 rounded-full bg-[var(--iberdrola-green)] px-2.5 py-0.5 text-xs font-black text-white">
            ✓ Match
          </span>
        )}

        {/* Count badge */}
        <span className="shrink-0 rounded-full border border-[var(--iberdrola-sky)] bg-white px-2.5 py-0.5 text-xs font-black text-[var(--iberdrola-forest)]">
          {variant.count} {variant.count === 1 ? "persona" : "personas"}
        </span>

        {/* Edit this value button */}
        {!editMode && (
          <button
            onClick={() => { setEditMode(true); setEditValue(variant.value); }}
            className="shrink-0 rounded-xl border border-[var(--iberdrola-sky)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--iberdrola-forest)] hover:border-[var(--iberdrola-green)] hover:bg-[var(--iberdrola-green-light)] transition"
            title="Editar este valor para todos los que lo han puesto"
          >
            ✏️ Renombrar
          </button>
        )}

        {/* Expand/collapse participants */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded-xl border border-[var(--iberdrola-sky)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--iberdrola-forest)] hover:bg-[var(--iberdrola-sand)]/50 transition"
        >
          {expanded ? "▲ Ocultar" : "▼ Ver quién"}
        </button>
      </div>

      {/* Participants list */}
      {expanded && (
        <div className="border-t border-[var(--iberdrola-sky)] px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {variant.entries.map((entry) => (
              <div
                key={entry.entry_id}
                className="rounded-xl border border-[var(--iberdrola-sky)] bg-white px-3 py-1.5"
              >
                <span className="text-xs font-bold text-[var(--iberdrola-forest)]">
                  {entry.entry_number != null ? `#${entry.entry_number} ` : ""}
                  {entry.name}
                </span>
                {entry.email && (
                  <span className="ml-1 text-xs text-[var(--iberdrola-forest)]/50">
                    ({entry.email})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminNormalizePredictionsClient() {
  const [selectedQuestion, setSelectedQuestion] = useState<ExtraQuestionKey>(
    EXTRA_QUESTIONS[0].key
  );
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  // For bulk rename
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkNewValue, setBulkNewValue] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");

  // ── Load variants ─────────────────────────────────────────────────────────

  const loadVariants = useCallback(async (key: ExtraQuestionKey) => {
    setLoading(true);
    setLoadError("");
    setVariants([]);
    setSelectedIds(new Set());
    setBulkNewValue("");
    setBulkError("");
    setBulkSuccess("");

    try {
      const res = await fetch(
        `/api/admin/normalize-extra?questionKey=${encodeURIComponent(key)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setVariants(data.variants ?? []);
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVariants(selectedQuestion);
  }, [selectedQuestion, loadVariants]);

  // ── Toggle / select logic ─────────────────────────────────────────────────

  function toggleVariant(variant: Variant) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allIds = variant.entries.map((e) => e.entry_id);
      const allSelected = allIds.every((id) => prev.has(id));
      if (allSelected) {
        allIds.forEach((id) => next.delete(id));
      } else {
        allIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function isVariantSelected(variant: Variant) {
    return variant.entries.every((e) => selectedIds.has(e.entry_id));
  }

  // ── Inline rename callback (updates local state without reload) ───────────

  function handleInlineRename(entryIds: string[], newValue: string) {
    setVariants((prev) => {
      const merged: Record<string, Variant> = {};

      for (const v of prev) {
        const remainingEntries = v.entries.filter(
          (e) => !entryIds.includes(e.entry_id)
        );
        const movedEntries = v.entries.filter((e) => entryIds.includes(e.entry_id));

        if (remainingEntries.length > 0) {
          merged[v.value] = { ...v, entries: remainingEntries, count: remainingEntries.length };
        }

        if (movedEntries.length > 0) {
          if (!merged[newValue]) {
            merged[newValue] = { value: newValue, count: 0, entries: [] };
          }
          merged[newValue].entries.push(...movedEntries);
          merged[newValue].count += movedEntries.length;
        }
      }

      return Object.values(merged).sort((a, b) => b.count - a.count);
    });
    setBulkSuccess("✅ Renombrado correctamente y puntuaciones recalculadas.");
  }

  // ── Bulk rename ───────────────────────────────────────────────────────────

  async function handleBulkRename() {
    if (!bulkNewValue.trim()) {
      setBulkError("Escribe el nuevo valor primero.");
      return;
    }
    if (selectedIds.size === 0) {
      setBulkError("Selecciona al menos una variante.");
      return;
    }

    setBulkSaving(true);
    setBulkError("");
    setBulkSuccess("");

    const entryIds = Array.from(selectedIds);

    try {
      const res = await fetch("/api/admin/normalize-extra", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionKey: selectedQuestion, entryIds, newValue: bulkNewValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");

      handleInlineRename(entryIds, bulkNewValue.trim());
      setSelectedIds(new Set());
      setBulkNewValue("");
    } catch (err: any) {
      setBulkError(err.message);
    } finally {
      setBulkSaving(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  // Compute official value hint (the admin sets it in Results page)
  // We don't have it here, but we can highlight variants that have warnings.
  const totalPredictions = variants.reduce((acc, v) => acc + v.count, 0);
  const uniqueValues = variants.length;

  return (
    <div className="min-h-screen bg-[var(--iberdrola-green-light)]">
      <main className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 sm:px-6">

        {/* ── Header ── */}
        <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--iberdrola-forest)]/45">
              Administración · Ibe World Cup 2026
            </div>
            <h1 className="mt-1.5 text-2xl font-black text-[var(--iberdrola-forest)]">
              Normalización de predicciones extra
            </h1>
            <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/65">
              Unifica variantes de texto para que el motor de puntuación las reconozca como el mismo jugador.
              Ej: <span className="font-bold">«Mbappe»</span>, <span className="font-bold">«Kylian»</span> y <span className="font-bold">«Kylian Mbappe»</span> → todos a <span className="font-bold">«Kylian Mbappé»</span>.
            </p>
            <div className="mt-4">
              <AdminNav />
            </div>
          </div>
        </section>

        {/* ── Question selector ── */}
        <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
          <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
            <h2 className="text-base font-black text-[var(--iberdrola-forest)]">
              Pregunta a normalizar
            </h2>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {EXTRA_QUESTIONS.map((q) => (
              <button
                key={q.key}
                onClick={() => setSelectedQuestion(q.key)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all ${
                  selectedQuestion === q.key
                    ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green)] text-white"
                    : "border-[var(--iberdrola-sky)] bg-white text-[var(--iberdrola-forest)] hover:border-[var(--iberdrola-green)] hover:bg-[var(--iberdrola-green-light)]"
                }`}
              >
                {EXTRA_LABELS[q.key]}
              </button>
            ))}
          </div>
        </section>

        {/* ── Stats bar ── */}
        {!loading && variants.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-2.5">
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                Predicciones totales
              </span>
              <span className="ml-2 text-lg font-black text-[var(--iberdrola-forest)]">
                {totalPredictions}
              </span>
            </div>
            <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-2.5">
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                Variantes distintas
              </span>
              <span className="ml-2 text-lg font-black text-[var(--iberdrola-forest)]">
                {uniqueValues}
              </span>
            </div>
            {selectedIds.size > 0 && (
              <div className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)] px-4 py-2.5">
                <span className="text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                  Seleccionadas para renombrar
                </span>
                <span className="ml-2 text-lg font-black text-[var(--iberdrola-forest)]">
                  {selectedIds.size} filas
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Bulk rename toolbar ── */}
        {selectedIds.size > 0 && (
          <section className="rounded-2xl border-2 border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)] shadow-sm">
            <div className="border-b border-[var(--iberdrola-green-mid)] px-4 py-3">
              <h2 className="text-base font-black text-[var(--iberdrola-forest)]">
                Renombrar en bloque — {selectedIds.size} predicciones seleccionadas
              </h2>
              <p className="mt-0.5 text-sm text-[var(--iberdrola-forest)]/65">
                Introduce el valor canónico y pulsa «Aplicar». Se recalculan los puntos automáticamente.
              </p>
            </div>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                  Nuevo valor
                </label>
                <input
                  type="text"
                  value={bulkNewValue}
                  onChange={(e) => setBulkNewValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleBulkRename(); }}
                  placeholder="p. ej. Kylian Mbappé"
                  className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2.5 text-sm font-semibold text-[var(--iberdrola-forest)] focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)]"
                />
              </div>
              <button
                onClick={handleBulkRename}
                disabled={bulkSaving || !bulkNewValue.trim()}
                className="shrink-0 rounded-2xl bg-[var(--iberdrola-green)] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
              >
                {bulkSaving ? "Aplicando..." : "✅ Aplicar y recalcular"}
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="shrink-0 rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--iberdrola-forest)] hover:bg-[var(--iberdrola-sand)]/50 transition"
              >
                Deseleccionar todo
              </button>
            </div>
            {bulkError && (
              <div className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
                {bulkError}
              </div>
            )}
          </section>
        )}

        {/* ── Success banner ── */}
        {bulkSuccess && (
          <div className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)] px-4 py-3 text-sm font-semibold text-[var(--iberdrola-forest)]">
            {bulkSuccess}
          </div>
        )}

        {/* ── Variants list ── */}
        <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
          <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-[var(--iberdrola-forest)]">
                Variantes encontradas
              </h2>
              <p className="mt-0.5 text-sm text-[var(--iberdrola-forest)]/65">
                Marca las variantes incorrectas y usa el renombrado en bloque, o edita cada una individualmente con ✏️.
              </p>
            </div>
            <button
              onClick={() => loadVariants(selectedQuestion)}
              className="shrink-0 rounded-xl border border-[var(--iberdrola-sky)] bg-white px-3 py-2 text-xs font-bold text-[var(--iberdrola-forest)] hover:bg-[var(--iberdrola-sand)]/50 transition"
            >
              🔄 Recargar
            </button>
          </div>

          <div className="space-y-3 p-4">
            {loading && (
              <div className="rounded-2xl border border-[var(--iberdrola-sky)] p-6 text-center text-sm text-[var(--iberdrola-forest)]/50">
                Cargando variantes...
              </div>
            )}

            {!loading && loadError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {loadError}
              </div>
            )}

            {!loading && !loadError && variants.length === 0 && (
              <div className="rounded-2xl border border-[var(--iberdrola-sky)] p-6 text-center text-sm text-[var(--iberdrola-forest)]/50">
                No hay predicciones para esta pregunta todavía.
              </div>
            )}

            {!loading &&
              variants.map((variant) => (
                <VariantRow
                  key={variant.value}
                  variant={variant}
                  selected={isVariantSelected(variant)}
                  onToggle={() => toggleVariant(variant)}
                  onRenameAll={handleInlineRename}
                  officialValue={""}
                  questionKey={selectedQuestion}
                />
              ))}
          </div>
        </section>

        {/* ── Info box ── */}
        <section className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-4 text-sm text-[var(--iberdrola-forest)]/70 space-y-2">
          <p className="font-bold text-[var(--iberdrola-forest)]">ℹ️ Cómo funciona la normalización automática</p>
          <p>
            El motor de puntuación ya aplica una normalización básica al comparar (elimina acentos, convierte a minúsculas y colapsa espacios),
            así que <span className="font-semibold">«Mbappé»</span> y <span className="font-semibold">«mbappe»</span> se consideran iguales.
          </p>
          <p>
            Pero <span className="font-semibold">«Kylian»</span> no matchea con <span className="font-semibold">«Mbappé»</span> porque son cadenas distintas.
            Esta herramienta te permite unificar esas variantes antes de que se cierre el torneo.
          </p>
          <p>
            Cada renombrado recalcula las puntuaciones automáticamente. No hace falta ir a la página de Resultados.
          </p>
        </section>

      </main>
    </div>
  );
}
