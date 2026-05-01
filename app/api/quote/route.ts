import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("quote_of_the_day")
    .select("es, en, pt")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ es: "", en: "", pt: "" });
  }

  return NextResponse.json(
    { es: data.es ?? "", en: data.en ?? "", pt: data.pt ?? "" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
