export type ExtraQuestionKey =
  | "first_goal_scorer_world"
  | "first_goal_scorer_spain"
  | "golden_boot"
  | "golden_ball"
  | "best_young_player"
  | "golden_glove"
  | "top_spanish_scorer";

export type ExtraQuestion = {
  key: ExtraQuestionKey;
  pointsKey:
    | "firstGoalScorerWorldPoints"
    | "firstGoalScorerSpainPoints"
    | "goldenBootPoints"
    | "goldenBallPoints"
    | "bestYoungPlayerPoints"
    | "goldenGlovePoints"
    | "topSpanishScorerPoints";
  showInGroupStandings: boolean;
  icon: string;
};

export const EXTRA_QUESTIONS: ExtraQuestion[] = [
  {
    key: "first_goal_scorer_world",
    pointsKey: "firstGoalScorerWorldPoints",
    showInGroupStandings: true,
    icon: "🥇⚽",
  },
  {
    key: "first_goal_scorer_spain",
    pointsKey: "firstGoalScorerSpainPoints",
    showInGroupStandings: true,
    icon: "🇪🇸⚽",
  },
  {
    key: "golden_boot",
    pointsKey: "goldenBootPoints",
    showInGroupStandings: false,
    icon: "👟✨",
  },
  {
    key: "golden_ball",
    pointsKey: "goldenBallPoints",
    showInGroupStandings: false,
    icon: "🏆🌟",
  },
  {
    key: "best_young_player",
    pointsKey: "bestYoungPlayerPoints",
    showInGroupStandings: false,
    icon: "🧒🔥",
  },
  {
    key: "golden_glove",
    pointsKey: "goldenGlovePoints",
    showInGroupStandings: false,
    icon: "🧤🥇",
  },
  {
    key: "top_spanish_scorer",
    pointsKey: "topSpanishScorerPoints",
    showInGroupStandings: false,
    icon: "🇪🇸🎯",
  },
];
