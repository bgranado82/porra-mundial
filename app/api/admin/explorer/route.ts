
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { teams } from "@/data/teams";

export async function GET(req: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || profile.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const adminSupabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const poolId = searchParams.get("poolId");
    const filterKey = searchParams.get("filterKey");

    if (!poolId || !filterKey) {
      return NextResponse.json({ error: "poolId y filterKey requeridos" }, { status: 400 });
    }

    // Get all entries for this pool
    const { data: entries, error: entriesError } = await adminSupabase
      .from("entries")
      .select("id, name, email")
      .eq("pool_id", poolId)
      .eq("status", "submitted");

    if (entriesError) return NextResponse.json({ error: entriesError.message }, { status: 500 });
    if (!entries || entries.length === 0) return NextResponse.json({ results: [] });

    const entryIds = entries.map((e: any) => e.id);
    const entryMap = new Map<string, { name: string; email: string }>(entries.map((e: any) => [String(e.id), { name: e.name as string, email: e.email as string }]));

    let rows: { entry_id: string; name: string; email: string; value: string }[] = [];

    if (filterKey === "champion") {
      const { data: preds, error } = await adminSupabase
        .from("entry_knockout_predictions")
        .select("entry_id, picked_team_id")
        .in("entry_id", entryIds)
        .eq("match_id", "final-1");

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      rows = (preds ?? [])
        .filter((p: any) => !!p.picked_team_id)
        .map((p: any) => {
          const entry = entryMap.get(String(p.entry_id));
          const team = teams.find((t) => t.id === p.picked_team_id);
          return {
            entry_id: String(p.entry_id),
            name: entry?.name || entry?.email || "–",
            email: entry?.email || "",
            value: team?.name ?? p.picked_team_id,
            flagUrl: team?.flagUrl ?? null,
          };
        });
    } else {
      const { data: preds, error } = await adminSupabase
        .from("entry_extra_predictions")
        .select("entry_id, predicted_value")
        .in("entry_id", entryIds)
        .eq("question_key", filterKey);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      rows = (preds ?? [])
        .filter((p: any) => p.predicted_value?.trim())
        .map((p: any) => {
          const entry = entryMap.get(String(p.entry_id));
          return {
            entry_id: String(p.entry_id),
            name: entry?.name || entry?.email || "–",
            email: entry?.email || "",
            value: (p.predicted_value as string).trim(),
            flagUrl: null,
          };
        });
    }

    // Group by value, sort by count desc
    const grouped: Record<string, typeof rows> = {};
    rows.forEach((r) => {
      if (!grouped[r.value]) grouped[r.value] = [];
      grouped[r.value].push(r);
    });

    const sorted = Object.entries(grouped)
      .sort(([, a], [, b]) => b.length - a.length)
      .map(([value, entries]) => ({ value, entries, flagUrl: (entries[0] as any).flagUrl ?? null }));

    return NextResponse.json({ results: sorted, total: rows.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
