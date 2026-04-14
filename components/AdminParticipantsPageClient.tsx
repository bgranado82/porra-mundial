
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type PoolRow = {
  id: string;
  name: string;
  slug: string;
};

type EntryAdminRow = {
  id: string;
  pool_id: string;
  user_id: string;
  entry_number: number | null;
  name: string | null;
  email: string | null;
  company: string | null;
  country: string | null;
  status: "draft" | "submitted";
  submitted_at: string | null;
  created_at: string | null;
  payment_status: "pending" | "paid";
  payment_method: string | null;
  payment_note: string | null;
};

function formatCreatedAt(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminParticipantsPageClient() {
  const supabase = createClient();

  const [pools, setPools] = useState<PoolRow[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [entries, setEntries] = useState<EntryAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [entriesMessage, setEntriesMessage] = useState("");
  const [updatingEntryId, setUpdatingEntryId] = useState<string | null>(null);

  const paidEntriesCount = useMemo(
    () => entries.filter((entry) => entry.payment_status === "paid").length,
    [entries]
  );

  const pendingEntriesCount = useMemo(
    () => entries.filter((entry) => entry.payment_status !== "paid").length,
    [entries]
  );

  const estimatedRevenue = paidEntriesCount * 10;

  useEffect(() => {
    async function loadPools() {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("pools")
          .select("id, name, slug")
          .order("name", { ascending: true });

        if (error) {
          console.error(error);
          setEntriesMessage("Error cargando pools.");
          return;
        }

        const nextPools = (data ?? []) as PoolRow[];
        setPools(nextPools);

        if (nextPools.length > 0) {
          setSelectedPoolId(nextPools[0].id);
        }
      } catch (err) {
        console.error(err);
        setEntriesMessage("Error cargando pools.");
      } finally {
        setLoading(false);
      }
    }

    loadPools();
  }, [supabase]);

  useEffect(() => {
    if (!selectedPoolId) return;
    loadEntries(selectedPoolId);
  }, [selectedPoolId]);

  async function loadEntries(poolId: string) {
    setLoading(true);
    setEntriesMessage("");

    try {
      const { data, error } = await supabase
        .from("entries")
        .select(`
          id,
          pool_id,
          user_id,
          entry_number,
          name,
          email,
          company,
          country,
          status,
          submitted_at,
          created_at,
          payment_status,
          payment_method,
          payment_note
        `)
        .eq("pool_id", poolId)
        .order("entry_number", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        setEntriesMessage("Error cargando participantes.");
        setEntries([]);
        return;
      }

      setEntries((data ?? []) as EntryAdminRow[]);
    } catch (err) {
      console.error(err);
      setEntriesMessage("Error cargando participantes.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateEntryPaymentStatus(
    entryId: string,
    paymentStatus: "pending" | "paid"
  ) {
    setUpdatingEntryId(entryId);
    setEntriesMessage("");

    try {
      const { error } = await supabase
        .from("entries")
        .update({ payment_status: paymentStatus })
        .eq("id", entryId);

      if (error) {
        console.error(error);
        setEntriesMessage("Error actualizando el pago.");
        return;
      }

      setEntries((current) =>
        current.map((entry) =>
          entry.id === entryId
            ? { ...entry, payment_status: paymentStatus }
            : entry
        )
      );
    } catch (err) {
      console.error(err);
      setEntriesMessage("Error actualizando el pago.");
    } finally {
      setUpdatingEntryId(null);
    }
  }

  async function reopenEntry(entryId: string) {
    const confirmed = window.confirm(
      "¿Seguro que quieres reabrir esta porra? Volverá a estado borrador."
    );
    if (!confirmed) return;

    setUpdatingEntryId(entryId);
    setEntriesMessage("");

    try {
      const { error } = await supabase
        .from("entries")
        .update({
          status: "draft",
          submitted_at: null,
        })
        .eq("id", entryId);

      if (error) {
        console.error(error);
        setEntriesMessage("Error reabriendo la porra.");
        return;
      }

      setEntries((current) =>
        current.map((entry) =>
          entry.id === entryId
            ? { ...entry, status: "draft", submitted_at: null }
            : entry
        )
      );
    } catch (err) {
      console.error(err);
      setEntriesMessage("Error reabriendo la porra.");
    } finally {
      setUpdatingEntryId(null);
    }
  }

  async function lockEntry(entryId: string) {
    const confirmed = window.confirm(
      "¿Seguro que quieres marcar esta porra como enviada?"
    );
    if (!confirmed) return;

    const submittedAt = new Date().toISOString();

    setUpdatingEntryId(entryId);
    setEntriesMessage("");

    try {
      const { error } = await supabase
        .from("entries")
        .update({
          status: "submitted",
          submitted_at: submittedAt,
        })
        .eq("id", entryId);

      if (error) {
        console.error(error);
        setEntriesMessage("Error marcando la porra como enviada.");
        return;
      }

      setEntries((current) =>
        current.map((entry) =>
          entry.id === entryId
            ? { ...entry, status: "submitted", submitted_at: submittedAt }
            : entry
        )
      );
    } catch (err) {
      console.error(err);
      setEntriesMessage("Error marcando la porra como enviada.");
    } finally {
      setUpdatingEntryId(null);
    }
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
                className="rounded-xl border border-[var(--iberdrola-sky)] bg-white px-3 py-2 text-sm font-bold text-[var(--iberdrola-forest)]"
              >
                Inicio admin
              </Link>
              <Link
                href="/admin/results"
                className="rounded-xl border border-[var(--iberdrola-sky)] bg-white px-3 py-2 text-sm font-bold text-[var(--iberdrola-forest)]"
              >
                Resultados
              </Link>
              <Link
                href="/admin/settings"
                className="rounded-xl border border-[var(--iberdrola-sky)] bg-white px-3 py-2 text-sm font-bold text-[var(--iberdrola-forest)]"
              >
                Configuración
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

        <div className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-[260px]">
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
              <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/65">
                  Participantes
                </div>
                <div className="mt-1 text-2xl font-black text-[var(--iberdrola-green)]">
                  {entries.length}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/65">
                  Pagados
                </div>
                <div className="mt-1 text-2xl font-black text-[var(--iberdrola-green)]">
                  {paidEntriesCount}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/65">
                  Recaudación
                </div>
                <div className="mt-1 text-2xl font-black text-[var(--iberdrola-green)]">
                  {estimatedRevenue}€
                </div>
              </div>
            </div>
          </div>

          {entriesMessage ? (
            <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)] px-4 py-3 text-sm font-semibold text-[var(--iberdrola-forest)]">
              {entriesMessage}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-3 text-sm text-[var(--iberdrola-forest)]/70">
              Cargando participantes...
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-3 text-sm text-[var(--iberdrola-forest)]/70">
              No hay participantes en este pool.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[1320px]">
                <div className="grid grid-cols-[80px_180px_240px_160px_120px_120px_120px_120px_300px] gap-3 border-b border-[var(--iberdrola-sky)] px-4 py-3 text-xs font-black uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                  <div>Porra</div>
                  <div>Nombre</div>
                  <div>Email</div>
                  <div>Empresa</div>
                  <div>País</div>
                  <div>Estado</div>
                  <div>Pago</div>
                  <div>Alta</div>
                  <div>Acciones</div>
                </div>

                {entries.map((entry) => {
                  const isUpdating = updatingEntryId === entry.id;

                  return (
                    <div
                      key={entry.id}
                      className="grid grid-cols-[80px_180px_240px_160px_120px_120px_120px_120px_300px] items-center gap-3 border-b border-[var(--iberdrola-sky)]/60 px-4 py-3"
                    >
                      <div className="text-sm font-bold text-[var(--iberdrola-forest)]">
                        {entry.entry_number ?? "-"}
                      </div>

                      <div className="truncate text-sm font-semibold text-[var(--iberdrola-forest)]">
                        {entry.name || "-"}
                      </div>

                      <div className="truncate text-sm text-[var(--iberdrola-forest)]/75">
                        {entry.email || "-"}
                      </div>

                      <div className="truncate text-sm text-[var(--iberdrola-forest)]/75">
                        {entry.company || "-"}
                      </div>

                      <div className="truncate text-sm text-[var(--iberdrola-forest)]/75">
                        {entry.country || "-"}
                      </div>

                      <div>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            entry.status === "submitted"
                              ? "bg-[var(--iberdrola-green-light)] text-[var(--iberdrola-forest)]"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {entry.status === "submitted" ? "Enviada" : "Borrador"}
                        </span>
                      </div>

                      <div>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            entry.payment_status === "paid"
                              ? "bg-green-50 text-green-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {entry.payment_status === "paid" ? "Pagado" : "Pendiente"}
                        </span>
                      </div>

                      <div className="text-sm text-[var(--iberdrola-forest)]/75">
                        {formatCreatedAt(entry.created_at)}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {entry.payment_status === "paid" ? (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              updateEntryPaymentStatus(entry.id, "pending")
                            }
                            className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-700 disabled:opacity-50"
                          >
                            Marcar pendiente
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              updateEntryPaymentStatus(entry.id, "paid")
                            }
                            className="rounded-xl border border-green-200 bg-white px-3 py-2 text-xs font-bold text-green-700 disabled:opacity-50"
                          >
                            Marcar pagado
                          </button>
                        )}

                        {entry.status === "submitted" ? (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => reopenEntry(entry.id)}
                            className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-700 disabled:opacity-50"
                          >
                            Reabrir porra
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => lockEntry(entry.id)}
                            className="rounded-xl border border-[var(--iberdrola-sky)] bg-white px-3 py-2 text-xs font-bold text-[var(--iberdrola-forest)] disabled:opacity-50"
                          >
                            Marcar enviada
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}