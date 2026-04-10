import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const supabase = getSupabase();
  const body = await req.json();

  const accessCode = String(body.accessCode || "").trim().toUpperCase();
  const entryNumber = Number(body.entryNumber);

  if (!accessCode) {
    return NextResponse.json({ error: "Código requerido" }, { status: 400 });
  }

  if (entryNumber !== 1 && entryNumber !== 2) {
    return NextResponse.json({ error: "Número de porra inválido" }, { status: 400 });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
  }

  const { data: pool, error: poolError } = await supabase
    .from("pools")
    .select("id, name, slug, status, access_code")
    .ilike("access_code", accessCode)
    .single();

  if (poolError || !pool) {
    return NextResponse.json({ error: "Código de porra inválido" }, { status: 404 });
  }

  if (pool.status !== "open") {
    return NextResponse.json({ error: "Esta porra está cerrada" }, { status: 403 });
  }

  const { data: existingEntry, error: existingError } = await supabase
    .from("entries")
    .select("id, pool_id, user_id, entry_number, status")
    .eq("pool_id", pool.id)
    .eq("user_id", user.id)
    .eq("entry_number", entryNumber)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (existingEntry) {
    return NextResponse.json({
      poolSlug: pool.slug,
      entryId: existingEntry.id,
      existing: true,
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: createdEntry, error: createError } = await supabase
    .from("entries")
    .insert({
      pool_id: pool.id,
      user_id: user.id,
      name:
        profile?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        "",
      email: user.email || "",
      company: "",
      country: "",
      entry_number: entryNumber,
      status: "draft",
    })
    .select("id")
    .single();

  if (createError || !createdEntry) {
    return NextResponse.json(
      { error: createError?.message || "No se pudo crear la entrada" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    poolSlug: pool.slug,
    entryId: createdEntry.id,
    existing: false,
  });
}