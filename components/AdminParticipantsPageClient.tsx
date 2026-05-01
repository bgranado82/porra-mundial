"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import AdminNav from "@/components/AdminNav";

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
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white p-6 text-sm text-[var(--iberdrola-forest)]/60">
          Cargando participantes...
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-4 sm:px-6">

      {/* ── Header ── */}
      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--iberdrola-forest)]/45">
            Administración · Ibe World Cup 2026
          </div>
          <h1 className="mt-1.5 text-2xl font-black text-[var(--iberdrola-forest)]">
            Participantes y pagos
          </h1>
          <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/65">
            Gestiona pagos, estados de envío y reapertura de porras
          </p>
          <div className="mt-4">
            <AdminNav />
          </div>
        </div>
      </section>

      {/* ── Filtros y stats ── */}
      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
          <h2 className="text-base font-black text-[var(--iberdrola-forest)]">Filtros</h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Pool */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                Pool
              </label>
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

            {/* Buscar */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 py-2.5 text-sm text-[var(--iberdrola-forest)]"
              />
            </div>

            {/* Pago */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                Estado pago
              </label>
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

            {/* Estado porra */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                Estado porra
              </label>
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
                <div className="text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                  {stat.label}
                </div>
                <div className={`text-2xl font-black leading-none mt-1 ${stat.color}`}>
                  {stat.value}
                </div>
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

      {/* ── Lista de participantes ── */}
      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3 flex items-center justify-between">
          <h2 className="text-base font-black text-[var(--iberdrola-forest)]">
            {selectedPool?.name ?? "Participantes"}
          </h2>
          <span className="rounded-full bg-[var(--iberdrola-green-light)] px-3 py-1 text-xs font-bold text-[var(--iberdrola-green)]">
            {filteredEntries.length} {filteredEntries.length === 1 ? "entrada" : "entradas"}
          </span>
        </div>

        <div className="p-4">
          {loadingEntries ? (
            <div className="rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-6 text-center text-sm text-[var(--iberdrola-forest)]/60">
              Cargando participantes...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-6 text-center text-sm text-[var(--iberdrola-forest)]/60">
              No hay participantes que coincidan con los filtros.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => {
                const draft = paymentDrafts[entry.id] ?? {
                  payment_status: entry.payment_status ?? "pending",
                  payment_method: entry.payment_method ?? "",
                  payment_note: entry.payment_note ?? "",
                };

                return (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-4"
                  >
                    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr_auto] xl:items-start">
                      {/* Info persona */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black text-[var(--iberdrola-forest)]">
                            {entry.name || entry.email || "Participante"}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              entry.status === "submitted"
                                ? "bg-[var(--iberdrola-green-light)] text-[var(--iberdrola-green)]"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {entry.status === "submitted" ? "✓ Enviada" : "Borrador"}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              draft.payment_status === "paid"
                                ? "bg-[var(--iberdrola-green-light)] text-[var(--iberdrola-green)]"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {draft.payment_status === "paid" ? "💶 Pagado" : "Pendiente pago"}
                          </span>
                        </div>

                        <div className="mt-2 grid gap-x-4 gap-y-0.5 text-sm text-[var(--iberdrola-forest)]/70 sm:grid-cols-2">
                          <div><span className="font-semibold text-[var(--iberdrola-forest)]">Email:</span> {entry.email || "-"}</div>
                          <div><span className="font-semibold text-[var(--iberdrola-forest)]">Empresa:</span> {entry.company || "-"}</div>
                          <div><span className="font-semibold text-[var(--iberdrola-forest)]">País:</span> {entry.country || "-"}</div>
                          <div><span className="font-semibold text-[var(--iberdrola-forest)]">Porra nº:</span> {entry.entry_number ?? "-"}</div>
                          <div><span className="font-semibold text-[var(--iberdrola-forest)]">Creada:</span> {formatDate(entry.created_at)}</div>
                          <div><span className="font-semibold text-[var(--iberdrola-forest)]">Enviada:</span> {formatDate(entry.submitted_at)}</div>
                        </div>
                      </div>

                      {/* Editar pago */}
                      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                            Estado pago
                          </label>
                          <select
                            value={draft.payment_status}
                            onChange={(e) => updatePaymentDraft(entry.id, "payment_status", e.target.value)}
                            className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
                          >
                            <option value="pending">Pendiente</option>
                            <option value="paid">Pagado</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                            Método
                          </label>
                          <input
                            type="text"
                            value={draft.payment_method}
                            onChange={(e) => updatePaymentDraft(entry.id, "payment_method", e.target.value)}
                            placeholder="Bizum, metálico..."
                            className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                            Nota
                          </label>
                          <input
                            type="text"
                            value={draft.payment_note}
                            onChange={(e) => updatePaymentDraft(entry.id, "payment_note", e.target.value)}
                            placeholder="Observación"
                            className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
                          />
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-row gap-2 xl:w-[180px] xl:flex-col">
                        <button
                          type="button"
                          onClick={() => handleSavePayment(entry.id)}
                          disabled={savingEntryId === entry.id}
                          className="flex-1 rounded-2xl bg-[var(--iberdrola-green)] px-4 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"
                        >
                          {savingEntryId === entry.id ? "Guardando..." : "Guardar pago"}
                        </button>

                        {entry.status === "submitted" ? (
                          <button
                            type="button"
                            onClick={() => handleReopen(entry.id)}
                            disabled={actionLoadingId === entry.id}
                            className="flex-1 rounded-2xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-bold text-amber-700 shadow-sm disabled:opacity-50"
                          >
                            {actionLoadingId === entry.id ? "Procesando..." : "Reabrir porra"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleForceSubmit(entry.id)}
                            disabled={actionLoadingId === entry.id}
                            className="flex-1 rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm disabled:opacity-50"
                          >
                            {actionLoadingId === entry.id ? "Procesando..." : "Marcar enviada"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
