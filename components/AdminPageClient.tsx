
"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { matches as initialMatches } from "@/data/matches";
import { teams } from "@/data/teams";
import { Match } from "@/types";

type GroupResultMap = Record<
  string,
  { homeGoals: string; awayGoals: string }
>;

type KnockoutResultMap = Record<string, string>;

export default function AdminPageClient() {
  const supabase = createClient();

  const [groupResults, setGroupResults] = useState<GroupResultMap>({});
  const [knockoutResults, setKnockoutResults] = useState<KnockoutResultMap>({});
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
        const { data: groupRows } = await supabase
          .from("official_group_results")
          .select("match_id, home_goals, away_goals");

        const nextGroup: GroupResultMap = {};
        (groupRows ?? []).forEach((row) => {
          nextGroup[row.match_id] = {
            homeGoals: row.home_goals !== null ? String(row.home_goals) : "",
            awayGoals: row.away_goals !== null ? String(row.away_goals) : "",
          };
        });
        setGroupResults(nextGroup);

        const { data: koRows } = await supabase
          .from("official_knockout_results")
          .select("match_id, picked_team_id");

        const nextKO: KnockoutResultMap = {};
        (koRows ?? []).forEach((row) => {
          nextKO[row.match_id] = row.picked_team_id ?? "";
        });
        setKnockoutResults(nextKO);
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

setMessage(
  `Guardado OK. entries=${data.debug?.entries ?? 0}, official=${data.debug?.officialGroupResults ?? 0}, predictions=${data.debug?.groupPredictions ?? 0}, scores=${data.debug?.scoresToInsert ?? 0}`
);

      setMessage("Resultados guardados y clasificación recalculada correctamente.");
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
    <main className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">ADMIN · Resultados</h1>

      {message && <p>{message}</p>}

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
        <h2 className="text-xl font-semibold mb-2">Grupos</h2>

        <div className="space-y-2 mt-4">
          {groupMatches.map((match: Match) => {
            const home = teamMap.get(match.homeTeamId ?? "");
            const away = teamMap.get(match.awayTeamId ?? "");

            if (!home || !away) return null;

            return (
              <div key={match.id} className="flex gap-2 items-center">
                <span>{home.name}</span>

                <input
                  value={groupResults[match.id]?.homeGoals ?? ""}
                  onChange={(e) =>
                    updateGroupResult(match.id, "homeGoals", e.target.value)
                  }
                  className="w-12 border"
                />

                <span>-</span>

                <input
                  value={groupResults[match.id]?.awayGoals ?? ""}
                  onChange={(e) =>
                    updateGroupResult(match.id, "awayGoals", e.target.value)
                  }
                  className="w-12 border"
                />

                <span>{away.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Eliminatorias</h2>

        <div className="space-y-2 mt-4">
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
    </main>
  );
}