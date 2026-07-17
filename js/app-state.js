import { loadStoredState, saveStoredState } from "./storage.js";
import {
  createDefaultGameState,
  normalizeGameState,
  reduceProgression,
} from "./game/progression.js";

export function createInitialState(initialLanguage = "en", storage) {
  return loadStoredState(storage, initialLanguage);
}

export function createStore(initialState, { storage } = {}) {
  let state = normalizeGameState(
    initialState ?? createDefaultGameState(),
    initialState?.language,
  );
  const listeners = new Set();
  let notifying = false;

  function notify() {
    if (notifying) return;
    notifying = true;
    try {
      listeners.forEach((listener) => listener(state));
    } finally {
      notifying = false;
    }
  }

  function commit(nextState, { persist = true } = {}) {
    state = nextState;
    if (persist) saveStoredState(state, storage);
    notify();
    return state;
  }

  return {
    getState: () => state,

    /**
     * Compatibility update path for the existing renderer. New progression
     * code should prefer dispatch(), whose actions are normalized and guarded.
     */
    setState(update, options = {}) {
      const next =
        typeof update === "function"
          ? update(state)
          : { ...state, ...(update && typeof update === "object" ? update : {}) };
      return commit(next, options);
    },

    dispatch(action, options = {}) {
      const next = reduceProgression(state, action);
      if (next === state) return state;
      return commit(next, options);
    },

    replaceState(nextState, options = {}) {
      return commit(normalizeGameState(nextState, state.language), options);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
