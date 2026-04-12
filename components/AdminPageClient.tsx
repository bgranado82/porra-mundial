
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { matches as initialMatches } from "@/data/matches";
import { teams } from "@/data/teams";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";
import { Match } from "@/types";

type GroupResultMap = Record<
  string,
  { homeGoals: string; awayGoals: string }
>;

type KnockoutResultMap = Record<string, string>;
type OfficialExtraResultMap = Record<string, string>;

const STANDINGS_POOL_ID = "eb10020a-f258-49c7-be10-b0350b35d54a";

export default function AdminPageClient() {
  const supabase = createClient();

  const [groupResults, setGroupResults] = useState<GroupResultMap>({});
  const [knockoutResults, setKnockoutResults] = useState<KnockoutResultMap>({});
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

  const groupMatches = useMemo(
    () => initialMatches.filter((match) => match.stage === "group"),
    []
  );

  const knockoutMatches = useMemo(
    () => initialMatches.filter((match) => match.stage !== "group"),
    []
  );

  useEffect(() => {
    async function loadOfficialResults() {
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

        const nextKO: KnockoutResultMap = {};
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
    }

    loadOfficialResults();
  }, [supabase]);

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

      const extraRows = EXTRA_QUESTIONS.map((question) => ({
        question_key: question.key,
        official_value: (officialExtras[question.key] ?? "").trim(),
      })).filter((row) => row.official_value !== "");

      const { error: extrasError } = await supabase
        .from("official_extra_results")
        .upsert(extraRows, { onConflict: "question_key" });

      if (extrasError) {
        console.error(extrasError);
        setMessage("Error guardando resultados extra.");
        return;
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
    <main className="space-y-6 p-4">
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
        <h2 className="mb-2 text-xl font-semibold">Grupos</h2>

        <div className="mt-4 space-y-2">
          {groupMatches.map((match: Match) => {
            const home = teamMap.get(match.homeTeamId ?? "");
            const away = teamMap.get(match.awayTeamId ?? "");

            if (!home || !away) return null;

            return (
              <div key={match.id} className="flex items-center gap-2">
                <span className="min-w-[120px]">{home.name}</span>

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

                <span className="min-w-[120px]">{away.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Eliminatorias</h2>

        <div className="mt-4 space-y-2">
          {knockoutMatches.map((match: Match) => {
            const home = teamMap.get(match.homeTeamId ?? "");
            const away = teamMap.get(match.awayTeamId ?? "");

            return (
              <div key={match.id}>
                <select
                  value={knockoutResults[match.id] ?? ""}
                  onChange={(e) =>
                    updateKnockoutResult(match.id, e.target.value)
                  }
                  className="rounded border px-3 py-2"
                >
                  <option value="">Selecciona</option>
                  {home ? <option value={home.id}>{home.name}</option> : null}
                  {away ? <option value={away.id}>{away.name}</option> : null}
                </select>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Preguntas extra</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {EXTRA_QUESTIONS.map((question) => (
            <div key={question.key} className="rounded-xl border p-3">
              <label className="mb-2 block text-sm font-medium">
                {question.icon} {question.key}
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