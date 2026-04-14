export type KnockoutStage =
  | "round32"
  | "round16"
  | "quarterfinal"
  | "semifinal"
  | "final";

export type Team = {
  id: string;
  name: string;
  flag: string;
  group: string | null;
};

export type Match = {
  id: string;
  stage: string;
  group?: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
  matchNumber?: number;
  kickoff?: string | null;
  day: number;
  order: number;
};

export type ScoreSettings = {
  exactScore: number;
  outcome: number;
  homeGoals: number;
  awayGoals: number;
  round32QualifiedPoints: number;
  round16QualifiedPoints: number;
  quarterfinalQualifiedPoints: number;
  semifinalQualifiedPoints: number;
  finalQualifiedPoints: number;
  championPoints: number;
  firstGoalScorerWorldPoints: number;
  firstGoalScorerSpainPoints: number;
  goldenBootPoints: number;
  goldenBallPoints: number;
  bestYoungPlayerPoints: number;
  goldenGlovePoints: number;
  topSpanishScorerPoints: number;
};

export type MatchPrediction = {
  homeGoals: number | null;
  awayGoals: number | null;
};

export type MatchPredictionScore = {
  exactHit: boolean;
  outcomeHit: boolean;
  homeGoalsHit: boolean;
  awayGoalsHit: boolean;
  points: number;
};

export type PredictionMap = Record<string, MatchPrediction>;

export type KnockoutPredictionMap = Record<string, string | null>;

export type StandingRow = {
  teamId: string;
  teamName: string;
  teamFlag: string;
  group: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type KnockoutMatch = {
  id: string;
  stage: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
};

export type KnockoutBracketMatch = {
  id: string;
  stage: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeLabel?: string;
  awayLabel?: string;
};

export type KnockoutBracket = {
  round32: KnockoutBracketMatch[];
  round16: KnockoutBracketMatch[];
  quarterfinals: KnockoutBracketMatch[];
  semifinals: KnockoutBracketMatch[];
  finals: KnockoutBracketMatch[];
  championId: string | null;
};

export type DailyPointsRow = {
  dateKey: string;
  label: string;
  points: number;
};

export type TimezoneValue = "local" | "est" | "cet" | "utc";

type VisibilityMode = "hidden" | "after_submit" | "always";

type PoolSettingsRow = {
  id: string;
  name: string;
  slug: string;
  is_registration_open: boolean;
  is_predictions_editable: boolean;
  is_submission_enabled: boolean;
  is_pool_visible: boolean;
  classification_visibility: VisibilityMode;
  statistics_visibility: VisibilityMode;
  transparency_visibility: VisibilityMode;
  submission_deadline: string | null;
  admin_note: string | null;
};

type PaymentStatus = "pending" | "paid";