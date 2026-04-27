"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import GroupMatchRow from "@/components/GroupMatchRow";
import GroupStandingsTable from "@/components/GroupStandingsTable";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import KnockoutBracket from "@/components/KnockoutBracket";
import ThirdPlaceTable from "@/components/ThirdPlaceTable";
import { matches as initialMatches } from "@/data/matches";
import { scoreSettings } from "@/data/settings";
import { teams } from "@/data/teams";
import { calculateMatchPredictionScore } from "@/lib/scoring";
import { calculatePredictedStandings, getGroupTeamsNeedingTiebreak } from "@/lib/standings";
import { buildUserKnockoutBracket } from "@/lib/knockoutBracket";
import { buildRealKnockoutBracket } from "@/lib/realKnockout";
import { calculateKnockoutScore } from "@/lib/knockoutScoring";
import { getBestThirdPlacedTeams, getThirdPlacedTeamsNeedingTiebreak } from "@/lib/thirdPlace";
import { Locale, messages } from "@/lib/i18n";
import { KnockoutPredictionMap, Match } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { EXTRA_QUESTIONS } from "@/lib/extraQuestions";
import GroupMatchCompactRow from "@/components/GroupMatchCompactRow";

type PredictionMap = Record<
  string,
  { homeGoals: number | null; awayGoals: number | null }
>;

type OfficialGroupRow = {
  match_id: string;
  home_goals: number | null;
  away_goals: number | null;
};

type ExtraPredictionRow = {
  question_key: string;
  predicted_value: string | null;
};

type EntryTiebreakRow = {
  scope: "group" | "third_place";
  scope_value: string;
  team_id: string;
  priority: number;
};

type UserTiebreakMap = Record<string, number>;

type StandingSummary = {
  entry_id: string;
  pool_id: string;
  name: string;
  email: string;
  company?: string;
  country?: string;
  day_points: Record<string, number>;
  group_total: number;
  r32_points: number;
  r16_points: number;
  qf_points: number;
  sf_points: number;
  third_points: number;
  final_points: number;
  total_points: number;
  outcome_hits: number;
  exact_hits: number;
  outcome_percent: number;
  exact_percent: number;
  position: number;
  previous_position?: number;
  movement: "up" | "down" | "same";
  movement_value: number;
};

type VisibilityMode = "hidden" | "after_submit" | "always";

type PoolSettings = {
  name: string;
  slug: string;
  is_registration_open: boolean;
  is_predictions_editable: boolean;
  is_submission_enabled: boolean;
  classification_visibility: VisibilityMode;
  statistics_visibility: VisibilityMode;
  transparency_visibility: VisibilityMode;
  submission_deadline: string | null;
};

const LOCALE_KEY = "porra-mundial-locale";

function getTeamsInRound(
  matches: { homeTeamId: string | null; awayTeamId: string | null }[]
) {
  const set = new Set<string>();
  for (const match of matches) {
    if (match.homeTeamId) set.add(match.homeTeamId);
    if (match.awayTeamId) set.add(match.awayTeamId);
  }
  return set;
}

function normalizeExtraValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getTiebreakKey(
  scope: "group" | "third_place",
  scopeValue: string,
  teamId: string
) {
  return `${scope}:${scopeValue}:${teamId}`;
}

function HeaderPill({
  label,
  value,
  big = false,
}: {
  label: string;
  value: string | number;
  big?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-4 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/65">
        {label}
      </div>
      <div
        className={`flex items-center justify-center text-center font-black text-[var(--iberdrola-green)] ${
          big ? "min-h-[110px] text-5xl sm:text-6xl" : "min-h-[110px] text-3xl"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function RulePill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--iberdrola-sky)] bg-white px-3 py-2">
      <div className="text-[11px] font-semibold text-[var(--iberdrola-forest)]/65">
        {label}
      </div>
      <div className="text-sm font-extrabold text-[var(--iberdrola-forest)]">
        {value}
      </div>
    </div>
  );
}

function MovementMini({
  movement,
  movementValue,
}: {
  movement: StandingSummary["movement"];
  movementValue: number;
}) {
  if (movement === "up") {
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700">
        ▲ +{movementValue}
      </span>
    );
  }

  if (movement === "down") {
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-700">
        ▼ -{movementValue}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-600">
      =
    </span>
  );
}

function ClassificationHeaderCard({
  currentUserStanding,
  title,
  movementLabel,
  pendingLabel,
}: {
  currentUserStanding: StandingSummary | null;
  title: string;
  movementLabel: string;
  pendingLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-4 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/65">
        {title}
      </div>

      <div className="flex min-h-[110px] flex-col items-center justify-center text-center">
        {currentUserStanding ? (
          <>
            <div className="text-5xl font-black text-[var(--iberdrola-green)] sm:text-6xl">
              {currentUserStanding.position}º
            </div>

            <div className="mt-3">
              <MovementMini
                movement={currentUserStanding.movement}
                movementValue={currentUserStanding.movement_value}
              />
            </div>

            <div className="mt-2 text-xs font-medium text-[var(--iberdrola-forest)]/65">
              {movementLabel}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <div className="text-3xl font-black text-[var(--iberdrola-green)]">-</div>
            <div className="mt-2 text-xs text-[var(--iberdrola-forest)]/50">
              {pendingLabel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type Props = {
  entryId: string;
};

export default function PredictionsPageClient({ entryId }: Props) {
  const [supabase] = useState(() => createClient());

  const [predictions, setPredictions] = useState<PredictionMap>({});
  const [knockoutPredictions, setKnockoutPredictions] =
    useState<KnockoutPredictionMap>({});
  const [realKnockoutPredictions, setRealKnockoutPredictions] =
    useState<KnockoutPredictionMap>({});
  const [officialMatches, setOfficialMatches] = useState<Match[]>(initialMatches);
  const [locale, setLocale] = useState<Locale>("es");
  const [authUserEmail, setAuthUserEmail] = useState("");
  const [authUserName, setAuthUserName] = useState("");
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [entryStatus, setEntryStatus] = useState<"draft" | "submitted">("draft");
  const [entryNumber, setEntryNumber] = useState<number | null>(null);
  const [poolName, setPoolName] = useState("");
  const [poolId, setPoolId] = useState<string | null>(null);
  const [poolSlug, setPoolSlug] = useState("");
  const [poolSettings, setPoolSettings] = useState<PoolSettings | null>(null);
  const [loadingEntry, setLoadingEntry] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [standings, setStandings] = useState<StandingSummary[]>([]);
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [lastStandingsUpdate, setLastStandingsUpdate] = useState<string | null>(null);
  const [extraPredictions, setExtraPredictions] = useState<Record<string, string>>({});
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid">("pending");
  const [officialExtraResults, setOfficialExtraResults] = useState<Record<string, string>>({});
  const [userTiebreaks, setUserTiebreaks] = useState<UserTiebreakMap>({});
  const [banquilloCount, setBanquilloCount] = useState(0);
const [loadingBanquilloCount, setLoadingBanquilloCount] = useState(false);

  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_KEY) as Locale | null;
    if (savedLocale === "es" || savedLocale === "en" || savedLocale === "pt") {
      setLocale(savedLocale);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    async function loadFromSupabase() {
      setLoadingEntry(true);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) console.error(authError);

        if (!user) {
          window.location.href = "/";
          return;
        }

        setAuthUserEmail(user.email ?? "");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) console.error(profileError);

        setAuthUserName(
          profile?.full_name ||
            user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            ""
        );

        const { data: rawEntry, error: entryError } = await supabase
          .from("entries")
          .select(`
            id,
            status,
            user_id,
            pool_id,
            entry_number,
            payment_status,
            created_at,
            pools (
              name,
              slug,
              is_registration_open,
              is_predictions_editable,
              is_submission_enabled,
              classification_visibility,
              statistics_visibility,
              transparency_visibility,
              submission_deadline
            )
          `)
          .eq("id", entryId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (entryError) console.error(entryError);

        const entry = rawEntry;

        if (!entry) {
          setActiveEntryId(null);
          setEntryStatus("draft");
          setPredictions({});
          setKnockoutPredictions({});
          setExtraPredictions({});
          setUserTiebreaks({});
          setSubmitMessage(t.selectedEntryNotFound);
          setLoadingEntry(false);
          return;
        }

        const pool = Array.isArray(entry.pools) ? entry.pools[0] : entry.pools;

        setActiveEntryId(entry.id);
        setEntryStatus((entry.status ?? "draft") as "draft" | "submitted");
        setEntryNumber(entry.entry_number ?? null);
        setPoolName(pool?.name ?? "");
        setPoolId(entry.pool_id ?? null);
        setPoolSlug(pool?.slug ?? "");
        setPaymentStatus((entry.payment_status ?? "pending") as "pending" | "paid");
        setPoolSettings(
          pool
            ? {
                name: pool.name ?? "",
                slug: pool.slug ?? "",
                is_registration_open: pool.is_registration_open ?? true,
                is_predictions_editable: pool.is_predictions_editable ?? true,
                is_submission_enabled: pool.is_submission_enabled ?? true,
                classification_visibility:
                  pool.classification_visibility ?? "after_submit",
                statistics_visibility: pool.statistics_visibility ?? "hidden",
                transparency_visibility: pool.transparency_visibility ?? "hidden",
                submission_deadline: pool.submission_deadline ?? null,
              }
            : null
        );

        const { data: groupRows, error: groupError } = await supabase
          .from("entry_group_predictions")
          .select("entry_id, match_id, home_goals, away_goals")
          .eq("entry_id", entry.id);

        if (groupError) console.error(groupError);

        const nextPredictions: PredictionMap = {};
        (groupRows ?? []).forEach((row) => {
          nextPredictions[row.match_id] = {
            homeGoals: row.home_goals,
            awayGoals: row.away_goals,
          };
        });
        setPredictions(nextPredictions);

        const { data: koRows, error: koError } = await supabase
          .from("entry_knockout_predictions")
          .select("entry_id, match_id, picked_team_id")
          .eq("entry_id", entry.id);

        if (koError) console.error(koError);

        const nextKo: KnockoutPredictionMap = {};
        (koRows ?? []).forEach((row) => {
          nextKo[row.match_id] = row.picked_team_id;
        });
        setKnockoutPredictions(nextKo);

        const { data: extraRows, error: extraError } = await supabase
          .from("entry_extra_predictions")
          .select("question_key, predicted_value")
          .eq("entry_id", entry.id);

        if (extraError) console.error(extraError);

        const { data: extraResults, error: extraResultsError } = await supabase
          .from("official_extra_results")
          .select("question_key, official_value");

        if (extraResultsError) console.error(extraResultsError);

        const officialExtraMap: Record<string, string> = {};
        (extraResults ?? []).forEach((row) => {
          officialExtraMap[row.question_key] = row.official_value;
        });
        setOfficialExtraResults(officialExtraMap);

        const nextExtraPredictions: Record<string, string> = {};
        (extraRows as ExtraPredictionRow[] | null)?.forEach((row) => {
          nextExtraPredictions[row.question_key] = row.predicted_value ?? "";
        });
        setExtraPredictions(nextExtraPredictions);

        const { data: tiebreakRows, error: tiebreakError } = await supabase
          .from("entry_tiebreaks")
          .select("scope, scope_value, team_id, priority")
          .eq("entry_id", entry.id);

        if (tiebreakError) console.error(tiebreakError);

        const nextTiebreaks: UserTiebreakMap = {};
        ((tiebreakRows ?? []) as EntryTiebreakRow[]).forEach((row) => {
          const key = getTiebreakKey(row.scope, row.scope_value, row.team_id);
          nextTiebreaks[key] = row.priority;
        });
        setUserTiebreaks(nextTiebreaks);

        const { data: officialGroupRows, error: officialGroupError } =
          await supabase
            .from("official_group_results")
            .select("match_id, home_goals, away_goals");

        if (officialGroupError) console.error(officialGroupError);

        const mergedMatches = initialMatches.map((match) => {
          if (match.stage !== "group") return match;

          const officialRow = (officialGroupRows as OfficialGroupRow[] | null)?.find(
            (row) => row.match_id === match.id
          );

          return {
            ...match,
            homeGoals: officialRow?.home_goals ?? null,
            awayGoals: officialRow?.away_goals ?? null,
          };
        });

        setOfficialMatches(mergedMatches);

        const { data: officialKnockoutRows, error: officialKnockoutError } =
          await supabase
            .from("official_knockout_results")
            .select("match_id, picked_team_id");

        if (officialKnockoutError) console.error(officialKnockoutError);

        const nextRealKo: KnockoutPredictionMap = {};
        (officialKnockoutRows ?? []).forEach((row) => {
          nextRealKo[row.match_id] = row.picked_team_id ?? null;
        });

        setRealKnockoutPredictions(nextRealKo);
      } catch (err) {
        console.error(err);
        setSubmitMessage(t.loadEntryError);
      } finally {
        setLoadingEntry(false);
      }
    }

    loadFromSupabase();
  }, [entryId, supabase]);

  useEffect(() => {
    async function loadStandings() {
      if (!poolId) return;

      setLoadingStandings(true);

      try {
        const res = await fetch(`/api/standings?poolId=${poolId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Error cargando clasificación");
        }

        const data = await res.json();
        setStandings((data?.standings ?? []) as StandingSummary[]);
        setLastStandingsUpdate(data?.lastUpdate ?? null);
      } catch (err) {
        console.error(err);
        setStandings([]);
        setLastStandingsUpdate(null);
      } finally {
        setLoadingStandings(false);
      }
    }

    loadStandings();
  }, [poolId]);

  useEffect(() => {
  async function loadBanquilloCount() {
    if (!poolId) return;

    try {
      setLoadingBanquilloCount(true);

      const res = await fetch(`/api/banquillo?poolId=${poolId}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Error cargando banquillo");
      }

      const data = await res.json();
      setBanquilloCount((data?.comments ?? []).length);
    } catch (err) {
      console.error(err);
      setBanquilloCount(0);
    } finally {
      setLoadingBanquilloCount(false);
    }
  }

  loadBanquilloCount();

  // Realtime: incrementar badge cuando llega un comentario nuevo
  const channel = supabase
    .channel(`banquillo-count-${poolId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "banquillo_comments",
        filter: `pool_id=eq.${poolId}`,
      },
      () => {
        setBanquilloCount((prev) => prev + 1);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [poolId, supabase]);

  const t = messages[locale];
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const groups = [...new Set(teams.map((team) => team.group).filter(Boolean))] as string[];

  const now = new Date();

  const submissionDeadlineDate =
    poolSettings?.submission_deadline
      ? new Date(poolSettings.submission_deadline)
      : null;

  const isDeadlinePassed =
    !!submissionDeadlineDate &&
    !Number.isNaN(submissionDeadlineDate.getTime()) &&
    now > submissionDeadlineDate;

  const canEditPredictions =
    entryStatus !== "submitted" &&
    !!poolSettings?.is_predictions_editable &&
    !isDeadlinePassed;

  const canSubmitPredictions =
    entryStatus !== "submitted" &&
    !!poolSettings?.is_submission_enabled &&
    !isDeadlinePassed;

  const canSeeClassification =
    poolSettings?.classification_visibility === "always" ||
    (poolSettings?.classification_visibility === "after_submit" &&
      entryStatus === "submitted");

  const canSeeStatistics =
    poolSettings?.statistics_visibility === "always" ||
    (poolSettings?.statistics_visibility === "after_submit" &&
      entryStatus === "submitted");

  const canSeeTransparency =
    poolSettings?.transparency_visibility === "always" ||
    (poolSettings?.transparency_visibility === "after_submit" &&
      entryStatus === "submitted");

  function updatePrediction(
    matchId: string,
    side: "homeGoals" | "awayGoals",
    value: number | null
  ) {
    if (!canEditPredictions) return;

    setPredictions((current) => ({
      ...current,
      [matchId]: {
        homeGoals: current[matchId]?.homeGoals ?? null,
        awayGoals: current[matchId]?.awayGoals ?? null,
        [side]: value,
      },
    }));
  }

  function updateKnockoutPrediction(matchId: string, teamId: string | null) {
    if (!canEditPredictions) return;

    setKnockoutPredictions((current) => ({
      ...current,
      [matchId]: teamId,
    }));
  }

  function updateExtraPrediction(questionKey: string, value: string) {
    if (!canEditPredictions) return;

    setExtraPredictions((current) => ({
      ...current,
      [questionKey]: value,
    }));
  }

  function updateGroupTiebreak(group: string, teamId: string, value: string) {
    if (!canEditPredictions) return;
    if (!/^\d*$/.test(value)) return;

    const key = getTiebreakKey("group", group, teamId);

    setUserTiebreaks((prev) => {
      const next = { ...prev };

      if (value === "") {
        delete next[key];
      } else {
        next[key] = Number(value);
      }

      return next;
    });
  }

  function updateThirdPlaceTiebreak(teamId: string, value: string) {
    if (!canEditPredictions) return;
    if (!/^\d*$/.test(value)) return;

    const key = getTiebreakKey("third_place", "overall", teamId);

    setUserTiebreaks((prev) => {
      const next = { ...prev };

      if (value === "") {
        delete next[key];
      } else {
        next[key] = Number(value);
      }

      return next;
    });
  }

  async function refreshStandings() {
    if (!poolId) return;

    try {
      const res = await fetch(`/api/standings?poolId=${poolId}`, {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = await res.json();
      setStandings((data?.standings ?? []) as StandingSummary[]);
      setLastStandingsUpdate(data?.lastUpdate ?? null);
    } catch (err) {
      console.error(err);
    }
  }

  const predictedGroupMatches = useMemo(
    () =>
      officialMatches.map((match) => {
        if (match.stage !== "group") return match;
        return {
          ...match,
          homeGoals: predictions[match.id]?.homeGoals ?? null,
          awayGoals: predictions[match.id]?.awayGoals ?? null,
        };
      }),
    [officialMatches, predictions]
  );

  const groupUserTiebreaks = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};

    Object.entries(userTiebreaks).forEach(([key, rank]) => {
      const [scope, group, teamId] = key.split(":");
      if (scope !== "group") return;

      if (!result[group]) result[group] = {};
      result[group][teamId] = rank;
    });

    return result;
  }, [userTiebreaks]);

  const thirdPlaceUserTiebreaks = useMemo(() => {
    const result: Record<string, number> = {};

    Object.entries(userTiebreaks).forEach(([key, rank]) => {
      const [scope, , teamId] = key.split(":");
      if (scope !== "third_place") return;

      result[teamId] = rank;
    });

    return result;
  }, [userTiebreaks]);

  const predictedThirdPlaced = useMemo(
    () =>
      getBestThirdPlacedTeams(
        teams,
        predictedGroupMatches,
        groups,
        8,
        undefined,
        thirdPlaceUserTiebreaks,
        groupUserTiebreaks
      ),
    [predictedGroupMatches, groups, thirdPlaceUserTiebreaks, groupUserTiebreaks]
  );

  const orderedGroupMatches = useMemo(
    () =>
      officialMatches
        .filter((match) => match.stage === "group")
        .sort((a, b) => {
          if ((a.order ?? 0) !== (b.order ?? 0)) {
            return (a.order ?? 0) - (b.order ?? 0);
          }
          return (a.matchNumber ?? 0) - (b.matchNumber ?? 0);
        }),
    [officialMatches]
  );

  const standingsByGroup = useMemo(
    () =>
      groups.map((groupCode) => ({
        groupCode,
        rows: calculatePredictedStandings(
          teams,
          officialMatches,
          predictions,
          groupCode,
          undefined,
          groupUserTiebreaks[groupCode]
        ),
      })),
    [groups, officialMatches, predictions, groupUserTiebreaks]
  );

  const tiedTeamIdsByGroup = useMemo(
    () =>
      Object.fromEntries(
        groups.map((groupCode) => [
          groupCode,
          getGroupTeamsNeedingTiebreak(teams, predictedGroupMatches, groupCode),
        ])
      ),
    [groups, predictedGroupMatches]
  );

  const tiedThirdPlaceTeamIds = useMemo(
    () =>
      getThirdPlacedTeamsNeedingTiebreak(
        teams,
        predictedGroupMatches,
        groups,
        groupUserTiebreaks
      ),
    [predictedGroupMatches, groups, groupUserTiebreaks]
  );

  const userBracket = useMemo(
    () =>
      buildUserKnockoutBracket(
        teams,
        officialMatches,
        groups,
        predictions,
        knockoutPredictions,
        {
          groupUserTiebreaks,
          thirdPlaceUserTiebreaks,
        }
      ),
    [
      officialMatches,
      groups,
      predictions,
      knockoutPredictions,
      groupUserTiebreaks,
      thirdPlaceUserTiebreaks,
    ]
  );

const validTeamsByMatch = useMemo(() => {
  const map: Record<string, Set<string>> = {};

  const allMatches = [
    ...userBracket.round32,
    ...userBracket.round16,
    ...userBracket.quarterfinals,
    ...userBracket.semifinals,
    ...userBracket.finals,
  ];

  allMatches.forEach((match) => {
    const teams = [match.homeTeamId, match.awayTeamId].filter(
      (teamId): teamId is string => !!teamId
    );

    map[match.id] = new Set(teams);
  });

  return map;
}, [userBracket]);

const invalidKnockoutPicks = useMemo(() => {
  const result: Record<string, boolean> = {};

  Object.entries(knockoutPredictions).forEach(([matchId, pickedTeamId]) => {
    if (!pickedTeamId) return;

    const validTeams = validTeamsByMatch[matchId];

    if (!validTeams || !validTeams.has(pickedTeamId)) {
      result[matchId] = true;
    }
  });

  return result;
}, [knockoutPredictions, validTeamsByMatch]);

  const realBracket = useMemo(
    () =>
      buildRealKnockoutBracket(
        teams,
        officialMatches,
        groups,
        realKnockoutPredictions
      ),
    [officialMatches, groups, realKnockoutPredictions]
  );

  const groupPointsTotal = officialMatches
    .filter((match) => match.stage === "group")
    .reduce((sum, match) => {
      const prediction = predictions[match.id] ?? {
        homeGoals: null,
        awayGoals: null,
      };

      const score = calculateMatchPredictionScore(
        match.homeGoals,
        match.awayGoals,
        prediction.homeGoals,
        prediction.awayGoals,
        scoreSettings
      );

      return sum + score.points;
    }, 0);

  const knockoutScore = useMemo(
    () => calculateKnockoutScore(scoreSettings, userBracket, realBracket),
    [userBracket, realBracket]
  );

  const realTeamsByRound = useMemo(
    () => ({
      round32: getTeamsInRound(realBracket.round32),
      round16: getTeamsInRound(realBracket.round16),
      quarterfinals: getTeamsInRound(realBracket.quarterfinals),
      semifinals: getTeamsInRound(realBracket.semifinals),
      finals: getTeamsInRound(realBracket.finals),
      champion: realBracket.championId,
    }),
    [realBracket]
  );

  const extraPointsTotal = useMemo(() => {
    return EXTRA_QUESTIONS.reduce((sum, question) => {
      const currentValue = extraPredictions[question.key] ?? "";
      const officialValue = officialExtraResults[question.key] ?? "";

      const isCorrect =
        !!officialValue &&
        normalizeExtraValue(currentValue) === normalizeExtraValue(officialValue);

      const points =
        (scoreSettings[
          question.pointsKey as keyof typeof scoreSettings
        ] as number) ?? 0;

      return sum + (isCorrect ? points : 0);
    }, 0);
  }, [extraPredictions, officialExtraResults]);

  async function handleSaveEntry() {
    if (!activeEntryId) {
      setSubmitMessage(t.noActiveEntry);
      throw new Error(t.noActiveEntry);
    }

    setSaveLoading(true);
    setSubmitMessage("");

    try {
      const { error: deleteGroupError } = await supabase
        .from("entry_group_predictions")
        .delete()
        .eq("entry_id", activeEntryId);

      if (deleteGroupError) throw deleteGroupError;

      const { error: deleteKoError } = await supabase
        .from("entry_knockout_predictions")
        .delete()
        .eq("entry_id", activeEntryId);

      if (deleteKoError) throw deleteKoError;

      const { error: deleteExtraError } = await supabase
        .from("entry_extra_predictions")
        .delete()
        .eq("entry_id", activeEntryId);

      if (deleteExtraError) throw deleteExtraError;

      const { error: deleteTiebreakError } = await supabase
        .from("entry_tiebreaks")
        .delete()
        .eq("entry_id", activeEntryId);

      if (deleteTiebreakError) throw deleteTiebreakError;

      const groupRows = Object.entries(predictions).map(([matchId, value]) => ({
        entry_id: activeEntryId,
        match_id: matchId,
        home_goals: value.homeGoals,
        away_goals: value.awayGoals,
      }));

      if (groupRows.length > 0) {
        const { error: insertGroupError } = await supabase
          .from("entry_group_predictions")
          .insert(groupRows);

        if (insertGroupError) throw insertGroupError;
      }

      const knockoutRows = Object.entries(knockoutPredictions)
        .filter(([, teamId]) => !!teamId)
        .map(([matchId, teamId]) => ({
          entry_id: activeEntryId,
          match_id: matchId,
          picked_team_id: teamId,
        }));

      if (knockoutRows.length > 0) {
        const { error: insertKoError } = await supabase
          .from("entry_knockout_predictions")
          .insert(knockoutRows);

        if (insertKoError) throw insertKoError;
      }

      const extraRows = EXTRA_QUESTIONS.map((question) => {
        const predictedValue = extraPredictions[question.key]?.trim() ?? "";

        return {
          entry_id: activeEntryId,
          question_key: question.key,
          predicted_value: predictedValue,
          normalized_value: predictedValue ? normalizeExtraValue(predictedValue) : null,
        };
      });

      if (extraRows.length > 0) {
        const { error: insertExtraError } = await supabase
          .from("entry_extra_predictions")
          .insert(extraRows);

        if (insertExtraError) throw insertExtraError;
      }

      const tiebreakRows = Object.entries(userTiebreaks).map(([key, priority]) => {
        const [scope, scope_value, team_id] = key.split(":");

        return {
          entry_id: activeEntryId,
          scope,
          scope_value,
          team_id,
          priority,
        };
      });

      if (tiebreakRows.length > 0) {
        const { error: insertTiebreakError } = await supabase
          .from("entry_tiebreaks")
          .insert(tiebreakRows);

        if (insertTiebreakError) throw insertTiebreakError;
      }

      setSubmitMessage("Porra guardada correctamente.");
      await refreshStandings();
    } catch (err) {
      console.error(err);
      setSubmitMessage(t.saveEntryError);
      throw err;
    } finally {
      setSaveLoading(false);
    }
  }

  function isPredictionComplete() {
    const allGroupsFilled = orderedGroupMatches.every((match) => {
      const prediction = predictions[match.id];
      return (
        prediction &&
        prediction.homeGoals !== null &&
        prediction.awayGoals !== null
      );
    });

    const allKnockoutFilled =
      userBracket.round32.every((m) => knockoutPredictions[m.id]) &&
      userBracket.round16.every((m) => knockoutPredictions[m.id]) &&
      userBracket.quarterfinals.every((m) => knockoutPredictions[m.id]) &&
      userBracket.semifinals.every((m) => knockoutPredictions[m.id]) &&
      userBracket.finals.every((m) => knockoutPredictions[m.id]) &&
      !!userBracket.championId;

    const allExtrasFilled = EXTRA_QUESTIONS.every((question) => {
      return (extraPredictions[question.key] ?? "").trim() !== "";
    });

    return allGroupsFilled && allKnockoutFilled && allExtrasFilled;
  }

  async function handleSubmitEntry() {
    if (!activeEntryId) {
      setSubmitMessage(t.activeEntryNotFound);
      return;
    }

    if (!isPredictionComplete()) {
      setSubmitMessage(t.predictionIncomplete);
      return;
    }

    const confirmed = window.confirm(
      t.submitEntryConfirm
    );

    if (!confirmed) return;

    setSubmitLoading(true);
    setSubmitMessage("");

    try {
      await handleSaveEntry();

      const { error: updateError } = await supabase
        .from("entries")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", activeEntryId);

      if (updateError) throw updateError;

      setEntryStatus("submitted");
      setSubmitMessage(t.submitEntrySuccess);
      await refreshStandings();
    } catch (err) {
      console.error(err);
      setSubmitMessage(t.submitEntryError);
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const totalPoints = groupPointsTotal + knockoutScore.total + extraPointsTotal;
  const greetingName = authUserName?.trim() || authUserEmail?.trim() || t.playerFallback;

  const currentUserStanding = useMemo(
    () => standings.find((row) => row.entry_id === activeEntryId) ?? null,
    [standings, activeEntryId]
  );

  const top3Standings = useMemo(() => standings.slice(0, 3), [standings]);

  const lastStanding = useMemo(
    () => (standings.length > 0 ? standings[standings.length - 1] : null),
    [standings]
  );

  if (loadingEntry) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-6 text-center text-sm font-semibold text-[var(--iberdrola-forest)] shadow-sm">
          {t.loadingPool}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-4 sm:py-6">
      <div className="space-y-4">
        <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="Porra Mundial"
                    className="h-12 w-12 rounded-xl object-contain sm:h-14 sm:w-14"
                  />
                  <div className="min-w-0">
                    <h1 className="truncate text-xl font-black text-[var(--iberdrola-forest)] sm:text-2xl">
                      {t.appTitle}
                    </h1>
                    <p className="text-sm text-[var(--iberdrola-forest)]/70">
                      {poolName ? `${poolName} · ` : ""}
                      Porra {entryNumber ?? "-"} ·{" "}
                      {entryStatus === "submitted" ? t.entryStatusSubmitted : t.entryStatusDraft}
                    </p>
                  </div>
                </div>

                <div className="mt-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                      paymentStatus === "paid"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {paymentStatus === "paid" ? "💳" : "⏳"}{" "}
                    {paymentStatus === "paid"
                      ? t.paymentStatus.paid
                      : t.paymentStatus.pending}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-semibold text-[var(--iberdrola-forest)]/65">
                    {t.welcomeUser}
                  </div>
                  <div className="text-2xl font-black tracking-tight text-[var(--iberdrola-green)] sm:text-3xl">
                    {greetingName}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 xl:min-w-[260px] xl:items-end">
                <LanguageSwitcher
                  locale={locale}
                  onChange={setLocale}
                  label={t.language}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1.3fr_0.8fr_auto]">
              <HeaderPill
                label={t.totalPoints}
                value={canSeeClassification ? totalPoints : "-"}
                big
              />
              <ClassificationHeaderCard
  currentUserStanding={canSeeClassification ? currentUserStanding : null}
  title={t.classificationCardTitle}
  movementLabel={t.classificationMovementLabel}
  pendingLabel={t.classificationPending}
/>

              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                <button
                  type="button"
                  onClick={handleSaveEntry}
                  disabled={saveLoading || !canEditPredictions}
                  className="rounded-2xl border border-[var(--iberdrola-forest)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:bg-[var(--iberdrola-sand)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saveLoading ? t.savingEntry : t.saveEntry}
                </button>

                <button
                  type="button"
                  onClick={handleSubmitEntry}
                  disabled={submitLoading || !canSubmitPredictions}
                  className="rounded-2xl bg-[var(--iberdrola-green)] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {entryStatus === "submitted"
                    ? t.entrySubmitted
                    : submitLoading
                      ? t.submittingEntry
                      : t.submitEntry}

                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50"
                >
                  {t.logout}
                </button>
              </div>
            </div>

            {submitMessage ? (
              <div className="mt-4 rounded-2xl border border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)] px-4 py-3 text-sm font-semibold text-[var(--iberdrola-forest)]">
                {submitMessage}
              </div>
            ) : null}

            {isDeadlinePassed ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                {t.deadlinePassed}
              </div>
            ) : null}

            {!canEditPredictions && entryStatus !== "submitted" && !isDeadlinePassed ? (
              <div className="mt-4 rounded-2xl border border-[var(--iberdrola-sky)] bg-[var(--iberdrola-sand)] px-4 py-3 text-sm font-semibold text-[var(--iberdrola-forest)]">
                {t.editingDisabled}
              </div>
            ) : null}
          </div>
        </section>

        {canSeeClassification ? (
          <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
            <div className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/65">
                    {t.classificationSummary}
                  </div>
                  <div className="mt-1 text-lg font-black text-[var(--iberdrola-forest)]">
                    {t.top3AndLast}
                  </div>
                  <div className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
                    {t.classificationQuickView}
                  </div>

                  {lastStandingsUpdate ? (
                    <div className="mt-2 text-xs font-medium text-[var(--iberdrola-forest)]/55">
                      {t.lastUpdate}:{" "}
                      {new Date(lastStandingsUpdate).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  ) : null}
                </div>

                {poolId && activeEntryId ? (
  <Link
    href={
      poolSlug
        ? `/stats?poolId=${poolId}&poolSlug=${poolSlug}&entryId=${activeEntryId}`
        : `/stats?poolId=${poolId}&entryId=${activeEntryId}`
    }
    className="inline-flex items-center justify-center rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:bg-[var(--iberdrola-sand)]"
  >
    {t.viewStats}
  </Link>
) : null}

                {poolId && activeEntryId && poolSlug ? (
                  <Link
                    href={`/standings?poolId=${poolId}&entryId=${activeEntryId}&poolSlug=${poolSlug}`}
                    className="inline-flex items-center justify-center rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:bg-[var(--iberdrola-sand)]"
                  >
                    {t.viewFullStandings}
                  </Link>
                ) : null}

                {poolId && activeEntryId && poolSlug ? (
  <Link
    href={`/banquillo?poolId=${poolId}&entryId=${activeEntryId}&poolSlug=${poolSlug}`}
    className="relative inline-flex items-center justify-center rounded-2xl border border-[var(--iberdrola-green)] bg-white px-4 py-3 text-sm font-bold text-[var(--iberdrola-forest)] shadow-sm transition hover:bg-[var(--iberdrola-sand)]"
  >
    {t.banquillo.title}

    {!loadingBanquilloCount && banquilloCount > 0 ? (
      <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-black text-white">
        {banquilloCount}
      </span>
    ) : null}
  </Link>
) : null}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/65">
                    {t.top3}
                  </div>

                  <div className="space-y-2">
                    {loadingStandings ? (
                      <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-3 text-sm text-[var(--iberdrola-forest)]/70">
                        {t.loadingStandings}
                      </div>
                    ) : top3Standings.length > 0 ? (
                      top3Standings.map((row) => (
                        <div
                          key={row.entry_id}
                          className="flex items-center justify-between rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-3"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[var(--iberdrola-green-light)] px-2 text-sm font-black text-[var(--iberdrola-forest)]">
                                {row.position}
                              </span>
                              <span className="truncate text-sm font-bold text-[var(--iberdrola-forest)] sm:text-base">
                                {row.name || row.email || t.playerFallback}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-lg font-black text-[var(--iberdrola-green)]">
                              {row.total_points}
                            </div>
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--iberdrola-forest)]/60">
                              {t.points}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-3 text-sm text-[var(--iberdrola-forest)]/70">
                        {t.noStandingsYet}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--iberdrola-forest)]/65">
                    {t.lastPlace}
                  </div>

                  {lastStanding ? (
                    <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base font-black text-[var(--iberdrola-forest)]">
                            {lastStanding.name || lastStanding.email || t.playerFallback}
                          </div>
                          <div className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
                            {t.positionLabel} {lastStanding.position}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-black text-[var(--iberdrola-green)]">
                            {lastStanding.total_points}
                          </div>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--iberdrola-forest)]/60">
                            {t.points}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white px-4 py-3 text-sm text-[var(--iberdrola-forest)]/70">
                      {t.noStandingsYet}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
          <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
            <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
              {t.scoringRules}
            </h2>
          </div>

          <div className="p-4">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              <RulePill
                label={t.exactScoreRule}
                value={`${scoreSettings.exactScore} ${t.points}`}
              />
              <RulePill
                label={t.outcomeRule}
                value={`${scoreSettings.outcome} ${t.points}`}
              />
              <RulePill
                label={t.homeGoalsRule}
                value={`${scoreSettings.homeGoals} ${t.points}`}
              />
              <RulePill
                label={t.awayGoalsRule}
                value={`${scoreSettings.awayGoals} ${t.points}`}
              />
              <RulePill
                label={t.round32}
                value={`${scoreSettings.round32QualifiedPoints} ${t.points}`}
              />
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              <RulePill
                label={t.round16}
                value={`${scoreSettings.round16QualifiedPoints} ${t.points}`}
              />
              <RulePill
                label={t.quarterfinals}
                value={`${scoreSettings.quarterfinalQualifiedPoints} ${t.points}`}
              />
              <RulePill
                label={t.semifinals}
                value={`${scoreSettings.semifinalQualifiedPoints} ${t.points}`}
              />
              <RulePill
                label={t.finalLabel}
                value={`${scoreSettings.finalQualifiedPoints} ${t.points}`}
              />
              <RulePill
                label={t.champion}
                value={`${scoreSettings.championPoints} ${t.points}`}
              />
            </div>

            <p className="mt-3 text-sm text-[var(--iberdrola-forest)]/75">
              {t.scoringNote}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
          <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
            <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
              {t.extraQuestionsRulesTitle}
            </h2>
            <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
              {t.extraQuestionsRulesSubtitle}
            </p>
          </div>

          <div className="p-4">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              <RulePill
                label={t.extras.first_goal_scorer_world}
                value={`${scoreSettings.firstGoalScorerWorldPoints} ${t.points}`}
              />
              <RulePill
                label={t.extras.first_goal_scorer_spain}
                value={`${scoreSettings.firstGoalScorerSpainPoints} ${t.points}`}
              />
              <RulePill
                label={t.extras.golden_boot}
                value={`${scoreSettings.goldenBootPoints} ${t.points}`}
              />
              <RulePill
                label={t.extras.golden_ball}
                value={`${scoreSettings.goldenBallPoints} ${t.points}`}
              />
              <RulePill
                label={t.extras.best_young_player}
                value={`${scoreSettings.bestYoungPlayerPoints} ${t.points}`}
              />
              <RulePill
                label={t.extras.golden_glove}
                value={`${scoreSettings.goldenGlovePoints} ${t.points}`}
              />
              <RulePill
                label={t.extras.top_spanish_scorer}
                value={`${scoreSettings.topSpanishScorerPoints} ${t.points}`}
              />
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.65fr_0.95fr]">
          <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
            <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
              <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
                {t.groupStageSection}
              </h2>
              <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
                {t.matchesChronological}
              </p>
            </div>

            <div className="p-4">
              <div className="hidden lg:block overflow-hidden rounded-2xl border border-[var(--iberdrola-sky)] bg-white">
                <div className="grid grid-cols-[140px_minmax(0,1fr)_80px] gap-3 bg-[var(--iberdrola-sand)]/40 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-[var(--iberdrola-forest)]/75">
                  <div>{t.matchTableInfoHeader}</div>
                  <div className="text-center">{t.predictionHeader}</div>
                  <div className="text-right">{t.pointsHeader}</div>
                </div>

                {orderedGroupMatches.map((match) => {
                  const homeTeam = teamMap.get(match.homeTeamId ?? "");
                  const awayTeam = teamMap.get(match.awayTeamId ?? "");

                  if (!homeTeam || !awayTeam) return null;

                  const prediction = predictions[match.id] ?? {
                    homeGoals: null,
                    awayGoals: null,
                  };

                  const score = calculateMatchPredictionScore(
                    match.homeGoals,
                    match.awayGoals,
                    prediction.homeGoals,
                    prediction.awayGoals,
                    scoreSettings
                  );

                  return (
                    <GroupMatchCompactRow
  key={match.id}
  day={match.day}
  group={match.group ?? null}
  kickoff={match.kickoff ?? null}
  homeTeam={homeTeam}
  awayTeam={awayTeam}
  homePrediction={prediction.homeGoals}
  awayPrediction={prediction.awayGoals}
  officialHomeGoals={match.homeGoals}
  officialAwayGoals={match.awayGoals}
  points={score.points}
  onChangeHome={(value) =>
    updatePrediction(match.id, "homeGoals", value)
  }
  onChangeAway={(value) =>
    updatePrediction(match.id, "awayGoals", value)
  }
  officialLabel={t.officialLabel}
  pointsShortLabel={t.pointsShort}
/>
                  );
                })}
              </div>

              <div className="space-y-2 lg:hidden">
                {orderedGroupMatches.map((match) => {
                  const homeTeam = teamMap.get(match.homeTeamId ?? "");
                  const awayTeam = teamMap.get(match.awayTeamId ?? "");

                  if (!homeTeam || !awayTeam) return null;

                  const prediction = predictions[match.id] ?? {
                    homeGoals: null,
                    awayGoals: null,
                  };

                  const score = calculateMatchPredictionScore(
                    match.homeGoals,
                    match.awayGoals,
                    prediction.homeGoals,
                    prediction.awayGoals,
                    scoreSettings
                  );

                  return (
                    <GroupMatchRow
  key={match.id}
  day={match.day}
  group={match.group ?? null}
  matchNumber={match.matchNumber ?? 0}
  kickoff={match.kickoff ?? null}
  homeTeam={homeTeam}
  awayTeam={awayTeam}
  homePrediction={prediction.homeGoals}
  awayPrediction={prediction.awayGoals}
  officialHomeGoals={match.homeGoals}
  officialAwayGoals={match.awayGoals}
  points={score.points}
  pointsShortLabel={t.pointsShort}
  officialLabel={t.officialLabel}
  officialPendingLabel={t.officialPending}
  matchLabel={t.matchLabel}
  onChangeHome={(value) =>
    updatePrediction(match.id, "homeGoals", value)
  }
  onChangeAway={(value) =>
    updatePrediction(match.id, "awayGoals", value)
  }
/>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm lg:sticky lg:top-4 self-start">
            <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
              <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
                {t.groupStandingsSection}
              </h2>
              <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
                {t.groupStandingsUpdated}
              </p>
            </div>

            <div className="p-4 space-y-3">
              {standingsByGroup.map(({ groupCode, rows }) => (
                <div
                  key={groupCode}
                  className="rounded-2xl border border-[var(--iberdrola-sky)] bg-white p-3"
                >
                  <GroupStandingsTable
                    title={`${t.group} ${groupCode}`}
                    groupCode={groupCode}
                    rows={rows}
                    tiebreaks={userTiebreaks}
                    onChangeTiebreak={updateGroupTiebreak}
                    showTiebreak
                    tiedTeamIds={tiedTeamIdsByGroup[groupCode]}
                    labels={{
                      team: t.team,
                      played: t.played,
                      won: t.won,
                      drawn: t.drawn,
                      lost: t.lost,
                      goalsFor: t.goalsFor,
                      goalsAgainst: t.goalsAgainst,
                      goalDifference: t.goalDifference,
                      pointsShort: t.pointsShort,
                      tiebreak: "TB",
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <ThirdPlaceTable
          title={`${t.bestThirdPlaced}`}
          subtitle={t.bestThirdPlacedSubtitle}
          rows={predictedThirdPlaced}
          tiebreaks={userTiebreaks}
          onChangeTiebreak={updateThirdPlaceTiebreak}
          tiedTeamIds={tiedThirdPlaceTeamIds}
          labels={{
            position: t.position,
            group: t.group,
            team: t.team,
            played: t.played,
            won: t.won,
            drawn: t.drawn,
            lost: t.lost,
            goalsFor: t.goalsFor,
            goalsAgainst: t.goalsAgainst,
            goalDifference: t.goalDifference,
            pointsShort: t.pointsShort,
            status: t.status,
            qualified: t.qualified,
            eliminated: t.eliminated,
            tiebreak: "TB",
          }}
        />

        <KnockoutBracket
  title={t.knockoutBracket}
  subtitle={t.realBracketPending}
  round32={userBracket.round32}
  round16={userBracket.round16}
  quarterfinals={userBracket.quarterfinals}
  semifinals={userBracket.semifinals}
  finals={userBracket.finals}
  championId={userBracket.championId}
  teams={teams}
  picks={knockoutPredictions}
  onPick={canEditPredictions ? updateKnockoutPrediction : undefined}
  realTeamsByRound={realTeamsByRound}
  invalidPicks={invalidKnockoutPicks}
  labels={{
  matchLabel: t.matchLabel,
  championLabel: t.champion,
  undefinedLabel: t.undefinedLabel,
  invalidLabel: t.invalidLabel,
  leftSideLabel: t.leftSideLabel,
  rightSideLabel: t.rightSideLabel,
  round32Label: t.round32,
  round16Label: t.round16,
  quarterfinalsLabel: t.quarterfinals,
  semifinalsLabel: t.semifinals,
  finalLabel: t.finalLabel,
}}
/>

        <section className="rounded-3xl border border-[var(--iberdrola-sky)] bg-white shadow-sm">
          <div className="border-b border-[var(--iberdrola-sky)] px-4 py-3">
            <h2 className="text-lg font-black text-[var(--iberdrola-forest)]">
              {t.extras.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--iberdrola-forest)]/70">
              {t.extras.subtitle}
            </p>
          </div>

          <div className="p-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {EXTRA_QUESTIONS.map((question) => {
                const currentValue = extraPredictions[question.key] ?? "";
                const officialValue = officialExtraResults[question.key] ?? "";

                const points =
                  (scoreSettings[
                    question.pointsKey as keyof typeof scoreSettings
                  ] as number) ?? 0;

                const isCorrect =
                  !!officialValue &&
                  normalizeExtraValue(currentValue) === normalizeExtraValue(officialValue);

                return (
                  <div
                    key={question.key}
                    className={`rounded-2xl border px-4 py-4 ${
                      isCorrect
                        ? "border-green-400 bg-green-50"
                        : "border-[var(--iberdrola-sky)] bg-white"
                    }`}
                  >
                    <div className="mb-2 flex items-start gap-2 text-sm font-bold text-[var(--iberdrola-forest)]">
                      <span className="text-lg leading-none">{question.icon}</span>
                      <span>{t.extras[question.key as keyof typeof t.extras]}</span>
                    </div>

                    <input
                      type="text"
                      value={currentValue}
                      onChange={(e) => updateExtraPrediction(question.key, e.target.value)}
                      placeholder={t.extras.placeholder}
                      disabled={!canEditPredictions}
                      maxLength={60}
                      className="w-full rounded-xl border border-[var(--iberdrola-green)] bg-white px-3 py-2 text-sm font-semibold text-[var(--iberdrola-forest)] outline-none transition focus:ring-2 focus:ring-[var(--iberdrola-green)] disabled:cursor-not-allowed disabled:opacity-70"
                    />

                    {question.key === "best_young_player" ? (
                      <div className="mt-2 text-xs text-[var(--iberdrola-forest)]/60">
                        {t.extras.help_best_young}
                      </div>
                    ) : null}

                    {officialValue ? (
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="text-xs text-[var(--iberdrola-forest)]/65">
                          Oficial: {officialValue}
                        </div>

                        <span
                          className={`rounded-full px-2 py-1 text-xs font-black ${
                            isCorrect
                              ? "bg-[var(--iberdrola-green)] text-white"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {isCorrect ? `+${points}` : "0"}
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}