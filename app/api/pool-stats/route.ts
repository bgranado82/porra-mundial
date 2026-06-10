
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { teams } from "@/data/teams";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";
import { getPoolPrizeConfig } from "@/data/settings";

const PAGE = 1000;
async function fetchAllByIds(supabase: any, table: string, selectFields: string, entryIds: string[]): Promise<any[]> {
  const results: any[] = [];
  for (let i = 0; i < entryIds.length; i += PAGE) {
    const chunk = entryIds.slice(i, i + PAGE);
    let from = 0;
    while (true) {
      const { data, error } = await supabase.from(table).select(selectFields).in("entry_id", chunk).range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      results.push(...data);
      if (data.length < PAGE) break;
      from += PAGE;
    }
  }
  return results;
}


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
      // Insight 1: combo más popular (campeón + balón de oro)
      comboInsight: (champion: string, ball: string, count: number) =>
        `La combinación más popular es ${champion} campeón + ${ball} balón de oro, apostada por ${count} ${count === 1 ? "persona" : "personas"}.`,
      // Insight 2: consenso global
      consensusInsight: (clearCount: number, totalCount: number) =>
        `En ${clearCount} de los ${totalCount} extras hay un favorito claro (>40%).`,
      consensusNoneInsight: (totalCount: number) =>
        `En ninguno de los ${totalCount} extras hay un favorito claro (>40%): el grupo está muy abierto.`,
      // Insight 3: apuesta más solitaria
      uniquePickInsight: (label: string, questionTitle: string) =>
        `Solo una persona apuesta por ${label} como ${questionTitle.toLowerCase()}.`,
      // Insight 4: extra con más dispersión
      mostScatteredInsight: (title: string, distinctCount: number) =>
        `En "${title}" hay ${distinctCount} opciones diferentes votadas: el extra con más dispersión.`,
    },
    en: {
      comboInsight: (champion: string, ball: string, count: number) =>
        `The most popular combo is ${champion} as champion + ${ball} as Golden Ball, picked by ${count} ${count === 1 ? "person" : "people"}.`,
      consensusInsight: (clearCount: number, totalCount: number) =>
        `${clearCount} out of ${totalCount} extras have a clear favorite (>40%).`,
      consensusNoneInsight: (totalCount: number) =>
        `None of the ${totalCount} extras has a clear favorite (>40%): the group is wide open.`,
      uniquePickInsight: (label: string, questionTitle: string) =>
        `Only one person picks ${label} as ${questionTitle.toLowerCase()}.`,
      mostScatteredInsight: (title: string, distinctCount: number) =>
        `"${title}" has ${distinctCount} different options voted: the most scattered extra.`,
    },
    pt: {
      comboInsight: (champion: string, ball: string, count: number) =>
        `A combinação mais popular é ${champion} campeão + ${ball} bola de ouro, apostada por ${count} ${count === 1 ? "pessoa" : "pessoas"}.`,
      consensusInsight: (clearCount: number, totalCount: number) =>
        `Em ${clearCount} dos ${totalCount} extras há um favorito claro (>40%).`,
      consensusNoneInsight: (totalCount: number) =>
        `Em nenhum dos ${totalCount} extras há um favorito claro (>40%): o grupo está muito aberto.`,
      uniquePickInsight: (label: string, questionTitle: string) =>
        `Apenas uma pessoa aposta em ${label} como ${questionTitle.toLowerCase()}.`,
      mostScatteredInsight: (title: string, distinctCount: number) =>
        `Em "${title}" há ${distinctCount} opções diferentes votadas: o extra mais disperso.`,
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
// full=1 → devuelve TODOS los picks de cada extra (vista admin para normalizar).
// Sin el parámetro, se mantiene el comportamiento de la vista pública (top 8).
const full = request.nextUrl.searchParams.get("full") === "1";
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

    const prizeConfig = getPoolPrizeConfig(pool.id);

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

    const buyIn = prizeConfig.buyIn;
    const potTotal = participants * buyIn;

    // Devolución al último según la config del pool.
    let loserRefund = 0;
    if (participants > 0) {
      if (prizeConfig.loserRefund.kind === "fixed") {
        loserRefund = prizeConfig.loserRefund.amount;
      } else if (prizeConfig.loserRefund.kind === "percent") {
        loserRefund = Math.round((buyIn * prizeConfig.loserRefund.percent) / 100);
      }
      // No puede devolverse más de lo que hay en el bote.
      loserRefund = Math.min(loserRefund, potTotal);
    }

    const remainingPot = Math.max(potTotal - loserRefund, 0);
    const firstPrize = Math.round((remainingPot * prizeConfig.firstPct) / 100);
    const secondPrize = Math.round((remainingPot * prizeConfig.secondPct) / 100);
    // El 3º absorbe el redondeo solo si su % > 0; si es 0, queda en 0.
    const thirdPrize = prizeConfig.thirdPct > 0
      ? Math.max(remainingPot - firstPrize - secondPrize, 0)
      : 0;

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

    // Buffer de insights — se rellena dentro del if (entryIds.length > 0)
    // porque los 4 insights necesitan koRows y extraRows.
    const insightsBuffer: string[] = [];

    if (entryIds.length > 0) {
      const koRowsAll = await fetchAllByIds(supabase, "entry_knockout_predictions", "entry_id, match_id, picked_team_id", entryIds);
      const koRows = koRowsAll.filter((r: any) => r.match_id === "final-1");

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

      const extraRows = await fetchAllByIds(supabase, "entry_extra_predictions", "question_key, predicted_value, normalized_value, entry_id", entryIds);

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
          .sort((a, b) => b.count - a.count);

        // Vista pública: top 8. Vista admin (full): todos los picks distintos,
        // para poder detectar qué variantes hay que normalizar.
        const trimmedItems = full ? items : items.slice(0, 8);

        return {
          questionKey: question.key,
          title: EXTRA_LABELS[question.key]?.[locale as "es" | "en" | "pt"] ?? question.key,
          total: participants,
          items: trimmedItems,
        };
      });

      // ─── Cálculo de los 4 insights ─────────────────────────────────────
      // 1) Combo más popular: campeón + balón de oro juntos
      // Cruzamos koRows (campeón por entry) con extraRows filtrado por golden_ball.
      const championByEntry = new Map<string, string>();
      (koRows ?? []).forEach((row: any) => {
        if (row.picked_team_id) {
          championByEntry.set(String(row.entry_id), String(row.picked_team_id));
        }
      });

      const ballByEntry = new Map<string, { normalized: string; raw: string }>();
      (extraRows ?? []).forEach((row: any) => {
        if (row.question_key !== "golden_ball") return;
        const normalized = row.normalized_value?.trim();
        const raw = row.predicted_value?.trim();
        if (!normalized || !raw) return;
        ballByEntry.set(String(row.entry_id), { normalized, raw });
      });

      const comboCounter = new Map<string, { championId: string; ball: string; count: number }>();
      championByEntry.forEach((championId, entryId) => {
        const ball = ballByEntry.get(entryId);
        if (!ball) return;
        const key = `${championId}::${ball.normalized}`;
        const current = comboCounter.get(key);
        if (current) {
          current.count += 1;
        } else {
          comboCounter.set(key, { championId, ball: ball.raw, count: 1 });
        }
      });

      const topCombo = Array.from(comboCounter.values()).sort((a, b) => b.count - a.count)[0];
      if (topCombo) {
        const team = teamMap.get(topCombo.championId);
        const championName = team?.name ?? topCombo.championId;
        insightsBuffer.push(text.comboInsight(championName, prettifyValue(topCombo.ball), topCombo.count));
      }

      // 2) Consenso global: cuántos extras tienen un favorito >40%
      const extrasWithClearFavorite = extras.filter((extra) => {
        const top = extra.items.find((item) => item.key !== "__no_answer__");
        return top && top.percentage > 40;
      }).length;
      const totalExtras = extras.length;
      if (totalExtras > 0) {
        if (extrasWithClearFavorite > 0) {
          insightsBuffer.push(text.consensusInsight(extrasWithClearFavorite, totalExtras));
        } else {
          insightsBuffer.push(text.consensusNoneInsight(totalExtras));
        }
      }

      // 3) Apuesta más solitaria: pick único en algún extra (campeón incluido)
      // Priorizamos campeón > golden_ball > resto, y elegimos el primer único encontrado.
      const candidatesUnique: Array<{ label: string; questionTitle: string; priority: number }> = [];

      // Champion uniques
      championItems.forEach((item) => {
        if (item.key !== "__no_answer__" && item.count === 1) {
          candidatesUnique.push({
            label: item.label,
            questionTitle: locale === "en" ? "Champion" : locale === "pt" ? "Campeão" : "Campeón",
            priority: 0,
          });
        }
      });

      // Extra uniques
      extras.forEach((extra) => {
        const priority = extra.questionKey === "golden_ball" ? 1 : 2;
        extra.items.forEach((item) => {
          if (item.key !== "__no_answer__" && item.count === 1) {
            candidatesUnique.push({
              label: item.label,
              questionTitle: extra.title,
              priority,
            });
          }
        });
      });

      if (candidatesUnique.length > 0) {
        candidatesUnique.sort((a, b) => a.priority - b.priority);
        const pick = candidatesUnique[0];
        insightsBuffer.push(text.uniquePickInsight(pick.label, pick.questionTitle));
      }

      // 4) Extra más comodín: el extra con MÁS opciones distintas votadas
      const extrasByDistinct = extras
        .map((extra) => ({
          title: extra.title,
          // contar opciones reales (sin __no_answer__) que tengan al menos 1 voto
          distinctCount: extra.items.filter((item) => item.key !== "__no_answer__" && item.count > 0).length,
        }))
        .sort((a, b) => b.distinctCount - a.distinctCount);

      const mostScattered = extrasByDistinct[0];
      if (mostScattered && mostScattered.distinctCount >= 3) {
        insightsBuffer.push(text.mostScatteredInsight(mostScattered.title, mostScattered.distinctCount));
      }
    }

    const insights: string[] = insightsBuffer;

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

    return NextResponse.json(response, { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}