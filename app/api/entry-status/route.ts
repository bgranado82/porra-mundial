import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(req.url);
  const entryId = searchParams.get("entryId");

  if (!entryId) {
    return NextResponse.json({ error: "entryId requerido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("entries")
    .select("status, submitted_at")
    .eq("id", entryId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Entry no encontrada" }, { status: 404 });
  }

  return NextResponse.json(data);
}