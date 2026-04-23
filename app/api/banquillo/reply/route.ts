import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type ParentCommentRow = {
  id: string;
  pool_id: string;
};

function cleanMessage(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const commentId =
      typeof body.commentId === "string" ? body.commentId.trim() : "";
    const message = cleanMessage(
      typeof body.message === "string" ? body.message : ""
    );

    if (!commentId) {
      return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
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

    const { data: parent, error: parentError } = await supabase
      .from("pool_comments")
      .select("id, pool_id")
      .eq("id", commentId)
      .eq("is_deleted", false)
      .maybeSingle<ParentCommentRow>();

    if (parentError) {
      console.error("banquillo reply parentError:", parentError);
      return NextResponse.json(
        { error: "Error validating parent comment" },
        { status: 500 }
      );
    }

    if (!parent) {
      return NextResponse.json(
        { error: "Parent comment not found" },
        { status: 404 }
      );
    }

    const { data: entry, error: entryError } = await supabase
      .from("entries")
      .select("id, name")
      .eq("pool_id", parent.pool_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (entryError) {
      console.error("banquillo reply entryError:", entryError);
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
      pool_id: parent.pool_id,
      user_id: user.id,
      entry_id: entry.id,
      parent_comment_id: commentId,
      author_name: authorName,
      message,
      is_deleted: false,
      is_pinned: false,
    });

    if (insertError) {
      console.error("banquillo reply insertError:", insertError);
      return NextResponse.json(
        { error: "Error creating reply" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("banquillo reply unexpected:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}