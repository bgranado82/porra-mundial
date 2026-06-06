"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Locale, messages } from "@/lib/i18n";

const LOCALE_KEY = "porra-mundial-locale";
const MAX_CHARS = 500;

type ReactionKey = "like" | "heart" | "fire" | "laugh" | "clap" | "lucky";

type BanquilloReply = {
  id: string;
  user_id: string;
  author_name: string | null;
  message: string;
  created_at: string;
  reactions: { counts: Record<string, number>; mine: string[] };
};

type BanquilloComment = {
  id: string;
  pool_id: string;
  user_id: string;
  author_name: string | null;
  message: string;
  is_pinned?: boolean | null;
  created_at: string;
  replies: BanquilloReply[];
  reactions: { counts: Record<string, number>; mine: string[] };
};

type BanquilloResponse = {
  comments: BanquilloComment[];
  total: number;
  offset: number;
  pageSize: number;
  currentUserId: string;
};

const REACTION_META: Record<ReactionKey, { emoji: string }> = {
  like: { emoji: "👍" },
  heart: { emoji: "❤️" },
  fire: { emoji: "🔥" },
  laugh: { emoji: "😂" },
  clap: { emoji: "👏" },
  lucky: { emoji: "🍀" },
};

// Hash consistente del nombre completo para asignar color de avatar
function nameColorIndex(name: string | null, total: number): number {
  const str = name ?? "?";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % total;
}

function formatDate(value: string, locale: Locale) {
  const localeMap: Record<Locale, string> = { es: "es-ES", en: "en-GB", pt: "pt-PT" };
  try {
    return new Date(value).toLocaleString(localeMap[locale], {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  } catch { return value; }
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────
function AuthorAvatar({ name, isMe }: { name: string | null; isMe: boolean }) {
  const letter = (name ?? "?").charAt(0).toUpperCase();
  const colors = [
    "bg-[var(--iberdrola-green)] text-white",
    "bg-[var(--iberdrola-sky)] text-white",
    "bg-amber-400 text-white",
    "bg-violet-400 text-white",
    "bg-rose-400 text-white",
    "bg-teal-500 text-white",
    "bg-orange-400 text-white",
  ];
  const idx = nameColorIndex(name, colors.length);
  return (
    <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${colors[idx]}`}>
      {letter}
      {isMe && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--iberdrola-green)] text-[8px] font-black text-white ring-2 ring-white">
          ✓
        </span>
      )}
    </div>
  );
}

// ─── REACTION PILLS ───────────────────────────────────────────────────────────
function ReactionPills({
  commentId, reactions, reactingKey, onReact,
}: {
  commentId: string;
  reactions: { counts: Record<string, number>; mine: string[] };
  reactingKey: string | null;
  onReact: (commentId: string, reaction: ReactionKey) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {(Object.keys(REACTION_META) as ReactionKey[]).map((reactionKey) => {
        const count = reactions.counts[reactionKey] ?? 0;
        const isMine = reactions.mine.includes(reactionKey);
        const isLoading = reactingKey === `${commentId}-${reactionKey}`;
        // Ocultar reacciones con 0 que no son mías
        if (count === 0 && !isMine) return null;
        return (
          <button
            key={reactionKey}
            type="button"
            onClick={() => onReact(commentId, reactionKey)}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition ${
              isMine
                ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green)]/10 text-[var(--iberdrola-forest)] hover:bg-[var(--iberdrola-green)]/20"
                : "border-gray-200 bg-white text-[var(--iberdrola-forest)]/60 hover:border-[var(--iberdrola-green)]/50 hover:bg-[var(--iberdrola-green-light)]"
            }`}
          >
            <span>{REACTION_META[reactionKey].emoji}</span>
            {count > 0 && (
              <span className={isMine ? "text-[var(--iberdrola-green)]" : "text-[var(--iberdrola-forest)]/50"}>
                {count}
              </span>
            )}
          </button>
        );
      })}
      {/* Botón + para añadir reacciones nuevas */}
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-xs text-[var(--iberdrola-forest)]/40 transition hover:border-[var(--iberdrola-green)]/50 hover:text-[var(--iberdrola-forest)]/70"
        onClick={() => {
          // Cicla por las reacciones que aún no tiene el usuario
          const missing = (Object.keys(REACTION_META) as ReactionKey[]).find(
            (k) => !reactions.mine.includes(k)
          );
          if (missing) onReact(commentId, missing);
        }}
      >
        + 😊
      </button>
    </div>
  );
}

// ─── COMMENT CARD ─────────────────────────────────────────────────────────────
function CommentCard({
  comment, locale, t, currentUserId,
  replyOpen, replyDraft, expandedReplies, sendingReply, reactingKey,
  onToggleReply, onReplyDraftChange, onSendReply, onReact, onToggleExpandReplies, onDelete,
}: {
  comment: BanquilloComment;
  locale: Locale;
  t: typeof messages.es;
  currentUserId: string;
  replyOpen: boolean;
  replyDraft: string;
  expandedReplies: boolean;
  sendingReply: boolean;
  reactingKey: string | null;
  onToggleReply: (id: string) => void;
  onReplyDraftChange: (id: string, value: string) => void;
  onSendReply: (id: string) => void;
  onReact: (id: string, reaction: ReactionKey) => void;
  onToggleExpandReplies: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isMe = comment.user_id === currentUserId;
  const visibleReplies = expandedReplies || comment.replies.length <= 2
    ? comment.replies
    : comment.replies.slice(0, 2);

  return (
    <article className={`rounded-3xl border bg-white shadow-sm transition ${
      comment.is_pinned
        ? "border-[var(--iberdrola-green)]/40 shadow-md"
        : isMe
          ? "border-[var(--iberdrola-green)]/30 bg-[var(--iberdrola-green-light)]/20"
          : "border-[var(--iberdrola-green-mid)]"
    }`}>
      {comment.is_pinned && (
        <div className="flex items-center gap-2 rounded-t-3xl bg-[var(--iberdrola-green)]/8 px-5 py-2 border-b border-[var(--iberdrola-green)]/20">
          <span className="text-sm">📌</span>
          <span className="text-xs font-black uppercase tracking-widest text-[var(--iberdrola-green)]">
            {t.banquillo.pinned}
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Author */}
        <div className="flex items-start gap-3">
          <AuthorAvatar name={comment.author_name} isMe={isMe} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-[var(--iberdrola-forest)]">
                {comment.author_name || t.banquillo.participantFallback}
              </span>
              {isMe && (
                <span className="rounded-full bg-[var(--iberdrola-green)]/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[var(--iberdrola-green)]">
                  {t.banquillo.yourMessage}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[var(--iberdrola-forest)]/45">
              {formatDate(comment.created_at, locale)}
            </div>
          </div>
          {/* Botón borrar (solo el autor) */}
          {isMe && (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              className="shrink-0 rounded-full p-1.5 text-[var(--iberdrola-forest)]/25 transition hover:bg-red-50 hover:text-red-400"
              title={t.banquillo.deleteComment}
            >
              🗑
            </button>
          )}
        </div>

        {/* Message */}
        <div className="mt-3 pl-12 whitespace-pre-wrap text-sm leading-relaxed text-[var(--iberdrola-forest)]/85">
          {comment.message}
        </div>

        {/* Reactions */}
        <div className="pl-12">
          <ReactionPills
            commentId={comment.id}
            reactions={comment.reactions}
            reactingKey={reactingKey}
            onReact={onReact}
          />
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center justify-between gap-3 pl-12">
          <button
            type="button"
            onClick={() => onToggleReply(comment.id)}
            className="rounded-full border border-gray-200 px-3 py-1 text-xs font-bold text-[var(--iberdrola-forest)]/60 transition hover:border-[var(--iberdrola-green)]/40 hover:text-[var(--iberdrola-forest)]"
          >
            ↩ {t.banquillo.reply}
          </button>

          {comment.replies.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--iberdrola-forest)]/45">
                {comment.replies.length} {t.banquillo.responses}
              </span>
              {comment.replies.length > 2 && (
                <button
                  type="button"
                  onClick={() => onToggleExpandReplies(comment.id)}
                  className="text-xs font-bold text-[var(--iberdrola-green)] hover:underline"
                >
                  {expandedReplies ? t.banquillo.hideReplies : t.banquillo.showReplies}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Replies */}
        {comment.replies.length > 0 && (
          <div className="mt-3 pl-12 space-y-2 border-l-2 border-[var(--iberdrola-green)]/20 pl-4">
            {visibleReplies.map((reply) => {
              const replyIsMe = reply.user_id === currentUserId;
              return (
                <div key={reply.id} className={`rounded-2xl px-4 py-3 ${replyIsMe ? "bg-[var(--iberdrola-green-light)]/60" : "bg-[var(--iberdrola-green-light)]/40"}`}>
                  <div className="flex items-center gap-2">
                    <AuthorAvatar name={reply.author_name} isMe={replyIsMe} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-[var(--iberdrola-forest)]">
                          {reply.author_name || t.banquillo.participantFallback}
                        </span>
                        {replyIsMe && (
                          <span className="rounded-full bg-[var(--iberdrola-green)]/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[var(--iberdrola-green)]">
                            {t.banquillo.yourMessage}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--iberdrola-forest)]/45">
                        {formatDate(reply.created_at, locale)}
                      </div>
                    </div>
                    {replyIsMe && (
                      <button
                        type="button"
                        onClick={() => onDelete(reply.id)}
                        className="ml-auto shrink-0 rounded-full p-1 text-[var(--iberdrola-forest)]/25 transition hover:bg-red-50 hover:text-red-400"
                        title={t.banquillo.deleteComment}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                  <div className="mt-2 pl-11 text-sm leading-relaxed text-[var(--iberdrola-forest)]/80">
                    {reply.message}
                  </div>
                  {/* Reacciones en replies */}
                  <div className="pl-11">
                    <ReactionPills
                      commentId={reply.id}
                      reactions={reply.reactions}
                      reactingKey={reactingKey}
                      onReact={onReact}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reply composer */}
        {replyOpen && (
          <div className="mt-4 space-y-2 pl-12 border-t border-gray-100 pt-4">
            <div className="relative">
              <textarea
                value={replyDraft}
                onChange={(e) => onReplyDraftChange(comment.id, e.target.value)}
                placeholder={t.banquillo.replyPlaceholder}
                rows={2}
                maxLength={MAX_CHARS}
                className="w-full resize-none rounded-2xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)]/30 px-4 py-2.5 text-sm font-medium text-[var(--iberdrola-forest)] outline-none transition focus:border-[var(--iberdrola-green)] focus:bg-white focus:ring-2 focus:ring-[var(--iberdrola-green)]/20 placeholder:text-[var(--iberdrola-forest)]/35"
              />
              {replyDraft.length > 400 && (
                <span className={`absolute bottom-2 right-3 text-[10px] font-bold ${replyDraft.length >= MAX_CHARS ? "text-red-500" : "text-amber-500"}`}>
                  {MAX_CHARS - replyDraft.length}
                </span>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onToggleReply(comment.id)}
                className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-400 transition hover:text-gray-600"
              >
                {t.banquillo.cancel}
              </button>
              <button
                type="button"
                onClick={() => onSendReply(comment.id)}
                disabled={sendingReply || !replyDraft.trim()}
                className="rounded-2xl bg-[var(--iberdrola-green)] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
              >
                {sendingReply ? t.banquillo.sending : t.banquillo.sendReply}
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function BanquilloPageClient() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const poolId = searchParams.get("poolId") ?? "";
  const poolSlug = searchParams.get("poolSlug") ?? "";
  const entryId = searchParams.get("entryId") ?? "";

  const [locale, setLocale] = useState<Locale>("es");
  const t = messages[locale];

  const [comments, setComments] = useState<BanquilloComment[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingReplyFor, setSendingReplyFor] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [reactingKey, setReactingKey] = useState<string | null>(null);

  const PAGE_SIZE = 30;
  const hasMore = total > offset + PAGE_SIZE;

  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_KEY) as Locale | null;
    if (savedLocale === "es" || savedLocale === "en" || savedLocale === "pt") {
      setLocale(savedLocale);
    }
  }, []);

  useEffect(() => { localStorage.setItem(LOCALE_KEY, locale); }, [locale]);

  // Carga inicial (offset 0)
  const loadComments = useCallback(async (reset = false) => {
    if (!poolId) { setError(t.banquillo.missingPoolId); setLoading(false); return; }
    try {
      reset ? setLoading(true) : setLoadingMore(true);
      setError("");
      const currentOffset = reset ? 0 : offset;
      const res = await fetch(`/api/banquillo?poolId=${poolId}&offset=${currentOffset}`, { cache: "no-store" });
      const json = (await res.json()) as Partial<BanquilloResponse> & { error?: string };
      if (!res.ok) throw new Error(json.error || t.banquillo.errorLoading);
      setTotal(json.total ?? 0);
      setCurrentUserId(json.currentUserId ?? "");
      if (reset) {
        setComments(json.comments ?? []);
        setOffset(PAGE_SIZE);
      } else {
        // Cargar más: añadir al final (son más antiguos)
        setComments((prev) => [...prev, ...(json.comments ?? [])]);
        setOffset((prev) => prev + PAGE_SIZE);
      }
    } catch (err) {
      console.error(err);
      setError(t.banquillo.errorLoading);
    } finally {
      reset ? setLoading(false) : setLoadingMore(false);
    }
  }, [poolId, offset, t.banquillo.errorLoading, t.banquillo.missingPoolId]);

  useEffect(() => { loadComments(true); }, [poolId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: nuevos comentarios aparecen sin recargar
  useEffect(() => {
    if (!poolId) return;
    const channel = supabase
      .channel(`banquillo-realtime-${poolId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pool_comments", filter: `pool_id=eq.${poolId}` },
        () => { loadComments(true); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [poolId]); // eslint-disable-line react-hooks/exhaustive-deps

  const orderedComments = useMemo(() => {
    const pinned = comments.filter((c) => !!c.is_pinned);
    const normal = comments.filter((c) => !c.is_pinned);
    return [...pinned, ...normal];
  }, [comments]);

  const backToPredictionHref = poolSlug && entryId ? `/pool/${poolSlug}/entry/${entryId}` : "/dashboard";
  const backToStatsHref =
    poolId && poolSlug && entryId
      ? `/stats?poolId=${poolId}&poolSlug=${poolSlug}&entryId=${entryId}`
      : poolId ? `/stats?poolId=${poolId}` : "/dashboard";

  async function handlePostComment() {
    const message = newComment.trim();
    if (!message) { setError(t.banquillo.writeSomething); return; }
    try {
      setSendingComment(true);
      setError("");
      const res = await fetch("/api/banquillo/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolId, message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || t.banquillo.postCommentError);
      setNewComment("");
      await loadComments(true);
    } catch (err) {
      console.error(err);
      setError(t.banquillo.postCommentError);
    } finally {
      setSendingComment(false);
    }
  }

  async function handlePostReply(commentId: string) {
    const message = (replyDrafts[commentId] ?? "").trim();
    if (!message) { setError(t.banquillo.writeReplySomething); return; }
    try {
      setSendingReplyFor(commentId);
      setError("");
      const res = await fetch("/api/banquillo/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || t.banquillo.postReplyError);
      setReplyDrafts((prev) => ({ ...prev, [commentId]: "" }));
      setReplyOpen((prev) => ({ ...prev, [commentId]: false }));
      setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
      await loadComments(true);
    } catch (err) {
      console.error(err);
      setError(t.banquillo.postReplyError);
    } finally {
      setSendingReplyFor(null);
    }
  }

  async function handleReaction(commentId: string, reaction: ReactionKey) {
    try {
      setReactingKey(`${commentId}-${reaction}`);
      setError("");
      const res = await fetch("/api/banquillo/reaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, reaction }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || t.banquillo.reactionError);
      await loadComments(true);
    } catch (err) {
      console.error(err);
      setError(t.banquillo.reactionError);
    } finally {
      setReactingKey(null);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm(t.banquillo.deleteComment + "?")) return;
    try {
      setError("");
      const res = await fetch("/api/banquillo/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || t.banquillo.deleteError);
      await loadComments(true);
    } catch (err) {
      console.error(err);
      setError(t.banquillo.deleteError);
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <main className="page-bg">
        <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-6">
          <div className="skeleton h-24 rounded-3xl" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="skeleton h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-28 rounded-full" />
                  <div className="skeleton h-3 w-20 rounded-full" />
                </div>
              </div>
              <div className="skeleton h-10 w-full rounded-2xl" style={{ marginLeft: "3rem" }} />
            </div>
          ))}
        </div>
      </main>
    );
  }

  const charsLeft = MAX_CHARS - newComment.length;

  return (
    <main className="page-bg">
      <div className="mx-auto max-w-[1100px] space-y-5 px-4 py-6 pb-32 fade-in">

        {/* ── HEADER */}
        <section className="rounded-3xl card-glass shadow-md">
          <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-[var(--iberdrola-green)] opacity-10 blur-lg scale-110" />
                <img
                  src="/icon-512.png"
                  alt={t.banquillo.title}
                  className="relative h-12 w-12 rounded-2xl object-contain shadow-sm sm:h-14 sm:w-14"
                />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--iberdrola-forest)]/45">
                  {t.banquillo.eyebrow}
                </div>
                <h1 className="text-2xl font-black tracking-tight text-[var(--iberdrola-forest)]">
                  {t.banquillo.title}
                </h1>
                <p className="mt-0.5 text-sm text-[var(--iberdrola-forest)]/55">
                  {total > 0 ? `${total} mensaje${total !== 1 ? "s" : ""}` : t.banquillo.subtitle}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <LanguageSwitcher locale={locale} onChange={setLocale} label={t.language} />
              <div className="flex flex-wrap gap-2">
                <Link href={backToStatsHref} className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white/80 px-3 py-2 text-xs font-bold text-[var(--iberdrola-forest)] transition hover:border-[var(--iberdrola-green)] hover:bg-white">
                  {t.banquillo.backToStats}
                </Link>
                <Link href={backToPredictionHref} className="rounded-2xl bg-[var(--iberdrola-green)] px-3 py-2 text-xs font-black text-white shadow-sm transition hover:brightness-110">
                  {t.banquillo.backToPrediction}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── ERROR */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* ── "VER ANTERIORES" (paginación hacia atrás) */}
        {hasMore && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => loadComments(false)}
              disabled={loadingMore}
              className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:border-[var(--iberdrola-green)] hover:bg-[var(--iberdrola-green-light)] disabled:opacity-60"
            >
              {loadingMore ? "..." : `⬆ ${t.banquillo.loadMore}`}
            </button>
          </div>
        )}

        {/* ── COMMENTS */}
        <section className="space-y-4">
          {orderedComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--iberdrola-green-mid)] bg-white/60 px-6 py-12 text-center shadow-sm">
              <span className="text-4xl">💬</span>
              <p className="mt-3 text-sm font-bold text-[var(--iberdrola-forest)]/50">
                {t.banquillo.noMessages}
              </p>
            </div>
          ) : (
            orderedComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                locale={locale}
                t={t}
                currentUserId={currentUserId}
                replyOpen={!!replyOpen[comment.id]}
                replyDraft={replyDrafts[comment.id] ?? ""}
                expandedReplies={!!expandedReplies[comment.id]}
                sendingReply={sendingReplyFor === comment.id}
                reactingKey={reactingKey}
                onToggleReply={(id) => setReplyOpen((prev) => ({ ...prev, [id]: !prev[id] }))}
                onReplyDraftChange={(id, value) => setReplyDrafts((prev) => ({ ...prev, [id]: value }))}
                onSendReply={handlePostReply}
                onReact={handleReaction}
                onToggleExpandReplies={(id) => setExpandedReplies((prev) => ({ ...prev, [id]: !prev[id] }))}
                onDelete={handleDelete}
              />
            ))
          )}
        </section>

      </div>

      {/* ── COMPOSER FLOTANTE (pegado al fondo) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--iberdrola-green-mid)] bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
        <div className="mx-auto max-w-[1100px]">
          <div className="flex items-end gap-3">
            <div className="relative flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t.banquillo.newCommentPlaceholder}
                rows={2}
                maxLength={MAX_CHARS}
                className="w-full resize-none rounded-2xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)]/30 px-4 py-3 text-sm font-medium text-[var(--iberdrola-forest)] outline-none transition focus:border-[var(--iberdrola-green)] focus:bg-white focus:ring-2 focus:ring-[var(--iberdrola-green)]/20 placeholder:text-[var(--iberdrola-forest)]/35"
              />
              {newComment.length > 400 && (
                <span className={`absolute bottom-2 right-3 text-[10px] font-bold ${charsLeft <= 0 ? "text-red-500" : "text-amber-500"}`}>
                  {charsLeft}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handlePostComment}
              disabled={sendingComment || !newComment.trim()}
              className="shrink-0 rounded-2xl bg-[var(--iberdrola-green)] px-5 py-3 text-sm font-black text-white shadow-md shadow-[var(--iberdrola-green)]/25 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingComment ? "..." : t.banquillo.send}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
