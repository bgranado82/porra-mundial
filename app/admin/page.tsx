"use client";

import { useEffect, useMemo, useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import GroupStandingsTable from "@/components/GroupStandingsTable";
import ScoringRulesCard from "@/components/ScoringRulesCard";
import KnockoutBracket from "@/components/KnockoutBracket";
import ThirdPlaceTable from "@/components/ThirdPlaceTable";

import { matches as initialMatches } from "@/data/matches";
import { scoreSettings } from "@/data/settings";
import { teams } from "@/data/teams";
import { realKnockoutPredictions as initialRealKnockoutPredictions } from "@/data/realKnockoutPredictions";

import { calculateStandings } from "@/lib/standings";
import { buildRealKnockoutBracket } from "@/lib/realKnockout";
import { getBestThirdPlacedTeams } from "@/lib/thirdPlace";
import { Locale, messages } from "@/lib/i18n";
import { KnockoutPredictionMap, Match } from "@/types";

const STORAGE_KEY = "porra-mundial-local";
const LOCALE_KEY = "porra-mundial-locale";

export default function AdminPage() {
  const [locale, setLocale] = useState<Locale>("es");
  const [officialMatches, setOfficialMatches] = useState<Match[]>(initialMatches);
  const [realKnockoutPredictions, setRealKnockoutPredictions] =
    useState<KnockoutPredictionMap>(initialRealKnockoutPredictions);

  function loadFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const parsed = JSON.parse(saved);

    if (parsed.officialMatches) {
      setOfficialMatches(parsed.officialMatches);
    }
    if (parsed.realKnockoutPredictions) {
      setRealKnockoutPredictions(parsed.realKnockoutPredictions);
    }
  }

  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_KEY) as Locale | null;
    if (savedLocale === "es" || savedLocale === "en" || savedLocale === "pt") {
      setLocale(savedLocale);
    }

    loadFromStorage();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        loadFromStorage();
      }
    };

    const handleFocus = () => {
      loadFromStorage();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...parsed,
        officialMatches,
        realKnockoutPredictions,
      })
    );
  }, [officialMatches, realKnockoutPredictions]);

  function updateOfficialResult(
    matchId: string,
    side: "homeGoals" | "awayGoals",
    value: number | null
  ) {
    setOfficialMatches((current) =>
      current.map((match) =>
        match.id === matchId
          ? {
              ...match,
              [side]: value,
            }
          : match
      )
    );
  }

  function updateRealKnockoutPrediction(matchId: string, teamId: string | null) {
    setRealKnockoutPredictions((current) => ({
      ...current,
      [matchId]: teamId,
    }));
  }

  const t = messages[locale];
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const groups = [...new Set(teams.map((team) => team.group).filter(Boolean))] as string[];

  const realBracket = useMemo(
    () =>
      buildRealKnockoutBracket(
        teams,
        officialMatches,
        groups,
        realKnockoutPredictions
      ),
    [officialMatches, groups, realKnockoutPredictions]
  );

  const bestThirdPlaced = useMemo(
    () => getBestThirdPlacedTeams(teams, officialMatches, groups, 8),
    [officialMatches, groups]
  );

  return (
    <main className="min-h-screen bg-[var(--iberdrola-green-light)] p-3">
      <div className="mx-auto max-w-7xl">
        <div className="mb-3 rounded-3xl bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Porra Mundial 2026 Admin"
                className="h-16 w-16 rounded-2xl shadow-md"
              />

              <div className="flex flex-col justify-center">
                <h1 className="m-0 text-2xl font-bold leading-tight text-[var(--iberdrola-forest)] md:text-3xl">
                  {t.appTitle} · Admin
                </h1>

                <p className="text-sm text-[var(--iberdrola-green)]">
                  {t.groupStage}
                </p>

                <div className="mt-1">
                  <LanguageSwitcher
                    locale={locale}
                    onChange={setLocale}
                    label={t.language}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <ScoringRulesCard
            settings={scoreSettings}
            title={t.scoringRules}
            exactScoreLabel={t.exactScoreRule}
            outcomeLabel={t.outcomeRule}
            homeGoalsLabel={t.homeGoalsRule}
            awayGoalsLabel={t.awayGoalsRule}
            round32Label={t.round32}
            round16Label={t.round16}
            quarterfinalLabel={t.quarterfinals}
            semifinalLabel={t.semifinals}
            finalLabel={t.finalLabel}
            championLabel={t.champion}
            noteLabel={t.scoringNote}
            pointsLabel={t.points}
          />
        </div>

        <div className="space-y-5">
          {groups.map((groupCode) => {
            const groupMatches = officialMatches.filter(
              (match) => match.stage === "group" && match.group === groupCode
            );

            const standings = calculateStandings(
              teams,
              officialMatches,
              groupCode
            );

            return (
              <section
                key={groupCode}
                className="rounded-3xl bg-white p-3 shadow-sm"
              >
                <h2 className="mb-3 text-lg font-semibold text-[var(--iberdrola-forest)] md:text-xl">
                  {t.group} {groupCode}
                </h2>

                <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
                  <div>
                    <div className="mb-2 grid grid-cols-[1.4fr_140px_1.4fr] px-2 text-xs text-[var(--iberdrola-forest)]">
                      <div>{t.home}</div>
                      <div className="text-center">{t.officialLabel}</div>
                      <div>{t.away}</div>
                    </div>

                    <div className="space-y-2">
                      {groupMatches.map((match) => {
                        const homeTeam = teamMap.get(match.homeTeamId ?? "");
                        const awayTeam = teamMap.get(match.awayTeamId ?? "");

                        if (!homeTeam || !awayTeam) return null;

                        return (
                          <div
                            key={match.id}
                            className="grid grid-cols-[1.4fr_140px_1.4fr] items-center gap-2 rounded-2xl border border-[var(--iberdrola-green)] bg-white p-2.5 shadow-sm"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-lg">{homeTeam.flag}</span>
                              <span className="truncate text-sm font-medium text-[var(--iberdrola-forest)] md:text-base">
                                {homeTeam.name}
                              </span>
                            </div>

                            <div className="flex items-center justify-center gap-1.5">
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
                                className="w-11 rounded border border-[var(--iberdrola-sky)] p-1 text-center text-sm text-[var(--iberdrola-forest)]"
                              />
                              <span className="font-bold text-[var(--iberdrola-forest)]">
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
                                className="w-11 rounded border border-[var(--iberdrola-sky)] p-1 text-center text-sm text-[var(--iberdrola-forest)]"
                              />
                            </div>

                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-lg">{awayTeam.flag}</span>
                              <span className="truncate text-sm font-medium text-[var(--iberdrola-forest)] md:text-base">
                                {awayTeam.name}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <GroupStandingsTable
                    title={t.standings}
                    rows={standings}
                    labels={{
                      team: t.team,
                      played: t.played,
                      won: t.won,
                      drawn: t.drawn,
                      lost: t.lost,
                      goalsFor: t.goalsFor,
                      goalsAgainst: t.goalsAgainst,
                      goalDifference: t.goalDifference,
                      pointsShort: t.pointsShort,
                    }}
                  />
                </div>
              </section>
            );
          })}

          <ThirdPlaceTable
            title={t.bestThirdPlaced}
            subtitle={t.bestThirdPlacedSubtitle}
            rows={bestThirdPlaced}
            labels={{
              position: t.position,
              group: t.group,
              team: t.team,
              played: t.played,
              won: t.won,
              drawn: t.drawn,
              lost: t.lost,
              goalsFor: t.goalsFor,
              goalsAgainst: t.goalsAgainst,
              goalDifference: t.goalDifference,
              pointsShort: t.pointsShort,
              status: t.status,
              qualified: t.qualified,
              eliminated: t.eliminated,
            }}
          />

          <KnockoutBracket
            title="Knockout real"
            subtitle="Marca con una X quién pasa de verdad en cada cruce."
            round32={realBracket.round32}
            round16={realBracket.round16}
            quarterfinals={realBracket.quarterfinals}
            semifinals={realBracket.semifinals}
            finals={realBracket.finals}
            championId={realBracket.championId}
            teams={teams}
            picks={realKnockoutPredictions}
            onPick={updateRealKnockoutPrediction}
          />
        </div>
      </div>
    </main>
  );
}