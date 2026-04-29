
export type Locale = "es" | "en" | "pt";

export type Messages = {
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
  entryStatusDraft: string;
entryStatusSubmitted: string;

welcomeUser: string;

saveEntry: string;
savingEntry: string;
submitEntry: string;
submittingEntry: string;
entrySubmitted: string;
logout: string;

selectedEntryNotFound: string;
loadEntryError: string;
loadStandingsError: string;
noActiveEntry: string;
entrySaved: string;
saveEntryError: string;
activeEntryNotFound: string;
predictionIncomplete: string;
submitEntryConfirm: string;
submitEntrySuccess: string;
submitEntryError: string;
loadingPool: string;

deadlinePassed: string;
editingDisabled: string;

classificationSummary: string;
top3AndLast: string;
classificationQuickView: string;
lastUpdate: string;
viewStats: string;
viewFullStandings: string;
top3: string;
loadingStandings: string;
noStandingsYet: string;
lastPlace: string;
positionLabel: string;

groupStageSection: string;
matchesChronological: string;
matchTableInfoHeader: string;
predictionHeader: string;
pointsHeader: string;

groupStandingsSection: string;
groupStandingsUpdated: string;

extraQuestionsRulesTitle: string;
extraQuestionsRulesSubtitle: string;

playerFallback: string;

standingsTitle: string;
standingsSubtitle: string;
standingsBackToPool: string;
standingsMissingPoolId: string;
standingsTabGeneral: string;
standingsColVariation: string;
standingsColAccuracy: string;
standingsColTotalMatchdays: string;
standingsColFirstGoalWorld: string;
standingsColFirstGoalSpain: string;
standingsColTotalGroups: string;
standingsColOutcomeHits: string;
standingsColOutcomePercent: string;
standingsColExactHits: string;
standingsColExactPercent: string;
  standingsColKoPrecision: string;
  standingsColKoHits: string;
  standingsColKoPercent: string;
  standingsColKoFinal: string;
standingsColFirstGoalWorldLong: string;
standingsColFirstGoalSpainLong: string;
standingsColGoldenBoot: string;
standingsColGoldenBall: string;
standingsColBestYoungPlayer: string;
standingsColGoldenGlove: string;
standingsColTopSpanishScorer: string;
standingsColTotal: string;
standingsColGroups: string;

transparencyEyebrow: string;
transparencyTitle: string;
transparencySubtitle: string;
transparencyLoading: string;
transparencyNoData: string;
transparencyParticipantLabel: string;
transparencyGroupStageSubtitle: string;
transparencyStandingsSubtitle: string;
transparencyExtraSubtitle: string;
transparencyOfficialLabel: string;
transparencyMatchDateHeader: string;
transparencyKnockoutSubtitle: string;

classificationCardTitle: string;
classificationMovementLabel: string;
classificationPending: string;
  countdownLabel: string;
matchLabel: string;
undefinedLabel: string;
invalidLabel: string;
leftSideLabel: string;
rightSideLabel: string;
forgotPassword: string;
forgotPasswordNeedEmail: string;
forgotPasswordEmailSent: string;
updatePasswordTitle: string;
newPassword: string;
updatePasswordButton: string;
updatePasswordSuccess: string;
stats: {
  sectionEyebrow: string;
  title: string;
  subtitle: string;

  viewStandings: string;
  viewTransparency: string;
  backToPrediction: string;

  participants: string;
  countries: string;
  potTotal: string;
  prizes: string;

  firstPlace: string;
  secondPlace: string;
  thirdPlace: string;
  lastPlace: string;

  championFavorites: string;
  poolInsights: string;

  loading: string;
  missingPoolId: string;
  loadError: string;
  noData: string;
  notEnoughData: string;
  notEnoughInsights: string;

  picksLabel: string;
  picksUnit: string;
  others: string;
  noAnswer: string;
  insightsTitle: string;
};
banquillo: {
  eyebrow: string;
  title: string;
  subtitle: string;
  newPostTitle: string;
  newCommentPlaceholder: string;
  replyPlaceholder: string;
  send: string;
  sendReply: string;
  sending: string;
  reply: string;
  cancel: string;
  noMessages: string;
  loading: string;
  reload: string;
  errorLoading: string;
  writeSomething: string;
  writeReplySomething: string;
  responses: string;
  pinned: string;
  showReplies: string;
  hideReplies: string;
  backToPrediction: string;
  backToStats: string;
  participantFallback: string;
  reactionError: string;
  postCommentError: string;
  postReplyError: string;
  missingPoolId: string;
};
};



export const messages: Record<Locale, Messages> = {
  es: {
    appTitle: "Porra Mundial 2026",
    groupStage: "Fase de grupos",
    language: "Idioma",

    participantData: "Datos del participante",
    name: "Nombre completo",
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
  entryStatusDraft: "Borrador",
entryStatusSubmitted: "Enviada",

welcomeUser: "Bienvenido",

saveEntry: "Guardar porra",
savingEntry: "Guardando...",
submitEntry: "Enviar porra",
submittingEntry: "Enviando...",
entrySubmitted: "Porra enviada",
logout: "Cerrar sesión",

selectedEntryNotFound: "No se ha encontrado la porra seleccionada.",
loadEntryError: "Error cargando la porra.",
loadStandingsError: "Error cargando clasificación",
noActiveEntry: "No hay entry activa.",
entrySaved: "Porra guardada correctamente.",
saveEntryError: "Error guardando la porra.",
activeEntryNotFound: "No se ha encontrado la entry activa.",
predictionIncomplete: "Tienes que completar toda la porra antes de enviarla.",
submitEntryConfirm: "¿Seguro que quieres enviar la porra? Después no podrás modificarla.",
submitEntrySuccess: "Porra enviada correctamente.",
submitEntryError: "Error al enviar la porra.",
loadingPool: "Cargando porra...",

deadlinePassed: "El plazo de envío de esta porra ha terminado.",
editingDisabled: "La edición de la porra está desactivada.",

classificationSummary: "Resumen clasificación",
top3AndLast: "Top 3 y último puesto",
classificationQuickView: "Consulta rápida de la clasificación general actual.",
lastUpdate: "Última actualización",
viewStats: "Ver estadísticas",
viewFullStandings: "Ver clasificación completa",
top3: "Top 3",
loadingStandings: "Cargando clasificación...",
noStandingsYet: "No hay clasificación disponible todavía.",
lastPlace: "Último",
positionLabel: "Puesto",

groupStageSection: "Fase de grupos",
matchesChronological: "Partidos en orden cronológico.",
matchTableInfoHeader: "J / G / Fecha",
predictionHeader: "Pronóstico",
pointsHeader: "Puntos",

groupStandingsSection: "Clasificaciones",
groupStandingsUpdated: "Clasificación actualizada por grupo.",

extraQuestionsRulesTitle: "Preguntas extra",
extraQuestionsRulesSubtitle: "Puntuación de premios individuales y goleadores.",

playerFallback: "Jugador",

standingsTitle: "Clasificación Porra Mundial 2026",
standingsSubtitle: "Consulta la clasificación por jornadas de grupos o la clasificación general acumulada.",
standingsBackToPool: "Volver a la porra",
standingsMissingPoolId: "Falta el poolId en la URL.",
standingsTabGeneral: "General",
standingsColVariation: "Variación",
standingsColAccuracy: "Precisión",
standingsColTotalMatchdays: "Total jornadas",
standingsColFirstGoalWorld: "1º gol",
standingsColFirstGoalSpain: "1º gol España",
standingsColTotalGroups: "Total grupos",
standingsColOutcomeHits: "Aciertos",
standingsColOutcomePercent: "% acierto",
standingsColExactHits: "Exactos",
standingsColExactPercent: "% exacto",
  standingsColKoPrecision: "Precisión KO",
  standingsColKoHits: "Aciertos KO",
  standingsColKoPercent: "% KO",
  standingsColKoFinal: "Final",
standingsColFirstGoalWorldLong: "Primer goleador",
standingsColFirstGoalSpainLong: "Primer goleador de España",
standingsColGoldenBoot: "Bota de Oro",
standingsColGoldenBall: "Balón de Oro",
standingsColBestYoungPlayer: "Mejor jugador joven",
standingsColGoldenGlove: "Guante de Oro",
standingsColTopSpanishScorer: "Máximo goleador de España",
standingsColTotal: "Total",
standingsColGroups: "Grupos",

transparencyEyebrow: "Transparencia total",
transparencyTitle: "Predicciones por participante",
transparencySubtitle: "Consulta una porra enviada completa: fase de grupos, clasificaciones, knockout y preguntas extra.",
transparencyLoading: "Cargando transparencia...",
transparencyNoData: "No hay datos disponibles.",
transparencyParticipantLabel: "Participante",
transparencyGroupStageSubtitle: "Pronósticos del participante en orden cronológico.",
transparencyStandingsSubtitle: "Clasificación proyectada por grupo.",
transparencyExtraSubtitle: "Respuestas enviadas por este participante.",
transparencyOfficialLabel: "Oficial",
transparencyMatchDateHeader: "J / G / Fecha",
transparencyKnockoutSubtitle: "Predicción enviada por este participante",

classificationCardTitle: "Clasificación",
classificationMovementLabel: "Variación respecto a la última clasificación",
classificationPending: "Pendiente de inicio",
  countdownLabel: "🔒 Cierre porra|⚽ Inicio del Mundial",
matchLabel: "Partido",
undefinedLabel: "Por definir",
invalidLabel: "Inválido",
leftSideLabel: "Lado izquierdo",
rightSideLabel: "Lado derecho",
forgotPassword: "¿Olvidaste tu contraseña?",
forgotPasswordNeedEmail: "Introduce tu email para recuperar la contraseña.",
forgotPasswordEmailSent: "Te hemos enviado un email para restablecer la contraseña.",
updatePasswordTitle: "Nueva contraseña",
newPassword: "Nueva contraseña",
updatePasswordButton: "Cambiar contraseña",
updatePasswordSuccess: "Contraseña actualizada correctamente.",
stats: {
  sectionEyebrow: "Estadísticas del pool",
  title: "Porra Mundial 2026",
  subtitle: "Transparencia y tendencias del pool.",

  viewStandings: "Ver clasificación",
  viewTransparency: "Ver predicciones por participante",
  backToPrediction: "Volver a la porra",

  participants: "Participantes",
  countries: "Países",
  potTotal: "Bote total",
  prizes: "Premios",

  firstPlace: "1º",
  secondPlace: "2º",
  thirdPlace: "3º",
  lastPlace: "Último",

  championFavorites: "Favoritos al campeón",
  poolInsights: "Insights del pool",

  loading: "Cargando estadísticas...",
  missingPoolId: "Falta el poolId.",
  loadError: "No se pudieron cargar las estadísticas.",
  noData: "No hay datos disponibles.",
  notEnoughData: "Todavía no hay datos suficientes.",
  notEnoughInsights: "Todavía no hay suficientes datos para generar insights.",

  picksLabel: "Pronósticos",
  picksUnit: "pronósticos",
  others: "Otros",
  noAnswer: "Sin respuesta",
  insightsTitle: "Insights del pool",
},
banquillo: {
  eyebrow: "Comunidad",
  title: "La Grada",
  subtitle: "Comentarios, respuestas y reacciones entre participantes.",
  newPostTitle: "Nuevo comentario",
  newCommentPlaceholder: "Escribe un comentario para el pool...",
  replyPlaceholder: "Escribe una respuesta...",
  send: "Enviar",
  sendReply: "Enviar respuesta",
  sending: "Enviando...",
  reply: "Responder",
  cancel: "Cancelar",
  noMessages: "Todavía no hay comentarios. Sé el primero en escribir algo.",
  loading: "Cargando La Grada...",
  reload: "Recargar",
  errorLoading: "No se pudo cargar La Grada.",
  writeSomething: "Escribe algo antes de enviar.",
  writeReplySomething: "Escribe una respuesta antes de enviarla.",
  responses: "respuestas",
  pinned: "Destacado",
  showReplies: "Ver todas",
  hideReplies: "Ocultar",
  backToPrediction: "Volver a la porra",
  backToStats: "Volver a estadísticas",
  participantFallback: "Participante",
  reactionError: "No se pudo guardar la reacción.",
  postCommentError: "No se pudo publicar el comentario.",
  postReplyError: "No se pudo publicar la respuesta.",
  missingPoolId: "Falta el poolId.",
},

  },

  en: {
    appTitle: "World Cup Pool 2026",
    groupStage: "Group stage",
    language: "Language",

    participantData: "Participant data",
    name: "Full name",
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
    entryStatusDraft: "Draft",
entryStatusSubmitted: "Submitted",

welcomeUser: "Welcome",

saveEntry: "Save entry",
savingEntry: "Saving...",
submitEntry: "Submit entry",
submittingEntry: "Submitting...",
entrySubmitted: "Entry submitted",
logout: "Log out",

selectedEntryNotFound: "Selected entry was not found.",
loadEntryError: "Error loading entry.",
loadStandingsError: "Error loading standings",
noActiveEntry: "No active entry.",
entrySaved: "Entry saved successfully.",
saveEntryError: "Error saving entry.",
activeEntryNotFound: "Active entry was not found.",
predictionIncomplete: "You must complete the whole entry before submitting.",
submitEntryConfirm: "Are you sure you want to submit your entry? You will not be able to edit it afterwards.",
submitEntrySuccess: "Entry submitted successfully.",
submitEntryError: "Error submitting entry.",
loadingPool: "Loading entry...",

deadlinePassed: "The submission deadline for this pool has passed.",
editingDisabled: "Entry editing is disabled.",

classificationSummary: "Standings summary",
top3AndLast: "Top 3 and last place",
classificationQuickView: "Quick view of the current overall standings.",
lastUpdate: "Last update",
viewStats: "View stats",
viewFullStandings: "View full standings",
top3: "Top 3",
loadingStandings: "Loading standings...",
noStandingsYet: "No standings available yet.",
lastPlace: "Last place",
positionLabel: "Position",

groupStageSection: "Group stage",
matchesChronological: "Matches in chronological order.",
matchTableInfoHeader: "D / G / Date",
predictionHeader: "Prediction",
pointsHeader: "Points",

groupStandingsSection: "Standings",
groupStandingsUpdated: "Updated standings by group.",

extraQuestionsRulesTitle: "Extra questions",
extraQuestionsRulesSubtitle: "Scoring for individual awards and scorers.",

playerFallback: "Player",

standingsTitle: "World Cup Pool 2026 Standings",
standingsSubtitle: "Check the standings by matchday or the overall accumulated standings.",
standingsBackToPool: "Back to pool",
standingsMissingPoolId: "Missing poolId in URL.",
standingsTabGeneral: "Overall",
standingsColVariation: "Change",
standingsColAccuracy: "Accuracy",
standingsColTotalMatchdays: "Total matchdays",
standingsColFirstGoalWorld: "1st goal",
standingsColFirstGoalSpain: "1st goal Spain",
standingsColTotalGroups: "Group total",
standingsColOutcomeHits: "Outcomes",
standingsColOutcomePercent: "% outcome",
standingsColExactHits: "Exact",
standingsColExactPercent: "% exact",
  standingsColKoPrecision: "KO Precision",
  standingsColKoHits: "KO Hits",
  standingsColKoPercent: "KO %",
  standingsColKoFinal: "Final",
standingsColFirstGoalWorldLong: "First scorer",
standingsColFirstGoalSpainLong: "First scorer Spain",
standingsColGoldenBoot: "Golden Boot",
standingsColGoldenBall: "Golden Ball",
standingsColBestYoungPlayer: "Best young player",
standingsColGoldenGlove: "Golden Glove",
standingsColTopSpanishScorer: "Top Spanish scorer",
standingsColTotal: "Total",
standingsColGroups: "Groups",

transparencyEyebrow: "Full transparency",
transparencyTitle: "Predictions by participant",
transparencySubtitle: "View a complete submitted entry: group stage, standings, knockout and extra questions.",
transparencyLoading: "Loading transparency...",
transparencyNoData: "No data available.",
transparencyParticipantLabel: "Participant",
transparencyGroupStageSubtitle: "Participant's predictions in chronological order.",
transparencyStandingsSubtitle: "Projected standings by group.",
transparencyExtraSubtitle: "Answers submitted by this participant.",
transparencyOfficialLabel: "Official",
transparencyMatchDateHeader: "MD / G / Date",
transparencyKnockoutSubtitle: "Prediction submitted by this participant",

classificationCardTitle: "Standings",
classificationMovementLabel: "Change compared to the latest standings",
classificationPending: "Pending start",
  countdownLabel: "🔒 Entry deadline|⚽ World Cup kickoff",
matchLabel: "Match",
undefinedLabel: "To be decided",
invalidLabel: "Invalid",
leftSideLabel: "Left side",
rightSideLabel: "Right side",
forgotPassword: "Forgot your password?",
forgotPasswordNeedEmail: "Enter your email to recover your password.",
forgotPasswordEmailSent: "We have sent you an email to reset your password.",
updatePasswordTitle: "New password",
newPassword: "New password",
updatePasswordButton: "Change password",
updatePasswordSuccess: "Password updated successfully.",
stats: {
  sectionEyebrow: "Pool stats",
  title: "World Cup Pool 2026",
  subtitle: "Pool transparency and trends.",

  viewStandings: "View standings",
  viewTransparency: "View participant predictions",
  backToPrediction: "Back to prediction",

  participants: "Participants",
  countries: "Countries",
  potTotal: "Prize pot",
  prizes: "Prizes",

  firstPlace: "1st",
  secondPlace: "2nd",
  thirdPlace: "3rd",
  lastPlace: "Last place",

  championFavorites: "Champion favorites",
  poolInsights: "Pool insights",

  loading: "Loading stats...",
  missingPoolId: "Missing poolId.",
  loadError: "Stats could not be loaded.",
  noData: "No data available.",
  notEnoughData: "There is not enough data yet.",
  notEnoughInsights: "There is not enough data yet to generate insights.",

  picksLabel: "Picks",
  picksUnit: "picks",
  others: "Others",
  noAnswer: "No answer",
  insightsTitle: "Pool insights",
},
banquillo: {
  eyebrow: "Community",
  title: "Fan Zone",
  subtitle: "Comments, replies and reactions between participants.",
  newPostTitle: "New comment",
  newCommentPlaceholder: "Write a comment for the pool...",
  replyPlaceholder: "Write a reply...",
  send: "Send",
  sendReply: "Send reply",
  sending: "Sending...",
  reply: "Reply",
  cancel: "Cancel",
  noMessages: "There are no comments yet. Be the first to post something.",
  loading: "Loading Fan Zone...",
  reload: "Reload",
  errorLoading: "The Fan Zone could not be loaded.",
  writeSomething: "Write something before sending.",
  writeReplySomething: "Write a reply before sending it.",
  responses: "replies",
  pinned: "Pinned",
  showReplies: "View all",
  hideReplies: "Hide",
  backToPrediction: "Back to prediction",
  backToStats: "Back to stats",
  participantFallback: "Participant",
  reactionError: "The reaction could not be saved.",
  postCommentError: "The comment could not be posted.",
  postReplyError: "The reply could not be posted.",
  missingPoolId: "Missing poolId.",
},

  },

  pt: {
    appTitle: "Bolão Mundial 2026",
    groupStage: "Fase de grupos",
    language: "Idioma",

    participantData: "Dados do participante",
    name: "Nome completo",
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
  entryStatusDraft: "Rascunho",
entryStatusSubmitted: "Enviada",

welcomeUser: "Bem-vindo",

saveEntry: "Salvar bolão",
savingEntry: "Salvando...",
submitEntry: "Enviar bolão",
submittingEntry: "Enviando...",
entrySubmitted: "Bolão enviado",
logout: "Sair",

selectedEntryNotFound: "Não foi possível encontrar o bolão selecionado.",
loadEntryError: "Erro ao carregar o bolão.",
loadStandingsError: "Erro ao carregar a classificação",
noActiveEntry: "Não há entry ativa.",
entrySaved: "Bolão salvo com sucesso.",
saveEntryError: "Erro ao salvar o bolão.",
activeEntryNotFound: "Não foi possível encontrar a entry ativa.",
predictionIncomplete: "Você precisa completar todo o bolão antes de enviá-lo.",
submitEntryConfirm: "Tem certeza de que deseja enviar o bolão? Depois disso não poderá modificá-lo.",
submitEntrySuccess: "Bolão enviado com sucesso.",
submitEntryError: "Erro ao enviar o bolão.",
loadingPool: "Carregando bolão...",

deadlinePassed: "O prazo de envio deste bolão terminou.",
editingDisabled: "A edição do bolão está desativada.",

classificationSummary: "Resumo da classificação",
top3AndLast: "Top 3 e último lugar",
classificationQuickView: "Visão rápida da classificação geral atual.",
lastUpdate: "Última atualização",
viewStats: "Ver estatísticas",
viewFullStandings: "Ver classificação completa",
top3: "Top 3",
loadingStandings: "Carregando classificação...",
noStandingsYet: "Ainda não há classificação disponível.",
lastPlace: "Último",
positionLabel: "Posição",

groupStageSection: "Fase de grupos",
matchesChronological: "Partidas em ordem cronológica.",
matchTableInfoHeader: "R / G / Data",
predictionHeader: "Palpite",
pointsHeader: "Pontos",

groupStandingsSection: "Classificações",
groupStandingsUpdated: "Classificação atualizada por grupo.",

extraQuestionsRulesTitle: "Perguntas extras",
extraQuestionsRulesSubtitle: "Pontuação de prêmios individuais e artilheiros.",

playerFallback: "Jogador",

standingsTitle: "Classificação Bolão Mundial 2026",
standingsSubtitle: "Consulte a classificação por jornadas de grupos ou a classificação geral acumulada.",
standingsBackToPool: "Voltar ao bolão",
standingsMissingPoolId: "Falta o poolId na URL.",
standingsTabGeneral: "Geral",
standingsColVariation: "Variação",
standingsColAccuracy: "Precisão",
standingsColTotalMatchdays: "Total jornadas",
standingsColFirstGoalWorld: "1º gol",
standingsColFirstGoalSpain: "1º gol Espanha",
standingsColTotalGroups: "Total grupos",
standingsColOutcomeHits: "Acertos",
standingsColOutcomePercent: "% acerto",
standingsColExactHits: "Exatos",
standingsColExactPercent: "% exato",
  standingsColKoPrecision: "Precisão KO",
  standingsColKoHits: "Acertos KO",
  standingsColKoPercent: "% KO",
  standingsColKoFinal: "Final",
standingsColFirstGoalWorldLong: "Primeiro goleador",
standingsColFirstGoalSpainLong: "Primeiro goleador Espanha",
standingsColGoldenBoot: "Chuteira de Ouro",
standingsColGoldenBall: "Bola de Ouro",
standingsColBestYoungPlayer: "Melhor jovem",
standingsColGoldenGlove: "Luva de Ouro",
standingsColTopSpanishScorer: "Maior goleador espanhol",
standingsColTotal: "Total",
standingsColGroups: "Grupos",

transparencyEyebrow: "Transparência total",
transparencyTitle: "Palpites por participante",
transparencySubtitle: "Consulte um bolão enviado completo: fase de grupos, classificações, knockout e perguntas extras.",
transparencyLoading: "Carregando transparência...",
transparencyNoData: "Não há dados disponíveis.",
transparencyParticipantLabel: "Participante",
transparencyGroupStageSubtitle: "Palpites do participante em ordem cronológica.",
transparencyStandingsSubtitle: "Classificação projetada por grupo.",
transparencyExtraSubtitle: "Respostas enviadas por este participante.",
transparencyOfficialLabel: "Oficial",
transparencyMatchDateHeader: "J / G / Data",
transparencyKnockoutSubtitle: "Palpite enviado por este participante",

classificationCardTitle: "Classificação",
classificationMovementLabel: "Variação em relação à última classificação",
classificationPending: "Aguardando início",
  countdownLabel: "🔒 Fecho palpite|⚽ Início do Mundial",
matchLabel: "Partida",
undefinedLabel: "Por definir",
invalidLabel: "Inválido",
leftSideLabel: "Lado esquerdo",
rightSideLabel: "Lado direito",
forgotPassword: "Esqueceu a sua senha?",
forgotPasswordNeedEmail: "Introduza o seu email para recuperar a senha.",
forgotPasswordEmailSent: "Enviámos um email para redefinir a sua senha.",
updatePasswordTitle: "Nova senha",
newPassword: "Nova senha",
updatePasswordButton: "Alterar senha",
updatePasswordSuccess: "Senha atualizada com sucesso.",
stats: {
  sectionEyebrow: "Estatísticas do bolão",
  title: "Bolão Mundial 2026",
  subtitle: "Transparência e tendências do bolão.",

  viewStandings: "Ver classificação",
  viewTransparency: "Ver palpites por participante",
  backToPrediction: "Voltar ao bolão",

  participants: "Participantes",
  countries: "Países",
  potTotal: "Bolo total",
  prizes: "Prêmios",

  firstPlace: "1º",
  secondPlace: "2º",
  thirdPlace: "3º",
  lastPlace: "Último",

  championFavorites: "Favoritos ao título",
  poolInsights: "Insights do bolão",

  loading: "Carregando estatísticas...",
  missingPoolId: "Falta o poolId.",
  loadError: "Não foi possível carregar as estatísticas.",
  noData: "Não há dados disponíveis.",
  notEnoughData: "Ainda não há dados suficientes.",
  notEnoughInsights: "Ainda não há dados suficientes para gerar insights.",

  picksLabel: "Palpites",
  picksUnit: "palpites",
  others: "Outros",
  noAnswer: "Sem resposta",
  insightsTitle: "Insights do bolão",
},
banquillo: {
  eyebrow: "Comunidade",
  title: "Zona de Adeptos",
  subtitle: "Comentários, respostas e reações entre participantes.",
  newPostTitle: "Novo comentário",
  newCommentPlaceholder: "Escreva um comentário para o bolão...",
  replyPlaceholder: "Escreva uma resposta...",
  send: "Enviar",
  sendReply: "Enviar resposta",
  sending: "Enviando...",
  reply: "Responder",
  cancel: "Cancelar",
  noMessages: "Ainda não há comentários. Seja o primeiro a escrever algo.",
  loading: "Carregando Zona de Adeptos...",
  reload: "Recarregar",
  errorLoading: "Não foi possível carregar Zona de Adeptos.",
  writeSomething: "Escreva algo antes de enviar.",
  writeReplySomething: "Escreva uma resposta antes de enviá-la.",
  responses: "respostas",
  pinned: "Destacado",
  showReplies: "Ver todas",
  hideReplies: "Ocultar",
  backToPrediction: "Voltar ao bolão",
  backToStats: "Voltar às estatísticas",
  participantFallback: "Participante",
  reactionError: "Não foi possível salvar a reação.",
  postCommentError: "Não foi possível publicar o comentário.",
  postReplyError: "Não foi possível publicar a resposta.",
  missingPoolId: "Falta o poolId.",
},

  },
};