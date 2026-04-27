"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Locale, messages } from "@/lib/i18n";

const LOCALE_KEY = "porra-mundial-locale";

type ReactionKey = "like" | "heart" | "fire" | "laugh" | "clap" | "lucky";

type BanquilloReply = {
  id: string;
  comment_id: string;
  user_id: string;
  author_name: string | null;
  message: string;
  created_at: string;
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
  reactions: {
    counts: Record<string, number>;
    mine: string[];
  };
};

type BanquilloResponse = {
  comments: BanquilloComment[];
};

const REACTION_META: Record<ReactionKey, { emoji: string }> = {
  like: { emoji: "👍" },
  heart: { emoji: "❤️" },
  fire: { emoji: "🔥" },
  laugh: { emoji: "😂" },
  clap: { emoji: "👏" },
  lucky: { emoji: "🍀" },
};

function formatDate(value: string, locale: Locale) {
  const localeMap: Record<Locale, string> = {
    es: "es-ES",
    en: "en-GB",
    pt: "pt-PT",
  };
  try {
    return new Date(value).toLocaleString(localeMap[locale], {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function AuthorAvatar({ name }: { name: string | null }) {
  const letter = (name ?? "?").charAt(0).toUpperCase();
  const colors = [
    "bg-[var(--iberdrola-green)] text-white",
    "bg-[var(--iberdrola-sky)] text-white",
    "bg-amber-400 text-white",
    "bg-violet-400 text-white",
    "bg-rose-400 text-white",
  ];
  const idx = (name?.charCodeAt(0) ?? 0) % colors.length;
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${colors[idx]}`}>
      {letter}
    </div>
  );
}

// ─── COMPOSER ────────────────────────────────────────────────────────────────
function Composer({
  value,
  onChange,
  onSubmit,
  onReload,
  sending,
  t,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onReload: () => void;
  sending: boolean;
  t: typeof messages.es;
}) {
  return (
    <section className="rounded-3xl border border-[var(--iberdrola-green-mid)] bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <span className="text-xl">✍️</span>
        <span className="text-base font-black text-[var(--iberdrola-forest)]">
          {t.banquillo.newPostTitle}
        </span>
      </div>

      <div className="space-y-3 p-5">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.banquillo.newCommentPlaceholder}
          rows={3}
          className="w-full resize-none rounded-2xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)]/30 px-4 py-3 text-sm font-medium text-[var(--iberdrola-forest)] outline-none transition focus:border-[var(--iberdrola-green)] focus:bg-white focus:ring-2 focus:ring-[var(--iberdrola-green)]/20 placeholder:text-[var(--iberdrola-forest)]/35"
        />

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReload}
            className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-400 transition hover:border-gray-300 hover:text-gray-600"
          >
            ↻ {t.banquillo.reload}
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={sending || !value.trim()}
            className="rounded-2xl bg-[var(--iberdrola-green)] px-5 py-2.5 text-sm font-black text-white shadow-md shadow-[var(--iberdrola-green)]/25 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? t.banquillo.sending : t.banquillo.send}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── REACTION PILLS ───────────────────────────────────────────────────────────
function ReactionPills({
  comment,
  reactingKey,
  onReact,
}: {
  comment: BanquilloComment;
  reactingKey: string | null;
  onReact: (commentId: string, reaction: ReactionKey) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {(Object.keys(REACTION_META) as ReactionKey[]).map((reactionKey) => {
        const count = comment.reactions.counts[reactionKey] ?? 0;
        const isMine = comment.reactions.mine.includes(reactionKey);
        const isLoading = reactingKey === `${comment.id}-${reactionKey}`;

        return (
          <button
            key={reactionKey}
            type="button"
            onClick={() => onReact(comment.id, reactionKey)}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition ${
              isMine
                ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green)]/10 text-[var(--iberdrola-forest)] hover:bg-[var(--iberdrola-green)]/20"
                : "border-gray-200 bg-white text-[var(--iberdrola-forest)]/60 hover:border-[var(--iberdrola-green)]/50 hover:bg-[var(--iberdrola-green-light)]"
            }`}
          >
            <span>{REACTION_META[reactionKey].emoji}</span>
            {count > 0 && <span className={isMine ? "text-[var(--iberdrola-green)]" : "text-[var(--iberdrola-forest)]/50"}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── REPLIES LIST ─────────────────────────────────────────────────────────────
function RepliesList({
  replies,
  expanded,
  locale,
  t,
}: {
  replies: BanquilloReply[];
  expanded: boolean;
  locale: Locale;
  t: typeof messages.es;
}) {
  const visibleReplies = expanded || replies.length <= 2 ? replies : replies.slice(0, 2);

  return (
    <div className="mt-4 space-y-2 border-l-2 border-[var(--iberdrola-green)]/20 pl-4">
      {visibleReplies.map((reply) => (
        <div key={reply.id} className="rounded-2xl bg-[var(--iberdrola-green-light)]/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <AuthorAvatar name={reply.author_name} />
            <div>
              <div className="text-xs font-black text-[var(--iberdrola-forest)]">
                {reply.author_name || t.banquillo.participantFallback}
              </div>
              <div className="text-[11px] text-[var(--iberdrola-forest)]/45">
                {formatDate(reply.created_at, locale)}
              </div>
            </div>
          </div>
          <div className="mt-2 pl-11 text-sm leading-relaxed text-[var(--iberdrola-forest)]/80">
            {reply.message}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── COMMENT CARD ─────────────────────────────────────────────────────────────
function CommentCard({
  comment,
  locale,
  t,
  replyOpen,
  replyDraft,
  expandedReplies,
  sendingReply,
  reactingKey,
  onToggleReply,
  onReplyDraftChange,
  onSendReply,
  onReact,
  onToggleExpandReplies,
}: {
  comment: BanquilloComment;
  locale: Locale;
  t: typeof messages.es;
  replyOpen: boolean;
  replyDraft: string;
  expandedReplies: boolean;
  sendingReply: boolean;
  reactingKey: string | null;
  onToggleReply: (commentId: string) => void;
  onReplyDraftChange: (commentId: string, value: string) => void;
  onSendReply: (commentId: string) => void;
  onReact: (commentId: string, reaction: ReactionKey) => void;
  onToggleExpandReplies: (commentId: string) => void;
}) {
  return (
    <article className={`rounded-3xl border bg-white shadow-sm transition ${
      comment.is_pinned
        ? "border-[var(--iberdrola-green)]/40 shadow-md"
        : "border-[var(--iberdrola-green-mid)]"
    }`}>
      {comment.is_pinned ? (
        <div className="flex items-center gap-2 rounded-t-3xl bg-[var(--iberdrola-green)]/8 px-5 py-2 border-b border-[var(--iberdrola-green)]/20">
          <span className="text-sm">📌</span>
          <span className="text-xs font-black uppercase tracking-widest text-[var(--iberdrola-green)]">
            {t.banquillo.pinned}
          </span>
        </div>
      ) : null}

      <div className="p-5">
        {/* Author */}
        <div className="flex items-start gap-3">
          <AuthorAvatar name={comment.author_name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-[var(--iberdrola-forest)]">
                {comment.author_name || t.banquillo.participantFallback}
              </span>
            </div>
            <div className="text-[11px] text-[var(--iberdrola-forest)]/45">
              {formatDate(comment.created_at, locale)}
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="mt-3 pl-12 whitespace-pre-wrap text-sm leading-relaxed text-[var(--iberdrola-forest)]/85">
          {comment.message}
        </div>

        {/* Reactions */}
        <div className="pl-12">
          <ReactionPills
            comment={comment}
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

          {comment.replies.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--iberdrola-forest)]/45">
                {comment.replies.length} {t.banquillo.responses}
              </span>
              {comment.replies.length > 2 ? (
                <button
                  type="button"
                  onClick={() => onToggleExpandReplies(comment.id)}
                  className="text-xs font-bold text-[var(--iberdrola-green)] hover:underline"
                >
                  {expandedReplies ? t.banquillo.hideReplies : t.banquillo.showReplies}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Replies */}
        {comment.replies.length > 0 ? (
          <div className="mt-3 pl-12">
            <RepliesList
              replies={comment.replies}
              expanded={expandedReplies}
              locale={locale}
              t={t}
            />
          </div>
        ) : null}

        {/* Reply composer */}
        {replyOpen ? (
          <div className="mt-4 space-y-2 pl-12 border-t border-gray-100 pt-4">
            <textarea
              value={replyDraft}
              onChange={(e) => onReplyDraftChange(comment.id, e.target.value)}
              placeholder={t.banquillo.replyPlaceholder}
              rows={2}
              className="w-full resize-none rounded-2xl border border-[var(--iberdrola-green-mid)] bg-[var(--iberdrola-green-light)]/30 px-4 py-2.5 text-sm font-medium text-[var(--iberdrola-forest)] outline-none transition focus:border-[var(--iberdrola-green)] focus:bg-white focus:ring-2 focus:ring-[var(--iberdrola-green)]/20 placeholder:text-[var(--iberdrola-forest)]/35"
            />
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
                disabled={sendingReply}
                className="rounded-2xl bg-[var(--iberdrola-green)] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
              >
                {sendingReply ? t.banquillo.sending : t.banquillo.sendReply}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function BanquilloPageClient() {
  const searchParams = useSearchParams();

  const poolId = searchParams.get("poolId") ?? "";
  const poolSlug = searchParams.get("poolSlug") ?? "";
  const entryId = searchParams.get("entryId") ?? "";

  const [locale, setLocale] = useState<Locale>("es");
  const t = messages[locale];

  const [comments, setComments] = useState<BanquilloComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingReplyFor, setSendingReplyFor] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [reactingKey, setReactingKey] = useState<string | null>(null);

  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_KEY) as Locale | null;
    if (savedLocale === "es" || savedLocale === "en" || savedLocale === "pt") {
      setLocale(savedLocale);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  const loadComments = useCallback(async () => {
    if (!poolId) {
      setError(t.banquillo.missingPoolId);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/banquillo?poolId=${poolId}`, { cache: "no-store" });
      const json = (await res.json()) as Partial<BanquilloResponse> & { error?: string };
      if (!res.ok) throw new Error(json.error || t.banquillo.errorLoading);
      setComments(json.comments ?? []);
    } catch (err) {
      console.error(err);
      setError(t.banquillo.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [poolId, t.banquillo.errorLoading, t.banquillo.missingPoolId]);

  useEffect(() => { loadComments(); }, [loadComments]);

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
      await loadComments();
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
      await loadComments();
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
      await loadComments();
    } catch (err) {
      console.error(err);
      setError(t.banquillo.reactionError);
    } finally {
      setReactingKey(null);
    }
  }

  // ── Loading skeleton
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
              <div className="skeleton h-10 w-full rounded-2xl ml-12" style={{ marginLeft: "3rem" }} />
              <div className="flex gap-1.5 ml-12" style={{ marginLeft: "3rem" }}>
                {[...Array(6)].map((_, j) => <div key={j} className="skeleton h-7 w-10 rounded-full" />)}
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="page-bg">
      <div className="mx-auto max-w-[1100px] space-y-5 px-4 py-6 fade-in">

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
                  {t.banquillo.subtitle}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 lg:items-end">
              <LanguageSwitcher locale={locale} onChange={setLocale} label={t.language} />
              <div className="flex flex-wrap gap-2">
                <Link
                  href={backToStatsHref}
                  className="rounded-2xl border border-[var(--iberdrola-green-mid)] bg-white/80 px-3 py-2 text-xs font-bold text-[var(--iberdrola-forest)] transition hover:border-[var(--iberdrola-green)] hover:bg-white"
                >
                  {t.banquillo.backToStats}
                </Link>
                <Link
                  href={backToPredictionHref}
                  className="rounded-2xl bg-[var(--iberdrola-green)] px-3 py-2 text-xs font-black text-white shadow-sm transition hover:brightness-110"
                >
                  {t.banquillo.backToPrediction}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── COMPOSER */}
        <Composer
          value={newComment}
          onChange={setNewComment}
          onSubmit={handlePostComment}
          onReload={loadComments}
          sending={sendingComment}
          t={t}
        />

        {/* ── ERROR */}
        {error ? (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <span>⚠️</span> {error}
          </div>
        ) : null}

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
                replyOpen={!!replyOpen[comment.id]}
                replyDraft={replyDrafts[comment.id] ?? ""}
                expandedReplies={!!expandedReplies[comment.id]}
                sendingReply={sendingReplyFor === comment.id}
                reactingKey={reactingKey}
                onToggleReply={(commentId) =>
                  setReplyOpen((prev) => ({ ...prev, [commentId]: !prev[commentId] }))
                }
                onReplyDraftChange={(commentId, value) =>
                  setReplyDrafts((prev) => ({ ...prev, [commentId]: value }))
                }
                onSendReply={handlePostReply}
                onReact={handleReaction}
                onToggleExpandReplies={(commentId) =>
                  setExpandedReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }))
                }
              />
            ))
          )}
        </section>

      </div>
    </main>
  );
}
