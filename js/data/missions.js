import { LEVELS, WORLDS } from "./worlds.js";

export const LOCATIONS = Object.freeze(
  WORLDS.map((world) =>
    Object.freeze({
      id: world.id,
      labelKey: world.nameKey,
      descriptionKey: world.descriptionKey,
      icon: world.icon,
    }),
  ),
);

const freezeArray = (items) => Object.freeze([...items]);

const choice = (missionId, id, value, representation = "quantity") =>
  Object.freeze({
    id: `${missionId}-${id}`,
    type: "puzzle-choice",
    value,
    quantity: value,
    representation,
    labelKey: "generatedChoiceLabel",
  });

const choiceSet = (missionId, values, prefix = "choice") =>
  freezeArray(values.map((value, index) => choice(missionId, `${prefix}-${index + 1}`, value)));

const sharedMetadata = (level, missionIndex, templateId) => {
  const world = WORLDS.find((item) => item.id === level.worldId);
  return {
    worldId: level.worldId,
    levelId: level.id,
    missionIndex,
    location: level.worldId,
    difficulty: level.difficulty,
    templateId,
    xpReward: 10 + (level.difficulty - 1) * 2,
    bonusXp: 5,
    rewardId: level.rewardId,
    visualSupport: level.difficulty === 1,
    parentPromptKey: missionIndex % 2 === 0 ? "parentPromptAnotherWay" : "parentPromptWhyChoose",
    parentPromptParams: Object.freeze({ world: world?.nameKey ?? level.worldId }),
    cooperative: missionIndex === 4,
    strategyChallenge: level.difficulty >= 2 && missionIndex === 4,
    starCriteria: Object.freeze({
      completion: true,
      reasoningObjective: missionIndex === 4,
      limitedHints: level.difficulty >= 2 ? 1 : 2,
    }),
  };
};

function targetTemplate(id, level, missionIndex) {
  const target = 7 + ((level.globalOrder + missionIndex) % 3);
  return {
    id,
    ...sharedMetadata(level, missionIndex, "target-pair"),
    type: "target-number",
    titleKey: "generatedTargetMissionTitle",
    instructionKey: "generatedTargetMissionInstruction",
    instructionParams: Object.freeze({ target, count: 2 }),
    target,
    minimumCards: 2,
    maximumCards: 2,
    allowedOperations: freezeArray(["add"]),
    solutionsRequired: 1,
    allowMultipleSolutions: true,
    handSize: 6,
    fallbackHandValues: freezeArray([1, 2, 3, 4, 5, 6]),
    hintKeys: freezeArray(["hintLevelOne", "hintLevelTwo", "hintLevelThree"]),
  };
}

function multipleSolutionsTemplate(id, level, missionIndex) {
  return {
    id,
    ...sharedMetadata(level, missionIndex, "multiple-pairs"),
    type: "multiple-solutions",
    titleKey: "generatedMultipleMissionTitle",
    instructionKey: "generatedMultipleMissionInstruction",
    instructionParams: Object.freeze({ target: 7 }),
    target: 7,
    minimumCards: 2,
    maximumCards: 2,
    allowedOperations: freezeArray(["add"]),
    solutionsRequired: 2,
    allowMultipleSolutions: true,
    handSize: 6,
    fallbackHandValues: freezeArray([1, 2, 3, 4, 5, 6]),
    hintKeys: freezeArray(["hintTargetTwelve1", "hintLevelTwo", "hintLevelThree"]),
  };
}

function comparisonTemplate(id, level, missionIndex) {
  const comparison = (level.globalOrder + missionIndex) % 2 ? "larger" : "smaller";
  return {
    id,
    ...sharedMetadata(level, missionIndex, "compare-groups"),
    type: "comparison",
    titleKey: "generatedComparisonMissionTitle",
    instructionKey: comparison === "larger"
      ? "generatedChooseLargerInstruction"
      : "generatedChooseSmallerInstruction",
    comparison,
    minimumCards: 1,
    maximumCards: 1,
    choices: choiceSet(id, [3, 7], "group"),
    solutionsRequired: 1,
    hintKeys: freezeArray(["hintComparison1", "hintLevelTwo", "hintLevelThree"]),
  };
}

function patternTemplate(id, level, missionIndex) {
  const useAab = (level.globalOrder + missionIndex) % 2 === 0;
  const sequence = useAab ? [1, 1, 2, 1, 1, 2] : [2, 4, 2, 4];
  const answer = useAab ? 1 : 2;
  return {
    id,
    ...sharedMetadata(level, missionIndex, "repeating-pattern"),
    type: "pattern",
    titleKey: "generatedPatternMissionTitle",
    instructionKey: "generatedPatternMissionInstruction",
    sequence: freezeArray(sequence),
    validNextValues: freezeArray([answer]),
    minimumCards: 1,
    maximumCards: 1,
    choices: choiceSet(id, [answer, answer + 1, answer + 3], "pattern"),
    solutionsRequired: 1,
    hintKeys: freezeArray(["hintPattern1", "hintPattern2", "hintLevelThree"]),
  };
}

function classificationTemplate(id, level, missionIndex) {
  const greater = (level.globalOrder + missionIndex) % 2 === 0;
  return {
    id,
    ...sharedMetadata(level, missionIndex, "classify-numbers"),
    type: "classification",
    titleKey: "generatedClassificationMissionTitle",
    instructionKey: greater
      ? "generatedChooseAboveInstruction"
      : "generatedChooseBelowInstruction",
    instructionParams: Object.freeze({ value: greater ? 5 : 6 }),
    predicate: Object.freeze({
      operator: greater ? "greater-than" : "less-than",
      value: greater ? 5 : 6,
    }),
    selectionRule: "all-matching",
    minimumCards: 1,
    maximumCards: 4,
    solutionsRequired: 1,
    handSize: 4,
    fallbackHandValues: freezeArray([2, 4, 6, 8]),
    hintKeys: freezeArray(["hintClassification1", "hintLevelTwo", "hintLevelThree"]),
  };
}

function openEndedTemplate(id, level, missionIndex) {
  return {
    id,
    ...sharedMetadata(level, missionIndex, "open-range"),
    type: "open-ended",
    titleKey: "generatedOpenMissionTitle",
    instructionKey: "generatedOpenMissionInstruction",
    instructionParams: Object.freeze({ minimum: 6, maximum: 10 }),
    minimumTotal: 6,
    maximumTotal: 10,
    minimumCards: 2,
    maximumCards: 2,
    allowedOperations: freezeArray(["add"]),
    solutionsRequired: 1,
    allowMultipleSolutions: true,
    handSize: 6,
    fallbackHandValues: freezeArray([1, 2, 3, 4, 5, 6]),
    hintKeys: freezeArray(["hintOpenRange1", "hintLevelTwo", "hintLevelThree"]),
  };
}

function matchTemplate(id, level, missionIndex) {
  const targetQuantity = 5 + ((level.globalOrder + missionIndex) % 3);
  return {
    id,
    ...sharedMetadata(level, missionIndex, "match-quantity"),
    type: "match-equivalent",
    titleKey: "generatedMatchMissionTitle",
    instructionKey: "generatedMatchMissionInstruction",
    instructionParams: Object.freeze({ target: targetQuantity }),
    targetQuantity,
    minimumCards: 1,
    maximumCards: 1,
    choices: choiceSet(id, [targetQuantity - 1, targetQuantity, targetQuantity + 2], "quantity"),
    solutionsRequired: 1,
    hintKeys: freezeArray(["hintLevelOne", "hintLevelTwo", "hintLevelThree"]),
  };
}

function oddOneOutTemplate(id, level, missionIndex) {
  const choices = choiceSet(id, [2, 4, 7, 8], "treasure");
  return {
    id,
    ...sharedMetadata(level, missionIndex, "odd-one-out"),
    type: "odd-one-out",
    titleKey: "generatedOddMissionTitle",
    instructionKey: "generatedOddMissionInstruction",
    property: "only-odd",
    minimumCards: 1,
    maximumCards: 1,
    choices,
    oddChoiceId: choices[2].id,
    solutionsRequired: 1,
    hintKeys: freezeArray(["hintLevelOne", "hintLevelTwo", "hintLevelThree"]),
  };
}

function compoundTemplate(id, level, missionIndex) {
  return {
    id,
    ...sharedMetadata(level, missionIndex, "planned-total"),
    type: "compound-target",
    titleKey: "generatedPlanMissionTitle",
    instructionKey: "generatedPlanMissionInstruction",
    instructionParams: Object.freeze({ target: 12, threshold: 5 }),
    target: 12,
    minimumCards: 3,
    maximumCards: 3,
    allowedOperations: freezeArray(["add"]),
    propertyRequirement: Object.freeze({ operator: "some-greater-than", value: 5 }),
    targetRange: freezeArray([11, 13]),
    solutionsRequired: 1,
    allowMultipleSolutions: true,
    handSize: 6,
    fallbackHandValues: freezeArray([1, 2, 3, 4, 6, 7]),
    hintKeys: freezeArray(["hintLevelOne", "hintLevelTwo", "hintLevelThree"]),
  };
}

function sequenceTemplate(id, level, missionIndex) {
  const gap = (level.globalOrder + missionIndex) % 2 ? 1 : 2;
  return {
    id,
    ...sharedMetadata(level, missionIndex, "ordered-sequence"),
    type: "sequence-build",
    titleKey: "generatedSequenceMissionTitle",
    instructionKey: "generatedSequenceMissionInstruction",
    instructionParams: Object.freeze({ gap }),
    minimumCards: 3,
    maximumCards: 3,
    relationship: Object.freeze({ operator: "increase-by", value: gap }),
    solutionsRequired: 1,
    allowMultipleSolutions: true,
    handSize: 6,
    fallbackHandValues: freezeArray([1, 2, 3, 4, 5, 6]),
    hintKeys: freezeArray(["hintPattern1", "hintPattern2", "hintLevelThree"]),
  };
}

const TEMPLATES = Object.freeze({
  target: targetTemplate,
  multiple: multipleSolutionsTemplate,
  comparison: comparisonTemplate,
  pattern: patternTemplate,
  classification: classificationTemplate,
  open: openEndedTemplate,
  match: matchTemplate,
  odd: oddOneOutTemplate,
  compound: compoundTemplate,
  sequence: sequenceTemplate,
});

const WORLD_TEMPLATE_ROTATIONS = Object.freeze({
  "number-forest": freezeArray(["target", "multiple", "classification", "open", "comparison"]),
  "pattern-cave": freezeArray(["pattern", "sequence", "odd", "classification", "open"]),
  "shape-river": freezeArray(["comparison", "match", "classification", "pattern", "sequence"]),
  "logic-mountain": freezeArray(["compound", "sequence", "comparison", "classification", "target"]),
  "treasure-camp": freezeArray(["multiple", "open", "compound", "pattern", "odd", "sequence", "match", "classification"]),
});

function specialLegacyMission(id, level, missionIndex) {
  if (id === "target-10-two") {
    return {
      ...multipleSolutionsTemplate(id, level, missionIndex),
      type: "target-number",
      templateId: "legacy-target-ten",
      titleKey: "missionTargetTenTitle",
      instructionKey: "missionTargetTenInstruction",
      target: 10,
      fallbackHandValues: freezeArray([2, 3, 4, 6, 7, 8]),
      hintKeys: freezeArray(["hintTargetTen1", "hintTargetTen2", "hintLevelThree"]),
    };
  }
  if (id === "target-12-two-ways") {
    return {
      ...multipleSolutionsTemplate(id, level, missionIndex),
      templateId: "legacy-target-twelve",
      titleKey: "missionTargetTwelveTitle",
      instructionKey: "missionTargetTwelveInstruction",
      target: 12,
      fallbackHandValues: freezeArray([3, 4, 5, 7, 8, 9]),
      hintKeys: freezeArray(["hintTargetTwelve1", "hintLevelTwo", "hintLevelThree"]),
    };
  }
  return null;
}

const buildMissions = () => {
  const missions = [];
  for (const level of LEVELS) {
    const rotation = WORLD_TEMPLATE_ROTATIONS[level.worldId];
    level.missionIds.forEach((id, offset) => {
      const missionIndex = offset + 1;
      const legacyMission = specialLegacyMission(id, level, missionIndex);
      const templateName = rotation[(level.order + offset - 1) % rotation.length];
      const definition = legacyMission ?? TEMPLATES[templateName](id, level, missionIndex);
      missions.push(Object.freeze(definition));
    });
  }
  return Object.freeze(missions);
};

export const MISSIONS = buildMissions();

export const LEGACY_MISSION_ID_MAP = Object.freeze({
  "target-10-two": "target-10-two",
  "compare-big-group": "shape-river-level-01-mission-1",
  "classify-under-6": "number-forest-level-01-mission-2",
  "pattern-ab-next": "pattern-cave-level-01-mission-1",
  "match-seven": "shape-river-level-01-mission-2",
  "target-12-two-ways": "target-12-two-ways",
  "open-8-to-12": "number-forest-level-01-mission-4",
  "pattern-growing": "pattern-cave-level-02-mission-1",
  "odd-even-treasure": "pattern-cave-level-01-mission-3",
  "target-15-flex": "number-forest-level-02-mission-1",
  "three-step-14": "logic-mountain-level-01-mission-1",
  "ordered-gap-two": "pattern-cave-level-01-mission-2",
  "target-9-two-ways": "logic-mountain-level-02-mission-1",
  "compare-small-group": "logic-mountain-level-01-mission-3",
  "classify-above-5": "logic-mountain-level-01-mission-4",
  "pattern-aab-next": "treasure-camp-level-01-mission-4",
  "open-10-to-15": "treasure-camp-level-01-mission-2",
  "ordered-gap-one": "treasure-camp-level-01-mission-3",
});

export const SAFE_FALLBACK_MISSION_ID = "target-10-two";

export function getMissionById(id) {
  const migratedId = LEGACY_MISSION_ID_MAP[id] ?? id;
  return MISSIONS.find((mission) => mission.id === migratedId) ?? null;
}

export function getMissionsForLevel(levelId) {
  return MISSIONS.filter((mission) => mission.levelId === levelId);
}

export function getMissionsForLocation(location, difficulty = 1) {
  const normalizedDifficulty = Math.min(3, Math.max(1, Number(difficulty) || 1));
  return MISSIONS.filter(
    (mission) => mission.location === location && mission.difficulty <= normalizedDifficulty,
  );
}
