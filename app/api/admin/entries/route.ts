
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

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: auth.status });
  }

  const poolId = request.nextUrl.searchParams.get("poolId");

  if (!poolId) {
    return NextResponse.json({ error: "Falta poolId" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("entries")
    .select(`
      id,
      pool_id,
      user_id,
      entry_number,
      name,
      email,
      company,
      country,
      status,
      submitted_at,
      created_at,
      payment_status,
      payment_method,
      payment_note
    `)
    .eq("pool_id", poolId)
    .order("entry_number", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Error cargando participantes", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    entries: data ?? [],
  });
}