
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const poolId = request.nextUrl.searchParams.get("poolId");

  if (!poolId) {
    return NextResponse.json({ error: "Missing poolId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("entries")
    .select("id, name, company, country")
    .eq("pool_id", poolId)
    .eq("status", "submitted")
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Error loading entries" }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}