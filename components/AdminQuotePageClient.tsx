"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import AdminNav from "@/components/AdminNav";

type Quote = { es: string; en: string; pt: string };

export default function AdminQuotePageClient() {
  const supabase = createClient();

  const [quote, setQuote] = useState<Quote>({ es: "", en: "", pt: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"ok" | "error">("ok");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("quote_of_the_day")
        .select("es, en, pt")
        .eq("id", 1)
        .maybeSingle();
      if (data) setQuote({ es: data.es ?? "", en: data.en ?? "", pt: data.pt ?? "" });
      setLoading(false);
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("quote_of_the_day")
      .update({
        es: quote.es.trim(),
        en: quote.en.trim(),
        pt: quote.pt.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
      setMessage("Error guardando la frase.");
      setMessageType("error");
    } else {
      setMessage("✅ Frase publicada. Aparece ya en la clasificación.");
      setMessageType("ok");
    }

    setSaving(false);
  }

  const langs = [
    { key: "es" as const, flag: "https://flagcdn.com/es.svg", label: "Español", placeholder: "Lo que hacemos en la vida tiene su eco en la eternidad." },
    { key: "en" as const, flag: "https://flagcdn.com/gb.svg", label: "English", placeholder: "What we do in life echoes in eternity." },
    { key: "pt" as const, flag: "https://flagcdn.com/br.svg", label: "Português", placeholder: "O que fazemos na vida ecoa na eternidade." },
  ];

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-4 sm:px-6">

      {/* Header */}
      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--iberdrola-forest)]/45">
            Administración · Ibe World Cup 2026
          </div>
          <h1 className="mt-1.5 text-2xl font-black text-[var(--iberdrola-forest)]">
            💬 Quote of the day
          </h1>
          <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/65">
            La frase aparece en la página de clasificación para todos los usuarios
          </p>
          <div className="mt-4">
            <AdminNav />
          </div>
        </div>
      </section>

      {/* Formulario */}
      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
          <h2 className="text-base font-black text-[var(--iberdrola-forest)]">Frase actual</h2>
          <p className="mt-0.5 text-xs text-[var(--iberdrola-forest)]/55">
            Escríbela en los tres idiomas. Si dejas los campos vacíos no se mostrará ninguna frase.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-11 w-full rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {langs.map(({ key, flag, label, placeholder }) => (
              <div key={key}>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                  <img src={flag} alt={label} className="h-3.5 w-5 rounded-[2px] border border-gray-200 object-cover" />
                  {label}
                </label>
                <input
                  type="text"
                  value={quote[key]}
                  onChange={(e) => setQuote((q) => ({ ...q, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm text-[var(--iberdrola-forest)] placeholder:text-[var(--iberdrola-forest)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--iberdrola-green)]/30"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Preview */}
      {(quote.es || quote.en || quote.pt) ? (
        <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
          <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
            <h2 className="text-base font-black text-[var(--iberdrola-forest)]">Vista previa</h2>
            <p className="mt-0.5 text-xs text-[var(--iberdrola-forest)]/55">Así se verá en la clasificación</p>
          </div>
          <div className="px-5 py-4">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55 mb-2">
              Quote of the day
            </div>
            <div className="text-center text-[var(--iberdrola-forest)] space-y-1">
              {quote.es ? (
                <div className="flex items-center justify-center gap-2 text-base font-bold italic">
                  <img src="https://flagcdn.com/es.svg" alt="ES" className="h-4 w-6 rounded-[2px] border border-gray-200 object-cover" />
                  <span>"{quote.es}"</span>
                </div>
              ) : null}
              {quote.en ? (
                <div className="flex items-center justify-center gap-2 text-sm italic opacity-70">
                  <img src="https://flagcdn.com/gb.svg" alt="EN" className="h-4 w-6 rounded-[2px] border border-gray-200 object-cover" />
                  <span>"{quote.en}"</span>
                </div>
              ) : null}
              {quote.pt ? (
                <div className="flex items-center justify-center gap-2 text-sm italic opacity-70">
                  <img src="https://flagcdn.com/br.svg" alt="PT" className="h-4 w-6 rounded-[2px] border border-gray-200 object-cover" />
                  <span>"{quote.pt}"</span>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* Publicar */}
      <div className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)] p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {message ? (
            <div className={`text-sm font-semibold ${messageType === "ok" ? "text-[var(--iberdrola-forest)]" : "text-red-700"}`}>
              {message}
            </div>
          ) : (
            <div className="text-sm text-[var(--iberdrola-forest)]/65">
              El cambio es inmediato para todos los usuarios.
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="shrink-0 rounded-2xl bg-[var(--iberdrola-green)] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Publicando..." : "Publicar frase"}
        </button>
      </div>

    </main>
  );
}
