import assert from "node:assert/strict";
import { NUMBER_CARDS, PUZZLE_CARD_ACTIVITIES, STRATEGY_CARDS } from "../js/data/cards.js";
import { LOCATIONS, MISSIONS } from "../js/data/missions.js";
import { REWARDS } from "../js/data/rewards.js";
import { dealCardsForMission, enumerateValidSolutions } from "../js/game/game-engine.js";
import { validateMission } from "../js/game/validation.js";

assert.ok(NUMBER_CARDS.length >= 12, "number card minimum");
assert.ok(PUZZLE_CARD_ACTIVITIES.length >= 3, "puzzle activity minimum");
assert.ok(STRATEGY_CARDS.length >= 4, "strategy card minimum");
assert.ok(MISSIONS.length >= 8, "mission minimum");
assert.ok(REWARDS.length >= 6, "reward minimum");
assert.equal(LOCATIONS.length, 5, "five map destinations");
assert.deepEqual(new Set(MISSIONS.map((mission) => mission.difficulty)), new Set([1, 2, 3]));

for (const mission of MISSIONS) {
  const deal = dealCardsForMission(mission);
  const solutions = enumerateValidSolutions(mission, deal);
  assert.ok(solutions.length >= (mission.solutionsRequired ?? 1), `${mission.id} is solvable`);
}

const multiple = MISSIONS.find((mission) => mission.id === "target-12-two-ways");
const deal = dealCardsForMission(multiple);
const card = (value) => deal.find((item) => item.value === value);
const first = validateMission(multiple, [card(3), card(9)]);
assert.equal(first.valid, true);
const second = validateMission(multiple, [card(4), card(8)], [first.canonical]);
assert.equal(second.valid, true);
assert.notEqual(first.canonical, second.canonical);
const duplicate = validateMission(multiple, [card(9), card(3)], [first.canonical]);
assert.equal(duplicate.status, "valid-duplicate");

console.log(`Game check passed: ${MISSIONS.length} solvable missions, including distinct and duplicate multi-solution handling.`);
