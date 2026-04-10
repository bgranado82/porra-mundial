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

type OfficialGroupRow = {
  match_id: string;
  home_goals: number | null;
  away_goals: number | null;
};

type OfficialKnockoutRow = {
  match_id: string;
  picked_team_id: string | null;
};

export default function AdminPage() {
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

  useEffect(() => {
    async function loadOfficialResults() {
      setLoading(true);
      setMessage("");

      try {
        const { data: officialGroupRows, error: groupError } = await supabase
          .from("official_group_results")
          .select("match_id, home_goals, away_goals");

        if (groupError) {
          throw groupError;
        }

        const nextGroupResults: GroupResultMap = {};
        (officialGroupRows as OfficialGroupRow[] | null)?.forEach((row) => {
          nextGroupResults[row.match_id] = {
            homeGoals:
              row.home_goals === null || row.home_goals === undefined
                ? ""
                : String(row.home_goals),
            awayGoals:
              row.away_goals === null || row.away_goals === undefined
                ? ""
                : String(row.away_goals),
          };
        });
        setGroupResults(nextGroupResults);

        const { data: officialKnockoutRows, error: knockoutError } =
          await supabase
            .from("official_knockout_results")
            .select("match_id, picked_team_id");

        if (knockoutError) {
          throw knockoutError;
        }

        const nextKnockoutResults: KnockoutResultMap = {};
        (officialKnockoutRows as OfficialKnockoutRow[] | null)?.forEach((row) => {
          nextKnockoutResults[row.match_id] = row.picked_team_id ?? "";
        });
        setKnockoutResults(nextKnockoutResults);
      } catch (err) {
        console.error(err);
        setMessage("Error cargando resultados oficiales.");
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

    setGroupResults((current) => ({
      ...current,
      [matchId]: {
        homeGoals: current[matchId]?.homeGoals ?? "",
        awayGoals: current[matchId]?.awayGoals ?? "",
        [side]: value,
      },
    }));
  }

  function updateKnockoutResult(matchId: string, teamId: string) {
    setKnockoutResults((current) => ({
      ...current,
      [matchId]: teamId,
    }));
  }

  async function handleSaveGroupResults() {
    setSavingGroups(true);
    setMessage("");

    try {
      const rows = Object.entries(groupResults)
        .filter(([, value]) => value.homeGoals !== "" && value.awayGoals !== "")
        .map(([matchId, value]) => ({
          match_id: matchId,
          home_goals: Number(value.homeGoals),
          away_goals: Number(value.awayGoals),
        }));

      if (rows.length === 0) {
        setMessage("No hay resultados de grupos para guardar.");
        return;
      }

      const { error } = await supabase
        .from("official_group_results")
        .upsert(rows, { onConflict: "match_id" });

      if (error) {
        throw error;
      }

      setMessage("Resultados de grupos guardados correctamente.");
    } catch (err) {
      console.error(err);
      setMessage("Error guardando resultados de grupos.");
    } finally {
      setSavingGroups(false);
    }
  }

  async function handleSaveKnockoutResults() {
    setSavingKnockout(true);
    setMessage("");

    try {
      const rows = Object.entries(knockoutResults)
        .filter(([, teamId]) => !!teamId)
        .map(([matchId, pickedTeamId]) => ({
          match_id: matchId,
          picked_team_id: pickedTeamId,
        }));

      if (rows.length === 0) {
        setMessage("No hay resultados de eliminatorias para guardar.");
        return;
      }

      const { error } = await supabase
        .from("official_knockout_results")
        .upsert(rows, { onConflict: "match_id" });

      if (error) {
        throw error;
      }

      setMessage("Resultados de eliminatorias guardados correctamente.");
    } catch (err) {
      console.error(err);
      setMessage("Error guardando resultados de eliminatorias.");
    } finally {
      setSavingKnockout(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--iberdrola-green-light)] p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-bold text-[var(--iberdrola-forest)]">
            Admin · Resultados oficiales
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Aquí puedes guardar los resultados reales de grupos y los equipos clasificados de eliminatorias en Supabase.
          </p>

          {message ? (
            <p className="mt-3 text-sm text-[var(--iberdrola-forest)]">
              {message}
            </p>
          ) : null}
        </section>

        <section className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-semibold text-[var(--iberdrola-forest)]">
              Resultados de grupos
            </h2>

            <button
              type="button"
              onClick={handleSaveGroupResults}
              disabled={loading || savingGroups}
              className="rounded-xl bg-[var(--iberdrola-green)] px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {savingGroups ? "Guardando..." : "Guardar grupos"}
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {groupMatches.map((match: Match) => {
              const homeTeam = teamMap.get(match.homeTeamId ?? "");
              const awayTeam = teamMap.get(match.awayTeamId ?? "");

              if (!homeTeam || !awayTeam) return null;

              return (
                <div
                  key={match.id}
                  className="grid items-center gap-3 rounded-2xl border border-[var(--iberdrola-sky)] p-3 md:grid-cols-[1fr_auto_1fr_auto]"
                >
                  <div className="font-medium text-[var(--iberdrola-forest)]">
                    {homeTeam.flag} {homeTeam.name}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      inputMode="numeric"
                      value={groupResults[match.id]?.homeGoals ?? ""}
                      onChange={(e) =>
                        updateGroupResult(match.id, "homeGoals", e.target.value)
                      }
                      className="w-16 rounded-xl border border-[var(--iberdrola-sky)] px-3 py-2 text-center"
                    />
                    <span className="font-bold text-[var(--iberdrola-forest)]">-</span>
                    <input
                      inputMode="numeric"
                      value={groupResults[match.id]?.awayGoals ?? ""}
                      onChange={(e) =>
                        updateGroupResult(match.id, "awayGoals", e.target.value)
                      }
                      className="w-16 rounded-xl border border-[var(--iberdrola-sky)] px-3 py-2 text-center"
                    />
                  </div>

                  <div className="text-right font-medium text-[var(--iberdrola-forest)]">
                    {awayTeam.name} {awayTeam.flag}
                  </div>

                  <div className="text-xs text-gray-500">
                    {match.group ? `Grupo ${match.group}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--iberdrola-green)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-semibold text-[var(--iberdrola-forest)]">
              Eliminatorias
            </h2>

            <button
              type="button"
              onClick={handleSaveKnockoutResults}
              disabled={loading || savingKnockout}
              className="rounded-xl bg-[var(--iberdrola-green)] px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {savingKnockout ? "Guardando..." : "Guardar eliminatorias"}
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {knockoutMatches.map((match: Match) => {
              const homeTeam = match.homeTeamId
                ? teamMap.get(match.homeTeamId)
                : null;
              const awayTeam = match.awayTeamId
                ? teamMap.get(match.awayTeamId)
                : null;

              return (
                <div
                  key={match.id}
                  className="rounded-2xl border border-[var(--iberdrola-sky)] p-3"
                >
                  <div className="mb-2 text-sm font-semibold text-[var(--iberdrola-forest)]">
                    {match.stage} · {match.id}
                  </div>

                  {homeTeam && awayTeam ? (
                    <select
                      value={knockoutResults[match.id] ?? ""}
                      onChange={(e) =>
                        updateKnockoutResult(match.id, e.target.value)
                      }
                      className="w-full rounded-xl border border-[var(--iberdrola-sky)] px-3 py-2"
                    >
                      <option value="">Selecciona ganador</option>
                      <option value={homeTeam.id}>
                        {homeTeam.flag} {homeTeam.name}
                      </option>
                      <option value={awayTeam.id}>
                        {awayTeam.flag} {awayTeam.name}
                      </option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={knockoutResults[match.id] ?? ""}
                      onChange={(e) =>
                        updateKnockoutResult(match.id, e.target.value)
                      }
                      placeholder="picked_team_id"
                      className="w-full rounded-xl border border-[var(--iberdrola-sky)] px-3 py-2"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}