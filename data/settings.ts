
import { ScoreSettings } from "@/types";

export type HallOfFameEntry = {
  tournament: string; // e.g. "Euro 2024" | "World Cup 2022"
  year: number;
  winner: string;
  country?: string; // ISO code or name for flag
};

export type PoolHallOfFame = {
  poolId: string;
  entries: HallOfFameEntry[];
};

export const HALL_OF_FAME: PoolHallOfFame[] = [
  {
    poolId: "04b85239-6f0e-436d-8afe-1395bca0f8f0",
    entries: [
      { tournament: "Euro",      year: 2024, winner: "Txetxu Omaechevareia", country: "es" },
      { tournament: "Euro",      year: 2021, winner: "Iñigo Sendín",          country: "es" },
      { tournament: "Euro",      year: 2016, winner: "Esti Ipiña",             country: "es" },
      { tournament: "World Cup", year: 2022, winner: "Borja Garayzar",         country: "es" },
      { tournament: "World Cup", year: 2018, winner: "Borja Álvarez Fanjul",   country: "es" },
      { tournament: "World Cup", year: 2014, winner: "Gaizka Agirre",          country: "es" },
    ],
  },
];

export const scoreSettings: ScoreSettings = {
  exactScore: 34,
  outcome: 12,
  homeGoals: 7,
  awayGoals: 7,

  round32QualifiedPoints: 15,
  round16QualifiedPoints: 30,
  quarterfinalQualifiedPoints: 45,
  semifinalQualifiedPoints: 60,
  finalQualifiedPoints: 80,
  championPoints: 120,

  firstGoalScorerWorldPoints: 35,
  firstGoalScorerSpainPoints: 25,
  goldenBootPoints: 45,
  goldenBallPoints: 45,
  bestYoungPlayerPoints: 35,
  goldenGlovePoints: 35,
  topSpanishScorerPoints: 30,
};