"use client";

import { useState } from "react";

export default function JoinPage() {
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [entryNumber, setEntryNumber] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/entry-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          accessCode,
          entryNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo acceder");
        setLoading(false);
        return;
      }

      const savedEntries = JSON.parse(
        localStorage.getItem("porra_entries") || "{}"
      );

      savedEntries[`${data.poolSlug}:${entryNumber}`] = data.entryId;
      localStorage.setItem("porra_entries", JSON.stringify(savedEntries));

      window.location.href = `/pool/${data.poolSlug}/entry/${data.entryId}`;
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--iberdrola-green-light)] p-4">
      <div className="mx-auto max-w-xl rounded-3xl border border-[var(--iberdrola-green)] bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold text-[var(--iberdrola-forest)]">
          Ibe World Cup
        </h1>

        <p className="mb-6 text-sm text-gray-600">
          Introduce tu email, el código de porra y si es tu primera o segunda porra.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--iberdrola-forest)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-xl border border-[var(--iberdrola-sky)] px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--iberdrola-forest)]">
              Código de porra
            </label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="IBERDROLA2026"
              className="w-full rounded-xl border border-[var(--iberdrola-sky)] px-3 py-2 uppercase"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--iberdrola-forest)]">
              Número de porra
            </label>

            <div className="flex gap-3">
              <label className="flex items-center gap-2 rounded-xl border border-[var(--iberdrola-sky)] px-4 py-2">
                <input
                  type="radio"
                  name="entryNumber"
                  checked={entryNumber === 1}
                  onChange={() => setEntryNumber(1)}
                />
                <span>Porra 1</span>
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-[var(--iberdrola-sky)] px-4 py-2">
                <input
                  type="radio"
                  name="entryNumber"
                  checked={entryNumber === 2}
                  onChange={() => setEntryNumber(2)}
                />
                <span>Porra 2</span>
              </label>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[var(--iberdrola-green)] px-5 py-2 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}