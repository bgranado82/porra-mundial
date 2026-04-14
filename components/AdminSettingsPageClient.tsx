
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

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

export default function AdminSettingsPageClient() {
  const supabase = createClient();

  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [settings, setSettings] = useState<any>(null);
  const [message, setMessage] = useState("");

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
  }, [selectedPoolId]);

  async function save() {
    const { error } = await supabase
      .from("pools")
      .update(settings)
      .eq("id", selectedPoolId);

    if (error) {
      setMessage("Error guardando");
    } else {
      setMessage("Guardado OK");
    }
  }

  if (!settings) return <div className="p-6">Cargando...</div>;

  return (
    <main className="mx-auto max-w-[1200px] p-6 space-y-6">
      <h1 className="text-2xl font-black">Configuración</h1>

      <div className="flex gap-2">
        <Link href="/admin">Inicio</Link>
        <Link href="/admin/results">Resultados</Link>
        <Link href="/admin/participants">Participantes</Link>
      </div>

      <select
        value={selectedPoolId}
        onChange={(e) => setSelectedPoolId(e.target.value)}
      >
        {pools.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <div className="space-y-3">
        <label>
          <input
            type="checkbox"
            checked={settings.is_registration_open}
            onChange={(e) =>
              setSettings({
                ...settings,
                is_registration_open: e.target.checked,
              })
            }
          />
          Inscripción abierta
        </label>

        <label>
          <input
            type="checkbox"
            checked={settings.is_predictions_editable}
            onChange={(e) =>
              setSettings({
                ...settings,
                is_predictions_editable: e.target.checked,
              })
            }
          />
          Editable
        </label>

        <label>
          <input
            type="checkbox"
            checked={settings.is_submission_enabled}
            onChange={(e) =>
              setSettings({
                ...settings,
                is_submission_enabled: e.target.checked,
              })
            }
          />
          Envío activo
        </label>
      </div>

      <button onClick={save}>Guardar</button>

      {message && <div>{message}</div>}
    </main>
  );
}
