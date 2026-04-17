"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { teams } from "@/data/teams";
import { matches as initialMatches } from "@/data/matches";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";
import { calculatePredictedStandings } from "@/lib/standings";
import { buildUserKnockoutBracket } from "@/lib/knockoutBracket";
import { buildRealKnockoutBracket } from "@/lib/realKnockout";
import GroupMatchCompactRow from "@/components/GroupMatchCompactRow";
import GroupMatchRow from "@/components/GroupMatchRow";
import GroupStandingsTable from "@/components/GroupStandingsTable";
import KnockoutBracket from "@/components/KnockoutBracket";
import { Match, KnockoutPredictionMap } from "@/types";

type TransparencyEntryListItem = {
  id: string;
  name: string | null;
  company: string | null;
  country: string | null;
};

type TransparencyEntryResponse = {
  entry: {
    id: string;
    name: string | null;
    company: string | null;
    country: string | null;
    status: string | null;
  };
  groupPredictions: Array<{
    match_id: string;
    home_goals: number | null;
    away_goals: number | null;
  }>;
  knockoutPredictions: Array<{
    match_id: string;
    picked_team_id: string | null;
  }>;
  extraPredictions: Array<{
    question_key: string;
    predicted_value: string | null;
  }>;
  officialGroup: Array<{
    match_id: string;
    home_goals: number | null;
    away_goals: number | null;
  }>;
  officialKO: Array<{
    match_id: string;
    picked_team_id: string | null;
  }>;
};

type PredictionMap = Record<
  string,
  { homeGoals: number | null; awayGoals: number | null }
>;

const EXTRA_LABELS: Record<string, string> = {
  first_goal_scorer_world: "🥇 Primer goleador del Mundial",
  first_goal_scorer_spain: "🇪🇸 Primer goleador de España",
  golden_boot: "👟 Bota de Oro",
  golden_ball: "🏆 Balón de Oro",
  best_young_player: "🌟 Mejor jugador joven",
  golden_glove: "🧤 Guante de Oro",
  top_spanish_scorer: "⚽ Máximo goleador de España",
};

function getTeamsInRound(
  matches: Array<{ homeTeamId: string | null; awayTeamId: string | null }>
) {
  const set = new Set<string>();
  matches.forEach((match) => {
    if (match.homeTeamId) set.add(match.homeTeamId);
    if (match.awayTeamId) set.add(match.awayTeamId);
  });
  return set;
}

export default function TransparencyPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const poolId = searchParams.get("poolId") ?? "";
  const poolSlug = searchParams.get("poolSlug") ?? "";
  const entryId = searchParams.get("entryId") ?? "";
  const selectedEntryIdParam =
    searchParams.get("selectedEntryId") ?? entryId;

  const [participants, setParticipants] = useState<TransparencyEntryListItem[]>(
    []
  );
  const [selectedEntryId, setSelectedEntryId] =
    useState(selectedEntryIdParam);
  const [data, setData] = useState<TransparencyEntryResponse | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingEntry, setLoadingEntry] = useState(true);
  const [error, setError] = useState("");

  const teamMap = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    []
  );

  const groups = useMemo(
    () => [...new Set(teams.map((t) => t.group).filter(Boolean))] as string[],
    []
  );

  useEffect(() => {
    setSelectedEntryId(selectedEntryIdParam);
  }, [selectedEntryIdParam]);

  useEffect(() => {
    async function loadParticipants() {
      if (!poolId) {
        setError("Falta el poolId.");
        setLoadingList(false);
        return;
      }

      try {
        setLoadingList(true);
        setError("");

        const res = await fetch(`/api/transparency-entries?poolId=${poolId}`, {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Error cargando participantes");
        }

        const items = (json.items ?? []) as TransparencyEntryListItem[];
        setParticipants(items);

        if (!selectedEntryIdParam && items.length > 0) {
          const firstId = items[0].id;
          setSelectedEntryId(firstId);

          const params = new URLSearchParams(searchParams.toString());
          params.set("selectedEntryId", firstId);
          router.replace(`/transparency?${params.toString()}`);
        }
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la lista de participantes.");
      } finally {
        setLoadingList(false);
      }
    }

    loadParticipants();
  }, [poolId, selectedEntryIdParam, router, searchParams]);

  useEffect(() => {
    async function loadEntry() {
      if (!poolId || !selectedEntryId) {
        setLoadingEntry(false);
        return;
      }

      try {
        setLoadingEntry(true);
        setError("");

        const res = await fetch(
          `/api/transparency-entry?poolId=${poolId}&entryId=${selectedEntryId}`,
          { cache: "no-store" }
        );

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Error cargando transparencia");
        }

        setData(json as TransparencyEntryResponse);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la predicción seleccionada.");
      } finally {
        setLoadingEntry(false);
      }
    }

    loadEntry();
  }, [poolId, selectedEntryId]);

  const predictions = useMemo<PredictionMap>(() => {
    const map: PredictionMap = {};
    (data?.groupPredictions ?? []).forEach((row) => {
      map[row.match_id] = {
        homeGoals: row.home_goals,
        awayGoals: row.away_goals,
      };
    });
    return map;
  }, [data]);

  const knockoutPredictions = useMemo<KnockoutPredictionMap>(() => {
    const map: KnockoutPredictionMap = {};
    (data?.knockoutPredictions ?? []).forEach((row) => {
      map[row.match_id] = row.picked_team_id;
    });
    return map;
  }, [data]);

  const realKnockoutPredictions = useMemo<KnockoutPredictionMap>(() => {
    const map: KnockoutPredictionMap = {};
    (data?.officialKO ?? []).forEach((row) => {
      map[row.match_id] = row.picked_team_id;
    });
    return map;
  }, [data]);

  const officialMatches = useMemo<Match[]>(() => {
    return initialMatches.map((match) => {
      if (match.stage !== "group") return match;

      const official = (data?.officialGroup ?? []).find(
        (row) => row.match_id === match.id
      );

      return {
        ...match,
        homeGoals: official?.home_goals ?? null,
        awayGoals: official?.away_goals ?? null,
      };
    });
  }, [data]);

  const orderedGroupMatches = useMemo(
    () =>
      officialMatches
        .filter((match) => match.stage === "group")
        .sort((a, b) => {
          if ((a.order ?? 0) !== (b.order ?? 0)) {
            return (a.order ?? 0) - (b.order ?? 0);
          }
          return (a.matchNumber ?? 0) - (b.matchNumber ?? 0);
        }),
    [officialMatches]
  );

  const standingsByGroup = useMemo(
    () =>
      groups.map((groupCode) => ({
        groupCode,
        rows: calculatePredictedStandings(
          teams,
          officialMatches,
          predictions,
          groupCode
        ),
      })),
    [groups, officialMatches, predictions]
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
    [groups, knockoutPredictions, officialMatches, predictions]
  );

  const realBracket = useMemo(
    () =>
      buildRealKnockoutBracket(
        teams,
        officialMatches,
        groups,
        realKnockoutPredictions
      ),
    [groups, officialMatches, realKnockoutPredictions]
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

  const backToStatsHref =
    poolId && poolSlug && entryId
      ? `/stats?poolId=${poolId}&poolSlug=${poolSlug}&entryId=${entryId}`
      : `/stats?poolId=${poolId}`;

  const backToPredictionHref =
    poolSlug && entryId
      ? `/pool/${poolSlug}/entry/${entryId}`
      : "/dashboard";

  const selectedParticipant = participants.find((p) => p.id === selectedEntryId);

  if (loadingList || loadingEntry) {
    return (
      <main className="mx-auto max-w-[1600px] px-4 py-6">
        <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-[var(--iberdrola-forest)]">
            Cargando transparencia...
          </div>
        </section>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-[1600px] px-4 py-6">
        <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-[var(--iberdrola-forest)]">
            {error || "No hay datos disponibles."}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6">
      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3">
              <img
                src="/icon-512.png"
                alt="Porra Mundial 2026"
                className="h-12 w-12 rounded-xl object-contain sm:h-14 sm:w-14"
              />
            </div>

            <div>
              <div className="text-sm font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                Transparencia total
              </div>
              <h1 className="text-2xl font-black text-[var(--iberdrola-forest)]">
                Predicciones por participante
              </h1>
              <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
                Consulta una porra enviada completa: fase de grupos,
                clasificaciones, knockout y preguntas extra.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={backToStatsHref}
              className="rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:bg-[var(--iberdrola-sand)]"
            >
              Volver a estadísticas
            </Link>

            <Link
              href={backToPredictionHref}
              className="rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:bg-[var(--iberdrola-sand)]"
            >
              Volver a la porra
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="grid gap-4 p-5 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
              Participante
            </label>
            <select
              value={selectedEntryId}
              onChange={(e) => {
                const nextId = e.target.value;
                setSelectedEntryId(nextId);

                const params = new URLSearchParams(searchParams.toString());
                params.set("selectedEntryId", nextId);

                if (entryId) {
                  params.set("entryId", entryId);
                }

                router.replace(`/transparency?${params.toString()}`);
              }}
              className="w-full rounded-2xl border border-[var(--iberdrola-green)] bg-white px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)]"
            >
              {participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name || "Participante"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                Nombre
              </div>
              <div className="mt-1 text-sm font-bold text-[var(--iberdrola-forest)]">
                {selectedParticipant?.name || data.entry.name || "-"}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                Empresa
              </div>
              <div className="mt-1 text-sm font-bold text-[var(--iberdrola-forest)]">
                {data.entry.company || "-"}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--iberdrola-sky)] px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                País
              </div>
              <div className="mt-1 text-sm font-bold text-[var(--iberdrola-forest)]">
                {data.entry.country || "-"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.65fr_0.95fr]">
        <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
          <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
            <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
              Fase de grupos
            </h2>
            <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
              Pronósticos del participante en orden cronológico.
            </p>
          </div>

          <div className="p-4">
            <div className="hidden xl:block overflow-hidden rounded-2xl border border-[var(--iberdrola-sky)] bg-white">
              <div className="grid grid-cols-[132px_minmax(0,1fr)_82px] gap-2 bg-[var(--iberdrola-sand)]/35 px-3 py-3 text-[11px] font-black uppercase tracking-wide text-[var(--iberdrola-forest)]/75">
                <div>J / G / Fecha</div>
                <div className="text-center">Pronóstico</div>
                <div className="text-right">Info</div>
              </div>

              {orderedGroupMatches.map((match) => {
                const homeTeam = teamMap.get(match.homeTeamId ?? "");
                const awayTeam = teamMap.get(match.awayTeamId ?? "");

                if (!homeTeam || !awayTeam) return null;

                const prediction = predictions[match.id] ?? {
                  homeGoals: null,
                  awayGoals: null,
                };

                return (
                  <GroupMatchCompactRow
                    key={match.id}
                    day={match.day}
                    group={match.group ?? null}
                    kickoff={match.kickoff ?? null}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    homePrediction={prediction.homeGoals}
                    awayPrediction={prediction.awayGoals}
                    officialHomeGoals={match.homeGoals}
                    officialAwayGoals={match.awayGoals}
                    points={0}
                    onChangeHome={() => {}}
                    onChangeAway={() => {}}
                  />
                );
              })}
            </div>

            <div className="space-y-2 xl:hidden">
              {orderedGroupMatches.map((match) => {
                const homeTeam = teamMap.get(match.homeTeamId ?? "");
                const awayTeam = teamMap.get(match.awayTeamId ?? "");

                if (!homeTeam || !awayTeam) return null;

                const prediction = predictions[match.id] ?? {
                  homeGoals: null,
                  awayGoals: null,
                };

                return (
                  <GroupMatchRow
                    key={match.id}
                    day={match.day}
                    group={match.group ?? null}
                    matchNumber={match.matchNumber ?? 0}
                    kickoff={match.kickoff ?? null}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    homePrediction={prediction.homeGoals}
                    awayPrediction={prediction.awayGoals}
                    officialHomeGoals={match.homeGoals}
                    officialAwayGoals={match.awayGoals}
                    points={0}
                    pointsShortLabel="pts"
                    officialLabel="Oficial"
                    officialPendingLabel="Pendiente"
                    onChangeHome={() => {}}
                    onChangeAway={() => {}}
                  />
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm xl:sticky xl:top-4 self-start">
          <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
            <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
              Clasificaciones
            </h2>
            <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
              Clasificación proyectada por grupo.
            </p>
          </div>

          <div className="space-y-3 p-4">
            {standingsByGroup.map(({ groupCode, rows }) => (
              <div
                key={groupCode}
                className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-3"
              >
                <GroupStandingsTable
                  title={`Grupo ${groupCode}`}
                  rows={rows}
                  labels={{
                    team: "Equipo",
                    played: "PJ",
                    won: "PG",
                    drawn: "PE",
                    lost: "PP",
                    goalsFor: "GF",
                    goalsAgainst: "GC",
                    goalDifference: "DG",
                    pointsShort: "Pts",
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <KnockoutBracket
        title="Cuadro eliminatorio"
        subtitle="Predicción enviada por este participante"
        round32={userBracket.round32}
        round16={userBracket.round16}
        quarterfinals={userBracket.quarterfinals}
        semifinals={userBracket.semifinals}
        finals={userBracket.finals}
        championId={userBracket.championId}
        teams={teams}
        picks={knockoutPredictions}
        realTeamsByRound={realTeamsByRound}
      />

      <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
        <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
          <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
            Preguntas extra
          </h2>
          <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
            Respuestas enviadas por este participante.
          </p>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
          {EXTRA_QUESTIONS.map((question: any) => {
            const answer =
              data.extraPredictions.find(
                (row: any) => row.question_key === question.key
              )?.predicted_value ?? "-";

            return (
              <div
                key={question.key}
                className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-4"
              >
                <div className="mb-2 text-sm font-bold text-[var(--iberdrola-forest)]">
  {EXTRA_LABELS[question.key] ||
    question.label ||
    question.title ||
    question.text ||
    question.key}
</div>

                <div className="rounded-xl border border-[var(--iberdrola-green)]/30 bg-[var(--iberdrola-sand)]/20 px-3 py-3 text-sm font-semibold text-[var(--iberdrola-forest)]">
                  {answer}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
