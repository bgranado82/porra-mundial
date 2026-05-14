import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { recalculateScoresAll } from "@/lib/recalculateScoresAll";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };
  const { data: profile, error } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (error || !profile || profile.role !== "admin") return { ok: false as const, status: 403 };
  return { ok: true as const };
}

// GET /api/admin/normalize-extra?questionKey=golden_boot&poolId=xxx&statusFilter=submitted
// Devuelve todas las filas de entry_extra_predictions del pool/pregunta/status,
// con predicted_value (lo que escribió el usuario) y normalized_value (editable).
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "No autorizado" }, { status: auth.status });

  const { searchParams } = request.nextUrl;
  const questionKey  = searchParams.get("questionKey");
  const poolId       = searchParams.get("poolId");
  const statusFilter = searchParams.get("statusFilter") ?? "submitted";

  if (!questionKey) return NextResponse.json({ error: "Falta questionKey" }, { status: 400 });
  if (!poolId)      return NextResponse.json({ error: "Falta poolId" }, { status: 400 });

  const supabase = createAdminClient();

  // 1. Entradas del pool filtradas por status
  let q = supabase.from("entries").select("id, name, entry_number, status").eq("pool_id", poolId);
  if (statusFilter === "submitted") q = q.eq("status", "submitted");
  else if (statusFilter === "draft") q = q.eq("status", "draft");
  const { data: entries, error: entriesError } = await q.range(0, 99999);
  if (entriesError) return NextResponse.json({ error: entriesError.message }, { status: 500 });

  const entryIds = (entries ?? []).map((e: any) => e.id);
  if (entryIds.length === 0) return NextResponse.json({ rows: [] });

  const entryMap = new Map((entries ?? []).map((e: any) => [e.id, e]));

  // 2. Predicciones extra para esa pregunta/entradas
  const { data: preds, error: predsError } = await supabase
    .from("entry_extra_predictions")
    .select("entry_id, predicted_value, normalized_value")
    .eq("question_key", questionKey)
    .in("entry_id", entryIds)
    .not("predicted_value", "is", null)
    .order("normalized_value", { ascending: true });

  if (predsError) return NextResponse.json({ error: predsError.message }, { status: 500 });

  const rows = (preds ?? []).map((p: any) => {
    const entry = entryMap.get(p.entry_id) as any;
    return {
      entry_id:        p.entry_id,
      predicted_value: p.predicted_value,   // intocable
      normalized_value: p.normalized_value, // editable por el admin
      name:            entry?.name ?? "—",
      entry_number:    entry?.entry_number ?? null,
      status:          entry?.status ?? "",
    };
  });

  return NextResponse.json({ rows });
}

// PATCH /api/admin/normalize-extra
// Body: { questionKey, entryIds, normalizedValue }
// Actualiza SOLO la columna normalized_value y recalcula.
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "No autorizado" }, { status: auth.status });

  let body: { questionKey?: string; entryIds?: string[]; normalizedValue?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const { questionKey, entryIds, normalizedValue } = body;

  if (!questionKey) return NextResponse.json({ error: "Falta questionKey" }, { status: 400 });
  if (!Array.isArray(entryIds) || entryIds.length === 0)
    return NextResponse.json({ error: "entryIds vacío" }, { status: 400 });
  if (typeof normalizedValue !== "string")
    return NextResponse.json({ error: "Falta normalizedValue" }, { status: 400 });

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("entry_extra_predictions")
    .update({ normalized_value: normalizedValue.trim().toLowerCase() })
    .eq("question_key", questionKey)
    .in("entry_id", entryIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await recalculateScoresAll();
  } catch (e: any) {
    return NextResponse.json({ success: true, warning: e?.message });
  }

  return NextResponse.json({ success: true });
}
