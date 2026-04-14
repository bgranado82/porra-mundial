
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
  const { entryId } = body ?? {};

  if (!entryId) {
    return NextResponse.json({ error: "Falta entryId" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("entries")
    .update({
      status: "draft",
      submitted_at: null,
    })
    .eq("id", entryId);

  if (error) {
    return NextResponse.json(
      { error: "Error reabriendo porra", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}