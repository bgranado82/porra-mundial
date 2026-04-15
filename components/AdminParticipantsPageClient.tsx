
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

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

        if (nextPools.length > 0) {
          setSelectedPoolId(nextPools[0].id);
        }
      } catch (err) {
        console.error(err);
        setMessage("Error cargando pools.");
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
        setEntries([]);
        return;
      }

      const nextEntries = (data.entries ?? []) as EntryRow[];
      setEntries(nextEntries);

      const drafts: Record<
        string,
        { payment_status: string; payment_method: string; payment_note: string }
      > = {};

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
      setEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  }

  useEffect(() => {
    if (selectedPoolId) {
      loadEntries(selectedPoolId);
    }
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

const paidCount = filteredEntries.filter(
  (entry) => entry.payment_status === "paid"
).length;

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
        headers: {
          "Content-Type": "application/json",
        },
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
        return;
      }

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                payment_status: draft.payment_status,
                payment_method: draft.payment_method || null,
                payment_note: draft.payment_note || null,
              }
            : entry
        )
      );

      setMessage("Pago actualizado.");
    } catch (err) {
      console.error(err);
      setMessage("Error guardando pago.");
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entryId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Error reabriendo porra.");
        return;
      }

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                status: "draft",
                submitted_at: null,
              }
            : entry
        )
      );

      setMessage("Porra reabierta.");
    } catch (err) {
      console.error(err);
      setMessage("Error reabriendo porra.");
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entryId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Error forzando envío.");
        return;
      }

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                status: "submitted",
                submitted_at: new Date().toISOString(),
              }
            : entry
        )
      );

      setMessage("Porra marcada como enviada.");
    } catch (err) {
      console.error(err);
      setMessage("Error forzando envío.");
    } finally {
      setActionLoadingId(null);
    }
  }

  if (loading) {
    return <div className="p-6">Cargando participantes...</div>;
  }


  return (
    <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-4 sm:px-6">
      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                Administración
              </div>
              <h1 className="text-2xl font-black text-[var(--iberdrola-forest)]">
                Participantes y pagos
              </h1>
              <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
                Gestiona pagos, estados de envío y reapertura de porras.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:bg-[var(--iberdrola-sand)]"
              >
                Inicio admin
              </Link>
              <Link
                href="/admin/results"
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:bg-[var(--iberdrola-sand)]"
              >
                Resultados y Configuración
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
          <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
            Gestión de participantes
          </h2>
        </div>

        <div className="space-y-5 p-4">
          <div className="grid gap-4 xl:grid-cols-[320px_1fr] xl:items-end">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                Pool
              </label>
              <select
                value={selectedPoolId}
                onChange={(e) => setSelectedPoolId(e.target.value)}
                className="w-full rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
              >
                {pools.map((pool) => (
                  <option key={pool.id} value={pool.id}>
                    {pool.name}
                  </option>
                ))}
              </select>
            </div>

<div className="grid gap-3 sm:grid-cols-3">
  <input
    type="text"
    placeholder="Buscar nombre o email"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm"
  />

  <select
    value={filterPayment}
    onChange={(e) => setFilterPayment(e.target.value as any)}
    className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm"
  >
    <option value="all">Todos pagos</option>
    <option value="paid">Pagados</option>
    <option value="pending">Pendientes</option>
  </select>

  <select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value as any)}
    className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm"
  >
    <option value="all">Todas porras</option>
    <option value="submitted">Enviadas</option>
    <option value="draft">Borrador</option>
  </select>
</div>


            <div className="grid gap-3 sm:grid-cols-3 w-full">
              <div className="rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3">
                <div className="text-sm font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                  Participantes
                </div>
                <div className="text-5xl xl:text-6xl font-black text-[var(--iberdrola-green)]">
                  {participantsCount}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3">
                <div className="text-sm font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                  Pagados
                </div>
                <div className="text-5xl xl:text-6xl font-black text-[var(--iberdrola-green)]">
                  {paidCount}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3">
                <div className="text-sm font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                  Recaudación
                </div>
                <div className="text-5xl xl:text-6xl font-black text-[var(--iberdrola-green)]">
                  {totalRevenue}€
                </div>
              </div>
            </div>
          </div>

          {message ? (
            <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)] px-4 py-3 text-sm font-semibold text-[var(--iberdrola-forest)]">
              {message}
            </div>
          ) : null}

          {loadingEntries ? (
            <div className="rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3 text-sm text-[var(--iberdrola-forest)]/70">
              Cargando participantes...
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3 text-sm text-[var(--iberdrola-forest)]/70">
              No hay participantes en este pool.
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
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-[var(--iberdrola-forest)]">
                            {entry.name || entry.email || "Participante"}
                          </h3>

                          <span
                            className={`rounded-full px-2 py-1 text-xs font-bold ${
                              entry.status === "submitted"
                                ? "bg-green-50 text-green-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {entry.status === "submitted" ? "Enviada" : "Borrador"}
                          </span>

                          <span
                            className={`rounded-full px-2 py-1 text-xs font-bold ${
                              draft.payment_status === "paid"
                                ? "bg-green-50 text-green-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {draft.payment_status === "paid" ? "Pagado" : "Pendiente"}
                          </span>
                        </div>

                        <div className="mt-2 space-y-1 text-sm text-[var(--iberdrola-forest)]/75">
                          <div>
                            <span className="font-bold">Email:</span> {entry.email || "-"}
                          </div>
                          <div>
                            <span className="font-bold">Empresa:</span> {entry.company || "-"}
                          </div>
                          <div>
                            <span className="font-bold">País:</span> {entry.country || "-"}
                          </div>
                          <div>
                            <span className="font-bold">Pool:</span> {selectedPool?.name || "-"}
                          </div>
                          <div>
                            <span className="font-bold">Porra:</span>{" "}
                            {entry.entry_number ?? "-"}
                          </div>
                          <div>
                            <span className="font-bold">Creada:</span>{" "}
                            {formatDate(entry.created_at)}
                          </div>
                          <div>
                            <span className="font-bold">Enviada:</span>{" "}
                            {formatDate(entry.submitted_at)}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                            Estado pago
                          </label>
                          <select
                            value={draft.payment_status}
                            onChange={(e) =>
                              updatePaymentDraft(entry.id, "payment_status", e.target.value)
                            }
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
                            onChange={(e) =>
                              updatePaymentDraft(entry.id, "payment_method", e.target.value)
                            }
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
                            onChange={(e) =>
                              updatePaymentDraft(entry.id, "payment_note", e.target.value)
                            }
                            placeholder="Observación"
                            className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 xl:w-[190px]">
                        <button
                          type="button"
                          onClick={() => handleSavePayment(entry.id)}
                          disabled={savingEntryId === entry.id}
                          className="rounded-2xl bg-[var(--iberdrola-green)] px-4 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-50"
                        >
                          {savingEntryId === entry.id ? "Guardando..." : "Guardar pago"}
                        </button>

                        {entry.status === "submitted" ? (
                          <button
                            type="button"
                            onClick={() => handleReopen(entry.id)}
                            disabled={actionLoadingId === entry.id}
                            className="rounded-2xl border border-amber-300 bg-white px-4 py-3 text-sm font-bold text-amber-700 shadow-sm disabled:opacity-50"
                          >
                            {actionLoadingId === entry.id ? "Procesando..." : "Reabrir porra"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleForceSubmit(entry.id)}
                            disabled={actionLoadingId === entry.id}
                            className="rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm disabled:opacity-50"
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