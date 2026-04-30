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
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRegister() {
    setLoading(true);
    setMessage("");

    try {
      if (!name.trim()) {
        setMessage(t.nameRequired);
        return;
      }

      if (!accessCode.trim()) {
        setMessage(t.accessCodeRequired);
        return;
      }

      if (password.length < 6) {
        setMessage(t.passwordMinLength);
        return;
      }

      if (password !== confirmPassword) {
        setMessage(t.passwordsDoNotMatch);
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
        return;
      }

      const user = data.user;

      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        email: normalizedEmail,
        full_name: name.trim(),
        company: company.trim(),
        country: country.trim(),
        role: "user",
      });

      if (profileError) {
        setMessage(profileError.message);
        return;
      }

      const { data: pool, error: poolError } = await supabase
        .from("pools")
        .select("id, slug, access_code")
        .eq("access_code", normalizedAccessCode)
        .single();

      if (poolError || !pool) {
        setMessage(t.invalidPoolCode);
        return;
      }

      const { data: createdEntry, error: entryError } = await supabase
        .from("entries")
        .insert({
          user_id: user.id,
          pool_id: pool.id,
          entry_number: 1,
          status: "draft",
          email: normalizedEmail,
          name: name.trim(),
          company: company.trim(),
          country: country.trim(),
        })
        .select("id")
        .single();

      if (entryError || !createdEntry) {
        setMessage(entryError?.message || t.entryCreationError);
        return;
      }

      router.push(`/pool/${pool.slug}/entry/${createdEntry.id}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      window.location.href = "/post-login";
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
  setMessage("");

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    setMessage(t.forgotPasswordNeedEmail);
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: `${window.location.origin}/update-password`,
  });

  if (error) {
    setMessage(error.message);
    return;
  }

  setMessage(t.forgotPasswordEmailSent);
}


  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: "linear-gradient(135deg, var(--iberdrola-green-light) 0%, #ffffff 50%, var(--iberdrola-sky-light) 100%)" }}
    >
      <div className="w-full max-w-md fade-in">
        <div className="mb-3 flex justify-end">
          <LanguageSwitcher
            locale={locale}
            onChange={setLocale}
            label={t.language}
          />
        </div>

        <div className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white/90 p-6 shadow-xl backdrop-blur-sm md:p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-3xl bg-[var(--iberdrola-green)] opacity-10 blur-xl scale-110" />
              <img
                src="/logo.png"
                alt="Ibe World Cup"
                className="relative h-24 w-24 rounded-3xl shadow-lg md:h-28 md:w-28"
              />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-[var(--iberdrola-forest)] md:text-3xl">
              {t.appTitle}
            </h1>

            <p className="mt-2 text-sm text-[var(--iberdrola-forest)]/60">{t.authWelcome}</p>
            <a
              href="/guia.html"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--iberdrola-green-light)] border border-[var(--iberdrola-green-mid)] px-4 py-2 text-xs font-bold text-[var(--iberdrola-forest)] transition hover:bg-[var(--iberdrola-green-mid)]"
            >
              📖 {t.guideLink}
            </a>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-[var(--iberdrola-green-light)] p-1">
            <button
              type="button"
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                mode === "login"
                  ? "bg-[var(--iberdrola-green)] text-white shadow-md"
                  : "text-[var(--iberdrola-forest)]/70 hover:text-[var(--iberdrola-forest)]"
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
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                mode === "register"
                  ? "bg-[var(--iberdrola-green)] text-white shadow-md"
                  : "text-[var(--iberdrola-forest)]/70 hover:text-[var(--iberdrola-forest)]"
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
                  className="w-full rounded-2xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)]/40 px-4 py-3 text-sm font-medium placeholder:text-[var(--iberdrola-forest)]/40 focus:border-[var(--iberdrola-green)] focus:bg-white focus:outline-none transition"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  placeholder={t.company}
                  className="w-full rounded-2xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)]/40 px-4 py-3 text-sm font-medium placeholder:text-[var(--iberdrola-forest)]/40 focus:border-[var(--iberdrola-green)] focus:bg-white focus:outline-none transition"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />

                <input
                  placeholder={t.country}
                  className="w-full rounded-2xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)]/40 px-4 py-3 text-sm font-medium placeholder:text-[var(--iberdrola-forest)]/40 focus:border-[var(--iberdrola-green)] focus:bg-white focus:outline-none transition"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />

                <input
                  placeholder={t.accessCode}
                  className="w-full rounded-2xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)]/40 px-4 py-3 text-sm font-medium uppercase placeholder:text-[var(--iberdrola-forest)]/40 focus:border-[var(--iberdrola-green)] focus:bg-white focus:outline-none transition"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                />
              </>
            )}

            <input
              type="email"
              placeholder="Email"
              className="w-full rounded-2xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)]/40 px-4 py-3 text-sm font-medium placeholder:text-[var(--iberdrola-forest)]/40 focus:border-[var(--iberdrola-green)] focus:bg-white focus:outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder={t.password}
              className="w-full rounded-2xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)]/40 px-4 py-3 text-sm font-medium placeholder:text-[var(--iberdrola-forest)]/40 focus:border-[var(--iberdrola-green)] focus:bg-white focus:outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-[var(--iberdrola-forest)]/55 hover:text-[var(--iberdrola-forest)] transition underline-offset-2 hover:underline"
                >
                  {t.forgotPassword}
                </button>
              </div>
            )}

            {mode === "register" && (
              <input
                type="password"
                placeholder={t.confirmPassword}
                className="w-full rounded-2xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)]/40 px-4 py-3 text-sm font-medium placeholder:text-[var(--iberdrola-forest)]/40 focus:border-[var(--iberdrola-green)] focus:bg-white focus:outline-none transition"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            )}

            <button
              onClick={mode === "login" ? handleLogin : handleRegister}
              className="w-full rounded-2xl bg-[var(--iberdrola-green)] py-3.5 text-sm font-black text-white shadow-lg shadow-[var(--iberdrola-green)]/30 transition hover:brightness-110 hover:shadow-[var(--iberdrola-green)]/40 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  {t.loading}
                </span>
              ) : mode === "login" ? t.login : t.register}
            </button>

            {message && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-700 text-center fade-in">
                {message}
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--iberdrola-forest)]/40">
          Ibe World Cup 2026 · ibewc2026.com
        </p>
      </div>
    </main>
  );
}
