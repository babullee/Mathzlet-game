const STORAGE_KEY = "mathzlet-state-v2";
const LEGACY_STORAGE_KEY = "25y-puzzle-state-v1";

export function loadStoredState() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY));
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

export function saveStoredState(state) {
  try {
    const persisted = {
      language: state.language,
      difficulty: state.difficulty,
      completedMissions: state.completedMissions,
      discoveredSolutions: state.discoveredSolutions,
      earnedRewards: state.earnedRewards,
      hintsUsed: state.hintsUsed,
      tutorialCompleted: state.tutorialCompleted,
      profile: state.profile,
      settings: state.settings,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    // Storage can be unavailable in private browsing; play should still continue.
  }
}

export function clearStoredState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // A failed clear must not trap the player in settings.
  }
}
