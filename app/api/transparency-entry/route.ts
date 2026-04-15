
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const poolId = request.nextUrl.searchParams.get("poolId");
  const entryId = request.nextUrl.searchParams.get("entryId");

  if (!poolId || !entryId) {
    return NextResponse.json(
      { error: "Missing poolId or entryId" },
      { status: 400 }
    );
  }

  // Entry
  const { data: entry } = await supabase
    .from("entries")
    .select("id, name, company, country, status")
    .eq("id", entryId)
    .eq("pool_id", poolId)
    .eq("status", "submitted")
    .single();

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  // Group predictions
  const { data: groupPredictions } = await supabase
    .from("entry_group_predictions")
    .select("match_id, home_goals, away_goals")
    .eq("entry_id", entryId);

  // Knockout
  const { data: knockoutPredictions } = await supabase
    .from("entry_knockout_predictions")
    .select("match_id, picked_team_id")
    .eq("entry_id", entryId);

  // Extras
  const { data: extraPredictions } = await supabase
    .from("entry_extra_predictions")
    .select("question_key, predicted_value")
    .eq("entry_id", entryId);

  // Oficiales (clave para calcular todo bien)
  const { data: officialGroup } = await supabase
    .from("official_group_results")
    .select("match_id, home_goals, away_goals");

  const { data: officialKO } = await supabase
    .from("official_knockout_results")
    .select("match_id, picked_team_id");

  return NextResponse.json({
    entry,
    groupPredictions: groupPredictions ?? [],
    knockoutPredictions: knockoutPredictions ?? [],
    extraPredictions: extraPredictions ?? [],
    officialGroup: officialGroup ?? [],
    officialKO: officialKO ?? [],
  });
}