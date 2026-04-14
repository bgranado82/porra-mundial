
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type VisibilityMode = "hidden" | "after_submit" | "always";

type PoolRow = {
  id: string;
  name: string;
  slug: string;
  is_registration_open: boolean;
  is_predictions_editable: boolean;
  is_submission_enabled: boolean;
  is_pool_visible: boolean;
  classification_visibility: VisibilityMode;
  statistics_visibility: VisibilityMode;
  transparency_visibility: VisibilityMode;
  submission_deadline: string | null;
  admin_note: string | null;
};

export default function AdminSettingsPageClient() {
  const supabase = createClient();

  const [pools, setPools] = useState<PoolRow[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [savingPoolSettings, setSavingPoolSettings] = useState(false);
  const [poolSettingsMessage, setPoolSettingsMessage] = useState("");

  const [poolSettings, setPoolSettings] = useState<{
    is_registration_open: boolean;
    is_predictions_editable: boolean;
    is_submission_enabled: boolean;
    is_pool_visible: boolean;
    classification_visibility: VisibilityMode;
    statistics_visibility: VisibilityMode;
    transparency_visibility: VisibilityMode;
    submission_deadline: string;
    admin_note: string;
  }>({
    is_registration_open: true,
    is_predictions_editable: true,
    is_submission_enabled: true,
    is_pool_visible: true,
    classification_visibility: "after_submit",
    statistics_visibility: "hidden",
    transparency_visibility: "hidden",
    submission_deadline: "",
    admin_note: "",
  });

  useEffect(() => {
    async function loadPools() {
      const { data, error } = await supabase
        .from("pools")
        .select(`
          id,
          name,
          slug,
          is_registration_open,
          is_predictions_editable,
          is_submission_enabled,
          is_pool_visible,
          classification_visibility,
          statistics_visibility,
          transparency_visibility,
          submission_deadline,
          admin_note
        `)
        .order("name", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      const nextPools = (data ?? []) as PoolRow[];
      setPools(nextPools);

      if (nextPools.length > 0) {
        setSelectedPoolId(nextPools[0].id);
      }
    }

    loadPools();
  }, [supabase]);

  useEffect(() => {
    const currentPool = pools.find((pool) => pool.id === selectedPoolId);
    if (!currentPool) return;

    setPoolSettings({
      is_registration_open: currentPool.is_registration_open,
      is_predictions_editable: currentPool.is_predictions_editable,
      is_submission_enabled: currentPool.is_submission_enabled,
      is_pool_visible: currentPool.is_pool_visible,
      classification_visibility: currentPool.classification_visibility,
      statistics_visibility: currentPool.statistics_visibility,
      transparency_visibility: currentPool.transparency_visibility,
      submission_deadline: currentPool.submission_deadline
        ? currentPool.submission_deadline.slice(0, 16)
        : "",
      admin_note: currentPool.admin_note ?? "",
    });
  }, [selectedPoolId, pools]);

  function updatePoolSetting<K extends keyof typeof poolSettings>(
    key: K,
    value: (typeof poolSettings)[K]
  ) {
    setPoolSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSavePoolSettings() {
    if (!selectedPoolId) return;

    setSavingPoolSettings(true);
    setPoolSettingsMessage("");

    try {
      const payload = {
        is_registration_open: poolSettings.is_registration_open,
        is_predictions_editable: poolSettings.is_predictions_editable,
        is_submission_enabled: poolSettings.is_submission_enabled,
        is_pool_visible: poolSettings.is_pool_visible,
        classification_visibility: poolSettings.classification_visibility,
        statistics_visibility: poolSettings.statistics_visibility,
        transparency_visibility: poolSettings.transparency_visibility,
        submission_deadline: poolSettings.submission_deadline
          ? `${poolSettings.submission_deadline}:00+02:00`
          : null,
        admin_note: poolSettings.admin_note.trim() || null,
      };

      const { error } = await supabase
        .from("pools")
        .update(payload)
        .eq("id", selectedPoolId);

      if (error) {
        console.error(error);
        setPoolSettingsMessage("Error guardando configuración del pool.");
        return;
      }

      setPools((prev) =>
        prev.map((pool) =>
          pool.id === selectedPoolId
            ? {
                ...pool,
                ...payload,
                submission_deadline: payload.submission_deadline ?? null,
                admin_note: payload.admin_note ?? null,
              }
            : pool
        )
      );

      setPoolSettingsMessage("Configuración del pool guardada.");
    } catch (err) {
      console.error(err);
      setPoolSettingsMessage("Error guardando configuración del pool.");
    } finally {
      setSavingPoolSettings(false);
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
                Configuración de pools
              </h1>
              <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
                Controla inscripción, edición, envío final y visibilidad.
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
                href="/admin/participants"
                className="rounded-xl border border-[var(--iberdrola-sky)] bg-white px-3 py-2 text-sm font-bold text-[var(--iberdrola-forest)]"
              >
                Participantes y pagos
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
          <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
            Ajustes del pool
          </h2>
        </div>

        <div className="space-y-5 p-4">
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="flex items-center justify-between rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3">
              <span className="text-sm font-bold text-[var(--iberdrola-forest)]">
                Inscripción abierta
              </span>
              <input
                type="checkbox"
                checked={poolSettings.is_registration_open}
                onChange={(e) =>
                  updatePoolSetting("is_registration_open", e.target.checked)
                }
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3">
              <span className="text-sm font-bold text-[var(--iberdrola-forest)]">
                Predicciones editables
              </span>
              <input
                type="checkbox"
                checked={poolSettings.is_predictions_editable}
                onChange={(e) =>
                  updatePoolSetting("is_predictions_editable", e.target.checked)
                }
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3">
              <span className="text-sm font-bold text-[var(--iberdrola-forest)]">
                Envío final habilitado
              </span>
              <input
                type="checkbox"
                checked={poolSettings.is_submission_enabled}
                onChange={(e) =>
                  updatePoolSetting("is_submission_enabled", e.target.checked)
                }
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-[var(--iberdrola-sky)] p-4">
              <label className="mb-2 block text-sm font-bold text-[var(--iberdrola-forest)]">
                Visibilidad clasificación
              </label>
              <select
                value={poolSettings.classification_visibility}
                onChange={(e) =>
                  updatePoolSetting(
                    "classification_visibility",
                    e.target.value as VisibilityMode
                  )
                }
                className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
              >
                <option value="hidden">Oculta</option>
                <option value="after_submit">Visible tras enviar</option>
                <option value="always">Visible siempre</option>
              </select>
            </div>

            <div className="rounded-2xl border border-[var(--iberdrola-sky)] p-4">
              <label className="mb-2 block text-sm font-bold text-[var(--iberdrola-forest)]">
                Visibilidad estadísticas
              </label>
              <select
                value={poolSettings.statistics_visibility}
                onChange={(e) =>
                  updatePoolSetting(
                    "statistics_visibility",
                    e.target.value as VisibilityMode
                  )
                }
                className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
              >
                <option value="hidden">Ocultas</option>
                <option value="after_submit">Visibles tras enviar</option>
                <option value="always">Visibles siempre</option>
              </select>
            </div>

            <div className="rounded-2xl border border-[var(--iberdrola-sky)] p-4">
              <label className="mb-2 block text-sm font-bold text-[var(--iberdrola-forest)]">
                Visibilidad transparencia
              </label>
              <select
                value={poolSettings.transparency_visibility}
                onChange={(e) =>
                  updatePoolSetting(
                    "transparency_visibility",
                    e.target.value as VisibilityMode
                  )
                }
                className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
              >
                <option value="hidden">Oculta</option>
                <option value="after_submit">Visible tras enviar</option>
                <option value="always">Visible siempre</option>
              </select>
            </div>

            <div className="rounded-2xl border border-[var(--iberdrola-sky)] p-4">
              <label className="mb-2 block text-sm font-bold text-[var(--iberdrola-forest)]">
                Fecha límite de envío
              </label>
              <input
                type="datetime-local"
                value={poolSettings.submission_deadline}
                onChange={(e) =>
                  updatePoolSetting("submission_deadline", e.target.value)
                }
                className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--iberdrola-sky)] p-4">
            <label className="mb-2 block text-sm font-bold text-[var(--iberdrola-forest)]">
              Nota interna del admin
            </label>
            <textarea
              value={poolSettings.admin_note}
              onChange={(e) => updatePoolSetting("admin_note", e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[var(--iberdrola-green)] px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
              placeholder="Notas internas sobre el estado del pool, pagos, pruebas, etc."
            />
          </div>

          <button
            type="button"
            onClick={handleSavePoolSettings}
            disabled={savingPoolSettings || !selectedPoolId}
            className="rounded-2xl bg-[var(--iberdrola-green)] px-5 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-50"
          >
            {savingPoolSettings ? "Guardando..." : "Guardar configuración del pool"}
          </button>

          {poolSettingsMessage ? (
            <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)] px-4 py-3 text-sm font-semibold text-[var(--iberdrola-forest)]">
              {poolSettingsMessage}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}