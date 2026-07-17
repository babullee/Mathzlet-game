import {
  SAVE_VERSION,
  createDefaultGameState,
  normalizeGameState,
} from "./game/progression.js";

export const STORAGE_KEY = "mathzlet-state-v3";
export const V2_STORAGE_KEY = "mathzlet-state-v2";
export const LEGACY_STORAGE_KEY = "25y-puzzle-state-v1";

function resolveStorage(storage) {
  return storage ?? globalThis.localStorage ?? null;
}

function parseStoredValue(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function serializeGameState(state) {
  const normalized = normalizeGameState(state, state?.language);
  return {
    saveVersion: SAVE_VERSION,
    language: normalized.language,
    difficulty: normalized.difficulty,
    currentScreen: normalized.currentScreen,
    currentWorldId: normalized.currentWorldId,
    currentLevelId: normalized.currentLevelId,
    currentMissionId: normalized.currentMissionId,
    lifecycle: normalized.lifecycle,
    transition: {
      locked: false,
      token: null,
      sequence: normalized.transition.sequence,
    },
    activeRun: normalized.activeRun,
    completion: normalized.completion,
    progress: normalized.progress,
    profile: normalized.profile,
    tutorialCompleted: normalized.tutorialCompleted,
    lifetimeHintsUsed: normalized.lifetimeHintsUsed,
    settings: normalized.settings,
    sessionCompleted: normalized.sessionCompleted,
  };
}

export function loadStoredState(storage, fallbackLanguage = "en") {
  const target = resolveStorage(storage);
  if (!target) return createDefaultGameState({ language: fallbackLanguage });

  try {
    const candidates = [
      { key: STORAGE_KEY, value: parseStoredValue(target.getItem(STORAGE_KEY)) },
      { key: V2_STORAGE_KEY, value: parseStoredValue(target.getItem(V2_STORAGE_KEY)) },
      { key: LEGACY_STORAGE_KEY, value: parseStoredValue(target.getItem(LEGACY_STORAGE_KEY)) },
    ];
    const candidate = candidates.find((item) => item.value);
    if (!candidate) return createDefaultGameState({ language: fallbackLanguage });

    const normalized = normalizeGameState(candidate.value, fallbackLanguage);
    if (candidate.key !== STORAGE_KEY || candidate.value.saveVersion !== SAVE_VERSION) {
      try {
        target.setItem(STORAGE_KEY, JSON.stringify(serializeGameState(normalized)));
      } catch {
        // A readable legacy save should still load when storage is temporarily read-only.
      }
    }
    return normalized;
  } catch (error) {
    console.warn("Mathzlet save data could not be loaded; using a clean adventure.", error);
    return createDefaultGameState({ language: fallbackLanguage });
  }
}

export function saveStoredState(state, storage) {
  const target = resolveStorage(storage);
  if (!target) return false;
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(serializeGameState(state)));
    return true;
  } catch {
    // Storage can be unavailable in private browsing; play should still continue.
    return false;
  }
}

export function clearStoredState(storage) {
  const target = resolveStorage(storage);
  if (!target) return false;
  try {
    target.removeItem(STORAGE_KEY);
    target.removeItem(V2_STORAGE_KEY);
    target.removeItem(LEGACY_STORAGE_KEY);
    return true;
  } catch {
    // A failed clear must not trap the player in settings.
    return false;
  }
}
