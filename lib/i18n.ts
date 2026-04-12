
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

  welcomeTitle: string;
  welcomeSubtitle1: string;
  welcomeSubtitle2: string;
  accessCode: string;
  entryNumber: string;
  entryOne: string;
  entryTwo: string;
  accessPool: string;
  entering: string;

  authWelcome: string;
  login: string;
  register: string;
  password: string;
  confirmPassword: string;
  passwordsDoNotMatch: string;
  passwordMinLength: string;
  nameRequired: string;
  accessCodeRequired: string;
  invalidPoolCode: string;
  userCreationError: string;
  loading: string;

  entryCreationError: string;

  extras: {
    title: string;
    subtitle: string;

    first_goal_scorer_world: string;
    first_goal_scorer_spain: string;
    golden_boot: string;
    golden_ball: string;
    best_young_player: string;
    golden_glove: string;
    top_spanish_scorer: string;

    placeholder: string;
    help_best_young: string;
  };

  paymentStatus: {
    paid: string;
    pending: string;
  };
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
    scoringNote:
      "Los puntos de grupos se acumulan por partido. Los de eliminatorias se darán por acertar equipos clasificados.",
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
    realBracketPending:
      "Los cruces reales aparecerán cuando termine la fase de grupos.",

    position: "Pos",
    status: "Estado",
    qualified: "Clasificado",
    eliminated: "Eliminado",
    bestThirdPlaced: "Mejores terceros",
    bestThirdPlacedSubtitle:
      "Los 8 mejores terceros pasarán a la Round of 32.",

    welcomeTitle: "Bienvenidos a la Porra del Mundial 2026",
    welcomeSubtitle1:
      "Participa en la porra oficial y demuestra que sabes de fútbol.",
    welcomeSubtitle2:
      "Introduce tu email, el código de acceso y selecciona tu número de porra.",
    accessCode: "Código de acceso",
    entryNumber: "Número de porra",
    entryOne: "Porra 1",
    entryTwo: "Porra 2",
    accessPool: "Acceder a la porra",
    entering: "Entrando...",

    authWelcome:
      "Accede o regístrate para entrar en tu porra del Mundial 2026.",
    login: "Login",
    register: "Registro",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    passwordsDoNotMatch: "Las contraseñas no coinciden",
    passwordMinLength: "La contraseña debe tener al menos 6 caracteres",
    nameRequired: "El nombre es obligatorio",
    accessCodeRequired: "El código de porra es obligatorio",
    invalidPoolCode: "Código de porra inválido",
    userCreationError: "Error creando usuario",
    loading: "Cargando...",

    entryCreationError: "No se pudo crear la entrada",

    extras: {
      title: "Predicciones extra",
      subtitle: "Premios y goleadores del torneo",

      first_goal_scorer_world: "Primer goleador del Mundial",
      first_goal_scorer_spain: "Primer goleador de España",
      golden_boot: "Bota de Oro",
      golden_ball: "Balón de Oro",
      best_young_player: "Mejor jugador joven",
      golden_glove: "Guante de Oro",
      top_spanish_scorer: "Máximo goleador español",

      placeholder: "Escribe el nombre del jugador",
      help_best_young:
        "Jugador nacido a partir del 1 de enero de 2005 según criterio FIFA",
    },

    paymentStatus: {
      paid: "Pagado",
      pending: "Pendiente de pago",
    },
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
    homeGoalsRule: "Home goals",
    awayGoalsRule: "Away goals",
    scoringNote:
      "Group points per match. Knockout points for correctly predicting qualified teams.",
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
    yourKnockoutBracket: "Your bracket",
    realBracketPending: "Bracket appears after group stage.",

    position: "Pos",
    status: "Status",
    qualified: "Qualified",
    eliminated: "Eliminated",
    bestThirdPlaced: "Best thirds",
    bestThirdPlacedSubtitle: "Top 8 advance.",

    welcomeTitle: "Welcome to World Cup Pool",
    welcomeSubtitle1: "Join and prove your football knowledge.",
    welcomeSubtitle2: "Enter your data and access code.",
    accessCode: "Access code",
    entryNumber: "Entry number",
    entryOne: "Entry 1",
    entryTwo: "Entry 2",
    accessPool: "Enter",
    entering: "Entering...",

    authWelcome: "Login or register",
    login: "Login",
    register: "Register",
    password: "Password",
    confirmPassword: "Confirm password",
    passwordsDoNotMatch: "Passwords do not match",
    passwordMinLength: "Min 6 chars",
    nameRequired: "Name required",
    accessCodeRequired: "Code required",
    invalidPoolCode: "Invalid code",
    userCreationError: "User error",
    loading: "Loading...",

    entryCreationError: "Entry error",

    extras: {
      title: "Extra predictions",
      subtitle: "Awards and scorers",

      first_goal_scorer_world: "First scorer",
      first_goal_scorer_spain: "First Spain scorer",
      golden_boot: "Golden Boot",
      golden_ball: "Golden Ball",
      best_young_player: "Best young player",
      golden_glove: "Golden Glove",
      top_spanish_scorer: "Top Spanish scorer",

      placeholder: "Enter player name",
      help_best_young: "Born after Jan 1, 2005 (FIFA rule)",
    },

    paymentStatus: {
      paid: "Paid",
      pending: "Pending",
    },
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
    homeGoalsRule: "Gols casa",
    awayGoalsRule: "Gols fora",
    scoringNote: "Pontos por jogo e classificados.",
    points: "pontos",

    group: "Grupo",
    home: "Casa",
    away: "Visitante",
    yourPrediction: "Palpite",

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
    knockoutBracket: "Chave",
    realRound32: "Real",
    yourKnockoutBracket: "Sua chave",
    realBracketPending: "Aparece depois.",

    position: "Pos",
    status: "Status",
    qualified: "Classificado",
    eliminated: "Eliminado",
    bestThirdPlaced: "Melhores terceiros",
    bestThirdPlacedSubtitle: "Top 8 passam.",

    welcomeTitle: "Bem-vindo",
    welcomeSubtitle1: "Participe",
    welcomeSubtitle2: "Insira dados",
    accessCode: "Código",
    entryNumber: "Número",
    entryOne: "Aposta 1",
    entryTwo: "Aposta 2",
    accessPool: "Entrar",
    entering: "Entrando...",

    authWelcome: "Login",
    login: "Entrar",
    register: "Registro",
    password: "Senha",
    confirmPassword: "Confirmar",
    passwordsDoNotMatch: "Não coincidem",
    passwordMinLength: "Min 6",
    nameRequired: "Nome obrigatório",
    accessCodeRequired: "Código obrigatório",
    invalidPoolCode: "Código inválido",
    userCreationError: "Erro",
    loading: "Carregando...",

    entryCreationError: "Erro",

    extras: {
      title: "Previsões extra",
      subtitle: "Prêmios e gols",

      first_goal_scorer_world: "Primeiro gol",
      first_goal_scorer_spain: "Primeiro gol Espanha",
      golden_boot: "Chuteira de Ouro",
      golden_ball: "Bola de Ouro",
      best_young_player: "Melhor jovem",
      golden_glove: "Luva de Ouro",
      top_spanish_scorer: "Artilheiro espanhol",

      placeholder: "Nome do jogador",
      help_best_young: "Nascido após 01/01/2005",
    },

    paymentStatus: {
      paid: "Pago",
      pending: "Pendente",
    },
  },
};