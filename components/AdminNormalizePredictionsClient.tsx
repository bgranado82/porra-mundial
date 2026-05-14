"use client";

import { useCallback, useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import { createClient } from "@/utils/supabase/client";
import { EXTRA_QUESTIONS, ExtraQuestionKey } from "@/lib/extraQuestions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Row = {
  entry_id: string;
  predicted_value: string;
  normalized_value: string | null;
  name: string;
  entry_number: number | null;
  status: string;
};

type Pool = { id: string; name: string };
type StatusFilter = "submitted" | "draft" | "all";

const EXTRA_LABELS: Record<ExtraQuestionKey, string> = {
  first_goal_scorer_world: "🥇 Primer goleador del Mundial",
  first_goal_scorer_spain: "🇪🇸 Primer goleador de España",
  golden_boot:             "👟 Bota de Oro",
  golden_ball:             "🏆 Balón de Oro",
  best_young_player:       "🌟 Mejor jugador joven",
  golden_glove:            "🧤 Guante de Oro",
  top_spanish_scorer:      "🇪🇸 Máximo goleador de España",
};

// ─── NormalizedCell: edición inline ──────────────────────────────────────────

function NormalizedCell({
  row,
  questionKey,
  onSaved,
  compact = false,
}: {
  row: Row;
  questionKey: ExtraQuestionKey;
  onSaved: (entryId: string, newValue: string) => void;
  compact?: boolean;
}) {
  const current = row.normalized_value ?? "";
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(current);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  async function save() {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === current) { setEditing(false); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/normalize-extra", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionKey, entryIds: [row.entry_id], normalizedValue: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      onSaved(row.entry_id, trimmed);
      setEditing(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") { setEditing(false); setValue(current); }
            }}
            className={`min-w-0 flex-1 rounded-lg border border-[var(--iberdrola-green)] px-2 py-1.5 font-mono text-[var(--iberdrola-forest)] focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)] ${compact ? "text-sm" : "text-xs"}`}
          />
          <button onClick={save} disabled={saving}
            className="shrink-0 rounded-lg bg-[var(--iberdrola-green)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
            {saving ? "…" : "✓"}
          </button>
          <button onClick={() => { setEditing(false); setValue(current); }}
            className="shrink-0 rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-400">
            ✕
          </button>
        </div>
        {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => { setValue(current); setEditing(true); }}
      className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-[var(--iberdrola-green-light)] transition w-full text-left"
    >
      <code className={`font-mono text-[var(--iberdrola-forest)] ${compact ? "text-sm" : "text-xs"} ${!current ? "italic text-gray-400" : ""}`}>
        {current || "vacío"}
      </code>
      <span className="text-[10px] text-[var(--iberdrola-forest)]/30 group-hover:text-[var(--iberdrola-green)] ml-auto shrink-0">✏️</span>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminNormalizePredictionsClient() {
  const supabase = createClient();

  const [pools, setPools]                       = useState<Pool[]>([]);
  const [selectedPoolId, setSelectedPoolId]     = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<ExtraQuestionKey>(EXTRA_QUESTIONS[0].key);
  const [statusFilter, setStatusFilter]         = useState<StatusFilter>("submitted");

  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [bulkValue, setBulkValue]     = useState("");
  const [bulkSaving, setBulkSaving]   = useState(false);
  const [bulkError, setBulkError]     = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");

  const [search, setSearch] = useState("");

  // Cargar pools
  useEffect(() => {
    supabase.from("pools").select("id, name").order("name").then(({ data }) => {
      if (data) { setPools(data as Pool[]); if (data.length) setSelectedPoolId(data[0].id); }
    });
  }, [supabase]);

  // Cargar filas
  const load = useCallback(async (q: ExtraQuestionKey, pool: string, status: StatusFilter) => {
    if (!pool) return;
    setLoading(true); setError(""); setRows([]); setSelected(new Set());
    setBulkValue(""); setBulkError(""); setBulkSuccess(""); setSearch("");
    try {
      const res = await fetch(`/api/admin/normalize-extra?questionKey=${q}&poolId=${pool}&statusFilter=${status}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRows(data.rows ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (selectedPoolId) load(selectedQuestion, selectedPoolId, statusFilter);
  }, [selectedQuestion, selectedPoolId, statusFilter, load]);

  function handleSaved(entryId: string, newValue: string) {
    setRows(prev => prev.map(r => r.entry_id === entryId ? { ...r, normalized_value: newValue } : r));
  }

  function toggleRow(entryId: string) {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(entryId) ? n.delete(entryId) : n.add(entryId);
      return n;
    });
  }

  // filteredRows se declara antes de toggleAll para que toggleAll lo pueda usar
  const filteredRows = search.trim()
    ? rows.filter(r => {
        const q = search.trim().toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.predicted_value.toLowerCase().includes(q) ||
          (r.normalized_value ?? "").toLowerCase().includes(q)
        );
      })
    : rows;

  function toggleAll() {
    const visibleIds = filteredRows.map(r => r.entry_id);
    setSelected(prev =>
      visibleIds.every(id => prev.has(id)) ? new Set() : new Set(visibleIds)
    );
  }

  async function handleBulkSave() {
    if (!bulkValue.trim()) { setBulkError("Escribe el valor primero."); return; }
    if (selected.size === 0) { setBulkError("Selecciona al menos una fila."); return; }
    setBulkSaving(true); setBulkError(""); setBulkSuccess("");
    try {
      const res = await fetch("/api/admin/normalize-extra", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionKey: selectedQuestion,
          entryIds: Array.from(selected),
          normalizedValue: bulkValue.trim().toLowerCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const v = bulkValue.trim().toLowerCase();
      setRows(prev => prev.map(r => selected.has(r.entry_id) ? { ...r, normalized_value: v } : r));
      const count = selected.size;
      setSelected(new Set()); setBulkValue("");
      setBulkSuccess(`✅ ${count} filas actualizadas y puntuaciones recalculadas.`);
    } catch (e: any) { setBulkError(e.message); }
    finally { setBulkSaving(false); }
  }

  const allVisibleSelected = filteredRows.length > 0 && filteredRows.every(r => selected.has(r.entry_id));

  return (
    <div className="min-h-screen bg-[var(--iberdrola-green-light)]">
      <main className="mx-auto max-w-[1100px] space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6">

        {/* ── Header ── */}
        <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm p-4 sm:p-6">
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--iberdrola-forest)]/45">Administración</div>
          <h1 className="mt-1 text-xl font-black text-[var(--iberdrola-forest)] sm:text-2xl">
            Normalización de extras
          </h1>
          <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/60">
            Edita el <span className="font-bold">valor normalizado</span> sin tocar lo que escribió cada participante.
          </p>
          <div className="mt-4"><AdminNav /></div>
        </section>

        {/* ── Filtros ── */}
        <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm p-4 space-y-4">

          {/* Pool + Status */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Pool</label>
              <select value={selectedPoolId} onChange={e => setSelectedPoolId(e.target.value)}
                className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2.5 text-sm font-semibold text-[var(--iberdrola-forest)]">
                {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="sm:w-52">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Entradas</label>
              <div className="flex overflow-hidden rounded-xl border border-[var(--iberdrola-green)]">
                {(["submitted", "draft", "all"] as StatusFilter[]).map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`flex-1 py-2.5 text-xs font-bold transition ${statusFilter === s ? "bg-[var(--iberdrola-green)] text-white" : "bg-white text-[var(--iberdrola-forest)] hover:bg-[var(--iberdrola-green-light)]"}`}>
                    {s === "submitted" ? "Enviadas" : s === "draft" ? "Borradores" : "Todas"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pregunta — scroll horizontal en móvil */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Pregunta</label>
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div className="flex gap-2 pb-1" style={{ minWidth: "max-content" }}>
                {EXTRA_QUESTIONS.map(q => (
                  <button key={q.key} onClick={() => setSelectedQuestion(q.key)}
                    className={`shrink-0 rounded-2xl border px-4 py-2 text-sm font-bold transition ${selectedQuestion === q.key ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green)] text-white" : "border-[var(--iberdrola-sky)] bg-white text-[var(--iberdrola-forest)]"}`}>
                    {EXTRA_LABELS[q.key]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Barra de edición en bloque ── */}
        {selected.size > 0 && (
          <section className="rounded-2xl border-2 border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)] p-4 space-y-3">
            <p className="text-sm font-black text-[var(--iberdrola-forest)]">
              {selected.size} {selected.size === 1 ? "fila seleccionada" : "filas seleccionadas"}
            </p>
            <input
              type="text"
              value={bulkValue}
              onChange={e => setBulkValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleBulkSave(); }}
              placeholder="Nuevo valor normalizado (ej: kylian mbappe)"
              className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-3 text-sm font-mono text-[var(--iberdrola-forest)] focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)]"
            />
            <div className="flex gap-2">
              <button onClick={handleBulkSave} disabled={bulkSaving || !bulkValue.trim()}
                className="flex-1 rounded-2xl bg-[var(--iberdrola-green)] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                {bulkSaving ? "Guardando..." : "✅ Aplicar y recalcular"}
              </button>
              <button onClick={() => setSelected(new Set())}
                className="shrink-0 rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)]">
                Cancelar
              </button>
            </div>
            {bulkError && <p className="text-sm font-semibold text-red-600">{bulkError}</p>}
          </section>
        )}

        {bulkSuccess && (
          <div className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)] px-4 py-3 text-sm font-semibold text-[var(--iberdrola-forest)]">
            {bulkSuccess}
          </div>
        )}

        {/* ── Lista de participantes ── */}
        <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm overflow-hidden">

          {/* Cabecera con buscador */}
          <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-black text-[var(--iberdrola-forest)]">
                {search.trim()
                  ? `${filteredRows.length} de ${rows.length} participantes`
                  : `${rows.length} participantes`}
              </h2>
              <button onClick={() => load(selectedQuestion, selectedPoolId, statusFilter)}
                className="shrink-0 rounded-xl border border-[var(--iberdrola-sky)] bg-white px-3 py-2 text-xs font-bold text-[var(--iberdrola-forest)] hover:bg-[var(--iberdrola-sand)]/50">
                🔄
              </button>
            </div>
            {/* Buscador en su propia fila, ancho completo */}
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--iberdrola-forest)]/40">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre o valor…"
                className="w-full rounded-xl border border-[var(--iberdrola-sky)] pl-9 pr-9 py-2.5 text-sm font-semibold text-[var(--iberdrola-forest)] focus:outline-none focus:border-[var(--iberdrola-green)] focus:ring-1 focus:ring-[var(--iberdrola-green)]"
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-3 flex items-center text-[var(--iberdrola-forest)]/40 hover:text-[var(--iberdrola-forest)]">
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Estados vacíos */}
          {loading && (
            <div className="p-10 text-center text-sm text-[var(--iberdrola-forest)]/50">Cargando...</div>
          )}
          {!loading && error && (
            <div className="p-4 text-sm font-semibold text-red-600">{error}</div>
          )}
          {!loading && !error && rows.length === 0 && (
            <div className="p-10 text-center text-sm text-[var(--iberdrola-forest)]/50">
              No hay predicciones para esta combinación.
            </div>
          )}
          {!loading && !error && rows.length > 0 && filteredRows.length === 0 && (
            <div className="p-10 text-center text-sm text-[var(--iberdrola-forest)]/50">
              Ningún resultado para «{search}».
            </div>
          )}

          {!loading && filteredRows.length > 0 && (
            <>
              {/* ── DESKTOP: tabla ── */}
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)]/30 text-xs font-black uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                      <th className="px-4 py-2.5 text-left w-8">
                        <input type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleAll}
                          className="h-4 w-4 rounded accent-[var(--iberdrola-green)]" />
                      </th>
                      <th className="px-3 py-2.5 text-left w-12">#</th>
                      <th className="px-3 py-2.5 text-left">Participante</th>
                      <th className="px-3 py-2.5 text-left">Lo que escribió</th>
                      <th className="px-3 py-2.5 text-left">Valor normalizado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--iberdrola-sky)]">
                    {filteredRows.map(row => (
                      <tr key={row.entry_id}
                        className={`transition ${selected.has(row.entry_id) ? "bg-[var(--iberdrola-green-light)]" : "hover:bg-[var(--iberdrola-sand)]/20"}`}>
                        <td className="px-4 py-2.5">
                          <input type="checkbox" checked={selected.has(row.entry_id)} onChange={() => toggleRow(row.entry_id)}
                            className="h-4 w-4 rounded accent-[var(--iberdrola-green)]" />
                        </td>
                        <td className="px-3 py-2.5 text-[var(--iberdrola-forest)]/50 font-mono text-xs">
                          {row.entry_number != null ? `#${row.entry_number}` : "—"}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-[var(--iberdrola-forest)]">
                          {row.name}
                          {row.status === "draft" && (
                            <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">borrador</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-[var(--iberdrola-forest)]/65 text-sm">
                          {row.predicted_value}
                        </td>
                        <td className="px-3 py-2.5">
                          <NormalizedCell row={row} questionKey={selectedQuestion} onSaved={handleSaved} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── MÓVIL: tarjetas ── */}
              <div className="md:hidden">
                {/* Seleccionar todo en móvil */}
                <div className="flex items-center gap-3 border-b border-[var(--iberdrola-sky)] px-4 py-2.5 bg-[var(--iberdrola-sand)]/20">
                  <input type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded accent-[var(--iberdrola-green)]" />
                  <span className="text-xs font-bold text-[var(--iberdrola-forest)]/60 uppercase tracking-wide">
                    Seleccionar todos ({filteredRows.length})
                  </span>
                </div>
                <div className="divide-y divide-[var(--iberdrola-sky)]">
                  {filteredRows.map(row => (
                    <div key={row.entry_id}
                      className={`px-4 py-3 transition ${selected.has(row.entry_id) ? "bg-[var(--iberdrola-green-light)]" : ""}`}>
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <input type="checkbox"
                          checked={selected.has(row.entry_id)}
                          onChange={() => toggleRow(row.entry_id)}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[var(--iberdrola-green)]" />
                        <div className="min-w-0 flex-1 space-y-2">
                          {/* Nombre + número */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {row.entry_number != null && (
                              <span className="text-xs font-mono text-[var(--iberdrola-forest)]/40">#{row.entry_number}</span>
                            )}
                            <span className="font-bold text-[var(--iberdrola-forest)]">{row.name}</span>
                            {row.status === "draft" && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">borrador</span>
                            )}
                          </div>
                          {/* Lo que escribió */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/40">Lo que escribió</span>
                            <p className="mt-0.5 text-sm text-[var(--iberdrola-forest)]/70">{row.predicted_value}</p>
                          </div>
                          {/* Valor normalizado editable */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/40">Valor normalizado</span>
                            <div className="mt-0.5">
                              <NormalizedCell row={row} questionKey={selectedQuestion} onSaved={handleSaved} compact />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        {/* ── Nota ── */}
        <section className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-4 text-sm text-[var(--iberdrola-forest)]/60 space-y-1.5">
          <p className="font-bold text-[var(--iberdrola-forest)]">ℹ️ Cómo funciona</p>
          <p>La columna <span className="font-semibold">«Lo que escribió»</span> es solo lectura — nunca se modifica.</p>
          <p>El <span className="font-semibold">valor normalizado</span> es el que compara el motor. Si está vacío, el motor normaliza automáticamente el valor original.</p>
          <p>Al guardar se recalculan las puntuaciones de inmediato.</p>
        </section>

      </main>
    </div>
  );
}
