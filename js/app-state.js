import { loadStoredState, saveStoredState } from "./storage.js";

const defaultSettings = {
  sound: false,
  reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  animationIntensity: "calm",
  showQuantities: true,
};

export function createInitialState(initialLanguage) {
  const saved = loadStoredState();
  return {
    language: saved.language === "zh-CN" ? "zh-CN" : initialLanguage,
    difficulty: [1, 2, 3].includes(Number(saved.difficulty)) ? Number(saved.difficulty) : 1,
    currentScreen: "home",
    currentLocation: null,
    currentMission: null,
    availableCards: [],
    selectedCards: [],
    pendingCardId: null,
    history: [],
    completedMissions: Array.isArray(saved.completedMissions) ? saved.completedMissions : [],
    discoveredSolutions: saved.discoveredSolutions && typeof saved.discoveredSolutions === "object" ? saved.discoveredSolutions : {},
    earnedRewards: Array.isArray(saved.earnedRewards) ? saved.earnedRewards : [],
    hintsUsed: Number(saved.hintsUsed) || 0,
    tutorialCompleted: Boolean(saved.tutorialCompleted),
    profile: {
      name: typeof saved.profile?.name === "string" && saved.profile.name.trim() ? saved.profile.name.trim().slice(0, 18) : "Explorer",
      avatar: ["star", "fox", "rocket", "leaf"].includes(saved.profile?.avatar) ? saved.profile.avatar : "star",
    },
    missionSolved: false,
    hintStep: 0,
    strategyUsed: null,
    sessionCompleted: 0,
    settings: { ...defaultSettings, ...(saved.settings ?? {}) },
  };
}

export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState: () => state,
    setState(update, { persist = true } = {}) {
      state = typeof update === "function" ? update(state) : { ...state, ...update };
      if (persist) saveStoredState(state);
      listeners.forEach((listener) => listener(state));
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
