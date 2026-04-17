
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();

  const poolId = request.nextUrl.searchParams.get("poolId");
  const entryId = request.nextUrl.searchParams.get("entryId");

  if (!poolId || !entryId) {
    return NextResponse.json(
      { error: "Missing poolId or entryId" },
      { status: 400 }
    );
  }

  const { data: entry, error: entryError } = await supabase
    .from("entries")
    .select("id, name, company, country, status")
    .eq("id", entryId)
    .eq("pool_id", poolId)
    .eq("status", "submitted")
    .maybeSingle();

  if (entryError) {
    console.error(entryError);
    return NextResponse.json(
      { error: "Error loading entry" },
      { status: 500 }
    );
  }

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const { data: groupPredictions, error: groupError } = await supabase
    .from("entry_group_predictions")
    .select("match_id, home_goals, away_goals")
    .eq("entry_id", entryId);

  if (groupError) {
    console.error(groupError);
    return NextResponse.json(
      { error: "Error loading group predictions" },
      { status: 500 }
    );
  }

  const { data: knockoutPredictions, error: knockoutError } = await supabase
    .from("entry_knockout_predictions")
    .select("match_id, picked_team_id")
    .eq("entry_id", entryId);

  if (knockoutError) {
    console.error(knockoutError);
    return NextResponse.json(
      { error: "Error loading knockout predictions" },
      { status: 500 }
    );
  }

  const { data: extraPredictions, error: extraError } = await supabase
    .from("entry_extra_predictions")
    .select("question_key, predicted_value")
    .eq("entry_id", entryId);

  if (extraError) {
    console.error(extraError);
    return NextResponse.json(
      { error: "Error loading extra predictions" },
      { status: 500 }
    );
  }

  const { data: officialGroup, error: officialGroupError } = await supabase
    .from("official_group_results")
    .select("match_id, home_goals, away_goals");

  if (officialGroupError) {
    console.error(officialGroupError);
    return NextResponse.json(
      { error: "Error loading official group results" },
      { status: 500 }
    );
  }

  const { data: officialKO, error: officialKOError } = await supabase
    .from("official_knockout_results")
    .select("match_id, picked_team_id");

  if (officialKOError) {
    console.error(officialKOError);
    return NextResponse.json(
      { error: "Error loading official knockout results" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    entry,
    groupPredictions: groupPredictions ?? [],
    knockoutPredictions: knockoutPredictions ?? [],
    extraPredictions: extraPredictions ?? [],
    officialGroup: officialGroup ?? [],
    officialKO: officialKO ?? [],
  });
}