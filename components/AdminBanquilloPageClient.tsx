"use client";

// Panel admin de La Grada: lista todos los comentarios de todos los pools,
// permite buscar por autor o texto, filtrar por pool, y borrar mensajes.

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import AdminPageHeader from "@/components/AdminPageHeader";
import AdminSectionHeader from "@/components/AdminSectionHeader";

type Comment = {
  id: string;
  pool_id: string;
  pool_name?: string;
  user_id: string;
  author_name: string | null;
  message: string;
  is_pinned: boolean;
  is_deleted: boolean;
  parent_comment_id: string | null;
  created_at: string;
  reply_count?: number;
};

type Pool = { id: string; name: string };

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return value; }
}

export default function AdminBanquilloPageClient() {
  const supabase = createClient();

  const [comments, setComments] = useState<Comment[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterPool, setFilterPool] = useState("all");
  const [filterType, setFilterType] = useState<"all" | "parent" | "reply">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pinningId, setPinningId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Cargar pools
      const { data: poolsData } = await supabase
        .from("pools")
        .select("id, name")
        .order("name");
      setPools(poolsData ?? []);

      // Cargar todos los comentarios (incluidos borrados para visibilidad admin)
      const { data: commentsData, error: commentsError } = await supabase
        .from("pool_comments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (commentsError) throw commentsError;

      const rows = (commentsData ?? []) as Comment[];

      // Enriquecer con nombre del pool y reply_count
      const poolMap = new Map((poolsData ?? []).map((p: Pool) => [p.id, p.name]));
      const replyCountMap: Record<string, number> = {};
      for (const row of rows) {
        if (row.parent_comment_id) {
          replyCountMap[row.parent_comment_id] = (replyCountMap[row.parent_comment_id] ?? 0) + 1;
        }
      }

      const enriched = rows.map((c) => ({
        ...c,
        pool_name: poolMap.get(c.pool_id) ?? c.pool_id,
        reply_count: replyCountMap[c.id] ?? 0,
      }));

      setComments(enriched);
    } catch (err) {
      console.error("AdminBanquillo loadData:", err);
      setError("Error cargando los comentarios.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleDelete(commentId: string) {
    if (!confirm("¿Eliminar este comentario?")) return;
    setDeletingId(commentId);
    try {
      const res = await fetch("/api/banquillo/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Error eliminando");
      await loadData();
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el comentario.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleTogglePin(comment: Comment) {
    setPinningId(comment.id);
    try {
      const { error: updateError } = await supabase
        .from("pool_comments")
        .update({ is_pinned: !comment.is_pinned })
        .eq("id", comment.id);
      if (updateError) throw updateError;
      await loadData();
    } catch (err) {
      console.error(err);
      setError("No se pudo cambiar el estado destacado.");
    } finally {
      setPinningId(null);
    }
  }

  const filtered = comments.filter((c) => {
    if (filterPool !== "all" && c.pool_id !== filterPool) return false;
    if (filterType === "parent" && !!c.parent_comment_id) return false;
    if (filterType === "reply" && !c.parent_comment_id) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (c.author_name ?? "").toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const parentCount = comments.filter((c) => !c.parent_comment_id && !c.is_deleted).length;
  const replyCount = comments.filter((c) => !!c.parent_comment_id && !c.is_deleted).length;
  const deletedCount = comments.filter((c) => c.is_deleted).length;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6">
      <AdminPageHeader
        title="La Grada"
        icon="💬"
        description="Moderación de comentarios de todos los pools."
      />

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Comentarios", value: parentCount, color: "text-[var(--iberdrola-green)]" },
          { label: "Respuestas", value: replyCount, color: "text-[var(--iberdrola-sky)]" },
          { label: "Eliminados", value: deletedCount, color: "text-red-400" },
          { label: "Total", value: comments.length, color: "text-[var(--iberdrola-forest)]" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white p-4 shadow-sm">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-[var(--iberdrola-forest)]/50">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
        <AdminSectionHeader
          title="Comentarios"
          subtitle={`${filtered.length} de ${comments.length}`}
        />

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 border-b border-gray-100 px-4 py-3">
          <input
            type="text"
            placeholder="Buscar por autor o texto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] rounded-xl border border-[var(--iberdrola-green-mid)] px-3 py-2 text-sm outline-none focus:border-[var(--iberdrola-green)] focus:ring-2 focus:ring-[var(--iberdrola-green)]/20"
          />
          <select
            value={filterPool}
            onChange={(e) => setFilterPool(e.target.value)}
            className="rounded-xl border border-[var(--iberdrola-green-mid)] px-3 py-2 text-sm outline-none focus:border-[var(--iberdrola-green)]"
          >
            <option value="all">Todos los pools</option>
            {pools.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="rounded-xl border border-[var(--iberdrola-green-mid)] px-3 py-2 text-sm outline-none focus:border-[var(--iberdrola-green)]"
          >
            <option value="all">Todos</option>
            <option value="parent">Solo comentarios</option>
            <option value="reply">Solo respuestas</option>
          </select>
          <button
            onClick={loadData}
            className="rounded-xl border border-[var(--iberdrola-green-mid)] bg-white px-3 py-2 text-sm font-bold text-[var(--iberdrola-forest)] transition hover:border-[var(--iberdrola-green)]"
          >
            ↻ Recargar
          </button>
        </div>

        {error && (
          <div className="mx-4 my-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-[var(--iberdrola-forest)]/40">
            No hay comentarios que coincidan.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((comment) => (
              <div
                key={comment.id}
                className={`flex items-start gap-4 px-4 py-3 transition hover:bg-gray-50/50 ${comment.is_deleted ? "opacity-40" : ""}`}
              >
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-[var(--iberdrola-forest)]">
                      {comment.author_name || "Participante"}
                    </span>
                    <span className="rounded-full bg-[var(--iberdrola-green-light)] px-2 py-0.5 text-[10px] font-bold text-[var(--iberdrola-forest)]/60">
                      {comment.pool_name}
                    </span>
                    {comment.parent_comment_id && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        respuesta
                      </span>
                    )}
                    {comment.is_pinned && (
                      <span className="rounded-full bg-[var(--iberdrola-green)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--iberdrola-green)]">
                        📌 destacado
                      </span>
                    )}
                    {comment.is_deleted && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-500">
                        eliminado
                      </span>
                    )}
                    <span className="text-[11px] text-[var(--iberdrola-forest)]/35">
                      {formatDate(comment.created_at)}
                    </span>
                    {!comment.parent_comment_id && (comment.reply_count ?? 0) > 0 && (
                      <span className="text-[11px] text-[var(--iberdrola-forest)]/35">
                        · {comment.reply_count} respuesta{comment.reply_count !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/75 line-clamp-2">
                    {comment.message}
                  </p>
                </div>

                {/* Acciones */}
                {!comment.is_deleted && (
                  <div className="flex shrink-0 gap-1">
                    {!comment.parent_comment_id && (
                      <button
                        onClick={() => handleTogglePin(comment)}
                        disabled={pinningId === comment.id}
                        title={comment.is_pinned ? "Quitar destacado" : "Destacar"}
                        className={`rounded-lg px-2 py-1.5 text-sm transition ${comment.is_pinned ? "bg-[var(--iberdrola-green)]/15 text-[var(--iberdrola-green)]" : "text-[var(--iberdrola-forest)]/30 hover:bg-gray-100"}`}
                      >
                        📌
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      title="Eliminar"
                      className="rounded-lg px-2 py-1.5 text-sm text-[var(--iberdrola-forest)]/30 transition hover:bg-red-50 hover:text-red-500"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
