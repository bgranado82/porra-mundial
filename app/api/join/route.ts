import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Código requerido" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("pools")
    .select("slug, access_code")
    .ilike("access_code", code)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Código inválido" }, { status: 404 });
  }

  return NextResponse.json({ slug: data.slug });
}