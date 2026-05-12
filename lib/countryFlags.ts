// Mapea texto libre de país (ES/EN, con tildes o sin, mayúsculas, códigos)
// a código ISO 3166-1 alpha-2 (lowercase) para usar con flagcdn.com.
//
// Si no se reconoce el país, devolvemos null y el caller puede mostrar
// un placeholder neutro.

const COUNTRY_TO_ISO: Record<string, string> = {
  // España
  españa: "es",
  espana: "es",
  spain: "es",
  esp: "es",
  es: "es",

  // Reino Unido
  "reino unido": "gb",
  "united kingdom": "gb",
  uk: "gb",
  gbr: "gb",
  gb: "gb",
  inglaterra: "gb",
  england: "gb",

  // Portugal
  portugal: "pt",
  pt: "pt",
  por: "pt",

  // EEUU
  "estados unidos": "us",
  "united states": "us",
  usa: "us",
  us: "us",
  eeuu: "us",

  // México
  mexico: "mx",
  méxico: "mx",
  mex: "mx",
  mx: "mx",

  // Brasil
  brasil: "br",
  brazil: "br",
  bra: "br",
  br: "br",

  // Argentina
  argentina: "ar",
  arg: "ar",
  ar: "ar",

  // Francia
  francia: "fr",
  france: "fr",
  fra: "fr",
  fr: "fr",

  // Alemania
  alemania: "de",
  germany: "de",
  deu: "de",
  ger: "de",
  de: "de",

  // Italia
  italia: "it",
  italy: "it",
  ita: "it",
  it: "it",

  // Holanda
  "países bajos": "nl",
  "paises bajos": "nl",
  netherlands: "nl",
  holanda: "nl",
  ned: "nl",
  nl: "nl",

  // Bélgica
  belgica: "be",
  bélgica: "be",
  belgium: "be",
  bel: "be",
  be: "be",

  // Polonia
  polonia: "pl",
  poland: "pl",
  pol: "pl",
  pl: "pl",

  // Australia
  australia: "au",
  aus: "au",
  au: "au",

  // Otros frecuentes en grupos internacionales
  irlanda: "ie",
  ireland: "ie",
  ie: "ie",
  escocia: "gb-sct",
  scotland: "gb-sct",
  gales: "gb-wls",
  wales: "gb-wls",
  chile: "cl",
  cl: "cl",
  colombia: "co",
  co: "co",
  peru: "pe",
  perú: "pe",
  pe: "pe",
  uruguay: "uy",
  uy: "uy",
  canada: "ca",
  canadá: "ca",
  ca: "ca",
};

/**
 * Devuelve el código ISO (lowercase) del país, o null si no se reconoce.
 */
export function countryToIso(country: string | null | undefined): string | null {
  if (!country) return null;
  const key = country.trim().toLowerCase();
  return COUNTRY_TO_ISO[key] ?? null;
}

/**
 * Devuelve la URL de la bandera (flagcdn.com SVG), o null si no se reconoce.
 * Es el mismo sistema que usan los equipos del Mundial en data/teams.ts,
 * que sí se ve en todos los ordenadores (los emojis no se ven en Windows
 * sin fuente de banderas instalada).
 */
export function countryFlagUrl(country: string | null | undefined): string | null {
  const iso = countryToIso(country);
  if (!iso) return null;
  if (iso === "gb-sct") return "https://flagcdn.com/gb-sct.svg";
  if (iso === "gb-wls") return "https://flagcdn.com/gb-wls.svg";
  return `https://flagcdn.com/${iso}.svg`;
}
