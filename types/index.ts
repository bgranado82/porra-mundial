export type Stage =
  | "group"
  | "round32"
  | "round16"
  | "quarterfinal"
  | "semifinal"
  | "thirdPlace"
  | "final";

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
  stage: Stage;
  group: string | null;
  day: number;
  order: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
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
};

export type MatchPredictionScore = {
  points: number;
  exactHit: boolean;
  outcomeHit: boolean;
  homeGoalsHit: boolean;
  awayGoalsHit: boolean;
};

export type KnockoutBracketMatch = {
  id: string;
  stage: KnockoutStage;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeLabel?: string;
  awayLabel?: string;
};

export type KnockoutPredictionMap = Record<string, string | null>;