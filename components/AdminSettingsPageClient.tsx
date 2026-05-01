"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import AdminNav from "@/components/AdminNav";

type VisibilityMode = "hidden" | "after_submit" | "always";

type Pool = {
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

const VISIBILITY_OPTIONS: { value: VisibilityMode; label: string }[] = [
  { value: "hidden", label: "Oculto" },
  { value: "after_submit", label: "Solo tras enviar porra" },
  { value: "always", label: "Siempre visible" },
];

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-4">
      <div className="min-w-0">
        <div className="text-sm font-bold text-[var(--iberdrola-forest)]">{label}</div>
        {description ? (
          <div className="mt-0.5 text-xs text-[var(--iberdrola-forest)]/60">{description}</div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative shrink-0 h-6 w-11 rounded-full transition-colors ${
          value ? "bg-[var(--iberdrola-green)]" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function VisibilitySelect({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: VisibilityMode;
  onChange: (v: VisibilityMode) => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-4">
      <label className="block text-sm font-bold text-[var(--iberdrola-forest)]">{label}</label>
      {description ? (
        <div className="mt-0.5 mb-2 text-xs text-[var(--iberdrola-forest)]/60">{description}</div>
      ) : (
        <div className="mb-2" />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as VisibilityMode)}
        className="w-full rounded-xl border border-[var(--iberdrola-green)] bg-white px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
      >
        {VISIBILITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function AdminSettingsPageClient() {
  const supabase = createClient();

  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [settings, setSettings] = useState<Pool | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"ok" | "error">("ok");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("pools").select("*");
      if (data) {
        setPools(data);
        if (data.length > 0) {
          setSelectedPoolId(data[0].id);
          setSettings(data[0]);
        }
      }
    }
    load();
  }, []);

  useEffect(() => {
    const pool = pools.find((p) => p.id === selectedPoolId);
    if (pool) setSettings(pool);
  }, [selectedPoolId, pools]);

  function update<K extends keyof Pool>(key: K, value: Pool[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("pools").update(settings).eq("id", selectedPoolId);

    if (error) {
      setMessage("Error guardando la configuración.");
      setMessageType("error");
    } else {
      setMessage("✅ Configuración guardada correctamente.");
      setMessageType("ok");
      setPools((prev) => prev.map((p) => (p.id === selectedPoolId ? settings : p)));
    }

    setSaving(false);
  }

  if (!settings) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white p-6 text-sm text-[var(--iberdrola-forest)]/60">
          Cargando configuración...
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-4 sm:px-6">

      {/* ── Header ── */}
      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--iberdrola-forest)]/45">
            Administración · Ibe World Cup 2026
          </div>
          <h1 className="mt-1.5 text-2xl font-black text-[var(--iberdrola-forest)]">
            Configuración
          </h1>
          <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/65">
            Controla el acceso, registro, deadlines y visibilidad de cada pool
          </p>
          <div className="mt-4">
            <AdminNav />
          </div>
        </div>
      </section>

      {/* ── Selector de pool ── */}
      {pools.length > 1 ? (
        <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
          <div className="p-4">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
              Pool a configurar
            </label>
            <select
              value={selectedPoolId}
              onChange={(e) => setSelectedPoolId(e.target.value)}
              className="w-full max-w-sm rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--iberdrola-forest)]"
            >
              {pools.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </section>
      ) : null}

      {/* ── Acceso y registro ── */}
      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
          <h2 className="text-base font-black text-[var(--iberdrola-forest)]">Acceso y registro</h2>
          <p className="mt-0.5 text-xs text-[var(--iberdrola-forest)]/55">
            Controla quién puede entrar y qué puede hacer
          </p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <Toggle
            label="Registro abierto"
            description="Los usuarios pueden registrarse con el código de acceso"
            value={settings.is_registration_open}
            onChange={(v) => update("is_registration_open", v)}
          />
          <Toggle
            label="Pool visible"
            description="El pool aparece listado en la aplicación"
            value={settings.is_pool_visible}
            onChange={(v) => update("is_pool_visible", v)}
          />
          <Toggle
            label="Predicciones editables"
            description="Los usuarios pueden modificar su porra (si no la han enviado)"
            value={settings.is_predictions_editable}
            onChange={(v) => update("is_predictions_editable", v)}
          />
          <Toggle
            label="Envío habilitado"
            description="Los usuarios pueden enviar su porra definitivamente"
            value={settings.is_submission_enabled}
            onChange={(v) => update("is_submission_enabled", v)}
          />
        </div>
      </section>

      {/* ── Deadline ── */}
      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
          <h2 className="text-base font-black text-[var(--iberdrola-forest)]">Fecha límite de envío</h2>
          <p className="mt-0.5 text-xs text-[var(--iberdrola-forest)]/55">
            Las porras no se podrán enviar después de esta fecha
          </p>
        </div>
        <div className="p-4">
          <input
            type="datetime-local"
            value={settings.submission_deadline?.slice(0, 16) ?? ""}
            onChange={(e) =>
              update("submission_deadline", e.target.value ? e.target.value + ":00Z" : null)
            }
            className="w-full max-w-sm rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--iberdrola-forest)]"
          />
          {settings.submission_deadline ? (
            <div className="mt-2 text-xs text-[var(--iberdrola-forest)]/55">
              Fecha guardada: {new Date(settings.submission_deadline).toLocaleString("es-ES")}
            </div>
          ) : (
            <div className="mt-2 text-xs text-[var(--iberdrola-forest)]/55">Sin fecha límite configurada</div>
          )}
        </div>
      </section>

      {/* ── Visibilidad ── */}
      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
          <h2 className="text-base font-black text-[var(--iberdrola-forest)]">Visibilidad de secciones</h2>
          <p className="mt-0.5 text-xs text-[var(--iberdrola-forest)]/55">
            Controla qué puede ver cada usuario según su estado
          </p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <VisibilitySelect
            label="Clasificación"
            description="Tabla de posiciones del pool"
            value={settings.classification_visibility}
            onChange={(v) => update("classification_visibility", v)}
          />
          <VisibilitySelect
            label="Estadísticas"
            description="Análisis y métricas del pool"
            value={settings.statistics_visibility}
            onChange={(v) => update("statistics_visibility", v)}
          />
          <VisibilitySelect
            label="Transparencia"
            description="Ver predicciones de otros participantes"
            value={settings.transparency_visibility}
            onChange={(v) => update("transparency_visibility", v)}
          />
        </div>
      </section>

      {/* ── Nota admin ── */}
      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
          <h2 className="text-base font-black text-[var(--iberdrola-forest)]">Nota del administrador</h2>
          <p className="mt-0.5 text-xs text-[var(--iberdrola-forest)]/55">
            Mensaje interno visible solo para administradores
          </p>
        </div>
        <div className="p-4">
          <textarea
            value={settings.admin_note ?? ""}
            onChange={(e) => update("admin_note", e.target.value || null)}
            placeholder="Notas internas sobre este pool..."
            rows={3}
            className="w-full rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 py-2.5 text-sm text-[var(--iberdrola-forest)] resize-none"
          />
        </div>
      </section>

      {/* ── Guardar ── */}
      <div className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)] p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {message ? (
            <div
              className={`text-sm font-semibold ${
                messageType === "ok" ? "text-[var(--iberdrola-forest)]" : "text-red-700"
              }`}
            >
              {message}
            </div>
          ) : (
            <div className="text-sm text-[var(--iberdrola-forest)]/65">
              Guarda los cambios para que surtan efecto inmediatamente.
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="shrink-0 rounded-2xl bg-[var(--iberdrola-green)] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>

    </main>
  );
}
