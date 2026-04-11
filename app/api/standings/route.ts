
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

type StandingRow = {
  entry_id: string;
  pool_id: string;
  full_name: string | null;
  email: string | null;
  day_points: Record<string, number>;
  group_total: number;
  r32_points: number;
  r16_points: number;
  qf_points: number;
  sf_points: number;
  third_points: number;
  final_points: number;
  total_points: number;
};

export async function GET(req: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const poolId = searchParams.get("poolId");

    const entriesQuery = supabase
      .from("entries")
      .select(`
        id,
        pool_id,
        user_id,
        profiles (
          full_name,
          email
        )
      `);

    const { data: entries, error: entriesError } = poolId
      ? await entriesQuery.eq("pool_id", poolId)
      : await entriesQuery;

    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    const entryIds = (entries ?? []).map((e) => e.id);

    if (entryIds.length === 0) {
      return NextResponse.json({
        days: [],
        standings: [],
      });
    }

    const { data: scores, error: scoresError } = await supabase
      .from("entry_scores")
      .select("entry_id, pool_id, stage, matchday, points, is_exact, is_outcome")
      .in("entry_id", entryIds);

    if (scoresError) {
      return NextResponse.json({ error: scoresError.message }, { status: 500 });
    }

    const daysSet = new Set<number>();
    const standingsMap = new Map<string, StandingRow>();

    for (const entry of entries ?? []) {
      const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;

      standingsMap.set(entry.id, {
        entry_id: entry.id,
        pool_id: entry.pool_id,
        full_name: profile?.full_name ?? null,
        email: profile?.email ?? null,
        day_points: {},
        group_total: 0,
        r32_points: 0,
        r16_points: 0,
        qf_points: 0,
        sf_points: 0,
        third_points: 0,
        final_points: 0,
        total_points: 0,
      });
    }

    for (const row of scores ?? []) {
      const standing = standingsMap.get(row.entry_id);
      if (!standing) continue;

      const points = Number(row.points ?? 0);
      standing.total_points += points;

      if (row.stage === "group") {
        standing.group_total += points;

        if (row.matchday !== null && row.matchday !== undefined) {
          const day = Number(row.matchday);
          daysSet.add(day);
          standing.day_points[String(day)] =
            (standing.day_points[String(day)] ?? 0) + points;
        }
      }

      if (row.stage === "r32") standing.r32_points += points;
      if (row.stage === "r16") standing.r16_points += points;
      if (row.stage === "qf") standing.qf_points += points;
      if (row.stage === "sf") standing.sf_points += points;
      if (row.stage === "third") standing.third_points += points;
      if (row.stage === "final") standing.final_points += points;
    }

    const days = Array.from(daysSet).sort((a, b) => a - b);

    const standings = Array.from(standingsMap.values()).sort(
      (a, b) => b.total_points - a.total_points
    );

    return NextResponse.json({
      days,
      standings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Error loading standings" },
      { status: 500 }
    );
  }
}