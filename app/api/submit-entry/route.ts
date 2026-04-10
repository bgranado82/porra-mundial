import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { entryId } = body;

    if (!entryId) {
      return NextResponse.json(
        { error: "entryId requerido" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: entry, error: entryError } = await supabase
      .from("entries")
      .select("id, status")
      .eq("id", entryId)
      .maybeSingle();

    if (entryError) {
      return NextResponse.json(
        { error: entryError.message },
        { status: 500 }
      );
    }

    if (!entry) {
      return NextResponse.json(
        { error: "No se ha encontrado la entry" },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from("entries")
      .update({
        status: "submitted",
      })
      .eq("id", entryId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entryId,
      status: "submitted",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}