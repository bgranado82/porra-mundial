
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { matches as initialMatches } from "@/data/matches";
import { teams } from "@/data/teams";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";
import { buildRealKnockoutBracket } from "@/lib/realKnockout";
import {
  KnockoutPredictionMap,
  Match,
  KnockoutBracketMatch,
} from "@/types";

type GroupResultMap = Record<
  string,
  { homeGoals: string; awayGoals: string }
>;

type OfficialExtraResultMap = Record<string, string>;

const STANDINGS_POOL_ID = "eb10020a-f258-49c7-be10-b0350b35d54a";

const EXTRA_LABELS: Record<string, string> = {
  first_goal_scorer_world: "🥇 Primer goleador del Mundial",
  first_goal_scorer_spain: "🇪🇸 Primer goleador de España",
  golden_boot: "👟 Bota de Oro",
  golden_ball: "🏆 Balón de Oro",
  best_young_player: "🌟 Mejor jugador joven",
  golden_glove: "🧤 Guante de Oro",
  top_spanish_scorer: "🇪🇸 Máximo goleador de España",
};

function RoundSection({
  title,
  matches,
  picks,
  onPick,
  teamMap,
}: {
  title: string;
  matches: KnockoutBracketMatch[];
  picks: KnockoutPredictionMap;
  onPick: (matchId: string, teamId: string) => void;
  teamMap: Map<string, { id: string; name: string; flag: string }>;
}) {
  if (matches.length === 0) return null;

  return (
    <section>
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>

      <div className="space-y-3">
        {matches.map((match) => {
          const home = match.homeTeamId ? teamMap.get(match.homeTeamId) : null;
          const away = match.awayTeamId ? teamMap.get(match.awayTeamId) : null;

          const homeLabel =
            home?.name || match.homeLabel || "Pendiente de definir";
          const awayLabel =
            away?.name || match.awayLabel || "Pendiente de definir";

          const hasOptions = !!home || !!away;

          return (
            <div
              key={match.id}
              className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-4"
            >
              <div className="mb-2 text-sm font-semibold text-[var(--iberdrola-forest)]/70">
                {match.id}
              </div>

              <div className="mb-3 text-sm text-[var(--iberdrola-forest)]">
                <div>{home ? `${home.flag} ${homeLabel}` : homeLabel}</div>
                <div className="my-1 text-xs text-[var(--iberdrola-forest)]/55">
                  vs
                </div>
                <div>{away ? `${away.flag} ${awayLabel}` : awayLabel}</div>
              </div>

              <select
                value={picks[match.id] ?? ""}
                onChange={(e) => onPick(match.id, e.target.value)}
                disabled={!hasOptions}
                className="w-full rounded-xl border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Selecciona ganador</option>
                {home ? (
                  <option value={home.id}>
                    {home.flag} {home.name}
                  </option>
                ) : null}
                {away ? (
                  <option value={away.id}>
                    {away.flag} {away.name}
                  </option>
                ) : null}
              </select>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function AdminPageClient() {
  const supabase = createClient();

  const [groupResults, setGroupResults] = useState<GroupResultMap>({});
  const [knockoutResults, setKnockoutResults] =
    useState<KnockoutPredictionMap>({});
  const [officialExtras, setOfficialExtras] = useState<OfficialExtraResultMap>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [message, setMessage] = useState("");

  const teamMap = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    []
  );

  const groups = useMemo(
    () =>
      [...new Set(teams.map((team) => team.group).filter(Boolean))] as string[],
    []
  );

  const groupMatches = useMemo(
    () => initialMatches.filter((match) => match.stage === "group"),
    []
  );

  const officialMatches = useMemo<Match[]>(() => {
    return initialMatches.map((match) => {
      if (match.stage !== "group") return match;

      const official = groupResults[match.id];

      return {
        ...match,
        homeGoals:
          official?.homeGoals !== undefined && official.homeGoals !== ""
            ? Number(official.homeGoals)
            : null,
        awayGoals:
          official?.awayGoals !== undefined && official.awayGoals !== ""
            ? Number(official.awayGoals)
            : null,
      };
    });
  }, [groupResults]);

  const realBracket = useMemo(
    () =>
      buildRealKnockoutBracket(
        teams,
        officialMatches,
        groups,
        knockoutResults
      ),
    [officialMatches, groups, knockoutResults]
  );

  const loadOfficialResults = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const { data: groupRows, error: groupError } = await supabase
        .from("official_group_results")
        .select("match_id, home_goals, away_goals");

      if (groupError) throw groupError;

      const nextGroup: GroupResultMap = {};
      (groupRows ?? []).forEach((row) => {
        nextGroup[row.match_id] = {
          homeGoals: row.home_goals !== null ? String(row.home_goals) : "",
          awayGoals: row.away_goals !== null ? String(row.away_goals) : "",
        };
      });
      setGroupResults(nextGroup);

      const { data: koRows, error: koError } = await supabase
        .from("official_knockout_results")
        .select("match_id, picked_team_id");

      if (koError) throw koError;

      const nextKO: KnockoutPredictionMap = {};
      (koRows ?? []).forEach((row) => {
        nextKO[row.match_id] = row.picked_team_id ?? "";
      });
      setKnockoutResults(nextKO);

      const { data: extraRows, error: extraError } = await supabase
        .from("official_extra_results")
        .select("question_key, official_value");

      if (extraError) throw extraError;

      const nextExtras: OfficialExtraResultMap = {};
      (extraRows ?? []).forEach((row) => {
        nextExtras[row.question_key] = row.official_value ?? "";
      });
      setOfficialExtras(nextExtras);
    } catch (err) {
      console.error(err);
      setMessage("Error cargando resultados.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadOfficialResults();
  }, [loadOfficialResults]);

  function updateGroupResult(
    matchId: string,
    side: "homeGoals" | "awayGoals",
    value: string
  ) {
    if (!/^\d*$/.test(value)) return;

    setGroupResults((prev) => ({
      ...prev,
      [matchId]: {
        homeGoals: prev[matchId]?.homeGoals ?? "",
        awayGoals: prev[matchId]?.awayGoals ?? "",
        [side]: value,
      },
    }));
  }

  function updateKnockoutResult(matchId: string, teamId: string) {
    setKnockoutResults((prev) => ({
      ...prev,
      [matchId]: teamId,
    }));
  }

  function updateOfficialExtra(questionKey: string, value: string) {
    setOfficialExtras((prev) => ({
      ...prev,
      [questionKey]: value,
    }));
  }

  async function handleSaveAllResults() {
    setSavingAll(true);
    setMessage("");

    try {
      const groupRows = Object.entries(groupResults)
        .filter(([, value]) => value.homeGoals !== "" && value.awayGoals !== "")
        .map(([matchId, value]) => ({
          match_id: matchId,
          home_goals: Number(value.homeGoals),
          away_goals: Number(value.awayGoals),
        }));

      const knockoutRows = Object.entries(knockoutResults)
        .filter(([, teamId]) => !!teamId)
        .map(([matchId, pickedTeamId]) => ({
          match_id: matchId,
          picked_team_id: pickedTeamId,
        }));

      const extraRows = EXTRA_QUESTIONS.map((question) => {
        const value = (officialExtras[question.key] ?? "").trim();
        return value
          ? {
              question_key: question.key,
              official_value: value,
            }
          : null;
      }).filter(Boolean) as Array<{
        question_key: string;
        official_value: string;
      }>;

      const { error: deleteExtrasError } = await supabase
        .from("official_extra_results")
        .delete()
        .not("question_key", "is", null);

      if (deleteExtrasError) {
        console.error(deleteExtrasError);
        setMessage("Error limpiando resultados extra.");
        return;
      }

      if (extraRows.length > 0) {
        const { error: extrasError } = await supabase
          .from("official_extra_results")
          .insert(extraRows);

        if (extrasError) {
          console.error(extrasError);
          setMessage("Error guardando resultados extra.");
          return;
        }
      }

      const res = await fetch("/api/admin/update-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupResults: groupRows,
          knockoutResults: knockoutRows,
        }),
      });

      const data = await res.json();
      console.log("UPDATE RESULTS RESPONSE:", data);

      if (!res.ok) {
        setMessage(data.error || "Error guardando resultados.");
        return;
      }

      await loadOfficialResults();
      setMessage("Resultados y preguntas extra guardados correctamente.");
    } catch (err) {
      console.error(err);
      setMessage("Error guardando resultados.");
    } finally {
      setSavingAll(false);
    }
  }

  if (loading) {
    return <div className="p-6">Cargando admin...</div>;
  }

  return (
    <main className="space-y-8 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">ADMIN · Resultados</h1>

        <Link
          href={`/standings?poolId=${STANDINGS_POOL_ID}`}
          className="inline-block rounded-xl border border-[var(--iberdrola-green)] bg-white px-4 py-2 text-sm font-medium text-[var(--iberdrola-forest)]"
        >
          Ver clasificación
        </Link>
      </div>

      {message ? <p>{message}</p> : null}

      <div>
        <button
          onClick={handleSaveAllResults}
          disabled={savingAll}
          className="rounded-xl bg-[var(--iberdrola-green)] px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {savingAll ? "Guardando..." : "Guardar y recalcular todo"}
        </button>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Grupos</h2>

        <div className="mt-4 space-y-2">
          {groupMatches.map((match: Match) => {
            const home = teamMap.get(match.homeTeamId ?? "");
            const away = teamMap.get(match.awayTeamId ?? "");

            if (!home || !away) return null;

            return (
              <div key={match.id} className="flex items-center gap-2">
                <span className="min-w-[140px]">
                  {home.flag} {home.name}
                </span>

                <input
                  value={groupResults[match.id]?.homeGoals ?? ""}
                  onChange={(e) =>
                    updateGroupResult(match.id, "homeGoals", e.target.value)
                  }
                  className="w-12 rounded border px-2 py-1"
                />

                <span>-</span>

                <input
                  value={groupResults[match.id]?.awayGoals ?? ""}
                  onChange={(e) =>
                    updateGroupResult(match.id, "awayGoals", e.target.value)
                  }
                  className="w-12 rounded border px-2 py-1"
                />

                <span className="min-w-[140px]">
                  {away.flag} {away.name}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-8">
        <h2 className="text-xl font-semibold">Eliminatorias</h2>

        <RoundSection
          title="Round of 32"
          matches={realBracket.round32}
          picks={knockoutResults}
          onPick={updateKnockoutResult}
          teamMap={teamMap}
        />

        <RoundSection
          title="Octavos"
          matches={realBracket.round16}
          picks={knockoutResults}
          onPick={updateKnockoutResult}
          teamMap={teamMap}
        />

        <RoundSection
          title="Cuartos"
          matches={realBracket.quarterfinals}
          picks={knockoutResults}
          onPick={updateKnockoutResult}
          teamMap={teamMap}
        />

        <RoundSection
          title="Semis"
          matches={realBracket.semifinals}
          picks={knockoutResults}
          onPick={updateKnockoutResult}
          teamMap={teamMap}
        />

        <RoundSection
          title="Final"
          matches={realBracket.finals}
          picks={knockoutResults}
          onPick={updateKnockoutResult}
          teamMap={teamMap}
        />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Preguntas extra</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {EXTRA_QUESTIONS.map((question) => (
            <div key={question.key} className="rounded-xl border p-3">
              <label className="mb-2 block text-sm font-medium">
                {EXTRA_LABELS[question.key] ?? question.key}
              </label>

              <input
                type="text"
                value={officialExtras[question.key] ?? ""}
                onChange={(e) =>
                  updateOfficialExtra(question.key, e.target.value)
                }
                placeholder="Resultado oficial"
                className="w-full rounded border px-3 py-2"
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}