import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type ReactionKey = "like" | "fire" | "laugh" | "clap" | "lucky";

const ALLOWED_REACTIONS: ReactionKey[] = [
  "like",
  "fire",
  "laugh",
  "clap",
  "lucky",
];

type ParentCommentRow = {
  id: string;
  pool_id: string;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const commentId =
      typeof body.commentId === "string" ? body.commentId.trim() : "";
    const reaction = body.reaction as ReactionKey;

    if (!commentId) {
      return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
    }

    if (!ALLOWED_REACTIONS.includes(reaction)) {
      return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
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
      console.error("banquillo reaction parentError:", parentError);
      return NextResponse.json(
        { error: "Error validating comment" },
        { status: 500 }
      );
    }

    if (!parent) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const { data: entry, error: entryError } = await supabase
      .from("entries")
      .select("id")
      .eq("pool_id", parent.pool_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (entryError) {
      console.error("banquillo reaction entryError:", entryError);
      return NextResponse.json(
        { error: "Error validating pool access" },
        { status: 500 }
      );
    }

    if (!entry) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: existing, error: existingError } = await supabase
      .from("pool_comment_reactions")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
      .eq("reaction", reaction)
      .maybeSingle();

    if (existingError) {
      console.error("banquillo reaction existingError:", existingError);
      return NextResponse.json(
        { error: "Error validating reaction" },
        { status: 500 }
      );
    }

    if (existing) {
      const { error: deleteError } = await supabase
        .from("pool_comment_reactions")
        .delete()
        .eq("id", existing.id);

      if (deleteError) {
        console.error("banquillo reaction deleteError:", deleteError);
        return NextResponse.json(
          { error: "Error removing reaction" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, active: false });
    }

    const { error: insertError } = await supabase
      .from("pool_comment_reactions")
      .insert({
        comment_id: commentId,
        user_id: user.id,
        reaction,
      });

    if (insertError) {
      console.error("banquillo reaction insertError:", insertError);
      return NextResponse.json(
        { error: "Error creating reaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, active: true });
  } catch (error) {
    console.error("banquillo reaction unexpected:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}