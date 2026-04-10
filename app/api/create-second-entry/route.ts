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

    const { data: sourceEntry, error: sourceError } = await supabase
      .from("entries")
      .select("id, user_id, pool_id, email, name, company, country")
      .eq("id", entryId)
      .maybeSingle();

    if (sourceError) {
      return NextResponse.json(
        { error: sourceError.message },
        { status: 500 }
      );
    }

    if (!sourceEntry) {
      return NextResponse.json(
        { error: "No se ha encontrado la porra origen" },
        { status: 404 }
      );
    }

    const { data: existingSecond, error: existingError } = await supabase
      .from("entries")
      .select("id")
      .eq("user_id", sourceEntry.user_id)
      .eq("pool_id", sourceEntry.pool_id)
      .eq("entry_number", 2)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    if (existingSecond) {
      return NextResponse.json({
        success: true,
        entryId: existingSecond.id,
        created: false,
      });
    }

    const { data: createdEntry, error: createError } = await supabase
      .from("entries")
      .insert({
        user_id: sourceEntry.user_id,
        pool_id: sourceEntry.pool_id,
        entry_number: 2,
        status: "draft",
        email: sourceEntry.email,
        name: sourceEntry.name,
        company: sourceEntry.company,
        country: sourceEntry.country,
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
      success: true,
      entryId: createdEntry.id,
      created: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}