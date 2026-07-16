import translations, { supportedLanguages } from "./data/translations.js";

export { translations };

export const DEFAULT_LANGUAGE = "en";
export const LANGUAGE_STORAGE_KEY = "mathzlet-language";
const LEGACY_LANGUAGE_STORAGE_KEY = "25y-puzzle-language";

let activeLanguage = DEFAULT_LANGUAGE;

function normalizeLanguage(language) {
  if (typeof language !== "string") return DEFAULT_LANGUAGE;
  if (language.toLowerCase().startsWith("zh")) return "zh-CN";
  if (language.toLowerCase().startsWith("en")) return "en";
  return supportedLanguages.includes(language) ? language : DEFAULT_LANGUAGE;
}

function readSavedLanguage() {
  try {
    return globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY) ?? globalThis.localStorage?.getItem(LEGACY_LANGUAGE_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function browserLanguages() {
  if (typeof navigator === "undefined") return [];
  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    return navigator.languages;
  }
  return navigator.language ? [navigator.language] : [];
}

/** Returns a saved supported language, then the browser match, then English. */
export function getInitialLanguage() {
  const savedLanguage = readSavedLanguage();
  if (savedLanguage && (savedLanguage === "en" || savedLanguage === "zh-CN")) {
    return savedLanguage;
  }

  const browserLanguage = browserLanguages().find(
    (language) => typeof language === "string" && /^(en|zh)(-|$)/i.test(language),
  );
  return normalizeLanguage(browserLanguage);
}

/** Updates the root document language without assuming a browser environment. */
export function applyDocumentLanguage(language = activeLanguage) {
  const normalizedLanguage = normalizeLanguage(language);
  if (typeof document !== "undefined") {
    document.documentElement.lang = normalizedLanguage;
  }
  return normalizedLanguage;
}

export function getLanguage() {
  return activeLanguage;
}

/**
 * Looks up a flat translation key and replaces {named} tokens.
 * Missing localized values fall back to English; unknown keys return the key.
 */
export function t(key, replacements = {}, language = activeLanguage) {
  const normalizedLanguage = normalizeLanguage(language);
  const localizedValue = translations[normalizedLanguage]?.[key];
  const fallbackValue = translations[DEFAULT_LANGUAGE]?.[key];
  const template = localizedValue ?? fallbackValue ?? key;

  if (typeof template !== "string") return String(template ?? key);
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (token, name) => {
    const value = replacements[name];
    return value === undefined || value === null ? token : String(value);
  });
}

function readElementReplacements(element) {
  const serializedReplacements = element.dataset.i18nParams;
  if (!serializedReplacements) return {};

  try {
    const parsedReplacements = JSON.parse(serializedReplacements);
    return parsedReplacements && typeof parsedReplacements === "object"
      ? parsedReplacements
      : {};
  } catch {
    return {};
  }
}

function localizableElements(root, selector) {
  if (!root?.querySelectorAll) return [];
  const descendants = Array.from(root.querySelectorAll(selector));
  return root.matches?.(selector) ? [root, ...descendants] : descendants;
}

/**
 * Applies translations to static DOM hooks without replacing markup.
 *
 * Supported hooks:
 * - data-i18n="key" updates textContent.
 * - data-i18n-attr="aria-label:key,title:key" updates named attributes.
 * - data-i18n-placeholder="key", data-i18n-title="key", and
 *   data-i18n-aria-label="key" are convenient single-attribute forms.
 * - data-i18n-params='{"count":2}' supplies interpolation values.
 */
export function localizeDocument(root = globalThis.document) {
  if (!root?.querySelectorAll) return root;

  for (const element of localizableElements(root, "[data-i18n]")) {
    const key = element.dataset.i18n;
    if (key) element.textContent = t(key, readElementReplacements(element));
  }

  for (const element of localizableElements(root, "[data-i18n-attr]")) {
    const replacements = readElementReplacements(element);
    const attributeMappings = element.dataset.i18nAttr.split(",");

    for (const mapping of attributeMappings) {
      const separatorIndex = mapping.indexOf(":");
      if (separatorIndex < 1) continue;
      const attribute = mapping.slice(0, separatorIndex).trim();
      const key = mapping.slice(separatorIndex + 1).trim();
      if (attribute && key) element.setAttribute(attribute, t(key, replacements));
    }
  }

  const directAttributeHooks = [
    ["data-i18n-placeholder", "placeholder"],
    ["data-i18n-title", "title"],
    ["data-i18n-aria-label", "aria-label"],
  ];

  for (const [hook, attribute] of directAttributeHooks) {
    for (const element of localizableElements(root, `[${hook}]`)) {
      const key = element.getAttribute(hook);
      if (key) element.setAttribute(attribute, t(key, readElementReplacements(element)));
    }
  }

  return root;
}

/**
 * Changes language immediately, saves it when possible, updates <html lang>,
 * and announces a single application event for renderers to subscribe to.
 */
export function setLanguage(language, { persist = true, announce = true } = {}) {
  activeLanguage = normalizeLanguage(language);

  if (persist) {
    try {
      globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, activeLanguage);
    } catch {
      // Storage can be unavailable in private or restricted browsing contexts.
    }
  }

  applyDocumentLanguage(activeLanguage);

  if (typeof document !== "undefined") {
    localizeDocument(document);
  }

  if (announce && typeof document !== "undefined" && typeof CustomEvent !== "undefined") {
    document.dispatchEvent(
      new CustomEvent("mathzlet:languagechange", {
        detail: { language: activeLanguage },
      }),
    );
  }

  return activeLanguage;
}

/** Initializes language once at application startup. */
export function initializeLanguage() {
  return setLanguage(getInitialLanguage(), { persist: false, announce: false });
}
