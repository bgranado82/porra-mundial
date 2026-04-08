"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Locale, messages } from "@/lib/i18n";

export default function Home() {
  const supabase = createClient();
  const router = useRouter();

  const [locale, setLocale] = useState<Locale>("es");
  const t = messages[locale];

  const [mode, setMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [entryNumber, setEntryNumber] = useState<1 | 2>(1);
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/predictions");
  }

  async function handleRegister() {
    setLoading(true);
    setMessage("");

    if (!name.trim()) {
      setMessage(t.nameRequired);
      setLoading(false);
      return;
    }

    if (!accessCode.trim()) {
      setMessage(t.accessCodeRequired);
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage(t.passwordMinLength);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage(t.passwordsDoNotMatch);
      setLoading(false);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedAccessCode = accessCode.trim().toUpperCase();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error || !data.user) {
      setMessage(error?.message || t.userCreationError);
      setLoading(false);
      return;
    }

    const user = data.user;

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      email: normalizedEmail,
      full_name: name.trim(),
      company: company.trim(),
      country: country.trim(),
    });

    if (profileError) {
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select("id, slug, access_code")
      .eq("access_code", normalizedAccessCode)
      .single();

    if (poolError || !pool) {
      setMessage(t.invalidPoolCode);
      setLoading(false);
      return;
    }

    const { error: entryError } = await supabase.from("entries").insert({
      user_id: user.id,
      pool_id: pool.id,
      entry_number: entryNumber,
      status: "draft",
      email: normalizedEmail,
      name: name.trim(),
      company: company.trim(),
      country: country.trim(),
    });

    if (entryError) {
      setMessage(entryError.message);
      setLoading(false);
      return;
    }

    router.push("/predictions");
  }

  return (
    <main className="min-h-screen bg-[var(--iberdrola-green-light)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-3 flex justify-end">
          <LanguageSwitcher
            locale={locale}
            onChange={setLocale}
            label={t.language}
          />
        </div>

        <div className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <img
              src="/logo.png"
              alt="Ibe World Cup"
              className="mb-4 h-24 w-24 rounded-3xl shadow-md md:h-28 md:w-28"
            />

            <h1 className="text-2xl font-bold text-[var(--iberdrola-forest)] md:text-3xl">
              {t.appTitle}
            </h1>

            <p className="mt-3 text-sm text-gray-600">
              {t.authWelcome}
            </p>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                mode === "login"
                  ? "bg-[var(--iberdrola-green)] text-white"
                  : "bg-white text-[var(--iberdrola-forest)] border border-[var(--iberdrola-sky)]"
              }`}
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              {t.login}
            </button>

            <button
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                mode === "register"
                  ? "bg-[var(--iberdrola-green)] text-white"
                  : "bg-white text-[var(--iberdrola-forest)] border border-[var(--iberdrola-sky)]"
              }`}
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
            >
              {t.register}
            </button>
          </div>

          <div className="space-y-3">
            {mode === "register" && (
              <>
                <input
                  placeholder={t.name}
                  className="w-full rounded-xl border border-[var(--iberdrola-sky)] px-3 py-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  placeholder={t.company}
                  className="w-full rounded-xl border border-[var(--iberdrola-sky)] px-3 py-2"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />

                <input
                  placeholder={t.country}
                  className="w-full rounded-xl border border-[var(--iberdrola-sky)] px-3 py-2"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />

                <input
                  placeholder={t.accessCode}
                  className="w-full rounded-xl border border-[var(--iberdrola-sky)] px-3 py-2 uppercase"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--iberdrola-forest)]">
                    {t.entryNumber}
                  </label>

                  <div className="flex gap-2">
                    <label className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--iberdrola-sky)] py-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        checked={entryNumber === 1}
                        onChange={() => setEntryNumber(1)}
                      />
                      {t.entryOne}
                    </label>

                    <label className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--iberdrola-sky)] py-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        checked={entryNumber === 2}
                        onChange={() => setEntryNumber(2)}
                      />
                      {t.entryTwo}
                    </label>
                  </div>
                </div>
              </>
            )}

            <input
              type="email"
              placeholder="Email"
              className="w-full rounded-xl border border-[var(--iberdrola-sky)] px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder={t.password}
              className="w-full rounded-xl border border-[var(--iberdrola-sky)] px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {mode === "register" && (
              <input
                type="password"
                placeholder={t.confirmPassword}
                className="w-full rounded-xl border border-[var(--iberdrola-sky)] px-3 py-2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            )}

            <button
              onClick={mode === "login" ? handleLogin : handleRegister}
              className="w-full rounded-xl bg-[var(--iberdrola-green)] py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              disabled={loading}
            >
              {loading
                ? t.loading
                : mode === "login"
                ? t.login
                : t.register}
            </button>

            {message && (
              <p className="text-sm text-red-600 text-center">{message}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}