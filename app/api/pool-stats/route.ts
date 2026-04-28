
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { teams } from "@/data/teams";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";

type ExtraPredictionRow = {
  question_key: string;
  predicted_value: string | null;
  normalized_value: string | null;
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

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getText(locale: string) {
  const lang = locale === "en" || locale === "pt" ? locale : "es";

  return {
    es: {
      championInsight: (label: string, percentage: number) =>
        `${label} es la selección más elegida como campeona con un ${percentage.toFixed(1)}% de los pronósticos.`,
      strongestExtraInsight: (title: string, label: string, percentage: number) =>
        `La predicción más concentrada en preguntas extra es "${title}": ${label} lidera con un ${percentage.toFixed(1)}%.`,
      mostOpenExtraInsight: (title: string, percentage: number) =>
        `"${title}" es la categoría más abierta: su opción líder solo alcanza un ${percentage.toFixed(1)}%.`,
    },
    en: {
      championInsight: (label: string, percentage: number) =>
        `${label} is the most selected champion with ${percentage.toFixed(1)}% of the picks.`,
      strongestExtraInsight: (title: string, label: string, percentage: number) =>
        `The most concentrated extra-question prediction is "${title}": ${label} leads with ${percentage.toFixed(1)}%.`,
      mostOpenExtraInsight: (title: string, percentage: number) =>
        `"${title}" is the most open category: its leading option only reaches ${percentage.toFixed(1)}%.`,
    },
    pt: {
      championInsight: (label: string, percentage: number) =>
        `${label} é a seleção mais escolhida como campeã com ${percentage.toFixed(1)}% dos palpites.`,
      strongestExtraInsight: (title: string, label: string, percentage: number) =>
        `A previsão mais concentrada nas perguntas extras é "${title}": ${label} lidera com ${percentage.toFixed(1)}%.`,
      mostOpenExtraInsight: (title: string, percentage: number) =>
        `"${title}" é a categoria mais aberta: sua opção líder alcança apenas ${percentage.toFixed(1)}%.`,
    },
  }[lang];
}

const EXTRA_LABELS: Record<string, Record<"es" | "en" | "pt", string>> = {
  first_goal_scorer_world: {
    es: "Primer goleador del Mundial",
    en: "First World Cup scorer",
    pt: "Primeiro goleador do Mundial",
  },
  first_goal_scorer_spain: {
    es: "Primer goleador de España",
    en: "First Spain scorer",
    pt: "Primeiro goleador da Espanha",
  },
  golden_boot: {
    es: "Bota de Oro",
    en: "Golden Boot",
    pt: "Chuteira de Ouro",
  },
  golden_ball: {
    es: "Balón de Oro",
    en: "Golden Ball",
    pt: "Bola de Ouro",
  },
  best_young_player: {
    es: "Mejor jugador joven",
    en: "Best young player",
    pt: "Melhor jogador jovem",
  },
  golden_glove: {
    es: "Guante de Oro",
    en: "Golden Glove",
    pt: "Luva de Ouro",
  },
  top_spanish_scorer: {
    es: "Máximo goleador de España",
    en: "Top Spain scorer",
    pt: "Maior goleador da Espanha",
  },
};

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const poolId = request.nextUrl.searchParams.get("poolId");
const locale = request.nextUrl.searchParams.get("locale") ?? "es";
const text = getText(locale);

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
      return NextResponse.json(
        { error: "Error loading entries" },
        { status: 500 }
      );
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
      flagUrl?: string | null;
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
        .eq("match_id", "final-1");

      if (koError) {
        return NextResponse.json(
          { error: "Error loading champion predictions" },
          { status: 500 }
        );
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

      const championPicked = Array.from(championCounter.values()).reduce((a, b) => a + b, 0);
      const championNoAnswer = participants - championPicked;

      championItems = Array.from(championCounter.entries())
        .map(([teamId, count]) => {
          const team = teamMap.get(teamId);
          return {
            key: teamId,
            label: team?.name ?? teamId,
            count,
            percentage: participants > 0 ? (count / participants) * 100 : 0,
            teamId,
            flagUrl: team?.flagUrl ?? null,
          };
        })
        .sort((a, b) => b.count - a.count);

      // Add "no answer" bucket so total sums to 100%
      if (championNoAnswer > 0) {
        championItems.push({
          key: "__no_answer__",
          label: "__no_answer__",
          count: championNoAnswer,
          percentage: participants > 0 ? (championNoAnswer / participants) * 100 : 0,
          teamId: null,
          flagUrl: null,
        });
      }

      const { data: extraRows, error: extraError } = await supabase
        .from("entry_extra_predictions")
        .select("question_key, predicted_value, normalized_value, entry_id")
        .in("entry_id", entryIds)
        .returns<(ExtraPredictionRow & { entry_id: string })[]>();

      if (extraError) {
        return NextResponse.json(
          { error: "Error loading extra predictions" },
          { status: 500 }
        );
      }

      extras = EXTRA_QUESTIONS.map((question) => {
        const rowsForQuestion = (extraRows ?? []).filter(
          (row) => row.question_key === question.key
        );

        const counter = new Map<string, { labels: string[]; count: number }>();

        rowsForQuestion.forEach((row) => {
          const normalized = row.normalized_value?.trim();
          const raw = row.predicted_value?.trim();
          if (!normalized || !raw) return;

          const current = counter.get(normalized);

          if (current) {
            current.count += 1;
          } else {
            counter.set(normalized, {
              labels: [prettifyValue(raw)],
              count: 1,
            });
          }
        });

        const answeredCount = Array.from(counter.values()).reduce((a, b) => a + b.count, 0);
        const noAnswerCount = participants - answeredCount;

        const items = [
          ...Array.from(counter.entries()).map(([key, value]) => ({
            key,
            label: titleCase(key),
            count: value.count,
            percentage: participants > 0 ? (value.count / participants) * 100 : 0,
          })),
          ...(noAnswerCount > 0 ? [{
            key: "__no_answer__",
            label: "__no_answer__",
            count: noAnswerCount,
            percentage: participants > 0 ? (noAnswerCount / participants) * 100 : 0,
          }] : []),
        ]
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        return {
          questionKey: question.key,
          title: EXTRA_LABELS[question.key]?.[locale as "es" | "en" | "pt"] ?? question.key,
          total: participants,
          items,
        };
      });
    }

    const insights: string[] = [];

    if (championItems.length > 0) {
      const topChampion = championItems[0];
      insights.push(
  text.championInsight(topChampion.label, topChampion.percentage)
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
  text.strongestExtraInsight(
    strongestExtra.title,
    strongestExtra.item.label,
    strongestExtra.item.percentage
  )
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
  text.mostOpenExtraInsight(
    mostOpenExtra.title,
    mostOpenExtra.item.percentage
  )
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