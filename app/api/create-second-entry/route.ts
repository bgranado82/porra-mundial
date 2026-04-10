import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const supabase = getSupabase();

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

  const { data: firstEntry, error: firstEntryError } = await supabase
    .from("entries")
    .select("id, pool_id, email, name, company, country")
    .eq("user_id", user.id)
    .eq("entry_number", 1)
    .maybeSingle();

  if (firstEntryError || !firstEntry) {
    return NextResponse.json(
      { error: "No se ha encontrado la Porra 1" },
      { status: 404 }
    );
  }

  const { data: secondEntry } = await supabase
    .from("entries")
    .select("id, pool_id, entry_number")
    .eq("user_id", user.id)
    .eq("pool_id", firstEntry.pool_id)
    .eq("entry_number", 2)
    .maybeSingle();

  if (secondEntry) {
    return NextResponse.json({
      entryId: secondEntry.id,
      created: false,
    });
  }

  const { data: createdEntry, error: createError } = await supabase
    .from("entries")
    .insert({
      user_id: user.id,
      pool_id: firstEntry.pool_id,
      entry_number: 2,
      status: "draft",
      email: firstEntry.email || user.email || "",
      name: firstEntry.name || "",
      company: firstEntry.company || "",
      country: firstEntry.country || "",
    })
    .select("id")
    .single();

  if (createError || !createdEntry) {
    return NextResponse.json(
      { error: createError?.message || "No se pudo crear la Porra 2" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    entryId: createdEntry.id,
    created: true,
  });
}