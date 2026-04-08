"use client";

import { useEffect, useMemo, useState } from "react";
import { matches as initialMatches } from "@/data/matches";
import { teams } from "@/data/teams";
import { Match } from "@/types";
import { Locale, messages } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { TIMEZONE_OPTIONS, TimezoneValue, formatKickoff } from "@/lib/timezone";

const STORAGE_KEY = "porra-mundial-local";
const LOCALE_KEY = "porra-mundial-locale";
const TIMEZONE_KEY = "porra-mundial-timezone";

export default function AdminPage() {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [locale, setLocale] = useState<Locale>("es");
  const [timeZone, setTimeZone] = useState<TimezoneValue>("local");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.officialMatches) {
        setMatches(parsed.officialMatches);
      }
    }

    const savedLocale = localStorage.getItem(LOCALE_KEY) as Locale | null;
    if (savedLocale === "es" || savedLocale === "en" || savedLocale === "pt") {
      setLocale(savedLocale);
    }

    const savedTimeZone = localStorage.getItem(TIMEZONE_KEY) as TimezoneValue | null;
    if (savedTimeZone) {
      setTimeZone(savedTimeZone);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...parsed,
        officialMatches: matches,
      })
    );
  }, [matches]);

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    localStorage.setItem(TIMEZONE_KEY, timeZone);
  }, [timeZone]);

  function updateOfficialResult(
    matchId: string,
    field: "homeGoals" | "awayGoals",
    value: number | null
  ) {
    setMatches((prev) =>
      prev.map((match) =>
        match.id === matchId ? { ...match, [field]: value } : match
      )
    );
  }

  const t = messages[locale];
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const groups = [...new Set(teams.map((team) => team.group).filter(Boolean))] as string[];

  const groupedMatches = useMemo(() => {
    return groups.map((groupCode) => ({
      groupCode,
      matches: matches.filter(
        (match) => match.stage === "group" && match.group === groupCode
      ),
    }));
  }, [groups, matches]);

  return (
    <main className="min-h-screen bg-[var(--iberdrola-green-light)] p-3">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 rounded-3xl border border-[var(--iberdrola-green)] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Ibe World Cup"
                className="h-16 w-16 rounded-2xl shadow-md"
              />

              <div>
                <h1 className="text-2xl font-bold text-[var(--iberdrola-forest)] md:text-3xl">
                  Admin · Resultados oficiales
                </h1>
                <p className="text-sm text-[var(--iberdrola-green)]">
                  Edita aquí los marcadores reales de la fase de grupos.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <LanguageSwitcher
                locale={locale}
                onChange={setLocale}
                label={t.language}
              />

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--iberdrola-forest)]">
                  Huso horario
                </span>

                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value as TimezoneValue)}
                  className="rounded-full border border-[var(--iberdrola-green)] bg-white px-3 py-1 text-sm text-[var(--iberdrola-forest)]"
                >
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {groupedMatches.map(({ groupCode, matches: groupMatches }) => (
            <section
              key={groupCode}
              className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-4 shadow-sm"
            >
              <h2 className="mb-4 text-2xl font-semibold text-[var(--iberdrola-forest)]">
                {t.group} {groupCode}
              </h2>

              <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 md:px-4">
                <div className="grid grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)] gap-2 border-b border-[var(--iberdrola-sky)] px-1 py-3 text-xs text-[var(--iberdrola-forest)] md:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] md:gap-3 md:text-sm">
                  <div>{t.home}</div>
                  <div className="text-center">{t.officialLabel}</div>
                  <div className="text-right">{t.away}</div>
                </div>

                <div className="divide-y divide-gray-100">
                  {groupMatches.map((match) => {
                    const homeTeam = teamMap.get(match.homeTeamId ?? "");
                    const awayTeam = teamMap.get(match.awayTeamId ?? "");

                    if (!homeTeam || !awayTeam) return null;

                    const kickoffInfo = formatKickoff(
                      (match as any).kickoff ?? null,
                      timeZone
                    );

                    return (
                      <div key={match.id} className="py-3 md:py-4">
                        <div className="mb-2 flex items-center justify-between text-[11px] text-gray-500 md:text-xs">
                          <span>
                            Partido {(match as any).matchNumber ?? "-"}
                          </span>
                          <span>{kickoffInfo.full}</span>
                        </div>

                        <div className="grid grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)] items-center gap-2 md:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] md:gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="text-lg">{homeTeam.flag}</span>
                            <span className="truncate text-sm font-medium text-[var(--iberdrola-forest)] md:text-base">
                              {homeTeam.name}
                            </span>
                          </div>

                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={match.homeGoals ?? ""}
                              onChange={(e) =>
                                updateOfficialResult(
                                  match.id,
                                  "homeGoals",
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              className="h-10 w-10 rounded-md border border-[var(--iberdrola-sky)] bg-white p-1 text-center text-base text-[var(--iberdrola-forest)] md:h-11 md:w-11"
                            />
                            <span className="text-base font-bold text-[var(--iberdrola-forest)] md:text-lg">
                              -
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={match.awayGoals ?? ""}
                              onChange={(e) =>
                                updateOfficialResult(
                                  match.id,
                                  "awayGoals",
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              className="h-10 w-10 rounded-md border border-[var(--iberdrola-sky)] bg-white p-1 text-center text-base text-[var(--iberdrola-forest)] md:h-11 md:w-11"
                            />
                          </div>

                          <div className="flex min-w-0 items-center justify-end gap-2">
                            <span className="truncate text-right text-sm font-medium text-[var(--iberdrola-forest)] md:text-base">
                              {awayTeam.name}
                            </span>
                            <span className="text-lg">{awayTeam.flag}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--iberdrola-green)] bg-white p-4 text-sm text-gray-500">
          Los resultados oficiales se guardan en este navegador. Luego lo conectamos a base de datos.
        </div>
      </div>
    </main>
  );
}