export type Locale = "es" | "en" | "pt";

type Messages = {
  appTitle: string;
  groupStage: string;
  language: string;

  participantData: string;
  name: string;
  email: string;
  company: string;
  country: string;

  totalPoints: string;
  dailyEvolution: string;

  scoringRules: string;
  exactScoreRule: string;
  outcomeRule: string;
  homeGoalsRule: string;
  awayGoalsRule: string;
  scoringNote: string;
  points: string;

  group: string;
  home: string;
  away: string;
  yourPrediction: string;

  predictedStandings: string;
  standings: string;

  team: string;
  played: string;
  won: string;
  drawn: string;
  lost: string;
  goalsFor: string;
  goalsAgainst: string;
  goalDifference: string;

  pointsShort: string;

  officialLabel: string;
  officialPending: string;

  round32: string;
  round16: string;
  quarterfinals: string;
  semifinals: string;
  finalLabel: string;
  champion: string;
  knockoutBracket: string;
  realRound32: string;
  yourKnockoutBracket: string;
  realBracketPending: string;

  position: string;
  status: string;
  qualified: string;
  eliminated: string;
  bestThirdPlaced: string;
  bestThirdPlacedSubtitle: string;
};

export const messages: Record<Locale, Messages> = {
  es: {
    appTitle: "Porra Mundial 2026",
    groupStage: "Fase de grupos",
    language: "Idioma",

    participantData: "Datos del participante",
    name: "Nombre",
    email: "Email",
    company: "Empresa",
    country: "País",

    totalPoints: "Puntos totales",
    dailyEvolution: "Evolución diaria",

    scoringRules: "Sistema de puntuación",
    exactScoreRule: "Resultado exacto",
    outcomeRule: "Resultado (ganador/empate)",
    homeGoalsRule: "Goles equipo local",
    awayGoalsRule: "Goles equipo visitante",
    scoringNote: "Los puntos de grupos se acumulan por partido. Los de eliminatorias se darán por acertar equipos clasificados.",
    points: "puntos",

    group: "Grupo",
    home: "Local",
    away: "Visitante",
    yourPrediction: "Tu pronóstico",

    predictedStandings: "Clasificación pronosticada",
    standings: "Clasificación",

    team: "Equipo",
    played: "PJ",
    won: "PG",
    drawn: "PE",
    lost: "PP",
    goalsFor: "GF",
    goalsAgainst: "GC",
    goalDifference: "DG",

    pointsShort: "Pts",

    officialLabel: "Oficial",
    officialPending: "Pendiente",

    round32: "Round of 32",
    round16: "Octavos",
    quarterfinals: "Cuartos",
    semifinals: "Semis",
    finalLabel: "Final",
    champion: "Campeón",
    knockoutBracket: "Cuadro eliminatorio",
    realRound32: "Round of 32 real",
    yourKnockoutBracket: "Tu cuadro eliminatorio",
    realBracketPending: "Los cruces reales aparecerán cuando termine la fase de grupos y estén definidos los clasificados.",

    position: "Pos",
    status: "Estado",
    qualified: "Clasificado",
    eliminated: "Eliminado",
    bestThirdPlaced: "Mejores terceros",
    bestThirdPlacedSubtitle: "Los 8 mejores terceros pasarán a la Round of 32.",
  },
  en: {
    appTitle: "World Cup Pool 2026",
    groupStage: "Group stage",
    language: "Language",

    participantData: "Participant data",
    name: "Name",
    email: "Email",
    company: "Company",
    country: "Country",

    totalPoints: "Total points",
    dailyEvolution: "Daily evolution",

    scoringRules: "Scoring system",
    exactScoreRule: "Exact score",
    outcomeRule: "Match outcome",
    homeGoalsRule: "Home team goals",
    awayGoalsRule: "Away team goals",
    scoringNote: "Group points are awarded per match. Knockout points will be awarded for correctly predicting qualified teams.",
    points: "points",

    group: "Group",
    home: "Home",
    away: "Away",
    yourPrediction: "Your prediction",

    predictedStandings: "Predicted standings",
    standings: "Standings",

    team: "Team",
    played: "P",
    won: "W",
    drawn: "D",
    lost: "L",
    goalsFor: "GF",
    goalsAgainst: "GA",
    goalDifference: "GD",

    pointsShort: "Pts",

    officialLabel: "Official",
    officialPending: "Pending",

    round32: "Round of 32",
    round16: "Round of 16",
    quarterfinals: "Quarterfinals",
    semifinals: "Semifinals",
    finalLabel: "Final",
    champion: "Champion",
    knockoutBracket: "Knockout bracket",
    realRound32: "Real Round of 32",
    yourKnockoutBracket: "Your knockout bracket",
    realBracketPending: "The real bracket will appear when the group stage is complete and the qualifiers are confirmed.",

    position: "Pos",
    status: "Status",
    qualified: "Qualified",
    eliminated: "Eliminated",
    bestThirdPlaced: "Best third-placed teams",
    bestThirdPlacedSubtitle: "The 8 best third-placed teams will advance to the Round of 32.",
  },
  pt: {
    appTitle: "Bolão Mundial 2026",
    groupStage: "Fase de grupos",
    language: "Idioma",

    participantData: "Dados do participante",
    name: "Nome",
    email: "Email",
    company: "Empresa",
    country: "País",

    totalPoints: "Pontos totais",
    dailyEvolution: "Evolução diária",

    scoringRules: "Sistema de pontuação",
    exactScoreRule: "Resultado exato",
    outcomeRule: "Resultado",
    homeGoalsRule: "Gols do mandante",
    awayGoalsRule: "Gols do visitante",
    scoringNote: "Os pontos da fase de grupos são acumulados por jogo. Os pontos do mata-mata serão dados por acertar os classificados.",
    points: "pontos",

    group: "Grupo",
    home: "Casa",
    away: "Visitante",
    yourPrediction: "Seu palpite",

    predictedStandings: "Classificação prevista",
    standings: "Classificação",

    team: "Equipe",
    played: "PJ",
    won: "V",
    drawn: "E",
    lost: "D",
    goalsFor: "GP",
    goalsAgainst: "GC",
    goalDifference: "SG",

    pointsShort: "Pts",

    officialLabel: "Oficial",
    officialPending: "Pendente",

    round32: "Round of 32",
    round16: "Oitavas",
    quarterfinals: "Quartas",
    semifinals: "Semis",
    finalLabel: "Final",
    champion: "Campeão",
    knockoutBracket: "Chave eliminatória",
    realRound32: "Round of 32 real",
    yourKnockoutBracket: "Sua chave eliminatória",
    realBracketPending: "Os confrontos reais aparecerão quando a fase de grupos terminar e os classificados estiverem definidos.",

    position: "Pos",
    status: "Status",
    qualified: "Classificado",
    eliminated: "Eliminado",
    bestThirdPlaced: "Melhores terceiros",
    bestThirdPlacedSubtitle: "Os 8 melhores terceiros avançam para a Round of 32.",
  },
};