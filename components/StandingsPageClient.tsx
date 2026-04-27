"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StandingsTable from "@/components/StandingsTable";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Locale, messages } from "@/lib/i18n";

const LOCALE_KEY = "porra-mundial-locale";

const QUOTE_OF_THE_DAY = {
  es: "Lo que hacemos en la vida tiene su eco en la eternidad.",
  en: "What we do in life echoes in eternity.",
  pt: "O que fazemos na vida ecoa na eternidade.",
};

const QUOTE_FLAGS = {
  es: "https://flagcdn.com/es.svg",
  en: "https://flagcdn.com/gb.svg",
  pt: "https://flagcdn.com/br.svg",
};

type Props = {
  poolId: string;
  backHref: string;
};

export default function StandingsPageClient({ poolId, backHref }: Props) {
  const [locale, setLocale] = useState<Locale>("es");
  const [data, setData] = useState<{ days: number[]; standings: unknown[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_KEY) as Locale | null;
    if (saved && ["es", "en", "pt"].includes(saved)) {
      setLocale(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/standings?poolId=${poolId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("error");
        const json = await res.json();
        setData(json);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    if (poolId) load();
    else setLoading(false);
  }, [poolId]);

  const t = messages[locale];

  return (
    <main className="min-h-screen bg-[var(--iberdrola-green-light)] p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">

        {/* HEADER */}
        <section className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/icon-512.png"
                alt="Porra Mundial 2026"
                className="h-12 w-12 rounded-xl object-contain sm:h-14 sm:w-14"
              />
              <div>
                <h1 className="text-2xl font-bold text-[var(--iberdrola-forest)] md:text-3xl">
                  {t.standingsTitle}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  {t.standingsSubtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher
                locale={locale}
                onChange={setLocale}
                label={t.language}
              />
              <Link
                href={backHref}
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:bg-[var(--iberdrola-green-light)]"
              >
                {t.standingsBackToPool}
              </Link>
            </div>
          </div>
        </section>

        {/* QUOTE OF THE DAY */}
        <section className="rounded-3xl border border-[var(--iberdrola-green)] bg-white px-5 py-3 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
            Quote of the day
          </div>
          <div className="mt-1 text-center text-[var(--iberdrola-forest)]">
            <div className="flex items-center justify-center gap-2 text-base font-bold italic">
              <img src={QUOTE_FLAGS.es} alt="España" className="h-4 w-6 rounded-[2px] border border-gray-200 object-cover" />
              <span>"{QUOTE_OF_THE_DAY.es}"</span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-2 text-sm italic opacity-80">
              <img src={QUOTE_FLAGS.en} alt="English" className="h-4 w-6 rounded-[2px] border border-gray-200 object-cover" />
              <span>"{QUOTE_OF_THE_DAY.en}"</span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-2 text-sm italic opacity-80">
              <img src={QUOTE_FLAGS.pt} alt="Brasil" className="h-4 w-6 rounded-[2px] border border-gray-200 object-cover" />
              <span>"{QUOTE_OF_THE_DAY.pt}"</span>
            </div>
          </div>
        </section>

        {/* TABLE */}
        {!poolId || error ? (
          <div className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-8 text-center text-sm text-red-600">
            {t.standingsMissingPoolId}
          </div>
        ) : loading ? (
          <div className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-6 shadow-sm space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-8 w-8 shrink-0 rounded-full" />
                <div className="skeleton h-8 flex-1 rounded-2xl" />
                <div className="skeleton h-8 w-16 rounded-2xl" />
                <div className="skeleton h-8 w-12 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : data ? (
          <StandingsTable
            days={data.days}
            standings={data.standings as never}
            locale={locale}
          />
        ) : null}

      </div>
    </main>
  );
}
