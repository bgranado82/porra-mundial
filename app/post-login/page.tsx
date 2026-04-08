import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const body = await req.json();

  const { entryId, predictions } = body;

  const { error } = await supabase
    .from("predictions")
    .upsert({
      entry_id: entryId,
      data: predictions,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}