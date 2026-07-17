const LEVEL_COUNTS = Object.freeze({
  "number-forest": 8,
  "pattern-cave": 8,
  "shape-river": 8,
  "logic-mountain": 8,
  "treasure-camp": 10,
});

const WORLD_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "number-forest",
    nameKey: "numberForest",
    descriptionKey: "numberForestDescription",
    icon: "tree",
    requiredRank: 1,
    requiredStars: 0,
    rewardId: "forest-friend",
  }),
  Object.freeze({
    id: "pattern-cave",
    nameKey: "patternCave",
    descriptionKey: "patternCaveDescription",
    icon: "cave",
    requiredRank: 2,
    requiredStars: 8,
    rewardId: "pattern-pathfinder",
  }),
  Object.freeze({
    id: "shape-river",
    nameKey: "shapeRiver",
    descriptionKey: "shapeRiverDescription",
    icon: "river",
    requiredRank: 3,
    requiredStars: 16,
    rewardId: "shape-sailor",
  }),
  Object.freeze({
    id: "logic-mountain",
    nameKey: "logicMountain",
    descriptionKey: "logicMountainDescription",
    icon: "mountain",
    requiredRank: 4,
    requiredStars: 24,
    rewardId: "logic-climber",
  }),
  Object.freeze({
    id: "treasure-camp",
    nameKey: "treasureCamp",
    descriptionKey: "treasureCampDescription",
    icon: "camp",
    requiredRank: 5,
    requiredStars: 32,
    rewardId: "treasure-guide",
  }),
]);

export const RANKS = Object.freeze([
  Object.freeze({ id: "number-seed", order: 1, minimumExperience: 0, nameKey: "rankNumberSeed" }),
  Object.freeze({ id: "little-explorer", order: 2, minimumExperience: 80, nameKey: "rankLittleExplorer" }),
  Object.freeze({ id: "path-finder", order: 3, minimumExperience: 180, nameKey: "rankPathFinder" }),
  Object.freeze({ id: "puzzle-scout", order: 4, minimumExperience: 300, nameKey: "rankPuzzleScout" }),
  Object.freeze({ id: "pattern-seeker", order: 5, minimumExperience: 440, nameKey: "rankPatternSeeker" }),
  Object.freeze({ id: "number-builder", order: 6, minimumExperience: 600, nameKey: "rankNumberBuilder" }),
  Object.freeze({ id: "strategy-adventurer", order: 7, minimumExperience: 780, nameKey: "rankStrategyAdventurer" }),
  Object.freeze({ id: "logic-ranger", order: 8, minimumExperience: 980, nameKey: "rankLogicRanger" }),
  Object.freeze({ id: "math-navigator", order: 9, minimumExperience: 1200, nameKey: "rankMathNavigator" }),
  Object.freeze({ id: "adventure-master", order: 10, minimumExperience: 1440, nameKey: "rankAdventureMaster" }),
]);

const missionIdForSlot = (worldId, levelNumber, missionIndex) => {
  if (worldId === "number-forest" && levelNumber === 1 && missionIndex === 1) {
    return "target-10-two";
  }
  if (worldId === "number-forest" && levelNumber === 1 && missionIndex === 3) {
    return "target-12-two-ways";
  }
  return `${worldId}-level-${String(levelNumber).padStart(2, "0")}-mission-${missionIndex}`;
};

const rewardCycle = Object.freeze([
  "number-builder",
  "careful-observer",
  "pattern-explorer",
  "creative-thinker",
  "plan-maker",
  "multiple-solution-finder",
  "team-helper",
  "brave-guesser",
]);

const buildLevels = () => {
  const levels = [];
  let previousLevelId = null;

  for (const [worldIndex, world] of WORLD_DEFINITIONS.entries()) {
    const count = LEVEL_COUNTS[world.id];
    for (let levelNumber = 1; levelNumber <= count; levelNumber += 1) {
      const id = `${world.id}-level-${String(levelNumber).padStart(2, "0")}`;
      const missionIds = Object.freeze(
        [1, 2, 3, 4].map((missionIndex) =>
          missionIdForSlot(world.id, levelNumber, missionIndex),
        ),
      );
      levels.push(
        Object.freeze({
          id,
          worldId: world.id,
          order: levelNumber,
          globalOrder: levels.length + 1,
          nameKey: "generatedLevelName",
          nameParams: Object.freeze({ level: levelNumber }),
          difficulty: Math.min(3, 1 + Math.floor((levelNumber - 1) / 3)),
          missionIds,
          unlockRequirement: Object.freeze({
            prerequisiteLevelId: previousLevelId,
            requiredStars: worldIndex === 0 && levelNumber === 1
              ? 0
              : Math.max(0, (levels.length - 1) * 2),
          }),
          rewardId: rewardCycle[(levels.length + worldIndex) % rewardCycle.length],
          starMaximum: 3,
        }),
      );
      previousLevelId = id;
    }
  }

  return Object.freeze(levels);
};

export const LEVELS = buildLevels();

export const WORLDS = Object.freeze(
  WORLD_DEFINITIONS.map((world, index) => {
    const levels = LEVELS.filter((level) => level.worldId === world.id);
    const previousWorld = WORLD_DEFINITIONS[index - 1];
    const previousWorldLevels = previousWorld
      ? LEVELS.filter((level) => level.worldId === previousWorld.id)
      : [];
    return Object.freeze({
      ...world,
      order: index + 1,
      levelIds: Object.freeze(levels.map((level) => level.id)),
      unlockRequirement: Object.freeze({
        prerequisiteWorldId: previousWorld?.id ?? null,
        prerequisiteLevelId: previousWorldLevels.at(-1)?.id ?? null,
        requiredRank: world.requiredRank,
        requiredStars: world.requiredStars,
      }),
      starMaximum: levels.length * 3,
    });
  }),
);

export function getWorldById(id) {
  return WORLDS.find((world) => world.id === id) ?? null;
}

export function getLevelById(id) {
  return LEVELS.find((level) => level.id === id) ?? null;
}
