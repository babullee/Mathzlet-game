import { NUMBER_CARDS, getNumberCardByValue, getStrategyCardById } from "../data/cards.js";
import { MISSIONS, SAFE_FALLBACK_MISSION_ID, getMissionById } from "../data/missions.js";
import { VALIDATION_STATUS, validateMissionData, validateSubmission } from "./validation.js";

const identityOf = (card) => card?.instanceId ?? card?.id ?? null;

function clampDifficulty(difficulty) {
  return Math.min(3, Math.max(1, Number(difficulty) || 1));
}

function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function createCardInstance(definition, index = 0, prefix = "deal") {
  if (!definition || typeof definition !== "object" || !definition.id) return null;
  return {
    ...definition,
    instanceId: `${prefix}-${definition.id}-${index + 1}`,
  };
}

export function createHandFromValues(values, prefix = "deal") {
  if (!Array.isArray(values)) return [];
  return values
    .map((value, index) => createCardInstance(getNumberCardByValue(value), index, prefix))
    .filter(Boolean);
}

export function getMissionsForContext({
  difficulty = 1,
  location = null,
  missions = MISSIONS,
} = {}) {
  const level = clampDifficulty(difficulty);
  return missions.filter(
    (mission) =>
      mission.difficulty <= level && (!location || mission.location === location),
  );
}

export function selectNextMission({
  difficulty = 1,
  location = null,
  previousMissionId = null,
  previousMissionType = null,
  missions = MISSIONS,
  random = Math.random,
} = {}) {
  const eligible = getMissionsForContext({ difficulty, location, missions });
  if (eligible.length === 0) return getMissionById(SAFE_FALLBACK_MISSION_ID);

  const withoutPrevious = eligible.filter((mission) => mission.id !== previousMissionId);
  const idCandidates = withoutPrevious.length > 0 ? withoutPrevious : eligible;
  const variedTypes = idCandidates.filter((mission) => mission.type !== previousMissionType);
  const candidates = variedTypes.length > 0 ? variedTypes : idCandidates;
  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  return candidates[index];
}

function combinations(items, size, start = 0, current = [], result = []) {
  if (current.length === size) {
    result.push([...current]);
    return result;
  }
  for (let index = start; index <= items.length - (size - current.length); index += 1) {
    current.push(items[index]);
    combinations(items, size, index + 1, current, result);
    current.pop();
  }
  return result;
}

function permutations(items) {
  if (items.length <= 1) return [items];
  const result = [];
  items.forEach((item, index) => {
    const remainder = [...items.slice(0, index), ...items.slice(index + 1)];
    for (const tail of permutations(remainder)) result.push([item, ...tail]);
  });
  return result;
}

export function enumerateValidSolutions(mission, availableCards) {
  if (!validateMissionData(mission).valid || !Array.isArray(availableCards)) return [];
  const minimum = mission.minimumCards ?? 1;
  const maximum = Math.min(mission.maximumCards ?? minimum, availableCards.length);
  const ordered =
    mission.type === "sequence-build" ||
    (mission.allowedOperations?.includes("subtract") &&
      !mission.allowedOperations?.includes("add"));
  const solutions = new Map();

  for (let size = minimum; size <= maximum; size += 1) {
    for (const subset of combinations(availableCards, size)) {
      const candidates = ordered ? permutations(subset) : [subset];
      for (const selectedCards of candidates) {
        const validation = validateSubmission({
          mission,
          availableCards,
          selectedCards,
          discoveredSolutions: [],
        });
        if (validation.status === VALIDATION_STATUS.VALID_NEW) {
          solutions.set(validation.canonicalSolution, {
            canonicalSolution: validation.canonicalSolution,
            selectedCards,
          });
        }
      }
    }
  }

  return [...solutions.values()];
}

export function missionHasEnoughSolutions(mission, availableCards) {
  const required = mission?.solutionsRequired ?? 1;
  return enumerateValidSolutions(mission, availableCards).length >= required;
}

function choiceCardsForMission(mission) {
  return (mission.choices ?? []).map((card, index) => ({
    ...card,
    instanceId: card.instanceId ?? card.id ?? `choice-${index + 1}`,
  }));
}

function fallbackDealFor(mission) {
  if (Array.isArray(mission.choices)) return choiceCardsForMission(mission);
  return createHandFromValues(mission.fallbackHandValues ?? [], `fallback-${mission.id}`);
}

/**
 * Returns a mission plus a hand/options already proven feasible. No input is mutated.
 */
export function createMissionDeal(
  requestedMission,
  {
    numberCards = NUMBER_CARDS,
    random = Math.random,
    maximumAttempts = 3,
  } = {},
) {
  const requestedCheck = validateMissionData(requestedMission);
  const safeMission = getMissionById(SAFE_FALLBACK_MISSION_ID);
  const mission = requestedCheck.valid ? requestedMission : safeMission;

  if (Array.isArray(mission.choices)) {
    const availableCards = choiceCardsForMission(mission);
    return {
      mission,
      availableCards,
      source: requestedCheck.valid ? "choices" : "safe-fallback",
      solvable: missionHasEnoughSolutions(mission, availableCards),
    };
  }

  const level = clampDifficulty(mission.difficulty);
  const allowedValues = Array.isArray(mission.allowedValues)
    ? new Set(mission.allowedValues.map(Number))
    : null;
  const pool = numberCards.filter(
    (card) =>
      card.type === "number" &&
      card.difficulty <= level &&
      card.value !== 20 &&
      (!allowedValues || allowedValues.has(card.value)),
  );
  const handSize = Math.min(mission.handSize ?? 4, pool.length);

  for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
    const definitions = shuffled(pool, random).slice(0, handSize);
    const availableCards = definitions
      .map((definition, index) => createCardInstance(definition, index, `${mission.id}-${attempt}`))
      .filter(Boolean);
    if (missionHasEnoughSolutions(mission, availableCards)) {
      return { mission, availableCards, source: "generated", solvable: true };
    }
  }

  const fallbackCards = fallbackDealFor(mission);
  if (missionHasEnoughSolutions(mission, fallbackCards)) {
    return {
      mission,
      availableCards: fallbackCards,
      source: requestedCheck.valid ? "curated-fallback" : "safe-fallback",
      solvable: true,
    };
  }

  const safeCards = fallbackDealFor(safeMission);
  return {
    mission: safeMission,
    availableCards: safeCards,
    source: "safe-fallback",
    solvable: missionHasEnoughSolutions(safeMission, safeCards),
  };
}

function normalizedInstance(card, index, prefix) {
  if (!card || typeof card !== "object" || !Number.isFinite(Number(card.value))) return null;
  return {
    ...card,
    instanceId: card.instanceId ?? `${prefix}-${card.id ?? `number-${card.value}`}-${index + 1}`,
  };
}

/** Pure strategy reducer. Caller supplies visible replacement/draw cards. */
export function applyStrategyEffect(
  {
    mission,
    availableCards = [],
    effects = {},
    usedStrategyIds = [],
    hintsUsed = 0,
  },
  strategyId,
  payload = {},
) {
  const strategy = getStrategyCardById(strategyId);
  const unchanged = {
    mission,
    availableCards: [...availableCards],
    effects: { ...effects },
    usedStrategyIds: [...usedStrategyIds],
    hintsUsed,
  };
  if (!strategy) return { ok: false, reasonKey: "strategyUnknown", state: unchanged };
  if (usedStrategyIds.includes(strategyId)) {
    return { ok: false, reasonKey: "strategyAlreadyUsed", state: unchanged };
  }
  if (
    strategy.compatibleMissionTypes &&
    !strategy.compatibleMissionTypes.includes(mission?.type)
  ) {
    return { ok: false, reasonKey: "strategyNotCompatible", state: unchanged };
  }

  let nextCards = [...availableCards];
  const nextEffects = { ...effects };
  let nextHintsUsed = hintsUsed;

  if (strategyId === "swap-one") {
    const removeIndex = nextCards.findIndex(
      (card) => identityOf(card) === payload.removeInstanceId,
    );
    const replacement = normalizedInstance(
      payload.replacementCard,
      nextCards.length,
      `${mission?.id ?? "mission"}-swap`,
    );
    if (removeIndex < 0 || !replacement) {
      return { ok: false, reasonKey: "strategyChooseSwapCards", state: unchanged };
    }
    if ((payload.selectedInstanceIds ?? []).includes(payload.removeInstanceId)) {
      return { ok: false, reasonKey: "strategyUndoSelectedCardFirst", state: unchanged };
    }
    nextCards = nextCards.map((card, index) => (index === removeIndex ? replacement : card));
  } else if (strategyId === "draw-extra") {
    if (nextCards.length >= 8) {
      return { ok: false, reasonKey: "strategyHandIsFull", state: unchanged };
    }
    const extraCard = normalizedInstance(
      payload.card,
      nextCards.length,
      `${mission?.id ?? "mission"}-extra`,
    );
    if (!extraCard) return { ok: false, reasonKey: "strategyChooseExtraCard", state: unchanged };
    nextCards = [...nextCards, extraCard];
  } else if (strategyId === "ask-clue") {
    nextEffects.hintLevel = Math.min(3, (Number(nextEffects.hintLevel) || 0) + 1);
    nextHintsUsed += 1;
  } else if (strategyId === "echo-card") {
    if (!nextCards.some((card) => identityOf(card) === payload.instanceId)) {
      return { ok: false, reasonKey: "strategyChooseEchoCard", state: unchanged };
    }
    nextEffects.echoCardInstanceId = payload.instanceId;
  } else if (strategyId === "nudge-target") {
    if (![1, -1].includes(payload.delta)) {
      return { ok: false, reasonKey: "strategyChooseTargetDirection", state: unchanged };
    }
    const target = Number(mission?.target) + payload.delta;
    if (
      Array.isArray(mission?.targetRange) &&
      (target < Number(mission.targetRange[0]) || target > Number(mission.targetRange[1]))
    ) {
      return { ok: false, reasonKey: "strategyTargetOutsideRange", state: unchanged };
    }
    nextEffects.targetDelta = payload.delta;
  }

  return {
    ok: true,
    reasonKey: "strategyApplied",
    state: {
      mission,
      availableCards: nextCards,
      effects: nextEffects,
      usedStrategyIds: [...usedStrategyIds, strategyId],
      hintsUsed: nextHintsUsed,
    },
  };
}

export function findSolvableReplacementOptions({
  mission,
  availableCards,
  removeInstanceId,
  cardPool = NUMBER_CARDS,
  limit = 3,
}) {
  const removeIndex = availableCards.findIndex(
    (card) => identityOf(card) === removeInstanceId,
  );
  if (removeIndex < 0) return [];

  const options = [];
  for (const definition of cardPool) {
    const replacement = createCardInstance(
      definition,
      removeIndex,
      `${mission.id}-offer`,
    );
    const candidateHand = availableCards.map((card, index) =>
      index === removeIndex ? replacement : card,
    );
    if (missionHasEnoughSolutions(mission, candidateHand)) options.push(replacement);
    if (options.length >= limit) break;
  }
  return options;
}

/** Compact board integration API: returns only the already-solvable cards. */
export function dealCardsForMission(mission) {
  // The compact API is deterministic so validateMission can reconstruct the
  // complete classification hand from mission data. createMissionDeal remains
  // available when a caller wants generated variety plus explicit deal metadata.
  return createMissionDeal(mission, { maximumAttempts: 0 }).availableCards;
}

/**
 * Compact map integration API. Prefers unfinished content, while allowing
 * completed missions to be replayed after the local pool is exhausted.
 */
export function getNextMission(
  location,
  difficulty,
  completedIds = [],
  currentId = null,
) {
  const completed = new Set(Array.isArray(completedIds) ? completedIds : []);
  const eligible = getMissionsForContext({ difficulty, location });
  if (eligible.length === 0) return getMissionById(SAFE_FALLBACK_MISSION_ID);

  const fresh = eligible.filter(
    (mission) => !completed.has(mission.id) && mission.id !== currentId,
  );
  const replayable = eligible.filter((mission) => mission.id !== currentId);
  const candidates = fresh.length > 0 ? fresh : replayable.length > 0 ? replayable : eligible;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
