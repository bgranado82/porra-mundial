
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
  <main style={{ padding: 40, background: "red", color: "white", fontSize: 40 }}>
    ADMIN NUEVO TEST TOTAL
  </main>
);
}