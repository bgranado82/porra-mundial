
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

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

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: auth.status });
  }

  const body = await request.json();
  const { entryId, payment_status, payment_method, payment_note } = body ?? {};

  if (!entryId) {
    return NextResponse.json({ error: "Falta entryId" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const payload: Record<string, string | null> = {};

  if (payment_status !== undefined) payload.payment_status = payment_status;
  if (payment_method !== undefined) payload.payment_method = payment_method || null;
  if (payment_note !== undefined) payload.payment_note = payment_note || null;

  const { error } = await supabase
    .from("entries")
    .update(payload)
    .eq("id", entryId);

  if (error) {
    return NextResponse.json(
      { error: "Error actualizando entry", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}