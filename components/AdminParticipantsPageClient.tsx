"use client";

// Página de gestión de participantes y pagos.
//
// Diseño:
// - Desktop (≥ md): tabla compacta de 1 línea por participante. Toggle rápido
//   de "pagado/pendiente" sin abrir nada. Pulsar la fila la expande para
//   editar método y nota, y para reabrir / forzar envío.
// - Móvil (< md): fila compacta (nombre + chips) que se expande al pulsar.
// - Bulk-edit: checkbox por fila + footer flotante sticky que aparece cuando
//   hay selección. Permite marcar varios como pagados o como pendientes en un
//   solo click. Mismo patrón que la página de Normalizar.

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminSectionHeader from "@/components/AdminSectionHeader";

type PoolRow = {
  id: string;
  name: string;
  slug: string;
};

type EntryRow = {
  id: string;
  pool_id: string;
  user_id: string | null;
  entry_number: number | null;
  name: string | null;
  email: string | null;
  company: string | null;
  country: string | null;
  status: "draft" | "submitted" | string;
  submitted_at: string | null;
  created_at: string;
  payment_status: "pending" | "paid" | string | null;
  payment_method: string | null;
  payment_note: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AdminParticipantsPageClient() {
  const supabase = createClient();

  const [pools, setPools] = useState<PoolRow[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"ok" | "error">("ok");

  const [savingEntryId, setSavingEntryId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterPayment, setFilterPayment] = useState<"all" | "paid" | "pending">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "submitted" | "draft">("all");

  // Fila(s) expandida(s) en el listado. Permitir varias a la vez es útil
  // si el admin quiere comparar dos participantes.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Selección para bulk-edit.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  const [paymentDrafts, setPaymentDrafts] = useState<
    Record<string, { payment_status: string; payment_method: string; payment_note: string }>
  >({});

  useEffect(() => {
    async function loadPools() {
      setLoading(true);
      setMessage("");
      try {
        const { data, error } = await supabase
          .from("pools")
          .select("id, name, slug")
          .order("name", { ascending: true });

        if (error) throw error;

        const nextPools = (data ?? []) as PoolRow[];
        setPools(nextPools);
        if (nextPools.length > 0) setSelectedPoolId(nextPools[0].id);
      } catch (err) {
        console.error(err);
        setMessage("Error cargando pools.");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }

    loadPools();
  }, [supabase]);

  async function loadEntries(poolId: string) {
    if (!poolId) return;
    setLoadingEntries(true);
    setMessage("");
    setSelected(new Set());
    setExpanded(new Set());

    try {
      const res = await fetch(`/api/admin/entries?poolId=${poolId}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Error cargando participantes.");
        setMessageType("error");
        setEntries([]);
        return;
      }

      const nextEntries = (data.entries ?? []) as EntryRow[];
      setEntries(nextEntries);

      const drafts: Record<string, { payment_status: string; payment_method: string; payment_note: string }> = {};
      nextEntries.forEach((entry) => {
        drafts[entry.id] = {
          payment_status: entry.payment_status ?? "pending",
          payment_method: entry.payment_method ?? "",
          payment_note: entry.payment_note ?? "",
        };
      });
      setPaymentDrafts(drafts);
    } catch (err) {
      console.error(err);
      setMessage("Error cargando participantes.");
      setMessageType("error");
      setEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  }

  useEffect(() => {
    if (selectedPoolId) loadEntries(selectedPoolId);
  }, [selectedPoolId]);

  const selectedPool = useMemo(
    () => pools.find((pool) => pool.id === selectedPoolId) ?? null,
    [pools, selectedPoolId]
  );

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const text = `${entry.name ?? ""} ${entry.email ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const paymentOk =
        filterPayment === "all" ||
        (filterPayment === "paid" && entry.payment_status === "paid") ||
        (filterPayment === "pending" && entry.payment_status !== "paid");
      const statusOk =
        filterStatus === "all" ||
        (filterStatus === "submitted" && entry.status === "submitted") ||
        (filterStatus === "draft" && entry.status !== "submitted");
      return text && paymentOk && statusOk;
    });
  }, [entries, search, filterPayment, filterStatus]);

  const participantsCount = filteredEntries.length;
  const submittedCount = filteredEntries.filter((e) => e.status === "submitted").length;
  const paidCount = filteredEntries.filter((e) => e.payment_status === "paid").length;
  const totalRevenue = paidCount * 10;

  function updatePaymentDraft(
    entryId: string,
    field: "payment_status" | "payment_method" | "payment_note",
    value: string
  ) {
    setPaymentDrafts((prev) => ({
      ...prev,
      [entryId]: {
        payment_status: prev[entryId]?.payment_status ?? "pending",
        payment_method: prev[entryId]?.payment_method ?? "",
        payment_note: prev[entryId]?.payment_note ?? "",
        [field]: value,
      },
    }));
  }

  function toggleExpanded(entryId: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(entryId) ? n.delete(entryId) : n.add(entryId);
      return n;
    });
  }

  function toggleSelected(entryId: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(entryId) ? n.delete(entryId) : n.add(entryId);
      return n;
    });
  }

  function toggleSelectAll() {
    const allIds = filteredEntries.map((e) => e.id);
    setSelected((prev) =>
      allIds.every((id) => prev.has(id)) ? new Set() : new Set(allIds)
    );
  }

  async function handleSavePayment(entryId: string) {
    const draft = paymentDrafts[entryId];
    if (!draft) return;

    setSavingEntryId(entryId);
    setMessage("");

    try {
      const res = await fetch("/api/admin/entries/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId,
          payment_status: draft.payment_status,
          payment_method: draft.payment_method,
          payment_note: draft.payment_note,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Error guardando pago.");
        setMessageType("error");
        return;
      }

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId
            ? { ...entry, payment_status: draft.payment_status, payment_method: draft.payment_method || null, payment_note: draft.payment_note || null }
            : entry
        )
      );
      setMessage("✅ Pago actualizado.");
      setMessageType("ok");
    } catch (err) {
      console.error(err);
      setMessage("Error guardando pago.");
      setMessageType("error");
    } finally {
      setSavingEntryId(null);
    }
  }

  // Toggle rápido del status de pago, sin abrir el editor.
  // Usa el endpoint existente preservando el método y la nota actuales.
  async function quickTogglePayment(entry: EntryRow) {
    const newStatus = entry.payment_status === "paid" ? "pending" : "paid";
    setSavingEntryId(entry.id);
    setMessage("");

    try {
      const res = await fetch("/api/admin/entries/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: entry.id,
          payment_status: newStatus,
          payment_method: entry.payment_method ?? "",
          payment_note: entry.payment_note ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Error guardando pago.");
        setMessageType("error");
        return;
      }
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, payment_status: newStatus } : e))
      );
      setPaymentDrafts((prev) => ({
        ...prev,
        [entry.id]: {
          payment_status: newStatus,
          payment_method: prev[entry.id]?.payment_method ?? "",
          payment_note: prev[entry.id]?.payment_note ?? "",
        },
      }));
    } catch (err) {
      console.error(err);
      setMessage("Error guardando pago.");
      setMessageType("error");
    } finally {
      setSavingEntryId(null);
    }
  }

  // Bulk-set del status de pago para todas las filas seleccionadas.
  // Llama al endpoint existente una vez por entrada (mismo comportamiento que
  // si las hubiera tocado manualmente). Se hace en paralelo.
  async function bulkSetPayment(newStatus: "paid" | "pending") {
    if (selected.size === 0) return;
    setBulkSaving(true);
    setMessage("");

    const ids = Array.from(selected);
    const targets = entries.filter((e) => selected.has(e.id));

    try {
      const results = await Promise.all(
        targets.map((entry) =>
          fetch("/api/admin/entries/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entryId: entry.id,
              payment_status: newStatus,
              payment_method: entry.payment_method ?? "",
              payment_note: entry.payment_note ?? "",
            }),
          }).then((r) => r.ok)
        )
      );

      const failed = results.filter((ok) => !ok).length;
      setEntries((prev) =>
        prev.map((e) => (selected.has(e.id) ? { ...e, payment_status: newStatus } : e))
      );
      setPaymentDrafts((prev) => {
        const next = { ...prev };
        ids.forEach((id) => {
          next[id] = {
            payment_status: newStatus,
            payment_method: next[id]?.payment_method ?? "",
            payment_note: next[id]?.payment_note ?? "",
          };
        });
        return next;
      });
      setSelected(new Set());
      if (failed === 0) {
        setMessage(`✅ ${ids.length} ${ids.length === 1 ? "pago actualizado" : "pagos actualizados"}.`);
        setMessageType("ok");
      } else {
        setMessage(`⚠️ ${ids.length - failed} ok, ${failed} con error.`);
        setMessageType("error");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error en el bulk-edit.");
      setMessageType("error");
    } finally {
      setBulkSaving(false);
    }
  }

  async function handleReopen(entryId: string) {
    setActionLoadingId(entryId);
    setMessage("");

    try {
      const res = await fetch("/api/admin/entries/reopen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Error reabriendo porra.");
        setMessageType("error");
        return;
      }

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId ? { ...entry, status: "draft", submitted_at: null } : entry
        )
      );
      setMessage("✅ Porra reabierta correctamente.");
      setMessageType("ok");
    } catch (err) {
      console.error(err);
      setMessage("Error reabriendo porra.");
      setMessageType("error");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleForceSubmit(entryId: string) {
    setActionLoadingId(entryId);
    setMessage("");

    try {
      const res = await fetch("/api/admin/entries/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Error forzando envío.");
        setMessageType("error");
        return;
      }

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId
            ? { ...entry, status: "submitted", submitted_at: new Date().toISOString() }
            : entry
        )
      );
      setMessage("✅ Porra marcada como enviada.");
      setMessageType("ok");
    } catch (err) {
      console.error(err);
      setMessage("Error forzando envío.");
      setMessageType("error");
    } finally {
      setActionLoadingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--iberdrola-green-light)]">
        <div className="mx-auto max-w-[1600px] px-4 py-6">
          <div className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white p-6 text-sm text-[var(--iberdrola-forest)]/60">
            Cargando participantes...
          </div>
        </div>
      </div>
    );
  }

  const allVisibleSelected =
    filteredEntries.length > 0 && filteredEntries.every((e) => selected.has(e.id));

  return (
    <div className="min-h-screen bg-[var(--iberdrola-green-light)] pb-32">
      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">

        <AdminPageHeader
          title="Participantes y pagos"
          icon="👥"
          description="Gestiona pagos, estados de envío y reapertura de porras."
        />

        {/* ── Filtros ── */}
        <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
          <AdminSectionHeader title="Filtros" />
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Pool</label>
                <select
                  value={selectedPoolId}
                  onChange={(e) => setSelectedPoolId(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--iberdrola-forest)]"
                >
                  {pools.map((pool) => (
                    <option key={pool.id} value={pool.id}>{pool.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Buscar</label>
                <input
                  type="text"
                  placeholder="Nombre o email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 py-2.5 text-sm text-[var(--iberdrola-forest)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Estado pago</label>
                <select
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value as "all" | "paid" | "pending")}
                  className="w-full rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 py-2.5 text-sm text-[var(--iberdrola-forest)]"
                >
                  <option value="all">Todos los pagos</option>
                  <option value="paid">Pagados</option>
                  <option value="pending">Pendientes</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Estado porra</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as "all" | "submitted" | "draft")}
                  className="w-full rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 py-2.5 text-sm text-[var(--iberdrola-forest)]"
                >
                  <option value="all">Todas las porras</option>
                  <option value="submitted">Enviadas</option>
                  <option value="draft">Borrador</option>
                </select>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Resultados", value: participantsCount, color: "text-[var(--iberdrola-forest)]" },
                { label: "Enviadas", value: submittedCount, color: "text-[var(--iberdrola-green)]" },
                { label: "Pagados", value: paidCount, color: "text-[var(--iberdrola-green)]" },
                { label: "Recaudación", value: `${totalRevenue}€`, color: "text-[var(--iberdrola-sky)]" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-3 text-center"
                >
                  <div className="text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">{stat.label}</div>
                  <div className={`text-2xl font-black leading-none mt-1 ${stat.color}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            {message ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  messageType === "ok"
                    ? "border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)] text-[var(--iberdrola-forest)]"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            ) : null}
          </div>
        </section>

        {/* ── Lista ── */}
        <section className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm overflow-hidden">
          <AdminSectionHeader
            title={selectedPool?.name ?? "Participantes"}
            subtitle={`${filteredEntries.length} ${filteredEntries.length === 1 ? "entrada" : "entradas"}`}
          />

          {loadingEntries ? (
            <div className="p-10 text-center text-sm text-[var(--iberdrola-forest)]/50">
              Cargando participantes…
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-10 text-center text-sm text-[var(--iberdrola-forest)]/50">
              No hay participantes que coincidan con los filtros.
            </div>
          ) : (
            <>
              {/* ── DESKTOP: tabla ── */}
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)]/30 text-xs font-black uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                      <th className="w-8 px-4 py-2.5 text-left">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded accent-[var(--iberdrola-green)]"
                        />
                      </th>
                      <th className="w-12 px-2 py-2.5 text-left">#</th>
                      <th className="px-3 py-2.5 text-left">Participante</th>
                      <th className="px-3 py-2.5 text-left">Empresa / País</th>
                      <th className="px-3 py-2.5 text-left">Porra</th>
                      <th className="px-3 py-2.5 text-left">Pago</th>
                      <th className="w-8 px-2 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--iberdrola-sky)]">
                    {filteredEntries.map((entry) => {
                      const isOpen = expanded.has(entry.id);
                      const isPaid = entry.payment_status === "paid";
                      const isSubmitted = entry.status === "submitted";
                      const draft = paymentDrafts[entry.id] ?? {
                        payment_status: entry.payment_status ?? "pending",
                        payment_method: entry.payment_method ?? "",
                        payment_note: entry.payment_note ?? "",
                      };

                      return (
                        <>
                          <tr
                            key={entry.id}
                            className={`group transition ${selected.has(entry.id) ? "bg-[var(--iberdrola-green-light)]" : "hover:bg-[var(--iberdrola-sand)]/20"}`}
                          >
                            <td className="px-4 py-2.5">
                              <input
                                type="checkbox"
                                checked={selected.has(entry.id)}
                                onChange={() => toggleSelected(entry.id)}
                                className="h-4 w-4 rounded accent-[var(--iberdrola-green)]"
                              />
                            </td>
                            <td className="px-2 py-2.5 text-xs font-mono text-[var(--iberdrola-forest)]/50">
                              {entry.entry_number != null ? `#${entry.entry_number}` : "—"}
                            </td>
                            <td className="min-w-0 px-3 py-2.5">
                              <div className="font-bold text-[var(--iberdrola-forest)] truncate">
                                {entry.name || entry.email || "Participante"}
                              </div>
                              <div className="text-xs text-[var(--iberdrola-forest)]/55 truncate">{entry.email || "—"}</div>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[var(--iberdrola-forest)]/65">
                              <div className="truncate">{entry.company || "—"}</div>
                              <div className="truncate">{entry.country || "—"}</div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${isSubmitted ? "bg-[var(--iberdrola-green-light)] text-[var(--iberdrola-green)]" : "bg-amber-50 text-amber-700"}`}>
                                {isSubmitted ? "✓ Enviada" : "Borrador"}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <button
                                type="button"
                                onClick={() => quickTogglePayment(entry)}
                                disabled={savingEntryId === entry.id}
                                title="Pulsa para cambiar"
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition disabled:opacity-50 ${isPaid ? "bg-[var(--iberdrola-green-light)] text-[var(--iberdrola-green)] hover:bg-[var(--iberdrola-green-mid)]" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}
                              >
                                {savingEntryId === entry.id ? "…" : isPaid ? "💶 Pagado" : "Pendiente"}
                              </button>
                            </td>
                            <td className="px-2 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => toggleExpanded(entry.id)}
                                className="rounded-lg px-2 py-1 text-xs text-[var(--iberdrola-forest)]/50 hover:bg-[var(--iberdrola-sand)]/40 hover:text-[var(--iberdrola-forest)]"
                                aria-label={isOpen ? "Contraer" : "Expandir"}
                              >
                                {isOpen ? "▲" : "▼"}
                              </button>
                            </td>
                          </tr>
                          {isOpen && (
                            <tr key={entry.id + "-detail"} className="bg-[var(--iberdrola-sand)]/15">
                              <td></td>
                              <td colSpan={6} className="px-3 pb-4 pt-1">
                                <ExpandedDetail
                                  entry={entry}
                                  draft={draft}
                                  saving={savingEntryId === entry.id}
                                  actionLoading={actionLoadingId === entry.id}
                                  onChangeDraft={(f, v) => updatePaymentDraft(entry.id, f, v)}
                                  onSave={() => handleSavePayment(entry.id)}
                                  onReopen={() => handleReopen(entry.id)}
                                  onForceSubmit={() => handleForceSubmit(entry.id)}
                                />
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── MÓVIL: lista compacta expandible ── */}
              <div className="md:hidden">
                <div className="flex items-center gap-3 border-b border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)]/20 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded accent-[var(--iberdrola-green)]"
                  />
                  <span className="text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/60">
                    Seleccionar todos ({filteredEntries.length})
                  </span>
                </div>
                <ul className="divide-y divide-[var(--iberdrola-sky)]">
                  {filteredEntries.map((entry) => {
                    const isOpen = expanded.has(entry.id);
                    const isPaid = entry.payment_status === "paid";
                    const isSubmitted = entry.status === "submitted";
                    const draft = paymentDrafts[entry.id] ?? {
                      payment_status: entry.payment_status ?? "pending",
                      payment_method: entry.payment_method ?? "",
                      payment_note: entry.payment_note ?? "",
                    };

                    return (
                      <li key={entry.id} className={selected.has(entry.id) ? "bg-[var(--iberdrola-green-light)]" : ""}>
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={selected.has(entry.id)}
                            onChange={() => toggleSelected(entry.id)}
                            className="h-4 w-4 shrink-0 rounded accent-[var(--iberdrola-green)]"
                          />
                          <button
                            type="button"
                            onClick={() => toggleExpanded(entry.id)}
                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                {entry.entry_number != null && (
                                  <span className="text-xs font-mono text-[var(--iberdrola-forest)]/40">#{entry.entry_number}</span>
                                )}
                                <span className="truncate text-sm font-bold text-[var(--iberdrola-forest)]">
                                  {entry.name || entry.email || "Participante"}
                                </span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isSubmitted ? "bg-[var(--iberdrola-green-light)] text-[var(--iberdrola-green)]" : "bg-amber-50 text-amber-700"}`}>
                                  {isSubmitted ? "✓" : "Borrador"}
                                </span>
                                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isPaid ? "bg-[var(--iberdrola-green-light)] text-[var(--iberdrola-green)]" : "bg-amber-50 text-amber-700"}`}>
                                  {isPaid ? "💶 Pagado" : "Pendiente"}
                                </span>
                              </div>
                            </div>
                            <span className="shrink-0 text-xs text-[var(--iberdrola-forest)]/40">{isOpen ? "▲" : "▼"}</span>
                          </button>
                        </div>
                        {isOpen && (
                          <div className="border-t border-[var(--iberdrola-sky)]/60 bg-[var(--iberdrola-sand)]/15 px-3 py-3">
                            <ExpandedDetail
                              entry={entry}
                              draft={draft}
                              saving={savingEntryId === entry.id}
                              actionLoading={actionLoadingId === entry.id}
                              onChangeDraft={(f, v) => updatePaymentDraft(entry.id, f, v)}
                              onSave={() => handleSavePayment(entry.id)}
                              onReopen={() => handleReopen(entry.id)}
                              onForceSubmit={() => handleForceSubmit(entry.id)}
                              compact
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
        </section>

      </main>

      {/* ── Footer flotante de bulk-edit ── */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--iberdrola-green)] bg-[var(--iberdrola-green-light)]/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-[var(--iberdrola-green-light)]/85">
          <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <p className="text-sm font-black text-[var(--iberdrola-forest)] sm:shrink-0">
                {selected.size} {selected.size === 1 ? "participante" : "participantes"}
              </p>
              <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => bulkSetPayment("paid")}
                  disabled={bulkSaving}
                  className="rounded-xl bg-[var(--iberdrola-green)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {bulkSaving ? "Guardando…" : "💶 Marcar como pagados"}
                </button>
                <button
                  type="button"
                  onClick={() => bulkSetPayment("pending")}
                  disabled={bulkSaving}
                  className="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-bold text-amber-700 disabled:opacity-50"
                >
                  {bulkSaving ? "Guardando…" : "Marcar como pendientes"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="rounded-xl border border-[var(--iberdrola-sky)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--iberdrola-forest)]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ExpandedDetail ──────────────────────────────────────────────────────────
// Detalles editables que aparecen al expandir una fila. Mismos campos que el
// card original (método, nota, fechas, acciones de reabrir/forzar envío) pero
// con un layout horizontal compacto que aprovecha el ancho de la tabla.

function ExpandedDetail({
  entry,
  draft,
  saving,
  actionLoading,
  onChangeDraft,
  onSave,
  onReopen,
  onForceSubmit,
  compact,
}: {
  entry: EntryRow;
  draft: { payment_status: string; payment_method: string; payment_note: string };
  saving: boolean;
  actionLoading: boolean;
  onChangeDraft: (field: "payment_status" | "payment_method" | "payment_note", value: string) => void;
  onSave: () => void;
  onReopen: () => void;
  onForceSubmit: () => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      {/* Meta info en línea */}
      <div className={`grid gap-x-4 gap-y-1 text-xs text-[var(--iberdrola-forest)]/65 ${compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
        <div><span className="font-semibold text-[var(--iberdrola-forest)]">Email:</span> {entry.email || "—"}</div>
        <div><span className="font-semibold text-[var(--iberdrola-forest)]">Empresa:</span> {entry.company || "—"}</div>
        <div><span className="font-semibold text-[var(--iberdrola-forest)]">País:</span> {entry.country || "—"}</div>
        <div><span className="font-semibold text-[var(--iberdrola-forest)]">Creada:</span> {formatDate(entry.created_at)}</div>
        <div><span className="font-semibold text-[var(--iberdrola-forest)]">Enviada:</span> {formatDate(entry.submitted_at)}</div>
      </div>

      {/* Edición de pago */}
      <div className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-[160px_1fr_1fr_auto]"} sm:items-end`}>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Estado pago</label>
          <select
            value={draft.payment_status}
            onChange={(e) => onChangeDraft("payment_status", e.target.value)}
            className="w-full rounded-xl border border-[var(--iberdrola-green)] bg-white px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
          >
            <option value="pending">Pendiente</option>
            <option value="paid">Pagado</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Método</label>
          <input
            type="text"
            value={draft.payment_method}
            onChange={(e) => onChangeDraft("payment_method", e.target.value)}
            placeholder="Bizum, metálico…"
            className="w-full rounded-xl border border-[var(--iberdrola-green)] bg-white px-3 py-2 text-sm text-[var(--iberdrola-forest)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">Nota</label>
          <input
            type="text"
            value={draft.payment_note}
            onChange={(e) => onChangeDraft("payment_note", e.target.value)}
            placeholder="Observación"
            className="w-full rounded-xl border border-[var(--iberdrola-green)] bg-white px-3 py-2 text-sm text-[var(--iberdrola-forest)]"
          />
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-xl bg-[var(--iberdrola-green)] px-4 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar pago"}
        </button>
      </div>

      {/* Acciones secundarias */}
      <div className="flex flex-wrap gap-2 pt-1">
        {entry.status === "submitted" ? (
          <button
            type="button"
            onClick={onReopen}
            disabled={actionLoading}
            className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-700 disabled:opacity-50"
          >
            {actionLoading ? "Procesando…" : "Reabrir porra"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onForceSubmit}
            disabled={actionLoading}
            className="rounded-xl border border-[var(--iberdrola-green)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--iberdrola-forest)] disabled:opacity-50"
          >
            {actionLoading ? "Procesando…" : "Marcar como enviada"}
          </button>
        )}
      </div>
    </div>
  );
}
