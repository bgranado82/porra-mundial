import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { recalculateScoresAll } from "@/lib/recalculateScoresAll";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    return { ok: false as const, status: 403 };
  }
  return { ok: true as const };
}

// GET /api/admin/normalize-extra?questionKey=golden_boot
// Devuelve todos los valores distintos que han predicho los participantes
// para esa pregunta, junto con cuántas entradas tienen cada valor.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: auth.status });
  }

  const questionKey = request.nextUrl.searchParams.get("questionKey");
  if (!questionKey) {
    return NextResponse.json({ error: "Falta questionKey" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Traemos todas las predicciones para esta pregunta, junto con el nombre
  // de la entrada para que el admin pueda identificar quién puso qué.
  // Usamos entry_id como identificador único (hay un registro por entry+question).
  const { data, error } = await supabase
    .from("entry_extra_predictions")
    .select(
      `
      entry_id,
      question_key,
      predicted_value,
      entries ( name, email, entry_number )
    `
    )
    .eq("question_key", questionKey)
    .not("predicted_value", "is", null)
    .order("predicted_value", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Error cargando predicciones", details: error.message },
      { status: 500 }
    );
  }

  // Agrupamos por valor para mostrar cuántos participantes pusieron cada texto
  const grouped: Record<
    string,
    {
      count: number;
      entries: { entry_id: string; name: string; email: string; entry_number: number | null }[];
    }
  > = {};

  for (const row of data ?? []) {
    const val = (row.predicted_value ?? "").trim();
    if (!val) continue;
    if (!grouped[val]) grouped[val] = { count: 0, entries: [] };
    grouped[val].count++;
    const entry = row.entries as any;
    grouped[val].entries.push({
      entry_id: row.entry_id,
      name: entry?.name ?? "—",
      email: entry?.email ?? "",
      entry_number: entry?.entry_number ?? null,
    });
  }

  const variants = Object.entries(grouped)
    .map(([value, info]) => ({ value, ...info }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ variants });
}

// PATCH /api/admin/normalize-extra
// Body: { questionKey: string, entryIds: string[], newValue: string }
// Actualiza el predicted_value de las filas indicadas por (entry_id + question_key)
// y recalcula las puntuaciones.
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: auth.status });
  }

  let body: { questionKey?: string; entryIds?: string[]; newValue?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { questionKey, entryIds, newValue } = body;

  if (!questionKey || typeof questionKey !== "string") {
    return NextResponse.json({ error: "questionKey es obligatorio" }, { status: 400 });
  }
  if (!Array.isArray(entryIds) || entryIds.length === 0) {
    return NextResponse.json({ error: "entryIds debe ser un array no vacío" }, { status: 400 });
  }
  if (typeof newValue !== "string") {
    return NextResponse.json({ error: "newValue debe ser string" }, { status: 400 });
  }

  const trimmedValue = newValue.trim();

  const supabase = createAdminClient();

  // Actualizamos usando la clave compuesta (entry_id, question_key).
  // Supabase no soporta .in() con claves compuestas, así que hacemos
  // una única query filtrando por question_key + .in("entry_id", entryIds).
  const { error, count } = await supabase
    .from("entry_extra_predictions")
    .update({ predicted_value: trimmedValue })
    .eq("question_key", questionKey)
    .in("entry_id", entryIds);

  if (error) {
    return NextResponse.json(
      { error: "Error actualizando predicciones", details: error.message },
      { status: 500 }
    );
  }

  // Recalculamos para que los puntos reflejen la normalización de inmediato.
  try {
    await recalculateScoresAll();
  } catch (recalcError: any) {
    // No bloqueamos la respuesta: los datos ya se guardaron correctamente.
    console.error("Recalculate error (non-blocking):", recalcError);
    return NextResponse.json({
      success: true,
      updatedCount: entryIds.length,
      warning: "Predicciones actualizadas pero el recálculo falló: " + recalcError?.message,
    });
  }

  return NextResponse.json({ success: true, updatedCount: count ?? entryIds.length });
}
