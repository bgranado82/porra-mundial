import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { recalculateScoresAll } from "@/lib/recalculateScoresAll";

type GroupResultRow = {
  match_id: string;
  home_goals: number;
  away_goals: number;
};

type KnockoutResultRow = {
  match_id: string;
  picked_team_id: string;
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const groupResults = (body.groupResults ?? []) as GroupResultRow[];
    const knockoutResults = (body.knockoutResults ?? []) as KnockoutResultRow[];

    if (groupResults.length > 0) {
      const { error: groupError } = await supabase
        .from("official_group_results")
        .upsert(groupResults, { onConflict: "match_id" });

      if (groupError) {
        return NextResponse.json({ error: groupError.message }, { status: 500 });
      }
    }

    if (knockoutResults.length > 0) {
      const { error: knockoutError } = await supabase
        .from("official_knockout_results")
        .upsert(knockoutResults, { onConflict: "match_id" });

      if (knockoutError) {
        return NextResponse.json({ error: knockoutError.message }, { status: 500 });
      }
    }

    const debug = await recalculateScoresAll();

return NextResponse.json({ success: true, debug });
 } catch (error: any) {
  console.error("ERROR API ADMIN:", error);

  return NextResponse.json(
    {
      error: "Error actualizando resultados",
      details:
        error?.message ||
        error?.details ||
        error?.hint ||
        JSON.stringify(error, null, 2),
    },
    { status: 500 }
  );
  }
}