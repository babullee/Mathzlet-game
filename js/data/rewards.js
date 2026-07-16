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
