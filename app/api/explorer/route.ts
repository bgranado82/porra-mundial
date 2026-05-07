import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { teams } from "@/data/teams";

function normalizeValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function GET(req: Request) {
  try {
    const adminSupabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const poolId = searchParams.get("poolId");
    const filterKey = searchParams.get("filterKey");

    if (!poolId || !filterKey) {
      return NextResponse.json({ error: "poolId y filterKey requeridos" }, { status: 400 });
    }

    const { data: entries, error: entriesError } = await adminSupabase
      .from("entries")
      .select("id, name, email")
      .eq("pool_id", poolId)
      .eq("status", "submitted");

    if (entriesError) return NextResponse.json({ error: entriesError.message }, { status: 500 });
    if (!entries || entries.length === 0) return NextResponse.json({ results: [], total: 0 });

    const entryIds = entries.map((e: any) => e.id);
    const entryMap = new Map<string, { name: string; email: string }>(
      entries.map((e: any) => [String(e.id), { name: e.name as string, email: e.email as string }])
    );

    let rows: { entry_id: string; name: string; email: string; normalizedValue: string; displayValue: string; flagUrl: string | null }[] = [];

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
          const display = team?.name ?? p.picked_team_id;
          return {
            entry_id: String(p.entry_id),
            name: entry?.name || entry?.email || "–",
            email: entry?.email || "",
            normalizedValue: normalizeValue(display),
            displayValue: display,
            flagUrl: team?.flagUrl ?? null,
          };
        });
    } else {
      const { data: preds, error } = await adminSupabase
        .from("entry_extra_predictions")
        .select("entry_id, predicted_value, normalized_value")
        .in("entry_id", entryIds)
        .eq("question_key", filterKey);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      rows = (preds ?? [])
        .filter((p: any) => p.predicted_value?.trim())
        .map((p: any) => {
          const entry = entryMap.get(String(p.entry_id));
          const normalized = p.normalized_value?.trim() || normalizeValue(p.predicted_value);
          return {
            entry_id: String(p.entry_id),
            name: entry?.name || entry?.email || "–",
            email: entry?.email || "",
            normalizedValue: normalized,
            displayValue: titleCase(normalized),
            flagUrl: null,
          };
        });
    }

    // Agrupar por normalized_value, mostrar con titleCase
    const grouped: Record<string, { entries: typeof rows; displayValue: string; flagUrl: string | null }> = {};
    rows.forEach((r) => {
      if (!grouped[r.normalizedValue]) {
        grouped[r.normalizedValue] = { entries: [], displayValue: r.displayValue, flagUrl: r.flagUrl };
      }
      grouped[r.normalizedValue].entries.push(r);
    });

    const sorted = Object.entries(grouped)
      .sort(([, a], [, b]) => b.entries.length - a.entries.length)
      .map(([, group]) => ({
        value: group.displayValue,
        entries: group.entries,
        flagUrl: group.flagUrl,
      }));

    return NextResponse.json({ results: sorted, total: rows.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
