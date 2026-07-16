import fs from "node:fs";
import translations from "../js/data/translations.js";

const files = [
  "index.html",
  "js/main.js",
  "js/tutorial.js",
  "js/data/cards.js",
  "js/data/missions.js",
  "js/data/rewards.js",
];
const keys = new Set();
const patterns = [
  /data-i18n(?:-aria-label)?="([^"]+)"/g,
  /\bt\("([^"]+)"/g,
  /(?:titleKey|instructionKey|labelKey|descriptionKey):\s*"([^"]+)"/g,
  /"(hint[A-Z][^"]+)"/g,
];

for (const file of files) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  patterns.forEach((pattern) => {
    for (const match of source.matchAll(pattern)) keys.add(match[1]);
  });
}

const missing = [...keys].filter((key) => !(key in translations.en));
const parity = Object.keys(translations.en).filter((key) => !(key in translations["zh-CN"]));
if (missing.length || parity.length) {
  console.error(JSON.stringify({ missing, parity }, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Localization check passed: ${keys.size} used keys; ${Object.keys(translations.en).length} bilingual entries.`);
}
