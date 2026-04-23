import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function cleanMessage(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const poolId =
      typeof body.poolId === "string" ? body.poolId.trim() : "";
    const message = cleanMessage(
      typeof body.message === "string" ? body.message : ""
    );

    if (!poolId) {
      return NextResponse.json({ error: "Missing poolId" }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: "Message cannot exceed 500 characters" },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: entry, error: entryError } = await supabase
      .from("entries")
      .select("id, name")
      .eq("pool_id", poolId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (entryError) {
      console.error("banquillo comment entryError:", entryError);
      return NextResponse.json(
        { error: "Error validating pool access" },
        { status: 500 }
      );
    }

    if (!entry) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let authorName = entry.name ?? null;

    if (!authorName) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      authorName =
        profile?.full_name ??
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email ??
        "Participante";
    }

    const { error: insertError } = await supabase.from("pool_comments").insert({
      pool_id: poolId,
      user_id: user.id,
      entry_id: entry.id,
      parent_comment_id: null,
      author_name: authorName,
      message,
      is_deleted: false,
      is_pinned: false,
    });

    if (insertError) {
      console.error("banquillo comment insertError:", insertError);
      return NextResponse.json(
        { error: "Error creating comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("banquillo comment unexpected:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}