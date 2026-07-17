import assert from "node:assert/strict";
import { LEVELS, RANKS, WORLDS } from "../js/data/worlds.js";
import { MISSIONS, getMissionById } from "../js/data/missions.js";
import {
  LIFECYCLE,
  PROGRESSION_ACTION,
  advanceProgression,
  completeMission,
  createDefaultGameState,
  getPlayerRank,
  migrateLegacyState,
  normalizeGameState,
  reconcileProgression,
  reduceProgression,
  replayMission,
  resetProgress,
  resolveNextAction,
  startMission,
  useHint,
} from "../js/game/progression.js";
import {
  STORAGE_KEY,
  V2_STORAGE_KEY,
  loadStoredState,
  serializeGameState,
} from "../js/storage.js";

class MemoryStorage {
  #values = new Map();

  getItem(key) {
    return this.#values.has(key) ? this.#values.get(key) : null;
  }

  setItem(key, value) {
    this.#values.set(key, String(value));
  }

  removeItem(key) {
    this.#values.delete(key);
  }
}

function completeRecordsBefore(missionId) {
  let state = createDefaultGameState();
  let reachedTarget = false;
  const missionRecords = { ...state.progress.missionRecords };

  for (const level of LEVELS) {
    for (const id of level.missionIds) {
      if (id === missionId) {
        reachedTarget = true;
        break;
      }
      const record = missionRecords[id];
      missionRecords[id] = {
        ...record,
        status: "completed",
        attempts: 1,
        completions: 1,
        discoveredSolutions: [`${id}|prepared`],
        bestHintsUsed: 0,
      };
    }
    if (reachedTarget) break;
  }
  assert.equal(reachedTarget, true, `Unknown target mission ${missionId}`);
  return reconcileProgression({
    ...state,
    progress: { ...state.progress, missionRecords },
  });
}

function finishActiveRun(state, label = "solution") {
  const mission = getMissionById(state.currentMissionId);
  assert.ok(mission, "An active mission must exist");
  const required = mission.solutionsRequired ?? 1;
  let next = state;
  let index = next.progress.missionRecords[mission.id].discoveredSolutions.length;

  do {
    next = completeMission(next, {
      valid: true,
      canonicalSolution: `${mission.id}|${label}-${index + 1}`,
    });
    index += 1;
  } while (next.lifecycle === LIFECYCLE.ACTIVE && index < required + 2);

  assert.equal(next.lifecycle, LIFECYCLE.COMPLETED, `${mission.id} should complete`);
  return next;
}

// Initial unlock and rank selectors use the stable content graph.
const initial = createDefaultGameState();
const firstLevel = LEVELS[0];
const firstMissionId = firstLevel.missionIds[0];
assert.equal(initial.saveVersion, 3);
assert.equal(initial.progress.worldRecords[WORLDS[0].id].status, "unlocked");
assert.equal(initial.progress.levelRecords[firstLevel.id].status, "unlocked");
assert.equal(initial.progress.missionRecords[firstMissionId].status, "unlocked");
assert.equal(getPlayerRank({ progress: { experience: RANKS[1].minimumExperience - 1 } }).number, 1);
assert.equal(getPlayerRank({ progress: { experience: RANKS[1].minimumExperience } }).number, 2);

// Normal mission: record all required solutions, complete once, and advance once.
let state = startMission(initial, firstMissionId, { dealSeed: 7 });
assert.equal(state.lifecycle, LIFECYCLE.ACTIVE);
assert.equal(state.activeRun.runId, `${firstMissionId}:1`);
state = completeMission(state, {
  valid: true,
  canonicalSolution: `${firstMissionId}|first-way`,
});
assert.equal(state.lifecycle, LIFECYCLE.ACTIVE, "multi-solution mission remains active");
const completed = completeMission(state, {
  valid: true,
  canonicalSolution: `${firstMissionId}|second-way`,
});
assert.equal(completed.lifecycle, LIFECYCLE.COMPLETED);
assert.equal(completed.progress.missionRecords[firstMissionId].completions, 1);
assert.equal(completed.progress.experience, 18, "10 mission + 5 second way + 3 no hint");

const doubleComplete = completeMission(completed, {
  valid: true,
  canonicalSolution: `${firstMissionId}|third-way`,
});
assert.strictEqual(doubleComplete, completed, "double COMPLETE is ignored");
assert.equal(doubleComplete.progress.experience, completed.progress.experience);

const lockedComplete = completeMission({
  ...state,
  transition: { locked: true, token: "existing", sequence: 9 },
}, {
  valid: true,
  canonicalSolution: `${firstMissionId}|locked-way`,
});
assert.equal(lockedComplete.transition.token, "existing", "an owned transition is not entered twice");

assert.equal(resolveNextAction(completed).kind, "next-mission");
const missionCheckpoint = completed.completion.checkpointId;
const advanced = advanceProgression(completed, { checkpointId: missionCheckpoint });
assert.equal(advanced.lifecycle, LIFECYCLE.ACTIVE);
assert.equal(advanced.currentMissionId, firstLevel.missionIds[1]);
assert.strictEqual(
  advanceProgression(advanced, { checkpointId: missionCheckpoint }),
  advanced,
  "double ADVANCE from the same checkpoint is ignored",
);

// The reducer exposes the same explicit action contract.
const hinted = reduceProgression(advanced, { type: PROGRESSION_ACTION.USE_HINT });
assert.equal(hinted.activeRun.hintsUsed, 1);
assert.equal(
  reduceProgression(hinted, { type: "UNKNOWN_ACTION" }),
  hinted,
  "unknown actions are pure no-ops",
);

// Final mission in a level deterministically reaches level-complete then next-level.
const finalMissionInLevel = firstLevel.missionIds.at(-1);
state = startMission(completeRecordsBefore(finalMissionInLevel), finalMissionInLevel);
state = finishActiveRun(state, "level-boundary");
assert.equal(resolveNextAction(state).kind, "level-complete");
state = advanceProgression(state, { checkpointId: state.completion.checkpointId });
assert.equal(state.currentScreen, "level-complete");
assert.equal(resolveNextAction(state).kind, "next-level");
state = advanceProgression(state, { checkpointId: state.completion.checkpointId });
assert.equal(state.lifecycle, LIFECYCLE.ACTIVE);
assert.equal(state.currentLevelId, LEVELS[1].id);
assert.equal(state.currentMissionId, LEVELS[1].missionIds[0]);

// Final level in a world reaches world-complete and unlocks the next world.
const firstWorldLevels = LEVELS.filter((level) => level.worldId === WORLDS[0].id);
const finalFirstWorldMission = firstWorldLevels.at(-1).missionIds.at(-1);
state = startMission(completeRecordsBefore(finalFirstWorldMission), finalFirstWorldMission);
state = finishActiveRun(state, "world-boundary");
assert.equal(resolveNextAction(state).kind, "level-complete");
state = advanceProgression(state, { checkpointId: state.completion.checkpointId });
assert.equal(resolveNextAction(state).kind, "world-complete");
state = advanceProgression(state, { checkpointId: state.completion.checkpointId });
assert.equal(state.currentScreen, "world-complete");
assert.equal(resolveNextAction(state).kind, "next-world");
state = advanceProgression(state, { checkpointId: state.completion.checkpointId });
assert.equal(state.lifecycle, LIFECYCLE.ACTIVE);
assert.equal(state.currentWorldId, WORLDS[1].id);

// Final mission of the final world reaches the terminal game-complete branch.
const finalLevel = LEVELS.at(-1);
const finalMission = finalLevel.missionIds.at(-1);
state = startMission(completeRecordsBefore(finalMission), finalMission);
state = finishActiveRun(state, "game-boundary");
state = advanceProgression(state, { checkpointId: state.completion.checkpointId });
assert.equal(resolveNextAction(state).kind, "world-complete");
state = advanceProgression(state, { checkpointId: state.completion.checkpointId });
assert.equal(resolveNextAction(state).kind, "game-complete");
state = advanceProgression(state, { checkpointId: state.completion.checkpointId });
assert.equal(state.currentScreen, "game-complete");
assert.equal(state.completion.kind, "game-complete");

// Replay can improve a saved star result, but never reduces it or repeats first rewards.
state = createDefaultGameState();
for (const [index, missionId] of firstLevel.missionIds.entries()) {
  state = startMission(state, missionId);
  if (index === 0) state = useHint(state);
  state = finishActiveRun(state, `first-pass-${index}`);
}
assert.equal(state.progress.levelRecords[firstLevel.id].stars, 2);
const xpBeforeReplay = state.progress.experience;
state = replayMission(state, firstMissionId);
assert.equal(state.activeRun.mode, "replay");
state = completeMission(state, {
  valid: true,
  canonicalSolution: `${firstMissionId}|first-pass-0-1`,
});
assert.equal(state.progress.levelRecords[firstLevel.id].stars, 3);
assert.ok(state.progress.experience > xpBeforeReplay, "small replay and mastery rewards are positive");
const replayXp = state.progress.experience;
assert.strictEqual(
  completeMission(state, {
    valid: true,
    canonicalSolution: `${firstMissionId}|duplicate-after-replay`,
  }),
  state,
);
assert.equal(state.progress.experience, replayXp, "replay rewards are idempotent per run");

// V2 and legacy IDs migrate to stable V3 records, with invalid IDs discarded.
const legacy = {
  language: "zh-CN",
  difficulty: 2,
  completedMissions: ["target-10-two", "classify-under-6", "missing-mission"],
  discoveredSolutions: {
    "target-10-two": ["target-10-two|legacy"],
    "classify-under-6": ["classify-under-6|legacy"],
  },
  earnedRewards: ["number-builder", "missing-reward"],
  hintsUsed: 2,
  tutorialCompleted: true,
  profile: { name: "Mia", avatar: "fox" },
};
const migrated = migrateLegacyState(legacy);
const mappedClassify = getMissionById("classify-under-6").id;
assert.equal(migrated.saveVersion, 3);
assert.equal(migrated.progress.missionRecords[firstMissionId].status, "completed");
assert.equal(migrated.progress.missionRecords[mappedClassify].status, "completed");
assert.deepEqual(migrated.progress.earnedRewardIds, ["number-builder"]);
assert.equal(migrated.language, "zh-CN");

const migrationStorage = new MemoryStorage();
migrationStorage.setItem(V2_STORAGE_KEY, JSON.stringify(legacy));
const loadedMigration = loadStoredState(migrationStorage);
assert.equal(loadedMigration.saveVersion, 3);
assert.equal(JSON.parse(migrationStorage.getItem(STORAGE_KEY)).saveVersion, 3);

const corruptPrimaryWithFallback = new MemoryStorage();
corruptPrimaryWithFallback.setItem(STORAGE_KEY, "{not-json");
corruptPrimaryWithFallback.setItem(V2_STORAGE_KEY, JSON.stringify(legacy));
assert.equal(loadStoredState(corruptPrimaryWithFallback).profile.name, "Mia");

const corruptOnly = new MemoryStorage();
corruptOnly.setItem(STORAGE_KEY, "{not-json");
const recovered = loadStoredState(corruptOnly);
assert.equal(recovered.saveVersion, 3);
assert.equal(recovered.progress.experience, 0);
assert.equal(recovered.transition.locked, false);

// Refresh safely restores active/checking and completed/transitioning checkpoints.
const resumable = startMission(createDefaultGameState(), firstMissionId, {
  availableCards: [{ id: "number-2", instanceId: "card-1", value: 2 }],
});
const checkingSnapshot = serializeGameState({
  ...resumable,
  lifecycle: LIFECYCLE.CHECKING,
  transition: { locked: true, token: "stale", sequence: 4 },
});
const restoredActive = normalizeGameState(checkingSnapshot);
assert.equal(restoredActive.lifecycle, LIFECYCLE.ACTIVE);
assert.equal(restoredActive.transition.locked, false);
assert.equal(restoredActive.activeRun.availableCards.length, 1);

let checkpoint = finishActiveRun(resumable, "refresh");
const transitioningSnapshot = serializeGameState({
  ...checkpoint,
  lifecycle: LIFECYCLE.TRANSITIONING,
  transition: { locked: true, token: "stale", sequence: 5 },
});
const restoredCompletion = normalizeGameState(transitioningSnapshot);
assert.equal(restoredCompletion.lifecycle, LIFECYCLE.COMPLETED);
assert.equal(restoredCompletion.completion.checkpointId, checkpoint.completion.checkpointId);
assert.equal(restoredCompletion.transition.locked, false);

const reset = resetProgress(restoredCompletion);
assert.equal(reset.progress.experience, 0);
assert.equal(reset.completedMissions.length, 0);

console.log(
  `Progression check passed: ${WORLDS.length} worlds, ${LEVELS.length} levels, ${MISSIONS.length} missions; deterministic boundaries, replay growth, migration, corruption recovery, and refresh restoration.`,
);
