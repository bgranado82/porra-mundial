"use client";

import { useCallback, useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import { createClient } from "@/utils/supabase/client";
import { EXTRA_QUESTIONS, ExtraQuestionKey } from "@/lib/extraQuestions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Row = {
  entry_id: string;
  predicted_value: string;   // lo que escribió el usuario — solo lectura
  normalized_value: string | null; // lo que usa el scoring — editable
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

// ─── Inline cell ──────────────────────────────────────────────────────────────

function NormalizedCell({
  row,
  questionKey,
  onSaved,
}: {
  row: Row;
  questionKey: ExtraQuestionKey;
  onSaved: (entryId: string, newValue: string) => void;
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
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setEditing(false); setValue(current); } }}
          className="w-40 rounded-lg border border-[var(--iberdrola-green)] px-2 py-1 text-xs font-mono text-[var(--iberdrola-forest)] focus:outline-none"
        />
        <button onClick={save} disabled={saving}
          className="rounded-lg bg-[var(--iberdrola-green)] px-2 py-1 text-xs font-bold text-white disabled:opacity-50">
          {saving ? "…" : "✓"}
        </button>
        <button onClick={() => { setEditing(false); setValue(current); }}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-400">✕</button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => { setValue(current); setEditing(true); }}
      className="group flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-[var(--iberdrola-green-light)] transition"
      title="Haz clic para editar el valor normalizado"
    >
      <code className="text-xs font-mono text-[var(--iberdrola-forest)]">{current || <span className="text-gray-400 italic">vacío</span>}</code>
      <span className="text-[10px] text-[var(--iberdrola-forest)]/30 group-hover:text-[var(--iberdrola-green)]">✏️</span>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminNormalizePredictionsClient() {
  const supabase = createClient();

  const [pools, setPools]                   = useState<Pool[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<ExtraQuestionKey>(EXTRA_QUESTIONS[0].key);
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>("submitted");

  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Selección para edición en bloque
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [bulkValue, setBulkValue]     = useState("");
  const [bulkSaving, setBulkSaving]   = useState(false);
  const [bulkError, setBulkError]     = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");

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
    setBulkValue(""); setBulkError(""); setBulkSuccess("");
    try {
      const res = await fetch(`/api/admin/normalize-extra?questionKey=${q}&poolId=${pool}&statusFilter=${status}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRows(data.rows ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (selectedPoolId) load(selectedQuestion, selectedPoolId, statusFilter); },
    [selectedQuestion, selectedPoolId, statusFilter, load]);

  function handleSaved(entryId: string, newValue: string) {
    setRows(prev => prev.map(r => r.entry_id === entryId ? { ...r, normalized_value: newValue } : r));
  }

  function toggleRow(entryId: string) {
    setSelected(prev => { const n = new Set(prev); n.has(entryId) ? n.delete(entryId) : n.add(entryId); return n; });
  }
  function toggleAll() {
    setSelected(prev => prev.size === rows.length ? new Set() : new Set(rows.map(r => r.entry_id)));
  }

  async function handleBulkSave() {
    if (!bulkValue.trim()) { setBulkError("Escribe el valor primero."); return; }
    if (selected.size === 0) { setBulkError("Selecciona al menos una fila."); return; }
    setBulkSaving(true); setBulkError(""); setBulkSuccess("");
    try {
      const res = await fetch("/api/admin/normalize-extra", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionKey: selectedQuestion, entryIds: Array.from(selected), normalizedValue: bulkValue.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const v = bulkValue.trim().toLowerCase();
      setRows(prev => prev.map(r => selected.has(r.entry_id) ? { ...r, normalized_value: v } : r));
      setSelected(new Set()); setBulkValue("");
      setBulkSuccess(`✅ ${selected.size} filas actualizadas y puntuaciones recalculadas.`);
    } catch (e: any) { setBulkError(e.message); }
    finally { setBulkSaving(false); }
  }

  return (
    <div className="min-h-screen bg-[var(--iberdrola-green-light)]">
      <main className="mx-auto max-w-[1100px] space-y-6 px-4 py-6 sm:px-6">

        {/* Header */}
        <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm p-4 sm:p-6">
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--iberdrola-forest)]/45">Administración</div>
          <h1 className="mt-1 text-2xl font-black text-[var(--iberdrola-forest)]">Normalización de preguntas extra</h1>
          <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/60">
            Edita el <span className="font-bold">valor normalizado</span> que usa el motor de puntuación sin tocar lo que escribió cada participante.
          </p>
          <div className="mt-4"><AdminNav /></div>
        </section>

        {/* Filtros */}
        <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {/* Pool */}
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Pool</label>
              <select value={selectedPoolId} onChange={e => setSelectedPoolId(e.target.value)}
                className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2.5 text-sm font-semibold text-[var(--iberdrola-forest)]">
                {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {/* Status */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Entradas</label>
              <div className="flex overflow-hidden rounded-xl border border-[var(--iberdrola-green)]">
                {(["submitted","draft","all"] as StatusFilter[]).map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-3 py-2.5 text-xs font-bold transition ${statusFilter === s ? "bg-[var(--iberdrola-green)] text-white" : "bg-white text-[var(--iberdrola-forest)] hover:bg-[var(--iberdrola-green-light)]"}`}>
                    {s === "submitted" ? "Enviadas" : s === "draft" ? "Borradores" : "Todas"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pregunta */}
          <div className="flex flex-wrap gap-2">
            {EXTRA_QUESTIONS.map(q => (
              <button key={q.key} onClick={() => setSelectedQuestion(q.key)}
                className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${selectedQuestion === q.key ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green)] text-white" : "border-[var(--iberdrola-sky)] bg-white text-[var(--iberdrola-forest)] hover:border-[var(--iberdrola-green)] hover:bg-[var(--iberdrola-green-light)]"}`}>
                {EXTRA_LABELS[q.key]}
              </button>
            ))}
          </div>
        </section>

        {/* Barra de edición en bloque */}
        {selected.size > 0 && (
          <section className="rounded-2xl border-2 border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)] p-4 space-y-3">
            <p className="text-sm font-black text-[var(--iberdrola-forest)]">Editar {selected.size} filas seleccionadas</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input type="text" value={bulkValue} onChange={e => setBulkValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleBulkSave(); }}
                placeholder="Nuevo valor normalizado (ej: kylian mbappe)"
                className="flex-1 rounded-xl border border-[var(--iberdrola-green)] px-3 py-2.5 text-sm font-mono text-[var(--iberdrola-forest)] focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)]" />
              <button onClick={handleBulkSave} disabled={bulkSaving || !bulkValue.trim()}
                className="shrink-0 rounded-2xl bg-[var(--iberdrola-green)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                {bulkSaving ? "Guardando..." : "✅ Aplicar y recalcular"}
              </button>
              <button onClick={() => setSelected(new Set())}
                className="shrink-0 rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--iberdrola-forest)]">
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

        {/* Tabla */}
        <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--iberdrola-sky)] px-4 py-3">
            <div>
              <h2 className="text-base font-black text-[var(--iberdrola-forest)]">
                Predicciones — {rows.length} participantes
              </h2>
              <p className="text-xs text-[var(--iberdrola-forest)]/50">
                Haz clic en el valor normalizado para editarlo. Selecciona varias filas para editar en bloque.
              </p>
            </div>
            <button onClick={() => load(selectedQuestion, selectedPoolId, statusFilter)}
              className="shrink-0 rounded-xl border border-[var(--iberdrola-sky)] bg-white px-3 py-2 text-xs font-bold text-[var(--iberdrola-forest)] hover:bg-[var(--iberdrola-sand)]/50">
              🔄 Recargar
            </button>
          </div>

          {loading && (
            <div className="p-8 text-center text-sm text-[var(--iberdrola-forest)]/50">Cargando...</div>
          )}
          {!loading && error && (
            <div className="p-4 text-sm font-semibold text-red-600">{error}</div>
          )}
          {!loading && !error && rows.length === 0 && (
            <div className="p-8 text-center text-sm text-[var(--iberdrola-forest)]/50">No hay predicciones para esta combinación.</div>
          )}

          {!loading && rows.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)]/30 text-xs font-black uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                  <th className="px-4 py-2.5 text-left w-8">
                    <input type="checkbox"
                      checked={selected.size === rows.length && rows.length > 0}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded accent-[var(--iberdrola-green)]" />
                  </th>
                  <th className="px-4 py-2.5 text-left">#</th>
                  <th className="px-4 py-2.5 text-left">Participante</th>
                  <th className="px-4 py-2.5 text-left">Lo que escribió</th>
                  <th className="px-4 py-2.5 text-left">Valor normalizado (editable)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--iberdrola-sky)]">
                {rows.map(row => (
                  <tr key={row.entry_id}
                    className={`transition ${selected.has(row.entry_id) ? "bg-[var(--iberdrola-green-light)]" : "hover:bg-[var(--iberdrola-sand)]/20"}`}>
                    <td className="px-4 py-2.5">
                      <input type="checkbox" checked={selected.has(row.entry_id)} onChange={() => toggleRow(row.entry_id)}
                        className="h-4 w-4 rounded accent-[var(--iberdrola-green)]" />
                    </td>
                    <td className="px-4 py-2.5 text-[var(--iberdrola-forest)]/50 font-mono">
                      {row.entry_number != null ? `#${row.entry_number}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-[var(--iberdrola-forest)]">
                      {row.name}
                      {row.status === "draft" && (
                        <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">borrador</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--iberdrola-forest)]/70">
                      {row.predicted_value}
                    </td>
                    <td className="px-4 py-2.5">
                      <NormalizedCell row={row} questionKey={selectedQuestion} onSaved={handleSaved} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Nota */}
        <section className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-4 text-sm text-[var(--iberdrola-forest)]/60 space-y-1.5">
          <p className="font-bold text-[var(--iberdrola-forest)]">ℹ️ Cómo funciona</p>
          <p>La columna <span className="font-semibold">«Lo que escribió»</span> es solo lectura — nunca se modifica.</p>
          <p>La columna <span className="font-semibold">«Valor normalizado»</span> es la que compara el motor. Si la dejas vacía, el motor usa la normalización automática del valor original.</p>
          <p>Al guardar se recalculan las puntuaciones de inmediato.</p>
        </section>

      </main>
    </div>
  );
}
