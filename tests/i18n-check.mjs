import assert from "node:assert/strict";
import fs from "node:fs";
import translations from "../js/data/translations.js";
import { MISSIONS } from "../js/data/missions.js";
import { REWARDS } from "../js/data/rewards.js";
import { LEVELS, RANKS, WORLDS } from "../js/data/worlds.js";

const files = [
  "index.html",
  "js/main.js",
  "js/tutorial.js",
  "js/data/cards.js",
  "js/data/missions.js",
  "js/data/rewards.js",
  "js/data/worlds.js",
  "js/game/progression.js",
];
const keys = new Set();
const patterns = [
  /data-i18n(?:-aria-label|-placeholder|-title)?="([^"]+)"/g,
  /\bt\("([^"]+)"/g,
  /(?:nameKey|titleKey|instructionKey|labelKey|descriptionKey|parentPromptKey):\s*"([^"]+)"/g,
  /"(hint[A-Z][^"]+)"/g,
];

const read = (file) =>
  fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

for (const file of files) {
  const source = read(file);
  patterns.forEach((pattern) => {
    for (const match of source.matchAll(pattern)) keys.add(match[1]);
  });
}

for (const world of WORLDS) {
  keys.add(world.nameKey);
  keys.add(world.descriptionKey);
}
for (const level of LEVELS) keys.add(level.nameKey);
for (const rank of RANKS) keys.add(rank.nameKey);
for (const mission of MISSIONS) {
  [
    mission.titleKey,
    mission.instructionKey,
    mission.parentPromptKey,
    ...(mission.hintKeys ?? []),
    ...(mission.choices ?? []).map((choice) => choice.labelKey),
  ]
    .filter(Boolean)
    .forEach((key) => keys.add(key));
}
for (const reward of REWARDS) {
  keys.add(reward.labelKey);
  keys.add(reward.descriptionKey);
}

const tokenNames = (value) =>
  [...String(value).matchAll(/\{([a-zA-Z0-9_]+)\}/g)]
    .map((match) => match[1])
    .sort();

const englishKeys = Object.keys(translations.en).sort();
const chineseKeys = Object.keys(translations["zh-CN"]).sort();
const intentionallyBlankKeys = new Set(["ariaDecorative"]);
assert.deepEqual(
  chineseKeys,
  englishKeys,
  "English and Simplified Chinese dictionaries must have identical keys",
);

const missing = [...keys].filter((key) => !(key in translations.en));
assert.deepEqual(missing, [], `Used localization keys are missing: ${missing.join(", ")}`);

for (const key of englishKeys) {
  const english = translations.en[key];
  const chinese = translations["zh-CN"][key];
  assert.equal(typeof english, "string", `English ${key} must be a string`);
  assert.equal(typeof chinese, "string", `Chinese ${key} must be a string`);
  if (!intentionallyBlankKeys.has(key)) {
    assert.ok(english.trim(), `English ${key} must not be blank`);
    assert.ok(chinese.trim(), `Chinese ${key} must not be blank`);
  }
  assert.doesNotMatch(english, /\uFFFD/, `English ${key} contains a replacement character`);
  assert.doesNotMatch(chinese, /\uFFFD/, `Chinese ${key} contains a replacement character`);
  assert.deepEqual(
    tokenNames(chinese),
    tokenNames(english),
    `Interpolation tokens differ for ${key}`,
  );
}

const requiredProgressionKeys = [
  "missionComplete",
  "levelComplete",
  "worldComplete",
  "nextMission",
  "nextLevel",
  "continueAdventure",
  "newLevelUnlocked",
  "newWorldUnlocked",
  "experience",
  "rank",
  "stars",
  "progress",
  "rewardEarned",
  "playAgain",
  "returnToMap",
  "almostThere",
  "greatStrategy",
  "anotherSolutionFound",
  "chooseLevel",
  "gameComplete",
  "recoveryMessage",
];
const requiredAccessibilityKeys = [
  "ariaLevelSelection",
  "ariaMissionCompleteDialog",
  "ariaLevelCompleteDialog",
  "ariaWorldCompleteDialog",
  "ariaGameCompleteDialog",
  "ariaExperienceProgress",
  "ariaRankProgress",
  "ariaStarsProgress",
  "ariaScrollableCardHand",
  "ariaScrollableLevelList",
  "ariaSkipCelebration",
  "ariaNextMission",
  "ariaNextLevel",
  "ariaNextWorld",
];
for (const key of [...requiredProgressionKeys, ...requiredAccessibilityKeys]) {
  assert.ok(key in translations.en, `Required English UI key is missing: ${key}`);
  assert.ok(key in translations["zh-CN"], `Required Chinese UI key is missing: ${key}`);
}

assert.equal(WORLDS.length, 5, "All five worlds need localized metadata");
assert.equal(RANKS.length, 10, "All ten ranks need localized names");
assert.equal(REWARDS.length, 20, "All twenty rewards need localized names and descriptions");
assert.ok(LEVELS.length >= 42, "Every generated level needs a localized name");

const localizationSource = read("js/localization.js");
assert.match(
  localizationSource,
  /localizedValue\s*\?\?\s*fallbackValue/,
  "Localization must fall back to English",
);
assert.match(
  localizationSource,
  /document\.documentElement\.lang\s*=/,
  "Changing language must update the document language",
);
assert.match(
  localizationSource,
  /localStorage\?\.setItem\(LANGUAGE_STORAGE_KEY/,
  "The selected language must be saved",
);

console.log(
  `Localization check passed: ${keys.size} used keys; ${englishKeys.length} bilingual entries; ${WORLDS.length} worlds, ${LEVELS.length} levels, ${RANKS.length} ranks, and ${REWARDS.length} rewards covered.`,
);
