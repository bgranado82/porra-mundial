export type ThirdSlot =
  | "third74"
  | "third77"
  | "third79"
  | "third80"
  | "third81"
  | "third82"
  | "third85"
  | "third87";

export type AnnexCMapping = Record<
  string, // ejemplo: "ABCDEFGH"
  Record<ThirdSlot, string> // qué grupo va a cada slot
>;

/**
 * CLAVE:
 * string ordenado de los grupos de los 8 terceros clasificados
 *
 * VALOR:
 * qué grupo va a cada partido
 *
 * ⚠️ IMPORTANTE:
 * Esto debe rellenarse con el Anexo C oficial FIFA
 */
export const ANNEX_C_MAP: AnnexCMapping = {
  // EJEMPLOS (NO OFICIALES, solo para que funcione ya)
  ABCDEFGH: {
    third74: "A",
    third77: "C",
    third79: "E",
    third80: "G",
    third81: "B",
    third82: "D",
    third85: "F",
    third87: "H",
  },

  ABCDEFGI: {
    third74: "A",
    third77: "C",
    third79: "E",
    third80: "I",
    third81: "B",
    third82: "D",
    third85: "F",
    third87: "G",
  },

  // 👉 AQUÍ iremos metiendo las 495 combinaciones reales
};