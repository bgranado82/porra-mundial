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
    <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
      <div className="border-b border-[var(--iberdrola-sky)] px-5 py-4">
        <div className="text-base font-black text-[var(--iberdrola-forest)]">
          {t.banquillo.newPostTitle}
        </div>
      </div>

      <div className="space-y-3 p-5">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.banquillo.newCommentPlaceholder}
          rows={4}
          className="w-full resize-none rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-medium text-[var(--iberdrola-forest)] outline-none transition focus:ring-2 focus:ring-[var(--iberdrola-green)]"
        />

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReload}
            className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:bg-[var(--iberdrola-sand)]"
          >
            {t.banquillo.reload}
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={sending}
            className="rounded-2xl bg-[var(--iberdrola-green)] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? t.banquillo.sending : t.banquillo.send}
          </button>
        </div>
      </div>
    </section>
  );
}

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
    <div className="mt-4 flex flex-wrap items-center gap-2">
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
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold transition ${
              isMine
                ? "border-[var(--iberdrola-green)] bg-[var(--iberdrola-green)]/10 text-[var(--iberdrola-forest)] hover:bg-[var(--iberdrola-green)]/20"
                : "border-[var(--iberdrola-sky)] bg-white text-[var(--iberdrola-forest)]/85 hover:border-[var(--iberdrola-green)] hover:bg-[var(--iberdrola-sand)]"
            }`}
          >
            <span>{REACTION_META[reactionKey].emoji}</span>
            <span>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

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
  const visibleReplies =
    expanded || replies.length <= 2 ? replies : replies.slice(0, 2);

  return (
    <div className="mt-5 space-y-3 border-t border-[var(--iberdrola-sky)] pt-4">
      {visibleReplies.map((reply) => (
        <div
          key={reply.id}
          className="rounded-2xl border border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)]/25 px-4 py-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-black text-[var(--iberdrola-forest)]">
                {reply.author_name || t.banquillo.participantFallback}
              </div>
              <div className="mt-1 text-xs font-medium text-[var(--iberdrola-forest)]/55">
                {formatDate(reply.created_at, locale)}
              </div>
            </div>
          </div>

          <div className="mt-2 whitespace-pre-wrap text-sm font-medium text-[var(--iberdrola-forest)]">
            {reply.message}
          </div>
        </div>
      ))}
    </div>
  );
}
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
    <article className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black text-[var(--iberdrola-forest)]">
                {comment.author_name || t.banquillo.participantFallback}
              </span>

              {comment.is_pinned ? (
                <span className="rounded-full bg-[var(--iberdrola-green-light)] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--iberdrola-forest)]">
                  {t.banquillo.pinned}
                </span>
              ) : null}
            </div>

            <div className="mt-1 text-xs font-medium text-[var(--iberdrola-forest)]/55">
              {formatDate(comment.created_at, locale)}
            </div>
          </div>
        </div>

        <div className="mt-4 whitespace-pre-wrap text-sm font-medium leading-6 text-[var(--iberdrola-forest)]">
          {comment.message}
        </div>

        <ReactionPills
          comment={comment}
          reactingKey={reactingKey}
          onReact={onReact}
        />

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onToggleReply(comment.id)}
            className="rounded-full border border-[var(--iberdrola-sky)] px-3 py-1.5 text-sm font-bold text-[var(--iberdrola-forest)] transition hover:bg-[var(--iberdrola-sand)]"
          >
            {t.banquillo.reply}
          </button>

          {comment.replies.length > 0 ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                {comment.replies.length} {t.banquillo.responses}
              </span>

              {comment.replies.length > 2 ? (
                <button
                  type="button"
                  onClick={() => onToggleExpandReplies(comment.id)}
                  className="text-xs font-bold text-[var(--iberdrola-forest)] underline"
                >
                  {expandedReplies
                    ? t.banquillo.hideReplies
                    : t.banquillo.showReplies}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {comment.replies.length > 0 ? (
          <RepliesList
            replies={comment.replies}
            expanded={expandedReplies}
            locale={locale}
            t={t}
          />
        ) : null}

        {replyOpen ? (
          <div className="mt-5 space-y-3 border-t border-[var(--iberdrola-sky)] pt-4">
            <textarea
              value={replyDraft}
              onChange={(e) => onReplyDraftChange(comment.id, e.target.value)}
              placeholder={t.banquillo.replyPlaceholder}
              rows={3}
              className="w-full resize-none rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-medium text-[var(--iberdrola-forest)] outline-none transition focus:ring-2 focus:ring-[var(--iberdrola-green)]"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onToggleReply(comment.id)}
                className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--iberdrola-forest)]"
              >
                {t.banquillo.cancel}
              </button>

              <button
                type="button"
                onClick={() => onSendReply(comment.id)}
                disabled={sendingReply}
                className="rounded-2xl bg-[var(--iberdrola-green)] px-4 py-2.5 text-sm font-bold text-white"
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

  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>(
    {}
  );
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

      const res = await fetch(`/api/banquillo?poolId=${poolId}`, {
        cache: "no-store",
      });

      const json = (await res.json()) as Partial<BanquilloResponse> & {
        error?: string;
      };

      if (!res.ok) {
        throw new Error(json.error || t.banquillo.errorLoading);
      }

      setComments(json.comments ?? []);
    } catch (err) {
      console.error(err);
      setError(t.banquillo.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [poolId, t.banquillo.errorLoading, t.banquillo.missingPoolId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const orderedComments = useMemo(() => {
    const pinned = comments.filter((comment) => !!comment.is_pinned);
    const normal = comments.filter((comment) => !comment.is_pinned);
    return [...pinned, ...normal];
  }, [comments]);

  const backToPredictionHref =
    poolSlug && entryId ? `/pool/${poolSlug}/entry/${entryId}` : "/dashboard";

  const backToStatsHref =
    poolId && poolSlug && entryId
      ? `/stats?poolId=${poolId}&poolSlug=${poolSlug}&entryId=${entryId}`
      : poolId
        ? `/stats?poolId=${poolId}`
        : "/dashboard";

  async function handlePostComment() {
    const message = newComment.trim();

    if (!message) {
      setError(t.banquillo.writeSomething);
      return;
    }

    try {
      setSendingComment(true);
      setError("");

      const res = await fetch("/api/banquillo/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          poolId,
          message,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || t.banquillo.postCommentError);
      }

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

    if (!message) {
      setError(t.banquillo.writeReplySomething);
      return;
    }

    try {
      setSendingReplyFor(commentId);
      setError("");

      const res = await fetch("/api/banquillo/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentId,
          message,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || t.banquillo.postReplyError);
      }

      setReplyDrafts((prev) => ({
        ...prev,
        [commentId]: "",
      }));

      setReplyOpen((prev) => ({
        ...prev,
        [commentId]: false,
      }));

      setExpandedReplies((prev) => ({
        ...prev,
        [commentId]: true,
      }));

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentId,
          reaction,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || t.banquillo.reactionError);
      }

      await loadComments();
    } catch (err) {
      console.error(err);
      setError(t.banquillo.reactionError);
    } finally {
      setReactingKey(null);
    }
  }

  if (loading) {
    return (
      <main className="page-bg">
      <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-6">
        <div className="skeleton h-24 rounded-3xl" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="skeleton h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-32 rounded-full" />
                <div className="skeleton h-3 w-48 rounded-full" />
              </div>
            </div>
            <div className="skeleton h-12 w-full rounded-2xl" />
            <div className="flex gap-2">
              {[...Array(5)].map((_, j) => <div key={j} className="skeleton h-8 w-14 rounded-full" />)}
            </div>
          </div>
        ))}
        </div>
      </main>
    );
  }

  return (
    <main className="page-bg">
      <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-6 fade-in">
      <section className="rounded-3xl card-glass shadow-md">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/icon-512.png"
              alt={t.banquillo.title}
              className="h-12 w-12 rounded-xl object-contain sm:h-14 sm:w-14"
            />

            <div>
              <div className="text-sm font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/55">
                {t.banquillo.eyebrow}
              </div>
              <h1 className="text-2xl font-black text-[var(--iberdrola-forest)]">
                {t.banquillo.title}
              </h1>
              <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
                {t.banquillo.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LanguageSwitcher
              locale={locale}
              onChange={setLocale}
              label={t.language}
            />

            <Link
              href={backToStatsHref}
              className="rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:bg-[var(--iberdrola-sand)]"
            >
              {t.banquillo.backToStats}
            </Link>

            <Link
              href={backToPredictionHref}
              className="rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:bg-[var(--iberdrola-sand)]"
            >
              {t.banquillo.backToPrediction}
            </Link>
          </div>
        </div>
      </section>

      <Composer
        value={newComment}
        onChange={setNewComment}
        onSubmit={handlePostComment}
        onReload={loadComments}
        sending={sendingComment}
        t={t}
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <section className="space-y-4">
        {orderedComments.length === 0 ? (
          <div className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white px-5 py-6 text-sm font-semibold text-[var(--iberdrola-forest)]/70 shadow-sm">
            {t.banquillo.noMessages}
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
                setReplyOpen((prev) => ({
                  ...prev,
                  [commentId]: !prev[commentId],
                }))
              }
              onReplyDraftChange={(commentId, value) =>
                setReplyDrafts((prev) => ({
                  ...prev,
                  [commentId]: value,
                }))
              }
              onSendReply={handlePostReply}
              onReact={handleReaction}
              onToggleExpandReplies={(commentId) =>
                setExpandedReplies((prev) => ({
                  ...prev,
                  [commentId]: !prev[commentId],
                }))
              }
            />
          ))
        )}
      </section>
      </div>
    </main>
  );
}