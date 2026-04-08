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
    
    welcomeTitle: "Bienvenidos a la Porra del Mundial 2026",
    welcomeSubtitle1: "Participa en la porra oficial y demuestra que sabes de fútbol.",
    welcomeSubtitle2: "Introduce tu email, el código de acceso y selecciona tu número de porra.",
    accessCode: "Código de acceso",
    entryNumber: "Número de porra",
    entryOne: "Porra 1",
    entryTwo: "Porra 2",
    accessPool: "Acceder a la porra",
    entering: "Entrando...",

    authWelcome: "Accede o regístrate para entrar en tu porra del Mundial 2026.",
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
    
    welcomeTitle: "Welcome to the World Cup 2026 Pool",
    welcomeSubtitle1: "Join the official pool and prove your football knowledge.",
    welcomeSubtitle2: "Enter your email, access code and choose your entry number.",
    accessCode: "Access code",
    entryNumber: "Entry number",
    entryOne: "Entry 1",
    entryTwo: "Entry 2",
    accessPool: "Enter the pool",
    entering: "Entering...",
    authWelcome: "Log in or register to enter your World Cup 2026 pool.",
    login: "Login",
    register: "Register",
    password: "Password",
    confirmPassword: "Confirm password",
    passwordsDoNotMatch: "Passwords do not match",
    passwordMinLength: "Password must be at least 6 characters long",
    nameRequired: "Name is required",
    accessCodeRequired: "Pool code is required",
    invalidPoolCode: "Invalid pool code",
    userCreationError: "Error creating user",
    loading: "Loading...",

    entryCreationError: "Could not create entry",

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
    
    welcomeTitle: "Bem-vindo ao Bolão da Copa do Mundo 2026",
    welcomeSubtitle1: "Participe do bolão oficial e mostre que entende de futebol.",
    welcomeSubtitle2: "Insira seu e-mail, código de acesso e escolha o número da sua aposta.",
    accessCode: "Código de acesso",
    entryNumber: "Número da aposta",
    entryOne: "Aposta 1",
    entryTwo: "Aposta 2",
    accessPool: "Entrar no bolão",
    entering: "Entrando...",

    authWelcome: "Entre ou registre-se para acessar seu bolão da Copa do Mundo 2026.",
    login: "Entrar",
    register: "Registro",
    password: "Senha",
    confirmPassword: "Confirmar senha",
    passwordsDoNotMatch: "As senhas não coincidem",
    passwordMinLength: "A senha deve ter pelo menos 6 caracteres",
    nameRequired: "O nome é obrigatório",
    accessCodeRequired: "O código do bolão é obrigatório",
    invalidPoolCode: "Código do bolão inválido",
    userCreationError: "Erro ao criar usuário",
    loading: "Carregando...",

    entryCreationError: "Não foi possível criar a entrada",
  },
};