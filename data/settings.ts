
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
      { tournament: "Euro",      year: 2024, winner: "Txetxu Omaechevarria", country: "es" },
      { tournament: "Euro",      year: 2021, winner: "Iñigo Sendín",          country: "es" },
      { tournament: "Euro",      year: 2016, winner: "Esti Ipiña",             country: "es" },
      { tournament: "World Cup", year: 2022, winner: "Borja Garayzar",         country: "es" },
      { tournament: "World Cup", year: 2018, winner: "Borja Álvarez Fanjul",   country: "es" },
      { tournament: "World Cup", year: 2014, winner: "Gaizka Agirre",          country: "es" },
    ],
  },
  {
    poolId: "eb10020a-f258-49c7-be10-b0350b35d54a",
    entries: [
      { tournament: "Euro",      year: 2024, winner: "Txetxu Omaechevarria", country: "es" },
      { tournament: "Euro",      year: 2021, winner: "Iñigo Sendín",          country: "es" },
      { tournament: "Euro",      year: 2016, winner: "Esti Ipiña",             country: "es" },
      { tournament: "World Cup", year: 2022, winner: "Borja Garayzar",         country: "es" },
      { tournament: "World Cup", year: 2018, winner: "Borja Álvarez Fanjul",   country: "es" },
      { tournament: "World Cup", year: 2014, winner: "Gaizka Agirre",          country: "es" },
    ],
  },
   {
    poolId: "83e5cadf-a48a-462f-843a-c64e4de80d90",
    entries: [
      { tournament: "World Cup", year: 2026, winner: " ",          country: "es" },
    ],
  },
];

// ─── CONFIGURACIÓN DE PREMIOS POR POOL ────────────────────────────────────────
// Cada pool puede tener su propio buy-in, devolución al último y reparto entre
// los premios. Mismo patrón que HALL_OF_FAME: si un pool no aparece aquí,
// se usa POOL_PRIZE_CONFIG_FALLBACK.
//
// Reparto: primero se le devuelve al último (loserRefund), y de lo que queda
// (potTotal − loserRefund) se reparten los porcentajes a 1º/2º/3º.
// Los % NO tienen que sumar 100: lo que sobre simplemente no se reparte; lo
// que falte para llegar a 100 también queda fuera. Pon a 0 los puestos que
// no quieras premiar (ej. thirdPct: 0 → no hay 3er premio).
//
// loserRefund admite dos formas:
//   { kind: "fixed",   amount: 5  }  → 5€ fijos al último
//   { kind: "percent", percent: 100 } → 100% del buy-in (comportamiento histórico)
//   { kind: "none" }                 → no hay devolución al último

export type LoserRefundConfig =
  | { kind: "fixed";   amount: number }
  | { kind: "percent"; percent: number }
  | { kind: "none" };

export type PoolPrizeConfig = {
  poolId: string;
  buyIn: number;
  loserRefund: LoserRefundConfig;
  firstPct: number;   // % del bote restante (tras devolución) para el 1º
  secondPct: number;  // % para el 2º (0 si no hay)
  thirdPct: number;   // % para el 3º (0 si no hay)
};

export const POOL_PRIZE_CONFIG_FALLBACK: Omit<PoolPrizeConfig, "poolId"> = {
  buyIn: 10,
  loserRefund: { kind: "percent", percent: 100 },
  firstPct: 60,
  secondPct: 30,
  thirdPct: 10,
};

export const POOL_PRIZE_CONFIG: PoolPrizeConfig[] = [
  // EJEMPLO: rellena con la config real de cada pool. Si dejas un pool
  // fuera, se aplica POOL_PRIZE_CONFIG_FALLBACK automáticamente.
  {
    poolId: "04b85239-6f0e-436d-8afe-1395bca0f8f0",
    buyIn: 10,
    loserRefund: { kind: "percent", percent: 100 },
    firstPct: 60,
    secondPct: 30,
    thirdPct: 10,
  },
  {
    poolId: "eb10020a-f258-49c7-be10-b0350b35d54a",
    buyIn: 100,
    loserRefund: { kind: "percent", percent: 100 },
    firstPct: 50,
    secondPct: 20,
    thirdPct: 30,
  },
  {
    poolId: "83e5cadf-a48a-462f-843a-c64e4de80d90",
    buyIn: 5,
    loserRefund: { kind: "percent", percent: 100 },
    firstPct: 60,
    secondPct: 30,
    thirdPct: 10,
  },
];

export function getPoolPrizeConfig(poolId: string): Omit<PoolPrizeConfig, "poolId"> {
  const found = POOL_PRIZE_CONFIG.find((c) => c.poolId === poolId);
  if (!found) return POOL_PRIZE_CONFIG_FALLBACK;
  const { poolId: _omit, ...rest } = found;
  return rest;
}

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