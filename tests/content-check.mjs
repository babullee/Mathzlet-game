import assert from "node:assert/strict";
import { MISSIONS, LEGACY_MISSION_ID_MAP, getMissionsForLevel } from "../js/data/missions.js";
import { REWARDS } from "../js/data/rewards.js";
import translations from "../js/data/translations.js";
import { LEVELS, RANKS, WORLDS, getLevelById, getWorldById } from "../js/data/worlds.js";
import { createMissionDeal, enumerateValidSolutions } from "../js/game/game-engine.js";
import { validateMissionData } from "../js/game/validation.js";

const unique = (values, label) => {
  assert.equal(new Set(values).size, values.length, `${label} must use unique IDs`);
};

const assertBilingualKey = (key, source) => {
  assert.equal(typeof translations.en[key], "string", `${source} is missing English key ${key}`);
  assert.equal(typeof translations["zh-CN"][key], "string", `${source} is missing Chinese key ${key}`);
};

assert.equal(WORLDS.length, 5, "The adventure must have exactly five worlds");
assert.equal(LEVELS.length, 42, "The adventure must have exactly 42 levels");
assert.equal(MISSIONS.length, 168, "Four missions across 42 levels must produce 168 missions");
assert.equal(RANKS.length, 10, "The growth path must have ten ranks");
assert.ok(REWARDS.length >= 20, "The collection must contain at least 20 rewards");

unique(WORLDS.map((world) => world.id), "Worlds");
unique(LEVELS.map((level) => level.id), "Levels");
unique(MISSIONS.map((mission) => mission.id), "Missions");
unique(REWARDS.map((reward) => reward.id), "Rewards");
unique(RANKS.map((rank) => rank.id), "Ranks");

const expectedLevelCounts = new Map([
  ["number-forest", 8],
  ["pattern-cave", 8],
  ["shape-river", 8],
  ["logic-mountain", 8],
  ["treasure-camp", 10],
]);
const rewardIds = new Set(REWARDS.map((reward) => reward.id));
const missionIds = new Set(MISSIONS.map((mission) => mission.id));

for (const world of WORLDS) {
  assert.equal(getWorldById(world.id), world, `${world.id} must be retrievable by stable ID`);
  assert.equal(
    world.levelIds.length,
    expectedLevelCounts.get(world.id),
    `${world.id} has the wrong level count`,
  );
  assert.equal(world.starMaximum, world.levelIds.length * 3, `${world.id} star maximum`);
  assert.ok(rewardIds.has(world.rewardId), `${world.id} references an unknown reward`);
  assertBilingualKey(world.nameKey, world.id);
  assertBilingualKey(world.descriptionKey, world.id);
  for (const levelId of world.levelIds) {
    assert.equal(getLevelById(levelId)?.worldId, world.id, `${levelId} belongs to the wrong world`);
  }
  const prerequisite = world.unlockRequirement.prerequisiteWorldId;
  if (prerequisite) assert.ok(getWorldById(prerequisite), `${world.id} has an invalid world prerequisite`);
}

for (const level of LEVELS) {
  assert.equal(getLevelById(level.id), level, `${level.id} must be retrievable by stable ID`);
  assert.ok(getWorldById(level.worldId), `${level.id} references an unknown world`);
  assert.equal(level.missionIds.length, 4, `${level.id} must contain exactly four missions`);
  assert.ok(level.missionIds.length >= 3 && level.missionIds.length <= 5, `${level.id} mission range`);
  assert.equal(level.starMaximum, 3, `${level.id} star maximum`);
  assert.ok(rewardIds.has(level.rewardId), `${level.id} references an unknown reward`);
  assertBilingualKey(level.nameKey, level.id);
  const prerequisite = level.unlockRequirement.prerequisiteLevelId;
  if (prerequisite) assert.ok(getLevelById(prerequisite), `${level.id} has an invalid level prerequisite`);
  assert.deepEqual(
    getMissionsForLevel(level.id).map((mission) => mission.id),
    level.missionIds,
    `${level.id} mission references must preserve their configured order`,
  );
  for (const missionId of level.missionIds) {
    assert.ok(missionIds.has(missionId), `${level.id} references missing mission ${missionId}`);
  }
}

for (const mission of MISSIONS) {
  const level = getLevelById(mission.levelId);
  assert.ok(level, `${mission.id} references an unknown level`);
  assert.equal(mission.worldId, level.worldId, `${mission.id} world/level mismatch`);
  assert.equal(mission.location, mission.worldId, `${mission.id} location/world mismatch`);
  assert.ok(level.missionIds.includes(mission.id), `${mission.id} is not referenced by its level`);
  assert.ok(Number.isInteger(mission.missionIndex) && mission.missionIndex >= 1 && mission.missionIndex <= 4);
  assert.ok(Number.isFinite(mission.xpReward) && mission.xpReward > 0, `${mission.id} XP reward`);
  assert.ok(Number.isFinite(mission.bonusXp) && mission.bonusXp >= 0, `${mission.id} bonus XP`);
  assert.ok(rewardIds.has(mission.rewardId), `${mission.id} references an unknown reward`);
  assert.equal(typeof mission.visualSupport, "boolean", `${mission.id} visual support metadata`);
  assert.equal(typeof mission.parentPromptKey, "string", `${mission.id} parent prompt metadata`);
  assert.equal(typeof mission.starCriteria, "object", `${mission.id} star criteria metadata`);
  assertBilingualKey(mission.titleKey, mission.id);
  assertBilingualKey(mission.instructionKey, mission.id);
  assertBilingualKey(mission.parentPromptKey, mission.id);
  for (const key of mission.hintKeys ?? []) assertBilingualKey(key, mission.id);

  const missionCheck = validateMissionData(mission);
  assert.equal(missionCheck.valid, true, `${mission.id} failed mission-data validation`);
  const deal = createMissionDeal(mission, { maximumAttempts: 0 });
  assert.equal(deal.mission.id, mission.id, `${mission.id} unexpectedly fell back to another mission`);
  assert.equal(deal.solvable, true, `${mission.id} fallback deal is not solvable`);
  const solutions = enumerateValidSolutions(deal.mission, deal.availableCards);
  assert.ok(
    solutions.length >= (mission.solutionsRequired ?? 1),
    `${mission.id} needs ${mission.solutionsRequired ?? 1} solution(s), found ${solutions.length}`,
  );
}

for (const [legacyId, currentId] of Object.entries(LEGACY_MISSION_ID_MAP)) {
  assert.equal(typeof legacyId, "string");
  assert.ok(missionIds.has(currentId), `${legacyId} migrates to missing mission ${currentId}`);
}

for (const rank of RANKS) assertBilingualKey(rank.nameKey, rank.id);
for (const reward of REWARDS) {
  assertBilingualKey(reward.labelKey, reward.id);
  assertBilingualKey(reward.descriptionKey, reward.id);
}

assert.ok(MISSIONS.filter((mission) => mission.allowMultipleSolutions).length >= 10);
assert.ok(MISSIONS.filter((mission) => mission.strategyChallenge).length >= 8);
assert.ok(MISSIONS.filter((mission) => mission.cooperative).length >= 10);
assert.ok(MISSIONS.filter((mission) => mission.type === "open-ended").length >= 10);
assert.ok(
  MISSIONS.filter((mission) => ["pattern", "classification", "sequence-build"].includes(mission.type)).length >= 15,
);

console.log(
  `Content check passed: ${WORLDS.length} worlds, ${LEVELS.length} levels, ${MISSIONS.length} solvable missions, ${RANKS.length} ranks, and ${REWARDS.length} rewards.`,
);
