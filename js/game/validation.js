export const VALIDATION_STATUS = Object.freeze({
  INCOMPLETE: "incomplete",
  DEVELOPING: "developing",
  VALID_NEW: "valid-new",
  VALID_DUPLICATE: "valid-duplicate",
  INVALID_DATA: "invalid-data",
});

export const SUPPORTED_MISSION_TYPES = Object.freeze([
  "target-number",
  "multiple-solutions",
  "comparison",
  "pattern",
  "classification",
  "open-ended",
  "match-equivalent",
  "odd-one-out",
  "compound-target",
  "sequence-build",
]);

const SUPPORTED_OPERATIONS = new Set(["add", "subtract"]);
const SUPPORTED_PREDICATES = new Set([
  "less-than",
  "less-than-or-equal",
  "greater-than",
  "greater-than-or-equal",
  "equal",
]);

const identityOf = (card) => card?.instanceId ?? card?.id ?? null;
const valueOf = (card) => Number(card?.value ?? card?.quantity);
const isFiniteNumber = (value) => Number.isFinite(Number(value));
const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

function invalid(reasonKey = "validationInvalidMissionData") {
  return {
    status: VALIDATION_STATUS.INVALID_DATA,
    reasonKey,
    canonicalSolution: null,
    progress: { found: 0, required: 1 },
  };
}

function baseResult(status, reasonKey, canonicalSolution, found, required, details = {}) {
  return {
    status,
    reasonKey,
    canonicalSolution,
    progress: { found, required },
    ...details,
  };
}

export function validateMissionData(mission) {
  if (!mission || typeof mission !== "object") {
    return { valid: false, reasonKey: "validationMissingMission" };
  }
  if (typeof mission.id !== "string" || !mission.id.trim()) {
    return { valid: false, reasonKey: "validationMissingMissionId" };
  }
  if (!SUPPORTED_MISSION_TYPES.includes(mission.type)) {
    return { valid: false, reasonKey: "validationUnknownMissionType" };
  }

  const minimumCards = mission.minimumCards ?? 1;
  const maximumCards = mission.maximumCards ?? minimumCards;
  if (
    !isPositiveInteger(minimumCards) ||
    !isPositiveInteger(maximumCards) ||
    minimumCards > maximumCards
  ) {
    return { valid: false, reasonKey: "validationInvalidCardLimits" };
  }
  if (
    mission.solutionsRequired !== undefined &&
    !isPositiveInteger(mission.solutionsRequired)
  ) {
    return { valid: false, reasonKey: "validationInvalidSolutionGoal" };
  }

  const targetTypes = new Set([
    "target-number",
    "multiple-solutions",
    "compound-target",
  ]);
  if (targetTypes.has(mission.type) && !isFiniteNumber(mission.target)) {
    return { valid: false, reasonKey: "validationMissingTarget" };
  }

  const arithmeticTypes = new Set([
    ...targetTypes,
    "open-ended",
  ]);
  if (arithmeticTypes.has(mission.type)) {
    const operations = mission.allowedOperations ?? ["add"];
    if (
      !Array.isArray(operations) ||
      operations.length === 0 ||
      operations.some((operation) => !SUPPORTED_OPERATIONS.has(operation))
    ) {
      return { valid: false, reasonKey: "validationUnknownOperation" };
    }
  }

  if (
    mission.type === "open-ended" &&
    (!isFiniteNumber(mission.minimumTotal) ||
      !isFiniteNumber(mission.maximumTotal) ||
      Number(mission.minimumTotal) > Number(mission.maximumTotal))
  ) {
    return { valid: false, reasonKey: "validationInvalidTotalRange" };
  }

  if (mission.type === "classification") {
    if (
      !mission.predicate ||
      !SUPPORTED_PREDICATES.has(mission.predicate.operator) ||
      !isFiniteNumber(mission.predicate.value)
    ) {
      return { valid: false, reasonKey: "validationInvalidPredicate" };
    }
  }

  if (mission.type === "pattern") {
    if (
      !Array.isArray(mission.sequence) ||
      mission.sequence.some((value) => !isFiniteNumber(value)) ||
      !Array.isArray(mission.validNextValues) ||
      mission.validNextValues.length === 0 ||
      mission.validNextValues.some((value) => !isFiniteNumber(value))
    ) {
      return { valid: false, reasonKey: "validationInvalidPattern" };
    }
  }

  if (mission.type === "comparison" && !["larger", "smaller", "equal"].includes(mission.comparison)) {
    return { valid: false, reasonKey: "validationInvalidComparison" };
  }

  if (mission.type === "match-equivalent" && !isFiniteNumber(mission.targetQuantity)) {
    return { valid: false, reasonKey: "validationMissingQuantity" };
  }

  if (
    ["comparison", "pattern", "match-equivalent", "odd-one-out"].includes(mission.type) &&
    (!Array.isArray(mission.choices) ||
      mission.choices.length < 2 ||
      mission.choices.some((card) => !identityOf(card) || !isFiniteNumber(valueOf(card))))
  ) {
    return { valid: false, reasonKey: "validationInvalidChoices" };
  }

  if (
    mission.type === "odd-one-out" &&
    !mission.choices.some((card) => identityOf(card) === mission.oddChoiceId)
  ) {
    return { valid: false, reasonKey: "validationMissingOddChoice" };
  }

  if (
    mission.type === "sequence-build" &&
    (!mission.relationship ||
      mission.relationship.operator !== "increase-by" ||
      !isFiniteNumber(mission.relationship.value))
  ) {
    return { valid: false, reasonKey: "validationInvalidRelationship" };
  }

  if (mission.type === "compound-target" && mission.propertyRequirement) {
    if (
      mission.propertyRequirement.operator !== "some-greater-than" ||
      !isFiniteNumber(mission.propertyRequirement.value)
    ) {
      return { valid: false, reasonKey: "validationInvalidPropertyRequirement" };
    }
  }

  return { valid: true, reasonKey: null };
}

function resolveSelection(mission, availableCards, selectedCards, effects) {
  const sourceCards =
    Array.isArray(availableCards) && availableCards.length > 0
      ? availableCards
      : mission.choices ?? [];
  const byIdentity = new Map();

  for (const card of sourceCards) {
    const identity = identityOf(card);
    if (!identity || byIdentity.has(identity) || !isFiniteNumber(valueOf(card))) {
      return { errorKey: "validationInvalidAvailableCards" };
    }
    byIdentity.set(identity, card);
  }

  const resolved = [];
  const usedCounts = new Map();
  let echoUsed = false;

  for (const selected of selectedCards) {
    const requestedIdentity =
      typeof selected === "string"
        ? selected
        : selected?.sourceInstanceId ?? identityOf(selected);
    const source = byIdentity.get(requestedIdentity);
    if (!source) return { errorKey: "validationUnknownSelectedCard" };

    const count = usedCounts.get(requestedIdentity) ?? 0;
    const isExplicitEcho = Boolean(selected?.isVirtual || selected?.virtual);
    const echoIdentity = effects?.echoCardInstanceId ?? effects?.echoSourceInstanceId;
    const canEcho =
      !echoUsed &&
      echoIdentity === requestedIdentity &&
      (count === 1 || isExplicitEcho);

    if (count > 0 && !canEcho) {
      return { errorKey: "validationCardUsedTwice" };
    }

    if (canEcho) {
      echoUsed = true;
      resolved.push({
        ...source,
        instanceId: `${requestedIdentity}::echo`,
        sourceInstanceId: requestedIdentity,
        isVirtual: true,
      });
    } else {
      resolved.push(source);
    }
    usedCounts.set(requestedIdentity, count + 1);
  }

  return { cards: resolved, availableCards: sourceCards };
}

function evaluateOperation(values, operation) {
  if (values.length === 0) return null;
  if (operation === "add") return values.reduce((total, value) => total + value, 0);
  if (operation === "subtract") {
    return values.slice(1).reduce((total, value) => total - value, values[0]);
  }
  return null;
}

function effectiveTargetFor(mission, effects) {
  const delta = effects?.targetDelta ?? 0;
  if (!Number.isInteger(delta) || Math.abs(delta) > 1) return null;
  const target = Number(mission.target) + delta;
  if (Array.isArray(mission.targetRange)) {
    const [minimum, maximum] = mission.targetRange.map(Number);
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || target < minimum || target > maximum) {
      return null;
    }
  }
  return target;
}

function predicateMatches(value, predicate) {
  const expected = Number(predicate.value);
  switch (predicate.operator) {
    case "less-than":
      return value < expected;
    case "less-than-or-equal":
      return value <= expected;
    case "greater-than":
      return value > expected;
    case "greater-than-or-equal":
      return value >= expected;
    case "equal":
      return value === expected;
    default:
      return false;
  }
}

function discoveredIds(discoveredSolutions) {
  if (!Array.isArray(discoveredSolutions)) return [];
  return discoveredSolutions
    .map((solution) =>
      typeof solution === "string"
        ? solution
        : solution?.canonicalSolution ?? solution?.id ?? null,
    )
    .filter(Boolean);
}

/**
 * Creates an ID for the mathematical idea, intentionally excluding physical
 * card instance IDs. Addition is commutative; ordered sequences/subtraction are not.
 */
export function canonicalizeSolution({
  mission,
  selectedCards,
  operation = "add",
  effectiveTarget = mission?.target,
}) {
  const values = selectedCards.map(valueOf);
  const prefix = mission?.id ?? "unknown-mission";

  if (["target-number", "multiple-solutions", "open-ended", "compound-target"].includes(mission?.type)) {
    const normalized = operation === "add" ? [...values].sort((a, b) => a - b) : values;
    const hasTarget =
      effectiveTarget !== null &&
      effectiveTarget !== undefined &&
      Number.isFinite(Number(effectiveTarget));
    const targetPart = hasTarget ? `target:${effectiveTarget}` : "range";
    return `${prefix}|${targetPart}|${operation}:${normalized.join("+")}`;
  }

  if (mission?.type === "sequence-build") {
    return `${prefix}|sequence:${values.join(",")}`;
  }

  if (mission?.type === "classification") {
    return `${prefix}|set:${[...values].sort((a, b) => a - b).join(",")}`;
  }

  const choiceIds = selectedCards.map(identityOf).sort();
  return `${prefix}|choice:${choiceIds.join(",")}`;
}

function finalizeValid({ mission, selectedCards, operation, target, discoveredSolutions, details }) {
  const canonicalSolution = canonicalizeSolution({
    mission,
    selectedCards,
    operation,
    effectiveTarget: target,
  });
  const discoveries = new Set(discoveredIds(discoveredSolutions));
  const required = mission.solutionsRequired ?? 1;
  const duplicate = discoveries.has(canonicalSolution);
  const found = Math.min(required, discoveries.size + (duplicate ? 0 : 1));

  return baseResult(
    duplicate ? VALIDATION_STATUS.VALID_DUPLICATE : VALIDATION_STATUS.VALID_NEW,
    duplicate ? "validationSolutionAlreadyFound" : "validationSolutionWorks",
    canonicalSolution,
    found,
    required,
    details,
  );
}

export function validateSubmission({
  mission,
  availableCards = [],
  selectedCards = [],
  effects = {},
  discoveredSolutions = [],
} = {}) {
  const missionCheck = validateMissionData(mission);
  if (!missionCheck.valid) return invalid(missionCheck.reasonKey);
  if (!Array.isArray(selectedCards) || !Array.isArray(availableCards)) {
    return invalid("validationCardsMustBeArrays");
  }

  const required = mission.solutionsRequired ?? 1;
  const foundBefore = new Set(discoveredIds(discoveredSolutions)).size;
  const resolved = resolveSelection(mission, availableCards, selectedCards, effects);
  if (resolved.errorKey) return invalid(resolved.errorKey);

  const selected = resolved.cards;
  const values = selected.map(valueOf);
  const minimumCards = mission.minimumCards ?? 1;
  const maximumCards = mission.maximumCards ?? minimumCards;
  if (selected.length < minimumCards) {
    return baseResult(
      VALIDATION_STATUS.INCOMPLETE,
      "validationChooseMoreCards",
      null,
      foundBefore,
      required,
      { cardsNeeded: minimumCards - selected.length },
    );
  }
  if (selected.length > maximumCards) {
    return baseResult(
      VALIDATION_STATUS.DEVELOPING,
      "validationChooseFewerCards",
      null,
      foundBefore,
      required,
      { cardsToRemove: selected.length - maximumCards },
    );
  }

  const operation = effects.operation ?? mission.allowedOperations?.[0] ?? "add";
  if (mission.allowedOperations && !mission.allowedOperations.includes(operation)) {
    return invalid("validationOperationNotAllowed");
  }

  if (["target-number", "multiple-solutions", "compound-target"].includes(mission.type)) {
    const target = effectiveTargetFor(mission, effects);
    if (!Number.isFinite(target)) return invalid("validationInvalidTargetEffect");
    const total = evaluateOperation(values, operation);

    if (mission.type === "compound-target" && mission.propertyRequirement) {
      const threshold = Number(mission.propertyRequirement.value);
      if (!values.some((value) => value > threshold)) {
        return baseResult(
          VALIDATION_STATUS.DEVELOPING,
          "validationNeedCardAboveValue",
          null,
          foundBefore,
          required,
          { threshold, total },
        );
      }
    }

    if (total !== target) {
      return baseResult(
        VALIDATION_STATUS.DEVELOPING,
        total < target ? "validationTotalNeedsMore" : "validationTotalNeedsLess",
        null,
        foundBefore,
        required,
        { total, target, difference: Math.abs(target - total) },
      );
    }
    return finalizeValid({
      mission,
      selectedCards: selected,
      operation,
      target,
      discoveredSolutions,
      details: { total, target },
    });
  }

  if (mission.type === "open-ended") {
    const total = evaluateOperation(values, operation);
    const minimum = Number(mission.minimumTotal);
    const maximum = Number(mission.maximumTotal);
    if (total < minimum || total > maximum) {
      return baseResult(
        VALIDATION_STATUS.DEVELOPING,
        total < minimum ? "validationTotalNeedsMore" : "validationTotalNeedsLess",
        null,
        foundBefore,
        required,
        { total, minimum, maximum },
      );
    }
    return finalizeValid({
      mission,
      selectedCards: selected,
      operation,
      target: null,
      discoveredSolutions,
      details: { total, minimum, maximum },
    });
  }

  if (mission.type === "classification") {
    const matching = resolved.availableCards.filter((card) =>
      predicateMatches(valueOf(card), mission.predicate),
    );
    const expectedIds = new Set(matching.map(identityOf));
    const selectedIds = new Set(selected.map(identityOf));
    const hasExtra = [...selectedIds].some((id) => !expectedIds.has(id));
    const missing = [...expectedIds].filter((id) => !selectedIds.has(id));
    if (hasExtra || missing.length > 0) {
      return baseResult(
        VALIDATION_STATUS.DEVELOPING,
        hasExtra ? "validationOneCardDoesNotMatch" : "validationFindAllMatchingCards",
        null,
        foundBefore,
        required,
        { matchesStillNeeded: missing.length },
      );
    }
    return finalizeValid({
      mission,
      selectedCards: selected,
      operation,
      target: null,
      discoveredSolutions,
      details: { matchingCount: matching.length },
    });
  }

  if (mission.type === "pattern") {
    const validValues = new Set(mission.validNextValues.map(Number));
    if (!values.every((value) => validValues.has(value))) {
      return baseResult(
        VALIDATION_STATUS.DEVELOPING,
        "validationLookAtPatternAgain",
        null,
        foundBefore,
        required,
      );
    }
    return finalizeValid({ mission, selectedCards: selected, operation, target: null, discoveredSolutions });
  }

  if (mission.type === "match-equivalent") {
    if (!values.every((value) => value === Number(mission.targetQuantity))) {
      return baseResult(
        VALIDATION_STATUS.DEVELOPING,
        "validationCountTheGroupAgain",
        null,
        foundBefore,
        required,
      );
    }
    return finalizeValid({ mission, selectedCards: selected, operation, target: null, discoveredSolutions });
  }

  if (mission.type === "odd-one-out") {
    if (identityOf(selected[0]) !== mission.oddChoiceId) {
      return baseResult(
        VALIDATION_STATUS.DEVELOPING,
        "validationFindWhatIsDifferent",
        null,
        foundBefore,
        required,
      );
    }
    return finalizeValid({ mission, selectedCards: selected, operation, target: null, discoveredSolutions });
  }

  if (mission.type === "comparison") {
    const quantities = resolved.availableCards.map(valueOf);
    const chosen = values[0];
    let works = false;
    if (mission.comparison === "larger") works = chosen === Math.max(...quantities);
    if (mission.comparison === "smaller") works = chosen === Math.min(...quantities);
    if (mission.comparison === "equal") {
      works = quantities.filter((quantity) => quantity === chosen).length > 1;
    }
    if (!works) {
      return baseResult(
        VALIDATION_STATUS.DEVELOPING,
        "validationCompareTheGroupsAgain",
        null,
        foundBefore,
        required,
      );
    }
    return finalizeValid({ mission, selectedCards: selected, operation, target: null, discoveredSolutions });
  }

  if (mission.type === "sequence-build") {
    const gap = Number(mission.relationship.value);
    const works = values.slice(1).every((value, index) => value - values[index] === gap);
    if (!works) {
      return baseResult(
        VALIDATION_STATUS.DEVELOPING,
        "validationCheckSequenceSteps",
        null,
        foundBefore,
        required,
      );
    }
    return finalizeValid({ mission, selectedCards: selected, operation, target: null, discoveredSolutions });
  }

  return invalid("validationUnknownMissionType");
}

/**
 * Compact integration API used by the board. For classification missions the
 * caller should attach the complete hand as mission.availableCards; all other
 * mission types can safely infer their source cards from choices/selection.
 */
export function validateMission(mission, selectedCards, previousSolutions = []) {
  const fallbackHand = Array.isArray(mission?.fallbackHandValues)
    ? mission.fallbackHandValues.map((value, index) => ({
        id: `number-${value}`,
        instanceId: `fallback-${mission.id}-number-${value}-${index + 1}`,
        type: "number",
        value,
      }))
    : null;
  const availableCards =
    mission?.availableCards ??
    mission?.currentHand ??
    mission?.choices ??
    fallbackHand ??
    selectedCards ??
    [];
  const result = validateSubmission({
    mission,
    availableCards,
    selectedCards: selectedCards ?? [],
    effects: mission?.effects ?? {},
    discoveredSolutions: previousSolutions,
  });
  return {
    valid:
      result.status === VALIDATION_STATUS.VALID_NEW ||
      result.status === VALIDATION_STATUS.VALID_DUPLICATE,
    canonical: result.canonicalSolution,
    reasonKey: result.reasonKey,
    status: result.status,
    progress: result.progress,
  };
}
