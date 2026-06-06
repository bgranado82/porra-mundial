// DELETE /api/banquillo/delete
// Permite borrar (soft-delete) un comentario:
// - El propio autor puede borrar sus mensajes
// - El admin puede borrar cualquier mensaje
// En ambos casos se marca is_deleted=true, no se elimina de BD.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const commentId = typeof body.commentId === "string" ? body.commentId.trim() : "";

    if (!commentId) {
      return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Leer el perfil para saber si es admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = profile?.role === "admin";

    // Leer el comentario
    const adminClient = createAdminClient();
    const { data: comment, error: commentError } = await adminClient
      .from("pool_comments")
      .select("id, user_id, is_deleted")
      .eq("id", commentId)
      .maybeSingle();

    if (commentError || !comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.is_deleted) {
      return NextResponse.json({ error: "Already deleted" }, { status: 400 });
    }

    // Solo el autor o un admin pueden borrar
    if (!isAdmin && comment.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateError } = await adminClient
      .from("pool_comments")
      .update({ is_deleted: true })
      .eq("id", commentId);

    if (updateError) {
      console.error("banquillo delete updateError:", updateError);
      return NextResponse.json({ error: "Error deleting comment" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("banquillo delete unexpected:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
