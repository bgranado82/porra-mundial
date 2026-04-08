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
  kickoff?: string;
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
};

export type MatchPrediction = {
  homeGoals: number | null;
  awayGoals: number | null;
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

export type KnockoutBracket = {
  round32: KnockoutMatch[];
  round16: KnockoutMatch[];
  quarterfinals: KnockoutMatch[];
  semifinals: KnockoutMatch[];
  finals: KnockoutMatch[];
  championId: string | null;
};