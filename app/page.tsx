"use client";

import { useEffect, useMemo, useState } from "react";
import GroupMatchRow from "@/components/GroupMatchRow";
import GroupStandingsTable from "@/components/GroupStandingsTable";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ParticipantInfoCard from "@/components/ParticipantInfoCard";
import ScoringRulesCard from "@/components/ScoringRulesCard";
import TotalPointsCard from "@/components/TotalPointsCard";
import KnockoutBracket from "@/components/KnockoutBracket";
import ThirdPlaceTable from "@/components/ThirdPlaceTable";

import { matches as initialMatches } from "@/data/matches";
import { scoreSettings } from "@/data/settings";
import { teams } from "@/data/teams";
import { userPredictions } from "@/data/userPredictions";
import { userKnockoutPredictions } from "@/data/userKnockoutPredictions";
import { realKnockoutPredictions as initialRealKnockoutPredictions } from "@/data/realKnockoutPredictions";

import { calculateMatchPredictionScore } from "@/lib/scoring";
import { calculatePredictedStandings } from "@/lib/standings";
import { calculateDailyPoints } from "@/lib/dailyPoints";
import { buildUserKnockoutBracket } from "@/lib/knockoutBracket";
import { buildRealKnockoutBracket } from "@/lib/realKnockout";
import {
  calculateKnockoutHitMap,
  calculateKnockoutScore,
} from "@/lib/knockoutScoring";
import { getBestThirdPlacedTeams } from "@/lib/thirdPlace";
import { Locale, messages } from "@/lib/i18n";
import { KnockoutPredictionMap, Match } from "@/types";

type PredictionMap = Record<
  string,
  { homeGoals: number | null; awayGoals: number | null }
>;

const STORAGE_KEY = "porra-mundial-local";

function getTeamsInRound(
  matches: { homeTeamId: string | null; awayTeamId: string | null }[]
) {
  const teams = new Set<string>();

  for (const match of matches) {
    if (match.homeTeamId) teams.add(match.homeTeamId);
    if (match.awayTeamId) teams.add(match.awayTeamId);
  }

  return teams;
}

export default function Home() {
  const [predictions, setPredictions] = useState<PredictionMap>(userPredictions);
  const [knockoutPredictions, setKnockoutPredictions] =
    useState<KnockoutPredictionMap>(userKnockoutPredictions);
  const [realKnockoutPredictions, setRealKnockoutPredictions] =
    useState<KnockoutPredictionMap>(initialRealKnockoutPredictions);
  const [officialMatches, setOfficialMatches] = useState<Match[]>(initialMatches);
  const [locale, setLocale] = useState<Locale>("es");

  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [participantCompany, setParticipantCompany] = useState("");
  const [participantCountry, setParticipantCountry] = useState("");

  function loadFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const parsed = JSON.parse(saved);

    setPredictions(parsed.predictions || userPredictions);
    setKnockoutPredictions(parsed.knockoutPredictions || userKnockoutPredictions);
    setRealKnockoutPredictions(
      parsed.realKnockoutPredictions || initialRealKnockoutPredictions
    );
    setOfficialMatches(parsed.officialMatches || initialMatches);
    setParticipantName(parsed.name || "");
    setParticipantEmail(parsed.email || "");
    setParticipantCompany(parsed.company || "");
    setParticipantCountry(parsed.country || "");
  }

  useEffect(() => {
    loadFromStorage();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) loadFromStorage();
    };

    const handleFocus = () => loadFromStorage();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        predictions,
        knockoutPredictions,
        realKnockoutPredictions,
        officialMatches,
        name: participantName,
        email: participantEmail,
        company: participantCompany,
        country: participantCountry,
      })
    );
  }, [
    predictions,
    knockoutPredictions,
    realKnockoutPredictions,
    officialMatches,
    participantName,
    participantEmail,
    participantCompany,
    participantCountry,
  ]);

  function updatePrediction(
    matchId: string,
    side: "homeGoals" | "awayGoals",
    value: number | null
  ) {
    setPredictions((current) => ({
      ...current,
      [matchId]: {
        homeGoals: current[matchId]?.homeGoals ?? null,
        awayGoals: current[matchId]?.awayGoals ?? null,
        [side]: value,
      },
    }));
  }

  function updateKnockoutPrediction(matchId: string, teamId: string | null) {
    setKnockoutPredictions((current) => ({
      ...current,
      [matchId]: teamId,
    }));
  }

  const t = messages[locale];
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const groups = [...new Set(teams.map((team) => team.group).filter(Boolean))] as string[];

  const groupPointsByDay = calculateDailyPoints(
    officialMatches,
    predictions,
    scoreSettings
  );

  const groupPointsTotal = Object.values(groupPointsByDay).reduce(
    (sum, pts) => sum + pts,
    0
  );

  const predictedGroupMatches = useMemo(
    () =>
      officialMatches.map((match) => {
        if (match.stage !== "group") return match;

        return {
          ...match,
          homeGoals: predictions[match.id]?.homeGoals ?? null,
          awayGoals: predictions[match.id]?.awayGoals ?? null,
        };
      }),
    [officialMatches, predictions]
  );

  const predictedThirdPlaced = useMemo(
    () => getBestThirdPlacedTeams(teams, predictedGroupMatches, groups, 8),
    [predictedGroupMatches, groups]
  );

  const userBracket = useMemo(
    () =>
      buildUserKnockoutBracket(
        teams,
        officialMatches,
        groups,
        predictions,
        knockoutPredictions
      ),
    [officialMatches, groups, predictions, knockoutPredictions]
  );

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

  const knockoutScore = useMemo(
    () => calculateKnockoutScore(scoreSettings, userBracket, realBracket),
    [userBracket, realBracket]
  );

  const knockoutHitMap = useMemo(
    () => calculateKnockoutHitMap(scoreSettings, userBracket, realBracket),
    [userBracket, realBracket]
  );

  const realTeamsByRound = useMemo(
    () => ({
      round32: getTeamsInRound(realBracket.round32),
      round16: getTeamsInRound(realBracket.round16),
      quarterfinals: getTeamsInRound(realBracket.quarterfinals),
      semifinals: getTeamsInRound(realBracket.semifinals),
      finals: getTeamsInRound(realBracket.finals),
      champion: realBracket.championId,
    }),
    [realBracket]
  );

  const totalPoints = groupPointsTotal + knockoutScore.total;

  return (
    <main className="min-h-screen bg-[var(--iberdrola-green-light)] p-3">
      <div className="mx-auto max-w-7xl">
        <div className="mb-3 rounded-3xl bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Porra Mundial 2026"
                className="h-16 w-16 rounded-2xl shadow-md"
              />

              <div className="flex flex-col justify-center">
                <h1 className="m-0 text-2xl font-bold leading-tight text-[var(--iberdrola-forest)] md:text-3xl">
                  {t.appTitle}
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

            <div className="w-full xl:w-[720px]">
              <ParticipantInfoCard
                title={t.participantData}
                nameLabel={t.name}
                emailLabel={t.email}
                companyLabel={t.company}
                countryLabel={t.country}
                name={participantName}
                email={participantEmail}
                company={participantCompany}
                country={participantCountry}
                onChangeName={setParticipantName}
                onChangeEmail={setParticipantEmail}
                onChangeCompany={setParticipantCompany}
                onChangeCountry={setParticipantCountry}
              />
            </div>
          </div>
        </div>

        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_1fr]">
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

          <div className="flex flex-col gap-3">
            <TotalPointsCard title={t.totalPoints} points={totalPoints} />

            <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white p-3">
              <h3 className="mb-2 text-sm font-semibold text-[var(--iberdrola-forest)]">
                {t.dailyEvolution}
              </h3>

              <div className="flex flex-wrap gap-2">
                {Object.entries(groupPointsByDay).map(([day, pts]) => (
                  <div
                    key={day}
                    className="rounded-full bg-[var(--iberdrola-green-light)] px-3 py-1 text-xs text-[var(--iberdrola-forest)]"
                  >
                    Día {day}: {pts}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--iberdrola-green)] bg-white p-3">
              <h3 className="mb-2 text-sm font-semibold text-[var(--iberdrola-forest)]">
                Eliminatorias
              </h3>

              <div className="grid gap-2 text-xs text-[var(--iberdrola-forest)] md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
                  <span>{t.round32}</span>
                  <strong>{knockoutScore.round32}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
                  <span>{t.round16}</span>
                  <strong>{knockoutScore.round16}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
                  <span>{t.quarterfinals}</span>
                  <strong>{knockoutScore.quarterfinals}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
                  <span>{t.semifinals}</span>
                  <strong>{knockoutScore.semifinals}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
                  <span>{t.finalLabel}</span>
                  <strong>{knockoutScore.final}</strong>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[var(--iberdrola-green-light)]/35 px-3 py-2">
                  <span>{t.champion}</span>
                  <strong>{knockoutScore.champion}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {groups.map((groupCode) => {
            const groupMatches = officialMatches.filter(
              (match) => match.stage === "group" && match.group === groupCode
            );

            const predictedStandings = calculatePredictedStandings(
              teams,
              officialMatches,
              predictions,
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
                    <div className="mb-2 grid grid-cols-[1.4fr_140px_1.4fr_50px] px-2 text-xs text-[var(--iberdrola-forest)]">
                      <div>{t.home}</div>
                      <div className="text-center">{t.yourPrediction}</div>
                      <div>{t.away}</div>
                      <div className="text-center">{t.pointsShort}</div>
                    </div>

                    <div className="space-y-2">
                      {groupMatches.map((match) => {
                        const homeTeam = teamMap.get(match.homeTeamId ?? "");
                        const awayTeam = teamMap.get(match.awayTeamId ?? "");

                        if (!homeTeam || !awayTeam) return null;

                        const prediction = predictions[match.id] ?? {
                          homeGoals: null,
                          awayGoals: null,
                        };

                        const score = calculateMatchPredictionScore(
                          match.homeGoals,
                          match.awayGoals,
                          prediction.homeGoals,
                          prediction.awayGoals,
                          scoreSettings
                        );

                        return (
                          <GroupMatchRow
                            key={match.id}
                            homeTeam={{ name: homeTeam.name, flag: homeTeam.flag }}
                            awayTeam={{ name: awayTeam.name, flag: awayTeam.flag }}
                            homePrediction={prediction.homeGoals}
                            awayPrediction={prediction.awayGoals}
                            officialHomeGoals={match.homeGoals}
                            officialAwayGoals={match.awayGoals}
                            points={score.points}
                            pointsLabel={t.points}
                            pointsShortLabel={t.pointsShort}
                            officialLabel={t.officialLabel}
                            officialPendingLabel={t.officialPending}
                            onChangeHome={(value) =>
                              updatePrediction(match.id, "homeGoals", value)
                            }
                            onChangeAway={(value) =>
                              updatePrediction(match.id, "awayGoals", value)
                            }
                          />
                        );
                      })}
                    </div>
                  </div>

                  <GroupStandingsTable
                    title={t.predictedStandings}
                    rows={predictedStandings}
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
            subtitle="Tus mejores terceros según tus pronósticos."
            rows={predictedThirdPlaced}
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
            title={t.yourKnockoutBracket}
            subtitle="Marca con una X quién pasa en cada cruce. Los puntos se comparan contra el cuadro real marcado en admin."
            round32={userBracket.round32}
            round16={userBracket.round16}
            quarterfinals={userBracket.quarterfinals}
            semifinals={userBracket.semifinals}
            finals={userBracket.finals}
            championId={userBracket.championId}
            teams={teams}
            picks={knockoutPredictions}
            onPick={updateKnockoutPrediction}
            hitMap={knockoutHitMap}
            realTeamsByRound={realTeamsByRound}
          />
        </div>
      </div>
    </main>
  );
}