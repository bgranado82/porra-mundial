import { Match } from "@/types";
import { getKickoff } from "@/lib/getKickoff";

const baseMatches: Match[] = [
  // ===== GRUPO A =====
  { id: "a1", stage: "group", group: "A", day: 1, order: 1, homeTeamId: "mex", awayTeamId: "rsa", homeGoals: null, awayGoals: null },
  { id: "a2", stage: "group", group: "A", day: 1, order: 2, homeTeamId: "kor", awayTeamId: "cze", homeGoals: null, awayGoals: null },
  { id: "a3", stage: "group", group: "A", day: 8, order: 3, homeTeamId: "cze", awayTeamId: "rsa", homeGoals: null, awayGoals: null },
  { id: "a4", stage: "group", group: "A", day: 8, order: 4, homeTeamId: "mex", awayTeamId: "kor", homeGoals: null, awayGoals: null },
  { id: "a5", stage: "group", group: "A", day: 14, order: 5, homeTeamId: "cze", awayTeamId: "mex", homeGoals: null, awayGoals: null },
  { id: "a6", stage: "group", group: "A", day: 14, order: 6, homeTeamId: "rsa", awayTeamId: "kor", homeGoals: null, awayGoals: null },

  // ===== GRUPO B =====
  { id: "b1", stage: "group", group: "B", day: 2, order: 7, homeTeamId: "can", awayTeamId: "bih", homeGoals: null, awayGoals: null },
  { id: "b2", stage: "group", group: "B", day: 2, order: 8, homeTeamId: "qat", awayTeamId: "sui", homeGoals: null, awayGoals: null },
  { id: "b3", stage: "group", group: "B", day: 8, order: 9, homeTeamId: "sui", awayTeamId: "bih", homeGoals: null, awayGoals: null },
  { id: "b4", stage: "group", group: "B", day: 8, order: 10, homeTeamId: "can", awayTeamId: "qat", homeGoals: null, awayGoals: null },
  { id: "b5", stage: "group", group: "B", day: 14, order: 11, homeTeamId: "sui", awayTeamId: "can", homeGoals: null, awayGoals: null },
  { id: "b6", stage: "group", group: "B", day: 14, order: 12, homeTeamId: "bih", awayTeamId: "qat", homeGoals: null, awayGoals: null },

  // ===== GRUPO C =====
  { id: "c1", stage: "group", group: "C", day: 3, order: 13, homeTeamId: "bra", awayTeamId: "mar", homeGoals: null, awayGoals: null },
  { id: "c2", stage: "group", group: "C", day: 3, order: 14, homeTeamId: "hai", awayTeamId: "sco", homeGoals: null, awayGoals: null },
  { id: "c3", stage: "group", group: "C", day: 9, order: 15, homeTeamId: "bra", awayTeamId: "hai", homeGoals: null, awayGoals: null },
  { id: "c4", stage: "group", group: "C", day: 9, order: 16, homeTeamId: "sco", awayTeamId: "mar", homeGoals: null, awayGoals: null },
  { id: "c5", stage: "group", group: "C", day: 14, order: 17, homeTeamId: "sco", awayTeamId: "bra", homeGoals: null, awayGoals: null },
  { id: "c6", stage: "group", group: "C", day: 14, order: 18, homeTeamId: "mar", awayTeamId: "hai", homeGoals: null, awayGoals: null },

  // ===== GRUPO D =====
  { id: "d1", stage: "group", group: "D", day: 2, order: 19, homeTeamId: "usa", awayTeamId: "par", homeGoals: null, awayGoals: null },
  { id: "d2", stage: "group", group: "D", day: 2, order: 20, homeTeamId: "aus", awayTeamId: "tur", homeGoals: null, awayGoals: null },
  { id: "d3", stage: "group", group: "D", day: 9, order: 21, homeTeamId: "tur", awayTeamId: "par", homeGoals: null, awayGoals: null },
  { id: "d4", stage: "group", group: "D", day: 9, order: 22, homeTeamId: "usa", awayTeamId: "aus", homeGoals: null, awayGoals: null },
  { id: "d5", stage: "group", group: "D", day: 15, order: 23, homeTeamId: "tur", awayTeamId: "usa", homeGoals: null, awayGoals: null },
  { id: "d6", stage: "group", group: "D", day: 15, order: 24, homeTeamId: "par", awayTeamId: "aus", homeGoals: null, awayGoals: null },

  // ===== GRUPO E =====
  { id: "e1", stage: "group", group: "E", day: 4, order: 25, homeTeamId: "ger", awayTeamId: "cuw", homeGoals: null, awayGoals: null },
  { id: "e2", stage: "group", group: "E", day: 4, order: 26, homeTeamId: "civ", awayTeamId: "ecu", homeGoals: null, awayGoals: null },
  { id: "e3", stage: "group", group: "E", day: 10, order: 27, homeTeamId: "ger", awayTeamId: "civ", homeGoals: null, awayGoals: null },
  { id: "e4", stage: "group", group: "E", day: 10, order: 28, homeTeamId: "ecu", awayTeamId: "cuw", homeGoals: null, awayGoals: null },
  { id: "e5", stage: "group", group: "E", day: 15, order: 29, homeTeamId: "ecu", awayTeamId: "ger", homeGoals: null, awayGoals: null },
  { id: "e6", stage: "group", group: "E", day: 15, order: 30, homeTeamId: "cuw", awayTeamId: "civ", homeGoals: null, awayGoals: null },

  // ===== GRUPO F =====
  { id: "f1", stage: "group", group: "F", day: 4, order: 31, homeTeamId: "ned", awayTeamId: "jpn", homeGoals: null, awayGoals: null },
  { id: "f2", stage: "group", group: "F", day: 4, order: 32, homeTeamId: "swe", awayTeamId: "tun", homeGoals: null, awayGoals: null },
  { id: "f3", stage: "group", group: "F", day: 10, order: 33, homeTeamId: "ned", awayTeamId: "swe", homeGoals: null, awayGoals: null },
  { id: "f4", stage: "group", group: "F", day: 10, order: 34, homeTeamId: "tun", awayTeamId: "jpn", homeGoals: null, awayGoals: null },
  { id: "f5", stage: "group", group: "F", day: 15, order: 35, homeTeamId: "tun", awayTeamId: "ned", homeGoals: null, awayGoals: null },
  { id: "f6", stage: "group", group: "F", day: 15, order: 36, homeTeamId: "jpn", awayTeamId: "swe", homeGoals: null, awayGoals: null },

  // ===== GRUPO G =====
  { id: "g1", stage: "group", group: "G", day: 5, order: 37, homeTeamId: "bel", awayTeamId: "egy", homeGoals: null, awayGoals: null },
  { id: "g2", stage: "group", group: "G", day: 5, order: 38, homeTeamId: "irn", awayTeamId: "nzl", homeGoals: null, awayGoals: null },
  { id: "g3", stage: "group", group: "G", day: 11, order: 39, homeTeamId: "bel", awayTeamId: "irn", homeGoals: null, awayGoals: null },
  { id: "g4", stage: "group", group: "G", day: 11, order: 40, homeTeamId: "nzl", awayTeamId: "egy", homeGoals: null, awayGoals: null },
  { id: "g5", stage: "group", group: "G", day: 16, order: 41, homeTeamId: "nzl", awayTeamId: "bel", homeGoals: null, awayGoals: null },
  { id: "g6", stage: "group", group: "G", day: 16, order: 42, homeTeamId: "egy", awayTeamId: "irn", homeGoals: null, awayGoals: null },

  // ===== GRUPO H =====
  { id: "h1", stage: "group", group: "H", day: 5, order: 43, homeTeamId: "esp", awayTeamId: "cpv", homeGoals: null, awayGoals: null },
  { id: "h2", stage: "group", group: "H", day: 5, order: 44, homeTeamId: "ksa", awayTeamId: "uru", homeGoals: null, awayGoals: null },
  { id: "h3", stage: "group", group: "H", day: 11, order: 45, homeTeamId: "esp", awayTeamId: "ksa", homeGoals: null, awayGoals: null },
  { id: "h4", stage: "group", group: "H", day: 11, order: 46, homeTeamId: "uru", awayTeamId: "cpv", homeGoals: null, awayGoals: null },
  { id: "h5", stage: "group", group: "H", day: 16, order: 47, homeTeamId: "uru", awayTeamId: "esp", homeGoals: null, awayGoals: null },
  { id: "h6", stage: "group", group: "H", day: 16, order: 48, homeTeamId: "cpv", awayTeamId: "ksa", homeGoals: null, awayGoals: null },

  // ===== GRUPO I =====
  { id: "i1", stage: "group", group: "I", day: 6, order: 49, homeTeamId: "fra", awayTeamId: "sen", homeGoals: null, awayGoals: null },
  { id: "i2", stage: "group", group: "I", day: 6, order: 50, homeTeamId: "irq", awayTeamId: "nor", homeGoals: null, awayGoals: null },
  { id: "i3", stage: "group", group: "I", day: 12, order: 51, homeTeamId: "fra", awayTeamId: "irq", homeGoals: null, awayGoals: null },
  { id: "i4", stage: "group", group: "I", day: 12, order: 52, homeTeamId: "nor", awayTeamId: "sen", homeGoals: null, awayGoals: null },
  { id: "i5", stage: "group", group: "I", day: 16, order: 53, homeTeamId: "nor", awayTeamId: "fra", homeGoals: null, awayGoals: null },
  { id: "i6", stage: "group", group: "I", day: 16, order: 54, homeTeamId: "sen", awayTeamId: "irq", homeGoals: null, awayGoals: null },

  // ===== GRUPO J =====
  { id: "j1", stage: "group", group: "J", day: 6, order: 55, homeTeamId: "arg", awayTeamId: "alg", homeGoals: null, awayGoals: null },
  { id: "j2", stage: "group", group: "J", day: 6, order: 56, homeTeamId: "aut", awayTeamId: "jor", homeGoals: null, awayGoals: null },
  { id: "j3", stage: "group", group: "J", day: 12, order: 57, homeTeamId: "arg", awayTeamId: "aut", homeGoals: null, awayGoals: null },
  { id: "j4", stage: "group", group: "J", day: 12, order: 58, homeTeamId: "jor", awayTeamId: "alg", homeGoals: null, awayGoals: null },
  { id: "j5", stage: "group", group: "J", day: 17, order: 59, homeTeamId: "jor", awayTeamId: "arg", homeGoals: null, awayGoals: null },
  { id: "j6", stage: "group", group: "J", day: 17, order: 60, homeTeamId: "alg", awayTeamId: "aut", homeGoals: null, awayGoals: null },

  // ===== GRUPO K =====
  { id: "k1", stage: "group", group: "K", day: 7, order: 61, homeTeamId: "por", awayTeamId: "cod", homeGoals: null, awayGoals: null },
  { id: "k2", stage: "group", group: "K", day: 7, order: 62, homeTeamId: "uzb", awayTeamId: "col", homeGoals: null, awayGoals: null },
  { id: "k3", stage: "group", group: "K", day: 13, order: 63, homeTeamId: "por", awayTeamId: "uzb", homeGoals: null, awayGoals: null },
  { id: "k4", stage: "group", group: "K", day: 13, order: 64, homeTeamId: "col", awayTeamId: "cod", homeGoals: null, awayGoals: null },
  { id: "k5", stage: "group", group: "K", day: 17, order: 65, homeTeamId: "col", awayTeamId: "por", homeGoals: null, awayGoals: null },
  { id: "k6", stage: "group", group: "K", day: 17, order: 66, homeTeamId: "cod", awayTeamId: "uzb", homeGoals: null, awayGoals: null },

  // ===== GRUPO L =====
  { id: "l1", stage: "group", group: "L", day: 7, order: 67, homeTeamId: "eng", awayTeamId: "cro", homeGoals: null, awayGoals: null },
  { id: "l2", stage: "group", group: "L", day: 7, order: 68, homeTeamId: "gha", awayTeamId: "pan", homeGoals: null, awayGoals: null },
  { id: "l3", stage: "group", group: "L", day: 13, order: 69, homeTeamId: "eng", awayTeamId: "gha", homeGoals: null, awayGoals: null },
  { id: "l4", stage: "group", group: "L", day: 13, order: 70, homeTeamId: "pan", awayTeamId: "cro", homeGoals: null, awayGoals: null },
  { id: "l5", stage: "group", group: "L", day: 17, order: 71, homeTeamId: "pan", awayTeamId: "eng", homeGoals: null, awayGoals: null },
  { id: "l6", stage: "group", group: "L", day: 17, order: 72, homeTeamId: "cro", awayTeamId: "gha", homeGoals: null, awayGoals: null },

  // ===== ROUND OF 32 PREPARADA =====
  { id: "r32-1", stage: "round32", group: null, day: 18, order: 73, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r32-2", stage: "round32", group: null, day: 19, order: 74, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r32-3", stage: "round32", group: null, day: 19, order: 75, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r32-4", stage: "round32", group: null, day: 19, order: 76, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r32-5", stage: "round32", group: null, day: 20, order: 77, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r32-6", stage: "round32", group: null, day: 20, order: 78, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r32-7", stage: "round32", group: null, day: 20, order: 79, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r32-8", stage: "round32", group: null, day: 21, order: 80, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r32-9", stage: "round32", group: null, day: 21, order: 81, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r32-10", stage: "round32", group: null, day: 21, order: 82, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r32-11", stage: "round32", group: null, day: 22, order: 83, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r32-12", stage: "round32", group: null, day: 22, order: 84, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r32-13", stage: "round32", group: null, day: 22, order: 85, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r32-14", stage: "round32", group: null, day: 23, order: 86, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r32-15", stage: "round32", group: null, day: 23, order: 87, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r32-16", stage: "round32", group: null, day: 23, order: 88, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },

 // ===== ROUND OF 16 PREPARADA =====
  { id: "r16-1", stage: "round16", group: null, day: 24, order: 89, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r16-2", stage: "round16", group: null, day: 24, order: 90, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r16-3", stage: "round16", group: null, day: 24, order: 91, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r16-4", stage: "round16", group: null, day: 24, order: 92, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r16-5", stage: "round16", group: null, day: 25, order: 93, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r16-6", stage: "round16", group: null, day: 25, order: 94, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r16-7", stage: "round16", group: null, day: 25, order: 95, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "r16-8", stage: "round16", group: null, day: 25, order: 96, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },

  // ===== CUARTOS PREPARADOS =====
  { id: "qf-1", stage: "quarterfinal", group: null, day: 26, order: 97, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "qf-2", stage: "quarterfinal", group: null, day: 26, order: 98, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "qf-3", stage: "quarterfinal", group: null, day: 27, order: 99, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "qf-4", stage: "quarterfinal", group: null, day: 27, order: 100, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },

  // ===== SEMIS PREPARADAS =====
  { id: "sf-1", stage: "semifinal", group: null, day: 28, order: 101, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
  { id: "sf-2", stage: "semifinal", group: null, day: 28, order: 102, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },

  // ===== FINAL PREPARADA =====
  { id: "final-1", stage: "final", group: null, day: 29, order: 103, homeTeamId: null, awayTeamId: null, homeGoals: null, awayGoals: null },
];

export const matches: Match[] = baseMatches.map((match) => ({
  ...match,
  matchNumber: match.order,
  kickoff: getKickoff(match.day),
}));