import assert from "node:assert/strict";
import fs from "node:fs";
import { NUMBER_CARDS, PUZZLE_CARD_ACTIVITIES, STRATEGY_CARDS } from "../js/data/cards.js";
import { LOCATIONS, MISSIONS } from "../js/data/missions.js";
import { REWARDS } from "../js/data/rewards.js";
import translations from "../js/data/translations.js";
import { LEVELS, RANKS, WORLDS } from "../js/data/worlds.js";
import {
  createMissionDeal,
  enumerateValidSolutions,
} from "../js/game/game-engine.js";
import {
  VALIDATION_STATUS,
  validateMissionData,
  validateSubmission,
} from "../js/game/validation.js";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const html = read("index.html");
const baseCss = read("css/base.css");
const componentCss = read("css/components.css");
const animationCss = read("css/animations.css");
const variableCss = read("css/variables.css");
const mainSource = read("js/main.js");
const accessibilitySource = read("js/accessibility.js");

function tokens(value) {
  return [...String(value).matchAll(/\{([a-zA-Z0-9_]+)\}/g)]
    .map((match) => match[1])
    .sort();
}

function assertTranslationKey(key, source) {
  assert.ok(key in translations.en, `${source} references missing English key: ${key}`);
  assert.ok(key in translations["zh-CN"], `${source} references missing Chinese key: ${key}`);
}

// Localization coverage and interpolation parity.
const englishKeys = Object.keys(translations.en).sort();
const chineseKeys = Object.keys(translations["zh-CN"]).sort();
assert.deepEqual(chineseKeys, englishKeys, "English and Chinese dictionaries must have identical keys");
for (const key of englishKeys) {
  assert.deepEqual(
    tokens(translations["zh-CN"][key]),
    tokens(translations.en[key]),
    `Interpolation tokens differ for ${key}`,
  );
}

for (const mission of MISSIONS) {
  [mission.titleKey, mission.instructionKey, ...(mission.hintKeys ?? [])]
    .filter(Boolean)
    .forEach((key) => assertTranslationKey(key, mission.id));
}
for (const card of [...NUMBER_CARDS, ...PUZZLE_CARD_ACTIVITIES, ...STRATEGY_CARDS]) {
  [card.labelKey, card.descriptionKey]
    .filter(Boolean)
    .forEach((key) => assertTranslationKey(key, card.id));
}
for (const reward of REWARDS) {
  [reward.labelKey, reward.descriptionKey]
    .forEach((key) => assertTranslationKey(key, reward.id));
}

// Content minimums and complete difficulty/location coverage.
assert.ok(NUMBER_CARDS.length >= 12, "At least 12 number cards are required");
assert.ok(PUZZLE_CARD_ACTIVITIES.length >= 3, "At least 3 puzzle activities are required");
assert.ok(STRATEGY_CARDS.length >= 4, "At least 4 strategy cards are required");
assert.ok(REWARDS.length >= 20, "At least 20 rewards are required");
assert.ok(MISSIONS.length >= 150, "At least 150 missions are required");
assert.ok(LEVELS.length >= 42, "At least 42 levels are required");
assert.equal(WORLDS.length, 5, "Exactly five adventure worlds are required");
assert.equal(RANKS.length, 10, "The explorer growth path needs ten ranks");
assert.equal(LOCATIONS.length, WORLDS.length, "Every world needs one map destination");
assert.deepEqual([...new Set(MISSIONS.map((mission) => mission.difficulty))].sort(), [1, 2, 3]);

const requiredMissionTypes = [
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
];
for (const type of requiredMissionTypes) {
  assert.ok(MISSIONS.some((mission) => mission.type === type), `Missing mission type: ${type}`);
}

// Every configured mission validates, deals safely, and has enough accepted solutions.
for (const mission of MISSIONS) {
  assert.equal(validateMissionData(mission).valid, true, `${mission.id} has invalid mission data`);
  const deal = createMissionDeal(mission, { maximumAttempts: 0 });
  assert.equal(deal.solvable, true, `${mission.id} did not produce a solvable fallback deal`);
  const solutions = enumerateValidSolutions(deal.mission, deal.availableCards);
  assert.ok(
    solutions.length >= (mission.solutionsRequired ?? 1),
    `${mission.id} needs ${mission.solutionsRequired ?? 1} solution(s), found ${solutions.length}`,
  );

  const first = solutions[0];
  const accepted = validateSubmission({
    mission: deal.mission,
    availableCards: deal.availableCards,
    selectedCards: first.selectedCards,
    discoveredSolutions: [],
  });
  assert.equal(accepted.status, VALIDATION_STATUS.VALID_NEW, `${mission.id} rejected a known solution`);

  const duplicate = validateSubmission({
    mission: deal.mission,
    availableCards: deal.availableCards,
    selectedCards: first.selectedCards,
    discoveredSolutions: [first.canonicalSolution],
  });
  assert.equal(duplicate.status, VALIDATION_STATUS.VALID_DUPLICATE, `${mission.id} missed a duplicate solution`);
  assertTranslationKey(accepted.reasonKey, `${mission.id} success feedback`);
}

const invalidMission = validateSubmission({ mission: { id: "broken", type: "unknown" } });
assert.equal(invalidMission.status, VALIDATION_STATUS.INVALID_DATA, "Invalid mission data needs safe recovery");
assertTranslationKey(invalidMission.reasonKey, "invalid mission recovery");

// Feedback must stay positive and non-punitive in both languages.
const feedbackKeys = englishKeys.filter((key) =>
  key.startsWith("validation") ||
  [
    "tryAgain",
    "solutionWorks",
    "solutionAlreadyFound",
    "foundOneFindAnother",
    "patternSuccess",
    "cardsNeedFriend",
    "trayIsFull",
  ].includes(key),
);
for (const key of feedbackKeys) {
  assert.doesNotMatch(translations.en[key], /\b(wrong|failed?|failure|lose|lost)\b/i, `Punitive English feedback: ${key}`);
  assert.doesNotMatch(translations["zh-CN"][key], /错误|失败|扣分|失去/, `Punitive Chinese feedback: ${key}`);
}

// Static semantic and keyboard contracts.
for (const button of html.matchAll(/<button\b[\s\S]*?<\/button>/g)) {
  assert.match(button[0], /\btype="(?:button|submit)"/, "Every static button needs an explicit type");
}
assert.doesNotMatch(html, /role="listbox"|role="option"/, "Do not declare an incomplete listbox pattern");
assert.match(html, /id="cardHand"[^>]+role="group"/, "Card hand needs simple grouped-button semantics");
assert.match(html, /id="solutionZone"[^>]+role="group"/, "Solution area must not wrap buttons in a button role");
assert.match(html, /id="solutionPlaceButton"[^>]+type="button"/, "Solution placement needs a semantic button");
assert.match(html, /class="skip-link"[^>]+href="#mainContent"/, "A skip link must target main content");
assert.match(html, /id="mainContent"[^>]+tabindex="-1"/, "Skip-link target must accept focus");
const dialogCount = (html.match(/role="dialog"/g) ?? []).length;
const modalCount = (html.match(/aria-modal="true"/g) ?? []).length;
assert.ok(dialogCount >= 4, "Every overlay must expose dialog semantics");
assert.equal(modalCount, dialogCount, "Every dialog must be modal to assistive tech");
assert.match(html, /id="feedback"[^>]+role="status"[^>]+aria-live="polite"/, "Feedback needs a polite live region");
assert.match(html, /id="liveRegion"[^>]+aria-live="polite"[^>]+aria-atomic="true"/, "Global announcements need an atomic polite live region");
assert.match(accessibilitySource, /event\.key === "Escape"/, "Modal keyboard support must include Escape");
assert.match(accessibilitySource, /event\.key !== "Tab"/, "Modal keyboard support must contain Tab focus");
assert.match(accessibilitySource, /keyboardSupportInstalled/, "Modal keyboard support must resist duplicate registration");
assert.match(accessibilitySource, /setAttribute\("inert"/, "Background content must become inert while a modal is open");
assert.match(accessibilitySource, /visibleModals\(\)\.at\(-1\)/, "Keyboard support must target the topmost modal");
assert.match(accessibilitySource, /aria-hidden/, "Modal visibility must also be exposed to assistive technology");
assert.match(accessibilitySource, /requestAnimationFrame/, "Live announcements and modal focus must wait for rendered content");
assert.match(mainSource, /focusAfterRender|focusFirstAvailableCard/, "Dynamic board updates must restore useful focus");
assert.doesNotMatch(html, /\bon(?:click|keydown|touchstart)=/i, "Event handlers must not be embedded in markup");
assert.doesNotMatch(html, /\bdraggable="true"/i, "Drag and drop must not be required to play");

// Touch, focus, forced-colors, and reduced-motion CSS contracts.
assert.match(variableCss, /--target-min:\s*3rem/, "Touch target token must be at least 48 CSS pixels");
assert.match(componentCss, /min-width:\s*var\(--target-min\)/, "Interactive controls need minimum width");
assert.match(componentCss, /min-height:\s*var\(--target-min\)/, "Interactive controls need minimum height");
assert.match(baseCss, /:focus-visible\s*\{[\s\S]*?outline:/, "Visible focus styling is required");
assert.match(animationCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/, "Honor system reduced-motion preference");
assert.match(animationCss, /\[data-motion="reduced"\]/, "Honor the in-app reduced-motion setting");
assert.match(read("css/responsive.css"), /@media\s*\(forced-colors:\s*active\)/, "Forced-colors support is required");

console.log(
  `QA check passed: ${MISSIONS.length} missions, ${englishKeys.length} bilingual keys, semantic controls, focus, touch, and motion contracts.`,
);
