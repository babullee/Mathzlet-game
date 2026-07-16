export const tutorialSteps = [
  { titleKey: "tutorialMissionTitle", textKey: "tutorialStep1Instruction", actionKey: "next", visual: "mission" },
  { titleKey: "tutorialCardsTitle", textKey: "tutorialStep2Instruction", actionKey: "next", visual: "cards" },
  { titleKey: "tutorialBuildTitle", textKey: "tutorialStep3Instruction", actionKey: "placeCard", visual: "build" },
  { titleKey: "tutorialRewardTitle", textKey: "tutorialStep4Instruction", actionKey: "tutorialStart", visual: "reward" },
];

export function renderTutorialStep(index, translate) {
  const step = tutorialSteps[index] ?? tutorialSteps[0];
  document.querySelector("#tutorialTitle").textContent = translate(step.titleKey);
  document.querySelector("#tutorialText").textContent = translate(step.textKey);
  document.querySelector("#tutorialNext").textContent = translate(step.actionKey);
  document.querySelector("#tutorialProgress").textContent = translate("tutorialStep", { current: index + 1, total: tutorialSteps.length });
  document.querySelector("#tutorialVisual").innerHTML = tutorialVisual(step.visual);
  document.querySelector("#tutorialDots").innerHTML = tutorialSteps.map((_, dotIndex) => `<span class="${dotIndex === index ? "is-current" : ""}"></span>`).join("");
}

function tutorialVisual(type) {
  if (type === "mission") return `<div class="demo-mission"><span>🧭</span><b>10</b></div>`;
  if (type === "cards") return `<div class="demo-cards"><span>6</span><span>4</span><span>3</span></div>`;
  if (type === "build") return `<div class="demo-equation"><span>6</span><b>＋</b><span>4</span><b>＝ 10</b></div>`;
  return `<div class="demo-reward"><span>★</span></div>`;
}
