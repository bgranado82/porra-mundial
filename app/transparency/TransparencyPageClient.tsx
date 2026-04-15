
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { matches as initialMatches } from "@/data/matches";
import { teams } from "@/data/teams";
import { calculatePredictedStandings } from "@/lib/standings";
import { buildUserKnockoutBracket } from "@/lib/knockoutBracket";
import GroupStandingsTable from "@/components/GroupStandingsTable";
import KnockoutBracket from "@/components/KnockoutBracket";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";

export default function TransparencyPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const poolId = searchParams.get("poolId") ?? "";
  const entryId = searchParams.get("entryId") ?? "";

  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState(entryId);
  const [data, setData] = useState<any>(null);

  // Load participants
  useEffect(() => {
    if (!poolId) return;

    fetch(`/api/transparency-entries?poolId=${poolId}`)
      .then((res) => res.json())
      .then((json) => {
        setParticipants(json.items || []);

        if (!entryId && json.items?.length) {
          const first = json.items[0].id;
          setSelectedEntryId(first);
          router.replace(`/transparency?poolId=${poolId}&entryId=${first}`);
        }
      });
  }, [poolId]);

  // Load entry
  useEffect(() => {
    if (!poolId || !selectedEntryId) return;

    fetch(`/api/transparency-entry?poolId=${poolId}&entryId=${selectedEntryId}`)
      .then((res) => res.json())
      .then(setData);
  }, [poolId, selectedEntryId]);

  const teamMap = new Map(teams.map((t) => [t.id, t]));

  // Map predictions
  const predictions = useMemo(() => {
    const map: any = {};
    data?.groupPredictions?.forEach((r: any) => {
      map[r.match_id] = {
        homeGoals: r.home_goals,
        awayGoals: r.away_goals,
      };
    });
    return map;
  }, [data]);

  const knockout = useMemo(() => {
    const map: any = {};
    data?.knockoutPredictions?.forEach((r: any) => {
      map[r.match_id] = r.picked_team_id;
    });
    return map;
  }, [data]);

  const officialMatches = useMemo(() => {
    return initialMatches.map((m) => {
      if (m.stage !== "group") return m;
      const o = data?.officialGroup?.find((x: any) => x.match_id === m.id);
      return {
        ...m,
        homeGoals: o?.home_goals ?? null,
        awayGoals: o?.away_goals ?? null,
      };
    });
  }, [data]);

const groups = [...new Set(teams.map((t) => t.group).filter(Boolean))] as string[];

  const standings = useMemo(() => {
    return groups.map((g) => ({
      groupCode: g,
      rows: calculatePredictedStandings(teams, officialMatches, predictions, g),
    }));
  }, [predictions, officialMatches]);

  const bracket = useMemo(() => {
    return buildUserKnockoutBracket(
      teams,
      officialMatches,
      groups,
      predictions,
      knockout
    );
  }, [predictions, knockout, officialMatches]);

  if (!data) return <div className="p-6">Cargando...</div>;

  return (
    <main className="max-w-[1400px] mx-auto p-4 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black">Transparencia</h1>

        <Link
          href={`/stats?poolId=${poolId}`}
          className="border px-4 py-2 rounded-xl"
        >
          Volver
        </Link>
      </div>

      {/* SELECTOR */}
      <select
        value={selectedEntryId}
        onChange={(e) => {
          const id = e.target.value;
          setSelectedEntryId(id);
          router.replace(`/transparency?poolId=${poolId}&entryId=${id}`);
        }}
        className="w-full border p-3 rounded-xl"
      >
        {participants.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name || "Participante"}
          </option>
        ))}
      </select>

      {/* INFO */}
      <div className="grid grid-cols-2 gap-4">
        <div>{data.entry.name}</div>
        <div>{data.entry.company}</div>
        <div>{data.entry.country}</div>
      </div>

      {/* CLASIFICACIÓN */}
      {standings.map((g) => (
        <GroupStandingsTable
          key={g.groupCode}
          title={`Grupo ${g.groupCode}`}
          rows={g.rows}
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
      ))}

      {/* KNOCKOUT */}
      <KnockoutBracket
        title="Knockout"
        subtitle=""
        {...bracket}
        teams={teams}
        picks={knockout}
      />

      {/* EXTRAS */}
      <div className="grid md:grid-cols-3 gap-4">
        {EXTRA_QUESTIONS.map((q) => (
          <div key={q.key} className="border p-4 rounded-xl">
            <div className="font-bold">{String(q.key)}</div>
            <div>{data.extraPredictions.find((x:any)=>x.question_key===q.key)?.predicted_value || "-"}</div>
          </div>
        ))}
      </div>

    </main>
  );
}