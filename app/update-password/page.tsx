"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Locale, messages } from "@/lib/i18n";

const LOCALE_KEY = "porra-mundial-locale";

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [locale, setLocale] = useState<Locale>("es");
  const t = messages[locale];

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ─── Estado de la sesión de recuperación ──────────────────────────────────
  // Cuando el usuario llega desde el email de "olvidé contraseña", Supabase
  // pone el token en el hash de la URL (#access_token=...&type=recovery).
  // El cliente de supabase-js lo detecta automáticamente y dispara el evento
  // PASSWORD_RECOVERY. Hasta que no llega ese evento (o ya hay una sesión
  // activa de un usuario logueado), no podemos llamar a updateUser:
  // si lo hacemos antes de tiempo Supabase responde "Auth session missing!".
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_KEY) as Locale | null;
    if (savedLocale === "es" || savedLocale === "en" || savedLocale === "pt") {
      setLocale(savedLocale);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  // Escuchar el evento PASSWORD_RECOVERY y/o detectar sesión existente.
  useEffect(() => {
    let mounted = true;

    // Caso 1: el usuario ya está logueado y entra a /update-password
    // manualmente. Hay sesión, podemos actualizar la contraseña directamente.
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) setReady(true);
    });

    // Caso 2: llegó desde el email de recuperación. supabase-js procesa el
    // hash de la URL y dispara PASSWORD_RECOVERY cuando ha establecido la
    // sesión temporal de recuperación.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleUpdatePassword() {
    setMessage("");

    if (!ready) {
      // El listener todavía no ha establecido la sesión. Esto es muy raro
      // (el usuario ha pulsado el botón antes de que React procese el hash)
      // pero protegemos al usuario de ver el "Auth session missing" críptico.
      setMessage(t.updatePasswordInvalidLink);
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

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(t.updatePasswordSuccess);

    setTimeout(() => {
      router.push("/");
    }, 1500);
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
          <h1 className="text-2xl font-bold text-[var(--iberdrola-forest)] md:text-3xl">
            {t.updatePasswordTitle}
          </h1>

          <div className="mt-6 space-y-3">
            <input
              type="password"
              placeholder={t.newPassword}
              className="w-full rounded-xl border border-[var(--iberdrola-sky)] px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder={t.confirmPassword}
              className="w-full rounded-xl border border-[var(--iberdrola-sky)] px-3 py-2"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button
              onClick={handleUpdatePassword}
              disabled={loading || !ready}
              className="w-full rounded-xl bg-[var(--iberdrola-green)] py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {loading
                ? t.loading
                : !ready
                  ? t.updatePasswordVerifying
                  : t.updatePasswordButton}
            </button>

            {message && (
              <p className="text-sm text-center text-[var(--iberdrola-forest)]">
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
