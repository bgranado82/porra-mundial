
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { teams } from "@/data/teams";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";

type ExtraPredictionRow = {
  question_key: string;
  predicted_value: string | null;
};

type EntryRow = {
  id: string;
  pool_id: string;
  status: "draft" | "submitted" | null;
  country: string | null;
};

type PoolRow = {
  id: string;
  name: string;
};

function normalizeValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function prettifyValue(value: string) {
  return value.trim();
}

const EXTRA_LABELS: Record<string, string> = {
  first_goal_scorer_world: "Primer goleador del Mundial",
  first_goal_scorer_spain: "Primer goleador de España",
  golden_boot: "Bota de Oro",
  golden_ball: "Balón de Oro",
  best_young_player: "Mejor jugador joven",
  golden_glove: "Guante de Oro",
  top_spanish_scorer: "Máximo goleador de España",
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const poolId = request.nextUrl.searchParams.get("poolId");

  if (!poolId) {
    return NextResponse.json({ error: "Missing poolId" }, { status: 400 });
  }

  try {
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select("id, name")
      .eq("id", poolId)
      .single<PoolRow>();

    if (poolError || !pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    const { data: entries, error: entriesError } = await supabase
      .from("entries")
      .select("id, pool_id, status, country")
      .eq("pool_id", poolId)
      .eq("status", "submitted")
      .returns<EntryRow[]>();

    if (entriesError) {
      return NextResponse.json({ error: "Error loading entries" }, { status: 500 });
    }

    const submittedEntries = entries ?? [];
    const entryIds = submittedEntries.map((entry) => entry.id);

    const participants = submittedEntries.length;
    const countries = new Set(
      submittedEntries
        .map((entry) => entry.country?.trim())
        .filter((value): value is string => !!value)
    ).size;

    const buyIn = 10;
    const potTotal = participants * buyIn;
    const loserRefund = participants > 0 ? buyIn : 0;
    const remainingPot = Math.max(potTotal - loserRefund, 0);
    const firstPrize = Math.round(remainingPot * 0.6);
    const secondPrize = Math.round(remainingPot * 0.3);
    const thirdPrize = remainingPot - firstPrize - secondPrize;

    let championItems: Array<{
      key: string;
      label: string;
      count: number;
      percentage: number;
      teamId?: string | null;
      flag?: string | null;
    }> = [];

    let extras: Array<{
      questionKey: string;
      title: string;
      total: number;
      items: Array<{
        key: string;
        label: string;
        count: number;
        percentage: number;
      }>;
    }> = [];

    if (entryIds.length > 0) {
      const { data: koRows, error: koError } = await supabase
        .from("entry_knockout_predictions")
        .select("entry_id, match_id, picked_team_id")
        .in("entry_id", entryIds)
        .eq("match_id", "final_winner");

      if (koError) {
        return NextResponse.json({ error: "Error loading champion predictions" }, { status: 500 });
      }

      const teamMap = new Map(teams.map((team) => [team.id, team]));
      const championCounter = new Map<string, number>();

      (koRows ?? []).forEach((row) => {
        if (!row.picked_team_id) return;
        championCounter.set(
          row.picked_team_id,
          (championCounter.get(row.picked_team_id) ?? 0) + 1
        );
      });

      championItems = Array.from(championCounter.entries())
        .map(([teamId, count]) => {
          const team = teamMap.get(teamId);
          return {
            key: teamId,
            label: team?.name ?? teamId,
            count,
            percentage: participants > 0 ? (count / participants) * 100 : 0,
            teamId,
            flag: team?.flag ?? null,
          };
        })
        .sort((a, b) => b.count - a.count);

      const { data: extraRows, error: extraError } = await supabase
        .from("entry_extra_predictions")
        .select("question_key, predicted_value, entry_id")
        .in("entry_id", entryIds)
        .returns<(ExtraPredictionRow & { entry_id: string })[]>();

      if (extraError) {
        return NextResponse.json({ error: "Error loading extra predictions" }, { status: 500 });
      }

      extras = EXTRA_QUESTIONS.map((question) => {
        const rowsForQuestion = (extraRows ?? []).filter(
          (row) => row.question_key === question.key
        );

        const counter = new Map<string, { label: string; count: number }>();

        rowsForQuestion.forEach((row) => {
          const raw = row.predicted_value?.trim();
          if (!raw) return;

          const key = normalizeValue(raw);
          const current = counter.get(key);

          if (current) {
            current.count += 1;
          } else {
            counter.set(key, {
              label: prettifyValue(raw),
              count: 1,
            });
          }
        });

        const items = Array.from(counter.entries())
          .map(([key, value]) => ({
            key,
            label: value.label,
            count: value.count,
            percentage: participants > 0 ? (value.count / participants) * 100 : 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        return {
          questionKey: question.key,
          title: EXTRA_LABELS[question.key] ?? question.key,
          total: participants,
          items,
        };
      });
    }

    const insights: string[] = [];

    if (championItems.length > 0) {
      const topChampion = championItems[0];
      insights.push(
        `${topChampion.label} es la selección más elegida como campeona con un ${topChampion.percentage.toFixed(1)}% de los picks.`
      );
    }

    const strongestExtra = extras
      .map((extra) => ({
        title: extra.title,
        item: extra.items[0],
      }))
      .filter((entry) => !!entry.item)
      .sort((a, b) => (b.item?.percentage ?? 0) - (a.item?.percentage ?? 0))[0];

    if (strongestExtra?.item) {
      insights.push(
        `La predicción más concentrada en preguntas extra es "${strongestExtra.title}": ${strongestExtra.item.label} lidera con un ${strongestExtra.item.percentage.toFixed(1)}%.`
      );
    }

    const mostOpenExtra = extras
      .map((extra) => ({
        title: extra.title,
        item: extra.items[0],
      }))
      .filter((entry) => !!entry.item)
      .sort((a, b) => (a.item?.percentage ?? 0) - (b.item?.percentage ?? 0))[0];

    if (mostOpenExtra?.item) {
      insights.push(
        `"${mostOpenExtra.title}" es la categoría más abierta: su opción líder solo alcanza un ${mostOpenExtra.item.percentage.toFixed(1)}%.`
      );
    }

    const response = {
      summary: {
        poolId: pool.id,
        poolName: pool.name,
        participants,
        countries,
        potTotal,
        loserRefund,
        firstPrize,
        secondPrize,
        thirdPrize,
      },
      champion: {
        total: participants,
        items: championItems,
      },
      extras,
      insights,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}