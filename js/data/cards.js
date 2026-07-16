const makeQuantityVisual = (value) => ({
  groupSize: value <= 4 ? value : value < 10 ? 5 : 10,
  fullGroups: value <= 4 ? 1 : value < 10 ? 1 : Math.floor(value / 10),
  remainder: value <= 4 ? 0 : value < 10 ? value - 5 : value % 10,
});

const NUMBER_LEVELS = new Map([
  [11, 2],
  [12, 2],
  [15, 3],
  [20, 3],
]);

/** Immutable number-card definitions. Dealt cards receive a separate instanceId. */
export const NUMBER_CARDS = Object.freeze(
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20].map((value) =>
    Object.freeze({
      id: `number-${value}`,
      type: "number",
      value,
      labelKey: `number${value}`,
      quantityVisual: Object.freeze(makeQuantityVisual(value)),
      icon: "star",
      difficulty: NUMBER_LEVELS.get(value) ?? 1,
    }),
  ),
);

export const STRATEGY_CARDS = Object.freeze([
  Object.freeze({
    id: "swap-one",
    type: "strategy",
    action: "swap-one",
    labelKey: "strategyTrailSwapName",
    descriptionKey: "strategyTrailSwapDescription",
    icon: "swap",
    uses: 1,
    minimumDifficulty: 1,
  }),
  Object.freeze({
    id: "draw-extra",
    type: "strategy",
    action: "draw-extra-card",
    labelKey: "strategyExtraPocketName",
    descriptionKey: "strategyExtraPocketDescription",
    icon: "pocket",
    uses: 1,
    minimumDifficulty: 1,
  }),
  Object.freeze({
    id: "ask-clue",
    type: "strategy",
    action: "ask-clue",
    labelKey: "strategyClueCompassName",
    descriptionKey: "strategyClueCompassDescription",
    icon: "compass",
    uses: 1,
    minimumDifficulty: 1,
  }),
  Object.freeze({
    id: "echo-card",
    type: "strategy",
    action: "echo-card",
    labelKey: "strategyEchoCardName",
    descriptionKey: "strategyEchoCardDescription",
    icon: "echo",
    uses: 1,
    minimumDifficulty: 2,
    compatibleMissionTypes: Object.freeze([
      "target-number",
      "multiple-solutions",
      "open-ended",
      "compound-target",
    ]),
  }),
  Object.freeze({
    id: "nudge-target",
    type: "strategy",
    action: "nudge-target",
    labelKey: "strategyTargetNudgeName",
    descriptionKey: "strategyNudgeTargetDescription",
    icon: "target",
    uses: 1,
    minimumDifficulty: 3,
    compatibleMissionTypes: Object.freeze([
      "target-number",
      "multiple-solutions",
      "compound-target",
    ]),
  }),
]);

export const PUZZLE_CARD_ACTIVITIES = Object.freeze([
  Object.freeze({
    id: "pattern-next",
    type: "puzzle",
    activity: "pattern-next",
    labelKey: "puzzlePatternPath",
    icon: "pattern",
  }),
  Object.freeze({
    id: "match-equivalent",
    type: "puzzle",
    activity: "match-equivalent",
    labelKey: "puzzleQuantityBridge",
    icon: "bridge",
  }),
  Object.freeze({
    id: "odd-one-out",
    type: "puzzle",
    activity: "odd-one-out",
    labelKey: "puzzleOddTreasure",
    icon: "gem",
  }),
  Object.freeze({
    id: "compare-groups",
    type: "puzzle",
    activity: "comparison",
    labelKey: "puzzleBiggerBoat",
    icon: "boat",
  }),
]);

export const CARD_LIBRARY = Object.freeze([
  ...NUMBER_CARDS,
  ...STRATEGY_CARDS,
  ...PUZZLE_CARD_ACTIVITIES,
]);

export function getNumberCardByValue(value) {
  return NUMBER_CARDS.find((card) => card.value === Number(value)) ?? null;
}

export function getStrategyCardById(id) {
  return STRATEGY_CARDS.find((card) => card.id === id) ?? null;
}
