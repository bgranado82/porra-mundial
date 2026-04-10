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
  const [savingGroups, setSavingGroups] = useState(false);
  const [savingKnockout, setSavingKnockout] = useState(false);
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

  // 🔹 Cargar resultados oficiales desde Supabase
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
            homeGoals:
              row.home_goals !== null ? String(row.home_goals) : "",
            awayGoals:
              row.away_goals !== null ? String(row.away_goals) : "",
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

  // 🔹 Actualizar inputs grupos
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

  // 🔹 Actualizar KO
  function updateKnockoutResult(matchId: string, teamId: string) {
    setKnockoutResults((prev) => ({
      ...prev,
      [matchId]: teamId,
    }));
  }

  // 🔹 Guardar grupos
  async function handleSaveGroups() {
    setSavingGroups(true);
    setMessage("");

    try {
      const rows = Object.entries(groupResults)
        .filter(([, v]) => v.homeGoals !== "" && v.awayGoals !== "")
        .map(([matchId, v]) => ({
          match_id: matchId,
          home_goals: Number(v.homeGoals),
          away_goals: Number(v.awayGoals),
        }));

      if (!rows.length) {
        setMessage("No hay datos de grupos.");
        return;
      }

      const { error } = await supabase
        .from("official_group_results")
        .upsert(rows, { onConflict: "match_id" });

      if (error) throw error;

      setMessage("Grupos guardados ✅");
    } catch (err) {
      console.error(err);
      setMessage("Error guardando grupos ❌");
    } finally {
      setSavingGroups(false);
    }
  }

  // 🔹 Guardar KO
  async function handleSaveKO() {
    setSavingKnockout(true);
    setMessage("");

    try {
      const rows = Object.entries(knockoutResults)
        .filter(([, team]) => !!team)
        .map(([matchId, team]) => ({
          match_id: matchId,
          picked_team_id: team,
        }));

      if (!rows.length) {
        setMessage("No hay datos de eliminatorias.");
        return;
      }

      const { error } = await supabase
        .from("official_knockout_results")
        .upsert(rows, { onConflict: "match_id" });

      if (error) throw error;

      setMessage("Eliminatorias guardadas ✅");
    } catch (err) {
      console.error(err);
      setMessage("Error guardando eliminatorias ❌");
    } finally {
      setSavingKnockout(false);
    }
  }

  if (loading) {
    return <div className="p-6">Cargando admin...</div>;
  }

  return (
    <main className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">ADMIN · Resultados</h1>

      {message && <p>{message}</p>}

      {/* GRUPOS */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Grupos</h2>

        <button onClick={handleSaveGroups} disabled={savingGroups}>
          {savingGroups ? "Guardando..." : "Guardar grupos"}
        </button>

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

      {/* KO */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Eliminatorias</h2>

        <button onClick={handleSaveKO} disabled={savingKnockout}>
          {savingKnockout ? "Guardando..." : "Guardar eliminatorias"}
        </button>

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
                  {home && (
                    <option value={home.id}>{home.name}</option>
                  )}
                  {away && (
                    <option value={away.id}>{away.name}</option>
                  )}
                </select>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}