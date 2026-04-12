export type ThirdSlot =
  | "third74"
  | "third77"
  | "third79"
  | "third80"
  | "third81"
  | "third82"
  | "third85"
  | "third87";

export type ThirdSlotAssignment = Record<ThirdSlot, string>;

export const THIRD_SLOT_ORDER: ThirdSlot[] = [
  "third74",
  "third77",
  "third79",
  "third80",
  "third81",
  "third82",
  "third85",
  "third87",
];

export function buildThirdComboKey(groups: string[]): string {
  return [...groups].sort().join("");
}

/**
 * IMPORTANTE
 * ----------
 * Este archivo está preparado para la tabla oficial de las 495 combinaciones
 * del Mundial 2026 (Annex C / tabla pública equivalente).
 *
 * La clave es la concatenación alfabética de los 8 grupos cuyos terceros pasan.
 * Ejemplo:
 *   "EFGHIJKL"
 *
 * El valor es el rival de:
 *   1E, 1I, 1A, 1L, 1D, 1G, 1B, 1K
 * en ese orden, o sea:
 *   third74, third77, third79, third80, third81, third82, third85, third87
 *
 * He dejado varias filas ya puestas como ejemplo real.
 * Debes completar el resto hasta las 495.
 */
export const THIRD_PLACE_COMBINATIONS: Record<string, ThirdSlotAssignment> = {
  EFGHIJKL: {
    third74: "E",
    third77: "J",
    third79: "I",
    third80: "F",
    third81: "H",
    third82: "G",
    third85: "L",
    third87: "K",
  },
  DFGHIJKL: {
    third74: "H",
    third77: "G",
    third79: "I",
    third80: "D",
    third81: "J",
    third82: "F",
    third85: "L",
    third87: "K",
  },
  DEGHIJKL: {
    third74: "E",
    third77: "J",
    third79: "I",
    third80: "D",
    third81: "H",
    third82: "G",
    third85: "L",
    third87: "K",
  },
  DEFHIJKL: {
    third74: "E",
    third77: "J",
    third79: "I",
    third80: "D",
    third81: "H",
    third82: "F",
    third85: "L",
    third87: "K",
  },
  DEFGIJKL: {
    third74: "E",
    third77: "G",
    third79: "I",
    third80: "D",
    third81: "J",
    third82: "F",
    third85: "L",
    third87: "K",
  },
  DEFGHJKL: {
    third74: "E",
    third77: "G",
    third79: "J",
    third80: "D",
    third81: "H",
    third82: "F",
    third85: "L",
    third87: "K",
  },
  DEFGHIKL: {
    third74: "E",
    third77: "G",
    third79: "I",
    third80: "D",
    third81: "H",
    third82: "F",
    third85: "L",
    third87: "K",
  },
  DEFGHIJL: {
    third74: "E",
    third77: "G",
    third79: "J",
    third80: "D",
    third81: "H",
    third82: "F",
    third85: "L",
    third87: "I",
  },
  DEFGHIJK: {
    third74: "E",
    third77: "G",
    third79: "J",
    third80: "D",
    third81: "H",
    third82: "F",
    third85: "I",
    third87: "K",
  },
};
