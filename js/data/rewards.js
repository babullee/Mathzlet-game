export const REWARDS = Object.freeze([
  Object.freeze({
    id: "creative-thinker",
    labelKey: "rewardCreativeThinkerName",
    descriptionKey: "rewardCreativeThinkerDescription",
    icon: "spark",
    evidence: Object.freeze(["open-ended-complete", "idea-revised"]),
  }),
  Object.freeze({
    id: "pattern-explorer",
    labelKey: "rewardPatternExplorerName",
    descriptionKey: "rewardPatternExplorerDescription",
    icon: "pattern",
    evidence: Object.freeze(["pattern-complete"]),
  }),
  Object.freeze({
    id: "team-helper",
    labelKey: "rewardTeamHelperName",
    descriptionKey: "rewardTeamHelperDescription",
    icon: "hands",
    evidence: Object.freeze(["parent-prompt-used", "team-talked"]),
  }),
  Object.freeze({
    id: "number-builder",
    labelKey: "rewardNumberBuilderName",
    descriptionKey: "rewardNumberBuilderDescription",
    icon: "blocks",
    evidence: Object.freeze(["two-target-missions-complete"]),
  }),
  Object.freeze({
    id: "brave-guesser",
    labelKey: "rewardBraveGuesserName",
    descriptionKey: "rewardBraveGuesserDescription",
    icon: "flag",
    evidence: Object.freeze(["developing-idea-revised"]),
  }),
  Object.freeze({
    id: "multiple-solution-finder",
    labelKey: "rewardMultipleSolutionFinderName",
    descriptionKey: "rewardMultipleSolutionFinderDescription",
    icon: "branching-path",
    evidence: Object.freeze(["multiple-solutions-found"]),
  }),
  Object.freeze({
    id: "careful-observer",
    labelKey: "rewardCarefulObserverName",
    descriptionKey: "rewardCarefulObserverDescription",
    icon: "magnifier",
    evidence: Object.freeze(["comparison-complete", "matching-complete"]),
  }),
  Object.freeze({
    id: "plan-maker",
    labelKey: "rewardPlanMakerName",
    descriptionKey: "rewardPlanMakerDescription",
    icon: "map",
    evidence: Object.freeze(["strategy-mission-complete"]),
  }),
  Object.freeze({
    id: "forest-friend",
    labelKey: "rewardForestFriendName",
    descriptionKey: "rewardForestFriendDescription",
    icon: "leaf",
    evidence: Object.freeze(["number-forest-complete"]),
  }),
  Object.freeze({
    id: "pattern-pathfinder",
    labelKey: "rewardPatternPathfinderName",
    descriptionKey: "rewardPatternPathfinderDescription",
    icon: "lantern",
    evidence: Object.freeze(["pattern-cave-complete"]),
  }),
  Object.freeze({
    id: "shape-sailor",
    labelKey: "rewardShapeSailorName",
    descriptionKey: "rewardShapeSailorDescription",
    icon: "boat",
    evidence: Object.freeze(["shape-river-complete"]),
  }),
  Object.freeze({
    id: "logic-climber",
    labelKey: "rewardLogicClimberName",
    descriptionKey: "rewardLogicClimberDescription",
    icon: "mountain",
    evidence: Object.freeze(["logic-mountain-complete"]),
  }),
  Object.freeze({
    id: "treasure-guide",
    labelKey: "rewardTreasureGuideName",
    descriptionKey: "rewardTreasureGuideDescription",
    icon: "compass",
    evidence: Object.freeze(["treasure-camp-complete"]),
  }),
  Object.freeze({
    id: "curious-counter",
    labelKey: "rewardCuriousCounterName",
    descriptionKey: "rewardCuriousCounterDescription",
    icon: "numbers",
    evidence: Object.freeze(["counting-mission-complete"]),
  }),
  Object.freeze({
    id: "sorting-star",
    labelKey: "rewardSortingStarName",
    descriptionKey: "rewardSortingStarDescription",
    icon: "sorting",
    evidence: Object.freeze(["classification-complete"]),
  }),
  Object.freeze({
    id: "sequence-spotter",
    labelKey: "rewardSequenceSpotterName",
    descriptionKey: "rewardSequenceSpotterDescription",
    icon: "steps",
    evidence: Object.freeze(["sequence-complete"]),
  }),
  Object.freeze({
    id: "kind-teammate",
    labelKey: "rewardKindTeammateName",
    descriptionKey: "rewardKindTeammateDescription",
    icon: "heart",
    evidence: Object.freeze(["cooperative-mission-complete"]),
  }),
  Object.freeze({
    id: "hint-explorer",
    labelKey: "rewardHintExplorerName",
    descriptionKey: "rewardHintExplorerDescription",
    icon: "compass",
    evidence: Object.freeze(["hint-used"]),
  }),
  Object.freeze({
    id: "steady-thinker",
    labelKey: "rewardSteadyThinkerName",
    descriptionKey: "rewardSteadyThinkerDescription",
    icon: "trail",
    evidence: Object.freeze(["mission-replayed"]),
  }),
  Object.freeze({
    id: "world-traveler",
    labelKey: "rewardWorldTravelerName",
    descriptionKey: "rewardWorldTravelerDescription",
    icon: "globe",
    evidence: Object.freeze(["all-worlds-visited"]),
  }),
]);

export function getRewardById(id) {
  return REWARDS.find((reward) => reward.id === id) ?? null;
}

export function getEligibleRewards(evidenceEvents = [], earnedRewardIds = []) {
  const evidence = new Set(evidenceEvents);
  const earned = new Set(earnedRewardIds);
  return REWARDS.filter(
    (reward) =>
      !earned.has(reward.id) && reward.evidence.some((event) => evidence.has(event)),
  );
}
