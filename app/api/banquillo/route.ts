import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type ReactionKey = "like" | "heart" | "fire" | "laugh" | "clap" | "lucky";

type PoolCommentRow = {
  id: string;
  pool_id: string;
  user_id: string;
  entry_id: string | null;
  parent_comment_id: string | null;
  author_name: string;
  message: string;
  is_deleted: boolean;
  is_pinned: boolean;
  created_at: string;
};

type PoolCommentReactionRow = {
  id: string;
  comment_id: string;
  user_id: string;
  reaction: ReactionKey;
  created_at: string;
};

const ALLOWED_REACTIONS: ReactionKey[] = [
  "like",
  "fire",
  "heart",
  "laugh",
  "clap",
  "lucky",
];

const PAGE_SIZE = 30;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const poolId = request.nextUrl.searchParams.get("poolId");

    if (!poolId) {
      return NextResponse.json({ error: "Missing poolId" }, { status: 400 });
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
      .select("id")
      .eq("pool_id", poolId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (entryError) {
      console.error("banquillo GET entryError:", entryError);
      return NextResponse.json(
        { error: "Error validating pool access" },
        { status: 500 }
      );
    }

    if (!entry) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Paginación opcional. Sin ?offset el comportamiento es idéntico al original
    // (devuelve todos). Con ?offset pagina. Así PredictionsPageClient y
    // StatsPageClient no necesitan ningún cambio.
    const offsetParam = request.nextUrl.searchParams.get("offset");
    const paginated = offsetParam !== null;
    const offset = paginated ? Math.max(0, parseInt(offsetParam, 10)) : 0;

    let query = supabase
      .from("pool_comments")
      .select("*")
      .eq("pool_id", poolId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (paginated) {
      query = query.range(offset, offset + PAGE_SIZE - 1);
    }

    const { data: commentsData, error: commentsError } = await query
      .returns<PoolCommentRow[]>();

    if (commentsError) {
      console.error("banquillo GET commentsError:", commentsError);
      return NextResponse.json(
        { error: "Error loading comments" },
        { status: 500 }
      );
    }

    const rows = commentsData ?? [];
    const commentIds = rows.map((row) => row.id);

    let reactionRows: PoolCommentReactionRow[] = [];

    if (commentIds.length > 0) {
      const { data: reactionsData, error: reactionsError } = await supabase
        .from("pool_comment_reactions")
        .select("*")
        .in("comment_id", commentIds)
        .returns<PoolCommentReactionRow[]>();

      if (reactionsError) {
        console.error("banquillo GET reactionsError:", reactionsError);
        return NextResponse.json(
          { error: "Error loading reactions" },
          { status: 500 }
        );
      }

      reactionRows = (reactionsData ?? []).filter((row) =>
        ALLOWED_REACTIONS.includes(row.reaction)
      );
    }

    const parents = rows.filter((row) => !row.parent_comment_id);
    const replies = rows.filter((row) => !!row.parent_comment_id);

    const repliesByParent: Record<string, PoolCommentRow[]> = {};

    for (const reply of replies) {
      const parentId = reply.parent_comment_id;
      if (!parentId) continue;
      if (!repliesByParent[parentId]) repliesByParent[parentId] = [];
      repliesByParent[parentId].push(reply);
    }

    const reactionsByComment: Record<string, PoolCommentReactionRow[]> = {};

    for (const reaction of reactionRows) {
      if (!reactionsByComment[reaction.comment_id]) {
        reactionsByComment[reaction.comment_id] = [];
      }
      reactionsByComment[reaction.comment_id].push(reaction);
    }

    function buildReactions(commentId: string) {
      const commentReactions = reactionsByComment[commentId] ?? [];
      const counts: Record<ReactionKey, number> = {
        like: 0, fire: 0, heart: 0, laugh: 0, clap: 0, lucky: 0,
      };
      const mine: ReactionKey[] = [];
      for (const reaction of commentReactions) {
        counts[reaction.reaction] += 1;
        if (reaction.user_id === user!.id) mine.push(reaction.reaction);
      }
      return { counts, mine };
    }

    const comments = parents.map((comment) => ({
      ...comment,
      replies: (repliesByParent[comment.id] ?? [])
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((reply) => ({ ...reply, reactions: buildReactions(reply.id) })),
      reactions: buildReactions(comment.id),
    }));

    // total y currentUserId son extras que usa BanquilloPageClient.
    // comments sigue siendo el array principal que usan todos los consumidores.
    return NextResponse.json({
      comments,
      total: rows.length,
      offset,
      pageSize: PAGE_SIZE,
      currentUserId: user.id,
    });
  } catch (error) {
    console.error("banquillo GET unexpected:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
