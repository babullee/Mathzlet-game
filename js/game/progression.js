import {
  LEVELS,
  RANKS,
  WORLDS,
  getLevelById,
  getWorldById,
} from "../data/worlds.js";
import { MISSIONS, getMissionById } from "../data/missions.js";
import { REWARDS } from "../data/rewards.js";

export const SAVE_VERSION = 3;

export const LIFECYCLE = Object.freeze({
  IDLE: "idle",
  LOADING: "loading",
  ACTIVE: "active",
  CHECKING: "checking",
  COMPLETED: "completed",
  TRANSITIONING: "transitioning",
});

export const PROGRESSION_ACTION = Object.freeze({
  START_MISSION: "START_MISSION",
  REPLAY_MISSION: "REPLAY_MISSION",
  RECORD_SOLUTION: "RECORD_SOLUTION",
  USE_HINT: "USE_HINT",
  COMPLETE_MISSION: "COMPLETE_MISSION",
  AWARD_EXPERIENCE: "AWARD_EXPERIENCE",
  UNLOCK_MISSION: "UNLOCK_MISSION",
  UNLOCK_LEVEL: "UNLOCK_LEVEL",
  UNLOCK_WORLD: "UNLOCK_WORLD",
  ADVANCE: "ADVANCE",
  RETURN_TO_MAP: "RETURN_TO_MAP",
  RESET_PROGRESS: "RESET_PROGRESS",
});

const VALID_LIFECYCLES = new Set(Object.values(LIFECYCLE));
const VALID_STATUSES = new Set(["locked", "unlocked", "completed"]);
const VALID_SCREENS = new Set([
  "home",
  "map",
  "level-select",
  "game",
  "mission-complete",
  "level-complete",
  "world-complete",
  "game-complete",
  "collection",
  "parent",
  "profile",
  "settings",
]);
const AVATARS = new Set(["star", "fox", "rocket", "leaf"]);
const DEFAULT_RANKS = Object.freeze([
  { id: "number-seed", minimumXp: 0, nameKey: "rankNumberSeed" },
  { id: "little-explorer", minimumXp: 50, nameKey: "rankLittleExplorer" },
  { id: "path-finder", minimumXp: 120, nameKey: "rankPathFinder" },
  { id: "puzzle-scout", minimumXp: 210, nameKey: "rankPuzzleScout" },
  { id: "pattern-seeker", minimumXp: 320, nameKey: "rankPatternSeeker" },
  { id: "number-builder", minimumXp: 450, nameKey: "rankNumberBuilder" },
  { id: "strategy-adventurer", minimumXp: 600, nameKey: "rankStrategyAdventurer" },
  { id: "logic-ranger", minimumXp: 780, nameKey: "rankLogicRanger" },
  { id: "math-navigator", minimumXp: 990, nameKey: "rankMathNavigator" },
  { id: "adventure-master", minimumXp: 1230, nameKey: "rankAdventureMaster" },
]);

const isObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const uniqueStrings = (value) =>
  [...new Set((Array.isArray(value) ? value : []).filter((item) => typeof item === "string" && item))];
const nonNegativeInteger = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
};
const statusOf = (value) => (VALID_STATUSES.has(value) ? value : "locked");
const orderOf = (value, fallback) =>
  Number.isFinite(Number(value?.order)) ? Number(value.order) : fallback;
const referenceId = (value) => (typeof value === "string" ? value : value?.id ?? null);

function orderedWorlds() {
  return [...(Array.isArray(WORLDS) ? WORLDS : [])]
    .map((world, index) => ({ world, index }))
    .sort((left, right) => orderOf(left.world, left.index) - orderOf(right.world, right.index))
    .map(({ world }) => world);
}

function levelsForWorld(worldId) {
  const world = getWorldById?.(worldId) ?? orderedWorlds().find((item) => item.id === worldId);
  const referenced = world?.levelIds ?? world?.levels ?? [];
  const fromWorld = referenced
    .map((item) => (typeof item === "string" ? getLevelById?.(item) : item))
    .filter(Boolean);
  const flat = (Array.isArray(LEVELS) ? LEVELS : []).filter(
    (level) => level.worldId === worldId || level.location === worldId,
  );
  const seen = new Set();
  return [...fromWorld, ...flat]
    .filter((level) => level?.id && !seen.has(level.id) && seen.add(level.id))
    .map((level, index) => ({ level, index }))
    .sort((left, right) => orderOf(left.level, left.index) - orderOf(right.level, right.index))
    .map(({ level }) => level);
}

function missionIdsForLevel(level) {
  return uniqueStrings(
    (level?.missionIds ?? level?.missions ?? []).map(referenceId),
  ).filter((id) => Boolean(getMissionById(id)));
}

function findLevelForMission(missionId) {
  const mission = getMissionById(missionId);
  if (mission?.levelId) {
    const direct = getLevelById?.(mission.levelId);
    if (direct) return direct;
  }
  for (const world of orderedWorlds()) {
    const match = levelsForWorld(world.id).find((level) =>
      missionIdsForLevel(level).includes(missionId),
    );
    if (match) return match;
  }
  return null;
}

function findWorldForLevel(levelId) {
  const level = getLevelById?.(levelId) ?? (Array.isArray(LEVELS) ? LEVELS : [])
    .find((item) => item.id === levelId);
  if (level?.worldId) return getWorldById?.(level.worldId) ?? null;
  return orderedWorlds().find((world) =>
    levelsForWorld(world.id).some((item) => item.id === levelId),
  ) ?? null;
}

function defaultSettings() {
  return {
    sound: false,
    reducedMotion:
      globalThis.window?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false,
    animationIntensity: "calm",
    showQuantities: true,
  };
}

function bareState(language = "en") {
  return {
    saveVersion: SAVE_VERSION,
    language: language === "zh-CN" ? "zh-CN" : "en",
    difficulty: 1,
    currentScreen: "home",
    currentWorldId: orderedWorlds()[0]?.id ?? null,
    currentLevelId: null,
    currentMissionId: null,
    lifecycle: LIFECYCLE.IDLE,
    transition: { locked: false, token: null, sequence: 0 },
    activeRun: null,
    completion: null,
    progress: {
      experience: 0,
      missionRecords: {},
      levelRecords: {},
      worldRecords: {},
      earnedRewardIds: [],
      unlockedCosmeticIds: [],
      rewardLedger: [],
    },
    profile: { name: "Explorer", avatar: "star" },
    tutorialCompleted: false,
    lifetimeHintsUsed: 0,
    settings: defaultSettings(),
    lastError: null,
  };
}

function sanitizeMissionRecord(value = {}) {
  return {
    status: statusOf(value.status),
    attempts: nonNegativeInteger(value.attempts),
    completions: nonNegativeInteger(value.completions),
    discoveredSolutions: uniqueStrings(value.discoveredSolutions),
    bestHintsUsed:
      value.bestHintsUsed === null || value.bestHintsUsed === undefined
        ? null
        : nonNegativeInteger(value.bestHintsUsed),
    firstCompletedAt:
      typeof value.firstCompletedAt === "string" || Number.isFinite(value.firstCompletedAt)
        ? value.firstCompletedAt
        : null,
    rewardedReplayCount: Math.min(3, nonNegativeInteger(value.rewardedReplayCount)),
    bonusCompleted: Boolean(value.bonusCompleted),
  };
}

function sanitizeLevelRecord(value = {}) {
  return {
    status: statusOf(value.status),
    stars: Math.min(3, nonNegativeInteger(value.stars)),
    completedAt:
      typeof value.completedAt === "string" || Number.isFinite(value.completedAt)
        ? value.completedAt
        : null,
  };
}

function sanitizeWorldRecord(value = {}) {
  return {
    status: statusOf(value.status),
    completedAt:
      typeof value.completedAt === "string" || Number.isFinite(value.completedAt)
        ? value.completedAt
        : null,
  };
}

function withStatus(record, nextStatus) {
  if (record.status === "completed") return record;
  if (record.status === nextStatus) return record;
  return { ...record, status: nextStatus };
}

export function reconcileProgression(inputState) {
  const state = isObject(inputState) ? inputState : bareState();
  const progress = isObject(state.progress) ? state.progress : {};
  const sourceMissions = isObject(progress.missionRecords) ? progress.missionRecords : {};
  const sourceLevels = isObject(progress.levelRecords) ? progress.levelRecords : {};
  const sourceWorlds = isObject(progress.worldRecords) ? progress.worldRecords : {};
  const missionRecords = {};
  const levelRecords = {};
  const worldRecords = {};
  const knownRewardIds = new Set(
    (Array.isArray(REWARDS) ? REWARDS : []).map((reward) => reward.id),
  );

  for (const mission of MISSIONS) {
    missionRecords[mission.id] = sanitizeMissionRecord(sourceMissions[mission.id]);
  }
  for (const level of Array.isArray(LEVELS) ? LEVELS : []) {
    levelRecords[level.id] = sanitizeLevelRecord(sourceLevels[level.id]);
  }
  for (const world of orderedWorlds()) {
    worldRecords[world.id] = sanitizeWorldRecord(sourceWorlds[world.id]);
  }

  const worlds = orderedWorlds();
  if (worlds[0]) worldRecords[worlds[0].id] = withStatus(worldRecords[worlds[0].id], "unlocked");

  worlds.forEach((world, worldIndex) => {
    const levels = levelsForWorld(world.id);
    const worldRecord = worldRecords[world.id] ?? sanitizeWorldRecord();
    const predecessorComplete =
      worldIndex === 0 || worldRecords[worlds[worldIndex - 1]?.id]?.status === "completed";
    if (predecessorComplete) worldRecords[world.id] = withStatus(worldRecord, "unlocked");

    levels.forEach((level, levelIndex) => {
      levelRecords[level.id] ??= sanitizeLevelRecord(sourceLevels[level.id]);
      const canUnlockLevel =
        worldRecords[world.id]?.status !== "locked" &&
        (levelIndex === 0 || levelRecords[levels[levelIndex - 1]?.id]?.status === "completed");
      if (canUnlockLevel) {
        levelRecords[level.id] = withStatus(levelRecords[level.id], "unlocked");
      }

      const missionIds = missionIdsForLevel(level);
      missionIds.forEach((missionId, missionIndex) => {
        const previousComplete =
          missionIndex === 0 ||
          missionRecords[missionIds[missionIndex - 1]]?.status === "completed";
        if (levelRecords[level.id]?.status !== "locked" && previousComplete) {
          missionRecords[missionId] = withStatus(missionRecords[missionId], "unlocked");
        }
      });

      const levelComplete =
        missionIds.length > 0 &&
        missionIds.every((missionId) => missionRecords[missionId]?.status === "completed");
      if (levelComplete) {
        levelRecords[level.id] = { ...levelRecords[level.id], status: "completed" };
      }
    });

    const worldComplete =
      levels.length > 0 &&
      levels.every((level) => levelRecords[level.id]?.status === "completed");
    if (worldComplete) {
      worldRecords[world.id] = { ...worldRecords[world.id], status: "completed" };
    }
  });

  return {
    ...state,
    progress: {
      experience: nonNegativeInteger(progress.experience),
      missionRecords,
      levelRecords,
      worldRecords,
      earnedRewardIds: uniqueStrings(progress.earnedRewardIds)
        .filter((id) => knownRewardIds.has(id)),
      unlockedCosmeticIds: uniqueStrings(progress.unlockedCosmeticIds),
      rewardLedger: uniqueStrings(progress.rewardLedger),
    },
  };
}

function sanitizeActiveRun(value, currentMissionId) {
  if (!isObject(value) || !currentMissionId || value.missionId !== currentMissionId) return null;
  return {
    runId:
      typeof value.runId === "string" && value.runId
        ? value.runId
        : `${currentMissionId}:${nonNegativeInteger(value.attemptNumber, 1)}`,
    attemptNumber: Math.max(1, nonNegativeInteger(value.attemptNumber, 1)),
    mode: value.mode === "replay" ? "replay" : "first-play",
    missionId: currentMissionId,
    dealSeed: nonNegativeInteger(value.dealSeed),
    availableCards: Array.isArray(value.availableCards) ? value.availableCards : [],
    selectedInstanceIds: uniqueStrings(value.selectedInstanceIds),
    history: Array.isArray(value.history) ? value.history : [],
    discoveredSolutions: uniqueStrings(value.discoveredSolutions),
    effects: isObject(value.effects) ? value.effects : {},
    usedStrategyIds: uniqueStrings(value.usedStrategyIds),
    hintsUsed: nonNegativeInteger(value.hintsUsed),
  };
}

export function syncCompatibilityAliases(state) {
  const mission = state.currentMissionId ? getMissionById(state.currentMissionId) : null;
  const runCards = state.activeRun?.availableCards ?? [];
  const selectedIds = new Set(state.activeRun?.selectedInstanceIds ?? []);
  const discoveredSolutions = Object.fromEntries(
    Object.entries(state.progress?.missionRecords ?? {})
      .filter(([, record]) => record.discoveredSolutions.length > 0)
      .map(([id, record]) => [id, record.discoveredSolutions]),
  );
  return {
    ...state,
    currentLocation: state.currentWorldId,
    currentMission: mission,
    availableCards: runCards,
    selectedCards: runCards.filter((card) =>
      selectedIds.has(card.instanceId ?? card.id),
    ),
    pendingCardId: null,
    history: state.activeRun?.history ?? [],
    completedMissions: Object.entries(state.progress?.missionRecords ?? {})
      .filter(([, record]) => record.status === "completed")
      .map(([id]) => id),
    discoveredSolutions,
    earnedRewards: state.progress?.earnedRewardIds ?? [],
    hintsUsed: state.lifetimeHintsUsed,
    missionSolved: state.lifecycle === LIFECYCLE.COMPLETED,
    hintStep: state.activeRun?.hintsUsed ?? 0,
    strategyUsed: state.activeRun?.usedStrategyIds?.at(-1) ?? null,
    sessionCompleted: nonNegativeInteger(state.sessionCompleted),
  };
}

export function migrateLegacyState(raw, fallbackLanguage = "en") {
  const source = isObject(raw) ? raw : {};
  let state = bareState(source.language === "zh-CN" ? "zh-CN" : fallbackLanguage);
  const completed = new Set(
    uniqueStrings(source.completedMissions)
      .map((id) => getMissionById(id)?.id)
      .filter(Boolean),
  );
  const discovered = isObject(source.discoveredSolutions) ? source.discoveredSolutions : {};
  const missionRecords = {};

  for (const mission of MISSIONS) {
    missionRecords[mission.id] = sanitizeMissionRecord({
      status: completed.has(mission.id) ? "completed" : "locked",
      completions: completed.has(mission.id) ? 1 : 0,
      attempts: completed.has(mission.id) ? 1 : 0,
      discoveredSolutions: [
        ...new Set([
          ...uniqueStrings(discovered[mission.id]),
          ...Object.entries(discovered)
            .filter(([legacyId]) => getMissionById(legacyId)?.id === mission.id)
            .flatMap(([, solutions]) => uniqueStrings(solutions)),
        ]),
      ],
      bestHintsUsed: completed.has(mission.id) ? nonNegativeInteger(source.hintsUsed) : null,
    });
  }

  state = {
    ...state,
    language: source.language === "zh-CN" ? "zh-CN" : state.language,
    difficulty: [1, 2, 3].includes(Number(source.difficulty))
      ? Number(source.difficulty)
      : 1,
    profile: {
      name:
        typeof source.profile?.name === "string" && source.profile.name.trim()
          ? source.profile.name.trim().slice(0, 18)
          : "Explorer",
      avatar: AVATARS.has(source.profile?.avatar) ? source.profile.avatar : "star",
    },
    tutorialCompleted: Boolean(source.tutorialCompleted),
    lifetimeHintsUsed: nonNegativeInteger(source.hintsUsed),
    settings: { ...defaultSettings(), ...(isObject(source.settings) ? source.settings : {}) },
    progress: {
      ...state.progress,
      missionRecords,
      earnedRewardIds: uniqueStrings(source.earnedRewards),
    },
    currentScreen: completed.size > 0 ? "map" : "home",
  };
  return syncCompatibilityAliases(reconcileProgression(state));
}

export function normalizeGameState(raw, fallbackLanguage = "en") {
  if (!isObject(raw) || raw.saveVersion !== SAVE_VERSION) {
    return migrateLegacyState(raw, fallbackLanguage);
  }

  const defaults = bareState(raw.language === "zh-CN" ? "zh-CN" : fallbackLanguage);
  const requestedMissionId =
    typeof raw.currentMissionId === "string" ? raw.currentMissionId : raw.currentMission?.id;
  const currentMissionId =
    typeof requestedMissionId === "string" && getMissionById(requestedMissionId)
      ? requestedMissionId
      : null;
  const level = currentMissionId
    ? findLevelForMission(currentMissionId)
    : getLevelById?.(raw.currentLevelId) ?? null;
  const world = level
    ? findWorldForLevel(level.id)
    : getWorldById?.(raw.currentWorldId) ?? orderedWorlds()[0] ?? null;
  let lifecycle = VALID_LIFECYCLES.has(raw.lifecycle) ? raw.lifecycle : LIFECYCLE.IDLE;
  let activeRun = sanitizeActiveRun(raw.activeRun, currentMissionId);
  let completion =
    isObject(raw.completion) && typeof raw.completion.checkpointId === "string"
      ? raw.completion
      : null;

  if (!activeRun && currentMissionId && raw.currentScreen === "game") {
    const availableCards = Array.isArray(raw.availableCards) ? raw.availableCards : [];
    const selectedCards = Array.isArray(raw.selectedCards) ? raw.selectedCards : [];
    const attemptNumber = Math.max(
      1,
      nonNegativeInteger(raw.progress?.missionRecords?.[currentMissionId]?.attempts, 1),
    );
    activeRun = {
      runId: `${currentMissionId}:${attemptNumber}`,
      attemptNumber,
      mode:
        raw.completedMissions?.includes?.(currentMissionId) ? "replay" : "first-play",
      missionId: currentMissionId,
      dealSeed: attemptNumber,
      availableCards,
      selectedInstanceIds: uniqueStrings(
        selectedCards.map((card) => card?.instanceId ?? card?.id),
      ),
      history: Array.isArray(raw.history) ? raw.history : [],
      discoveredSolutions: uniqueStrings(raw.discoveredSolutions?.[currentMissionId]),
      effects: {},
      usedStrategyIds:
        typeof raw.strategyUsed === "string" ? [raw.strategyUsed] : [],
      hintsUsed: nonNegativeInteger(raw.hintStep),
    };
    lifecycle = raw.missionSolved ? LIFECYCLE.COMPLETED : LIFECYCLE.ACTIVE;
    if (raw.missionSolved && !completion) {
      completion = {
        kind: "mission-complete",
        checkpointId: `${activeRun.runId}:mission`,
        runId: activeRun.runId,
        missionId: currentMissionId,
        levelId: level?.id ?? null,
        worldId: world?.id ?? null,
        xpEarned: 0,
        starsEarned: 0,
        unlocks: [],
      };
    }
  }

  if ([LIFECYCLE.LOADING, LIFECYCLE.CHECKING].includes(lifecycle)) {
    lifecycle = activeRun ? LIFECYCLE.ACTIVE : LIFECYCLE.IDLE;
  }
  if (lifecycle === LIFECYCLE.TRANSITIONING) {
    lifecycle = completion ? LIFECYCLE.COMPLETED : activeRun ? LIFECYCLE.ACTIVE : LIFECYCLE.IDLE;
  }
  if (lifecycle === LIFECYCLE.COMPLETED && !completion) {
    lifecycle = activeRun ? LIFECYCLE.ACTIVE : LIFECYCLE.IDLE;
  }

  let state = {
    ...defaults,
    language: raw.language === "zh-CN" ? "zh-CN" : "en",
    difficulty: [1, 2, 3].includes(Number(raw.difficulty)) ? Number(raw.difficulty) : 1,
    currentScreen: VALID_SCREENS.has(raw.currentScreen) ? raw.currentScreen : "home",
    currentWorldId: world?.id ?? defaults.currentWorldId,
    currentLevelId: level?.id ?? null,
    currentMissionId,
    lifecycle,
    transition: {
      locked: false,
      token: null,
      sequence: nonNegativeInteger(raw.transition?.sequence),
    },
    activeRun,
    completion,
    progress: isObject(raw.progress) ? raw.progress : defaults.progress,
    profile: {
      name:
        typeof raw.profile?.name === "string" && raw.profile.name.trim()
          ? raw.profile.name.trim().slice(0, 18)
          : "Explorer",
      avatar: AVATARS.has(raw.profile?.avatar) ? raw.profile.avatar : "star",
    },
    tutorialCompleted: Boolean(raw.tutorialCompleted),
    lifetimeHintsUsed: Math.max(
      nonNegativeInteger(raw.lifetimeHintsUsed),
      nonNegativeInteger(raw.hintsUsed),
    ),
    settings: { ...defaultSettings(), ...(isObject(raw.settings) ? raw.settings : {}) },
    sessionCompleted: nonNegativeInteger(raw.sessionCompleted),
    lastError: typeof raw.lastError === "string" ? raw.lastError : null,
  };
  state = reconcileProgression(state);

  // Until main.js dispatches domain actions, accept its V2-compatible aliases
  // as an input adapter. The normalized records remain authoritative afterward.
  const compatibilityCompleted = new Set(
    uniqueStrings(raw.completedMissions)
      .map((id) => getMissionById(id)?.id)
      .filter(Boolean),
  );
  const compatibilitySolutions = isObject(raw.discoveredSolutions)
    ? raw.discoveredSolutions
    : {};
  if (compatibilityCompleted.size > 0 || Object.keys(compatibilitySolutions).length > 0) {
    const missionRecords = { ...state.progress.missionRecords };
    for (const mission of MISSIONS) {
      const record = missionRecords[mission.id];
      const solutions = [
        ...new Set([
          ...uniqueStrings(compatibilitySolutions[mission.id]),
          ...Object.entries(compatibilitySolutions)
            .filter(([legacyId]) => getMissionById(legacyId)?.id === mission.id)
            .flatMap(([, values]) => uniqueStrings(values)),
        ]),
      ];
      missionRecords[mission.id] = {
        ...record,
        status: compatibilityCompleted.has(mission.id) ? "completed" : record.status,
        completions: compatibilityCompleted.has(mission.id)
          ? Math.max(1, record.completions)
          : record.completions,
        discoveredSolutions:
          solutions.length > 0
            ? [...new Set([...record.discoveredSolutions, ...solutions])]
            : record.discoveredSolutions,
      };
    }
    const rewardIds = new Set((Array.isArray(REWARDS) ? REWARDS : []).map((reward) => reward.id));
    state = reconcileProgression({
      ...state,
      progress: {
        ...state.progress,
        missionRecords,
        earnedRewardIds: [
          ...new Set([
            ...state.progress.earnedRewardIds,
            ...uniqueStrings(raw.earnedRewards).filter((id) => rewardIds.has(id)),
          ]),
        ],
      },
    });
  }

  if (
    state.currentMissionId &&
    state.progress.missionRecords[state.currentMissionId]?.status === "locked"
  ) {
    if (raw.currentScreen === "game" && activeRun) {
      state = unlockMission(state, state.currentMissionId);
    } else {
      state = {
        ...state,
        currentMissionId: null,
        currentLevelId: null,
        activeRun: null,
        completion: null,
        lifecycle: LIFECYCLE.IDLE,
        currentScreen: "map",
      };
    }
  }

  return syncCompatibilityAliases(state);
}

export function createDefaultGameState(options = {}) {
  const state = bareState(options.language);
  return normalizeGameState({
    ...state,
    difficulty: options.difficulty ?? state.difficulty,
    profile: { ...state.profile, ...(options.profile ?? {}) },
    settings: { ...state.settings, ...(options.settings ?? {}) },
  }, options.language);
}

export function getRankForExperience(experience) {
  const ranks = (Array.isArray(RANKS) && RANKS.length > 0 ? RANKS : DEFAULT_RANKS)
    .map((rank, index) => ({
      ...rank,
      minimumXp: nonNegativeInteger(
        rank.minimumXp ??
          rank.minimumExperience ??
          rank.minXp ??
          rank.xpRequired ??
          rank.xp,
        DEFAULT_RANKS[index]?.minimumXp ?? 0,
      ),
    }))
    .sort((left, right) => left.minimumXp - right.minimumXp);
  const xp = nonNegativeInteger(experience);
  const current = [...ranks].reverse().find((rank) => xp >= rank.minimumXp) ?? ranks[0];
  const index = ranks.indexOf(current);
  const next = ranks[index + 1] ?? null;
  return {
    ...current,
    number: index + 1,
    next,
    progress: next
      ? Math.max(0, Math.min(1, (xp - current.minimumXp) / (next.minimumXp - current.minimumXp)))
      : 1,
  };
}

export function getPlayerRank(state) {
  return getRankForExperience(state.progress?.experience);
}

export function getTotalStars(state) {
  return Object.values(state.progress?.levelRecords ?? {})
    .reduce((total, record) => total + Math.min(3, nonNegativeInteger(record.stars)), 0);
}

export function getFirstPlayableMission(state) {
  for (const world of orderedWorlds()) {
    if (state.progress?.worldRecords?.[world.id]?.status === "locked") continue;
    for (const level of levelsForWorld(world.id)) {
      if (state.progress?.levelRecords?.[level.id]?.status === "locked") continue;
      const missionId = missionIdsForLevel(level).find(
        (id) => state.progress?.missionRecords?.[id]?.status !== "locked",
      );
      if (missionId) return { worldId: world.id, levelId: level.id, missionId };
    }
  }
  return null;
}

export function awardExperience(state, amount, ledgerKey) {
  const xp = nonNegativeInteger(amount);
  if (!ledgerKey || xp === 0 || state.progress.rewardLedger.includes(ledgerKey)) return state;
  return {
    ...state,
    progress: {
      ...state.progress,
      experience: state.progress.experience + xp,
      rewardLedger: [...state.progress.rewardLedger, ledgerKey],
    },
  };
}

function unlockRecord(records, id) {
  if (!records[id] || records[id].status !== "locked") return records;
  return { ...records, [id]: { ...records[id], status: "unlocked" } };
}

export function unlockMission(state, missionId) {
  if (!getMissionById(missionId)) return state;
  return {
    ...state,
    progress: {
      ...state.progress,
      missionRecords: unlockRecord(state.progress.missionRecords, missionId),
    },
  };
}

export function unlockLevel(state, levelId) {
  if (!getLevelById?.(levelId)) return state;
  return {
    ...state,
    progress: {
      ...state.progress,
      levelRecords: unlockRecord(state.progress.levelRecords, levelId),
    },
  };
}

export function unlockWorld(state, worldId) {
  if (!getWorldById?.(worldId)) return state;
  return {
    ...state,
    progress: {
      ...state.progress,
      worldRecords: unlockRecord(state.progress.worldRecords, worldId),
    },
  };
}

function withTransition(state, lifecycle, operation) {
  if (state.transition?.locked) return state;
  const sequence = nonNegativeInteger(state.transition?.sequence) + 1;
  const token = `transition-${sequence}`;
  const locked = {
    ...state,
    lifecycle,
    transition: { locked: true, token, sequence },
    lastError: null,
  };
  try {
    const result = operation(locked);
    return syncCompatibilityAliases({
      ...result,
      transition: { locked: false, token: null, sequence },
    });
  } catch (error) {
    console.error("Mathzlet progression transition failed", error);
    return syncCompatibilityAliases({
      ...state,
      transition: { locked: false, token: null, sequence },
      lastError: "progressionRecovery",
    });
  }
}

function startMissionInternal(state, missionId, options = {}) {
  const mission = getMissionById(missionId);
  const level = findLevelForMission(missionId);
  const world = level ? findWorldForLevel(level.id) : null;
  const record = state.progress.missionRecords[missionId];
  if (!mission || !level || !world || !record || record.status === "locked") return state;
  const attemptNumber = record.attempts + 1;
  const mode = options.mode === "replay" || record.status === "completed" ? "replay" : "first-play";
  const runId = `${missionId}:${attemptNumber}`;
  const missionRecords = {
    ...state.progress.missionRecords,
    [missionId]: { ...record, attempts: attemptNumber },
  };
  return {
    ...state,
    currentScreen: "game",
    currentWorldId: world.id,
    currentLevelId: level.id,
    currentMissionId: missionId,
    lifecycle: LIFECYCLE.ACTIVE,
    completion: null,
    activeRun: {
      runId,
      attemptNumber,
      mode,
      missionId,
      dealSeed: nonNegativeInteger(options.dealSeed, attemptNumber),
      availableCards: Array.isArray(options.availableCards) ? options.availableCards : [],
      selectedInstanceIds: uniqueStrings(options.selectedInstanceIds),
      history: [],
      discoveredSolutions: [...record.discoveredSolutions],
      effects: {},
      usedStrategyIds: [],
      hintsUsed: 0,
    },
    progress: { ...state.progress, missionRecords },
  };
}

export function startMission(state, missionId, options = {}) {
  if (!state || state.lifecycle === LIFECYCLE.CHECKING) return state;
  return withTransition(reconcileProgression(state), LIFECYCLE.LOADING, (locked) =>
    startMissionInternal(locked, missionId, options),
  );
}

export function replayMission(state, missionId, options = {}) {
  const normalized = reconcileProgression(state);
  if (normalized.progress.missionRecords[missionId]?.status !== "completed") return state;
  return withTransition(normalized, LIFECYCLE.LOADING, (locked) =>
    startMissionInternal(locked, missionId, { ...options, mode: "replay" }),
  );
}

export function recordSolution(state, canonicalSolution) {
  if (!state.activeRun || typeof canonicalSolution !== "string" || !canonicalSolution) return state;
  const missionId = state.activeRun.missionId;
  const record = state.progress.missionRecords[missionId];
  if (!record || record.discoveredSolutions.includes(canonicalSolution)) return state;
  const discoveredSolutions = [...record.discoveredSolutions, canonicalSolution];
  return {
    ...state,
    activeRun: { ...state.activeRun, discoveredSolutions },
    progress: {
      ...state.progress,
      missionRecords: {
        ...state.progress.missionRecords,
        [missionId]: { ...record, discoveredSolutions },
      },
    },
  };
}

export function useHint(state) {
  if (!state?.activeRun || state.lifecycle !== LIFECYCLE.ACTIVE) return state;
  return syncCompatibilityAliases({
    ...state,
    activeRun: {
      ...state.activeRun,
      hintsUsed: state.activeRun.hintsUsed + 1,
    },
  });
}

function configuredMissionXp(mission) {
  const configured = Number(
    mission?.xp ?? mission?.xpReward ?? mission?.rewardXp ?? mission?.rewards?.xp,
  );
  if (Number.isFinite(configured) && configured >= 0) return Math.floor(configured);
  return ["pattern", "open-ended", "compound-target", "sequence-build"].includes(mission?.type)
    ? 12
    : 10;
}

function levelStars(state, levelId) {
  const level = getLevelById?.(levelId);
  const missionIds = missionIdsForLevel(level);
  if (
    missionIds.length === 0 ||
    !missionIds.every((id) => state.progress.missionRecords[id]?.status === "completed")
  ) return 0;
  const records = missionIds.map((id) => state.progress.missionRecords[id]);
  const reasoningComplete =
    records.some((record) => record.bonusCompleted || record.discoveredSolutions.length >= 2);
  const hintMastery = records.every((record) => record.bestHintsUsed === 0);
  return 1 + Number(reasoningComplete) + Number(hintMastery);
}

function statusChanges(before, after, key) {
  const changes = [];
  for (const [id, record] of Object.entries(after.progress[key])) {
    const oldStatus = before.progress[key]?.[id]?.status ?? "locked";
    if (oldStatus !== record.status) changes.push({ id, from: oldStatus, to: record.status });
  }
  return changes;
}

export function completeMission(state, result = {}) {
  if (
    !state?.activeRun ||
    ![LIFECYCLE.ACTIVE, LIFECYCLE.CHECKING].includes(state.lifecycle) ||
    result.valid === false ||
    state.completion?.runId === state.activeRun.runId
  ) return state;

  return withTransition(reconcileProgression(state), LIFECYCLE.CHECKING, (locked) => {
    const missionId = locked.activeRun.missionId;
    const mission = getMissionById(missionId);
    const level = findLevelForMission(missionId);
    const world = level ? findWorldForLevel(level.id) : null;
    if (!mission || !level || !world) return locked;
    const before = locked;
    const canonical =
      typeof result.canonicalSolution === "string"
        ? result.canonicalSolution
        : typeof result.canonical === "string"
          ? result.canonical
          : `${missionId}|run:${locked.activeRun.runId}`;
    let next = recordSolution(locked, canonical);
    const record = next.progress.missionRecords[missionId];
    const required = Math.max(1, nonNegativeInteger(mission.solutionsRequired, 1));
    if (record.discoveredSolutions.length < required && result.forceComplete !== true) {
      return { ...next, lifecycle: LIFECYCLE.ACTIVE };
    }

    const firstCompletion = record.completions === 0;
    const hintsUsed = nonNegativeInteger(next.activeRun.hintsUsed);
    const bestHintsUsed =
      record.bestHintsUsed === null ? hintsUsed : Math.min(record.bestHintsUsed, hintsUsed);
    const completedRecord = {
      ...record,
      status: "completed",
      completions: record.completions + 1,
      bestHintsUsed,
      firstCompletedAt: record.firstCompletedAt ?? result.completedAt ?? null,
      bonusCompleted: record.bonusCompleted || Boolean(result.bonusCompleted),
    };
    next = {
      ...next,
      progress: {
        ...next.progress,
        missionRecords: {
          ...next.progress.missionRecords,
          [missionId]: completedRecord,
        },
        earnedRewardIds:
          mission.rewardId && !next.progress.earnedRewardIds.includes(mission.rewardId)
            ? [...next.progress.earnedRewardIds, mission.rewardId]
            : next.progress.earnedRewardIds,
      },
      lifetimeHintsUsed: next.lifetimeHintsUsed + hintsUsed,
    };

    let xpEarned = 0;
    const applyXp = (amount, ledgerKey) => {
      const beforeXp = next.progress.experience;
      next = awardExperience(next, amount, ledgerKey);
      xpEarned += next.progress.experience - beforeXp;
    };
    if (firstCompletion) {
      applyXp(configuredMissionXp(mission), `mission:${missionId}:first`);
    } else if (completedRecord.rewardedReplayCount < 3) {
      applyXp(2, `run:${next.activeRun.runId}:replay`);
      next = {
        ...next,
        progress: {
          ...next.progress,
          missionRecords: {
            ...next.progress.missionRecords,
            [missionId]: {
              ...next.progress.missionRecords[missionId],
              rewardedReplayCount: completedRecord.rewardedReplayCount + 1,
            },
          },
        },
      };
    }
    if (completedRecord.discoveredSolutions.length >= 2) {
      applyXp(5, `mission:${missionId}:second-solution`);
    }
    if (hintsUsed === 0) {
      applyXp(3, `mission:${missionId}:no-hint`);
    }

    next = reconcileProgression(next);
    const previousStars = before.progress.levelRecords[level.id]?.stars ?? 0;
    const earnedStars = levelStars(next, level.id);
    if (earnedStars > previousStars) {
      next = {
        ...next,
        progress: {
          ...next.progress,
          levelRecords: {
            ...next.progress.levelRecords,
            [level.id]: {
              ...next.progress.levelRecords[level.id],
              stars: earnedStars,
            },
          },
        },
      };
    }

    const levelWasComplete = before.progress.levelRecords[level.id]?.status === "completed";
    const worldWasComplete = before.progress.worldRecords[world.id]?.status === "completed";
    if (!levelWasComplete && next.progress.levelRecords[level.id]?.status === "completed") {
      applyXp(20, `level:${level.id}:first`);
    }
    if (!worldWasComplete && next.progress.worldRecords[world.id]?.status === "completed") {
      applyXp(50, `world:${world.id}:first`);
    }

    const checkpointId = `${next.activeRun.runId}:mission`;
    const unlocks = [
      ...statusChanges(before, next, "missionRecords"),
      ...statusChanges(before, next, "levelRecords"),
      ...statusChanges(before, next, "worldRecords"),
    ].filter((change) => change.to === "unlocked");
    return {
      ...next,
      lifecycle: LIFECYCLE.COMPLETED,
      currentScreen: "mission-complete",
      completion: {
        kind: "mission-complete",
        checkpointId,
        runId: next.activeRun.runId,
        missionId,
        levelId: level.id,
        worldId: world.id,
        xpEarned,
        starsEarned: Math.max(0, earnedStars - previousStars),
        totalStars: getTotalStars(next),
        unlocks,
      },
      sessionCompleted: nonNegativeInteger(next.sessionCompleted) + 1,
    };
  });
}

function nextLevelAfter(world, levelId) {
  const levels = levelsForWorld(world.id);
  const index = levels.findIndex((level) => level.id === levelId);
  return index >= 0 ? levels[index + 1] ?? null : null;
}

function nextWorldAfter(worldId) {
  const worlds = orderedWorlds();
  const index = worlds.findIndex((world) => world.id === worldId);
  return index >= 0 ? worlds[index + 1] ?? null : null;
}

export function resolveNextAction(state) {
  const completion = state?.completion;
  if (!completion) return null;
  const level = getLevelById?.(completion.levelId);
  const world = getWorldById?.(completion.worldId) ?? findWorldForLevel(completion.levelId);
  if (!level || !world) return { kind: "game-complete" };

  if (completion.kind === "mission-complete") {
    const missionIds = missionIdsForLevel(level);
    const currentIndex = missionIds.indexOf(completion.missionId);
    const nextMissionId = missionIds.slice(currentIndex + 1).find(
      (id) => state.progress.missionRecords[id]?.status !== "locked",
    );
    return nextMissionId
      ? {
          kind: "next-mission",
          worldId: world.id,
          levelId: level.id,
          missionId: nextMissionId,
        }
      : { kind: "level-complete", worldId: world.id, levelId: level.id };
  }

  if (completion.kind === "level-complete") {
    const nextLevel = nextLevelAfter(world, level.id);
    if (nextLevel) {
      return {
        kind: "next-level",
        worldId: world.id,
        levelId: nextLevel.id,
        missionId: missionIdsForLevel(nextLevel)[0] ?? null,
      };
    }
    return { kind: "world-complete", worldId: world.id, levelId: level.id };
  }

  if (completion.kind === "world-complete") {
    const nextWorld = nextWorldAfter(world.id);
    if (!nextWorld) return { kind: "game-complete", worldId: world.id };
    const nextLevel = levelsForWorld(nextWorld.id)[0] ?? null;
    return {
      kind: "next-world",
      worldId: nextWorld.id,
      levelId: nextLevel?.id ?? null,
      missionId: missionIdsForLevel(nextLevel)[0] ?? null,
    };
  }

  return { kind: "game-complete", worldId: world.id };
}

export function advanceProgression(state, options = {}) {
  if (
    !state?.completion ||
    state.lifecycle !== LIFECYCLE.COMPLETED ||
    (options.checkpointId && options.checkpointId !== state.completion.checkpointId)
  ) return state;

  return withTransition(state, LIFECYCLE.TRANSITIONING, (locked) => {
    const next = resolveNextAction(locked);
    if (!next) return locked;
    if (["next-mission", "next-level", "next-world"].includes(next.kind) && next.missionId) {
      return startMissionInternal(locked, next.missionId, options);
    }
    if (next.kind === "level-complete") {
      return {
        ...locked,
        lifecycle: LIFECYCLE.COMPLETED,
        currentScreen: "level-complete",
        completion: {
          ...locked.completion,
          kind: "level-complete",
          checkpointId: `${locked.completion.runId}:level`,
        },
      };
    }
    if (next.kind === "world-complete") {
      return {
        ...locked,
        lifecycle: LIFECYCLE.COMPLETED,
        currentScreen: "world-complete",
        completion: {
          ...locked.completion,
          kind: "world-complete",
          checkpointId: `${locked.completion.runId}:world`,
        },
      };
    }
    return {
      ...locked,
      lifecycle: LIFECYCLE.COMPLETED,
      currentScreen: "game-complete",
      completion: {
        ...locked.completion,
        kind: "game-complete",
        checkpointId: `${locked.completion.runId}:game`,
      },
    };
  });
}

export function returnToMap(state) {
  return syncCompatibilityAliases({
    ...state,
    currentScreen: "map",
    lifecycle: state.activeRun ? LIFECYCLE.ACTIVE : LIFECYCLE.IDLE,
    completion: null,
  });
}

export function resetProgress(state, options = {}) {
  return createDefaultGameState({
    language: options.language ?? state?.language,
    difficulty: options.difficulty ?? state?.difficulty,
    profile: options.keepProfile === false ? undefined : state?.profile,
    settings: state?.settings,
  });
}

export function reduceProgression(state, action = {}) {
  switch (action.type) {
    case PROGRESSION_ACTION.START_MISSION:
      return startMission(state, action.missionId, action);
    case PROGRESSION_ACTION.REPLAY_MISSION:
      return replayMission(state, action.missionId, action);
    case PROGRESSION_ACTION.RECORD_SOLUTION:
      return recordSolution(state, action.canonicalSolution);
    case PROGRESSION_ACTION.USE_HINT:
      return useHint(state);
    case PROGRESSION_ACTION.COMPLETE_MISSION:
      return completeMission(state, action.result ?? action);
    case PROGRESSION_ACTION.AWARD_EXPERIENCE:
      return awardExperience(state, action.amount, action.ledgerKey);
    case PROGRESSION_ACTION.UNLOCK_MISSION:
      return unlockMission(state, action.missionId);
    case PROGRESSION_ACTION.UNLOCK_LEVEL:
      return unlockLevel(state, action.levelId);
    case PROGRESSION_ACTION.UNLOCK_WORLD:
      return unlockWorld(state, action.worldId);
    case PROGRESSION_ACTION.ADVANCE:
      return advanceProgression(state, action);
    case PROGRESSION_ACTION.RETURN_TO_MAP:
      return returnToMap(state);
    case PROGRESSION_ACTION.RESET_PROGRESS:
      return resetProgress(state, action);
    default:
      return state;
  }
}
