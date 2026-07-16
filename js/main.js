import { createInitialState, createStore } from "./app-state.js";
import { clearStoredState } from "./storage.js";
import { getInitialLanguage, localizeDocument, setLanguage, t } from "./localization.js";
import { showScreen } from "./router.js";
import { closeModal, installModalKeyboardSupport, openModal, announce } from "./accessibility.js";
import { renderTutorialStep, tutorialSteps } from "./tutorial.js";
import { NUMBER_CARDS, STRATEGY_CARDS } from "./data/cards.js";
import { LOCATIONS, MISSIONS, getMissionsForLocation } from "./data/missions.js";
import { REWARDS, getRewardById } from "./data/rewards.js";
import { dealCardsForMission, enumerateValidSolutions, getNextMission } from "./game/game-engine.js";
import { validateMission } from "./game/validation.js";

const store = createStore(createInitialState(getInitialLanguage()));
let tutorialIndex = 0;
let lastParentPrompt = -1;
let resetArmed = false;
let currentFeedbackKey = "readyToExplore";
const PROFILE_AVATARS = Object.freeze({ star: "★", fox: "🦊", rocket: "🚀", leaf: "🍃" });

const elements = {
  tutorialModal: document.querySelector("#tutorialModal"),
  settingsModal: document.querySelector("#settingsModal"),
  promptModal: document.querySelector("#promptModal"),
  rewardModal: document.querySelector("#rewardModal"),
  settingsForm: document.querySelector("#settingsForm"),
  profileForm: document.querySelector("#profileForm"),
  feedback: document.querySelector("#feedback"),
  successActions: document.querySelector("#successActions"),
};

setLanguage(store.getState().language);
installModalKeyboardSupport();
installEventHandlers();
store.subscribe(renderApp);
renderApp(store.getState());

function renderApp(state) {
  setLanguage(state.language);
  localizeDocument();
  document.documentElement.dataset.motion = state.settings.reducedMotion ? "reduced" : state.settings.animationIntensity;
  document.documentElement.dataset.quantities = state.settings.showQuantities ? "shown" : "hidden";
  document.querySelector("#languageButtonLabel").textContent = t(state.language === "en" ? "languageShortEnglish" : "languageShortChinese");
  document.title = t("appTitle");
  document.querySelector("meta[name='description']").content = t("metaDescription");
  syncSettingsForm(state);
  renderMap(state);
  renderGame(state);
  renderCollections(state);
  renderParentGuide();
  renderProfile(state);
  showScreen(state.currentScreen);
}

function installEventHandlers() {
  document.addEventListener("click", (event) => {
    const cardButton = event.target.closest("[data-card-id]");
    if (cardButton) {
      handleCardActivation(cardButton.dataset.cardId, cardButton.dataset.cardArea);
      return;
    }
    const strategyButton = event.target.closest("[data-strategy-id]");
    if (strategyButton) {
      useStrategy(strategyButton.dataset.strategyId);
      return;
    }
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    handleAction(actionButton.dataset.action, actionButton);
  });

  document.querySelector("#solutionPlaceButton").addEventListener("click", placePendingCard);

  document.addEventListener("dragstart", (event) => {
    const card = event.target.closest("[data-card-id][draggable='true']");
    if (!card) return;
    event.dataTransfer.setData("text/plain", card.dataset.cardId);
    event.dataTransfer.effectAllowed = "move";
    card.classList.add("is-dragging");
  });
  document.addEventListener("dragend", (event) => event.target.closest(".game-card")?.classList.remove("is-dragging"));
  document.querySelector("#solutionZone").addEventListener("dragover", (event) => {
    event.preventDefault();
    event.currentTarget.classList.add("is-drop-target");
  });
  document.querySelector("#solutionZone").addEventListener("dragleave", (event) => event.currentTarget.classList.remove("is-drop-target"));
  document.querySelector("#solutionZone").addEventListener("drop", (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove("is-drop-target");
    addCardToSolution(event.dataTransfer.getData("text/plain"));
  });

  elements.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applySettings();
    closeModal(elements.settingsModal);
  });
  elements.profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveProfile();
  });
}

function handleAction(action, button) {
  const simpleRoutes = { home: "home", map: "map", collection: "collection", parent: "parent", profile: "profile" };
  if (simpleRoutes[action]) {
    store.setState({ currentScreen: simpleRoutes[action] }, { persist: false });
    return;
  }
  if (action === "start") {
    if (store.getState().tutorialCompleted) goToMap();
    else openTutorial();
  } else if (action === "open-tutorial" || action === "replay-tutorial") {
    closeModal(elements.settingsModal);
    openTutorial();
  } else if (action === "close-tutorial") {
    closeModal(elements.tutorialModal);
  } else if (action === "skip-tutorial") {
    finishTutorial();
  } else if (action === "next-tutorial") {
    if (tutorialIndex >= tutorialSteps.length - 1) finishTutorial();
    else renderTutorialStep(++tutorialIndex, t);
  } else if (action === "open-settings") {
    resetArmed = false;
    openModal(elements.settingsModal);
  } else if (action === "close-settings") {
    closeModal(elements.settingsModal);
  } else if (action === "toggle-language") {
    const language = store.getState().language === "en" ? "zh-CN" : "en";
    store.setState({ language });
    announce(t("ariaLanguageChanged"));
  } else if (action === "hint") {
    showHint();
  } else if (action === "undo") {
    undoSelection();
  } else if (action === "reset-attempt") {
    resetAttempt();
  } else if (action === "confirm") {
    confirmSolution();
  } else if (action === "parent-prompt") {
    showParentPrompt();
  } else if (action === "close-prompt") {
    closeModal(elements.promptModal);
  } else if (action === "next-mission") {
    startMission(store.getState().currentLocation);
  } else if (action === "another-way") {
    if (hasUndiscoveredSolution(store.getState())) {
      store.setState({ selectedCards: [], pendingCardId: null, history: [], missionSolved: false });
      setFeedback("anotherWayPrompt", "neutral");
      focusFirstAvailableCard();
    } else {
      setFeedback("allWaysFound", "success");
    }
  } else if (action === "finish-session") {
    store.setState({ currentScreen: "home" }, { persist: false });
    announce(t("adventureSaved"));
  } else if (action === "collect-reward") {
    closeModal(elements.rewardModal);
    focusAfterRender("[data-action='next-mission']");
  } else if (action === "reset-progress") {
    handleProgressReset(button);
  }
}

function goToMap() {
  store.setState({ currentScreen: "map" }, { persist: false });
}

function openTutorial() {
  tutorialIndex = 0;
  renderTutorialStep(tutorialIndex, t);
  openModal(elements.tutorialModal);
}

function finishTutorial() {
  store.setState({ tutorialCompleted: true });
  closeModal(elements.tutorialModal);
  goToMap();
}

function renderMap(state) {
  const map = document.querySelector("#mapGrid");
  map.replaceChildren();
  const completedCount = new Set(state.completedMissions).size;
  document.querySelector("#mapProgress").textContent = t("discoveriesCount", { count: completedCount });
  LOCATIONS.forEach((location, index) => {
    const unlocked = index === 0 || completedCount >= index;
    const completedHere = MISSIONS.filter((mission) => mission.location === location.id && state.completedMissions.includes(mission.id)).length;
    const button = createElement("button", `destination-card destination-${location.id}${unlocked ? "" : " is-locked"}`);
    button.type = "button";
    button.disabled = !unlocked;
    button.dataset.locationId = location.id;
    button.setAttribute("aria-label", `${t(location.labelKey)}. ${t(unlocked ? "destinationReady" : "destinationSoon")}`);
    button.innerHTML = `<span class="destination-icon" aria-hidden="true">${locationIcon(location.icon)}</span>`;
    const copy = createElement("span", "destination-copy");
    copy.append(createElement("b", "", t(location.labelKey)), createElement("small", "", t(unlocked ? (completedHere ? "destinationReplay" : "destinationExplore") : "destinationSoon")));
    const stamp = createElement("span", "destination-stamp", completedHere ? "✓" : unlocked ? "→" : "…");
    stamp.setAttribute("aria-hidden", "true");
    button.append(copy, stamp);
    button.addEventListener("click", () => startMission(location.id));
    map.append(button);
  });
}

function startMission(locationId) {
  const state = store.getState();
  const mission = getNextMission(locationId, state.difficulty, state.completedMissions, state.currentMission?.id) ?? getMissionsForLocation(locationId, state.difficulty)[0];
  if (!mission) {
    setFeedback("cardsNeedFriend", "clue");
    return;
  }
  const cards = dealCardsForMission(mission);
  store.setState({
    currentScreen: "game",
    currentLocation: locationId,
    currentMission: mission,
    availableCards: cards,
    selectedCards: [],
    pendingCardId: null,
    history: [],
    missionSolved: false,
    hintStep: 0,
    strategyUsed: null,
  });
  requestAnimationFrame(() => setFeedback("readyToExplore", "neutral"));
  focusAfterRender("#gameTitle");
}

function renderGame(state) {
  const mission = state.currentMission;
  if (!mission) return;
  document.querySelector("#locationName").textContent = t(LOCATIONS.find((location) => location.id === state.currentLocation)?.labelKey ?? "adventureMap");
  document.querySelector("#missionTitle").textContent = t(mission.titleKey);
  document.querySelector("#missionInstruction").textContent = t(mission.instructionKey);
  document.querySelector("#missionTarget").textContent = formatMissionTarget(mission);
  const locationMissions = getMissionsForLocation(state.currentLocation, state.difficulty);
  const completedHere = locationMissions.filter((item) => state.completedMissions.includes(item.id)).length;
  document.querySelector("#missionProgress").textContent = t("missionProgressCount", { count: completedHere, total: locationMissions.length });
  renderCardHand(state);
  renderSolution(state);
  renderStrategies(state);
  renderDiscoveredSolutions(state);
  const confirm = document.querySelector("#confirmButton");
  confirm.disabled = state.selectedCards.length < (mission.minimumCards ?? 1) || state.missionSolved;
  confirm.setAttribute("aria-disabled", String(confirm.disabled));
  elements.successActions.hidden = !state.missionSolved;
  elements.successActions.querySelector("[data-action='another-way']").hidden = !hasUndiscoveredSolution(state);
}

function hasUndiscoveredSolution(state) {
  if (!state.currentMission?.allowMultipleSolutions) return false;
  const found = new Set(state.discoveredSolutions[state.currentMission.id] ?? []);
  return enumerateValidSolutions(state.currentMission, state.availableCards)
    .some((solution) => !found.has(solution.canonicalSolution));
}

function renderCardHand(state) {
  const hand = document.querySelector("#cardHand");
  hand.replaceChildren();
  state.availableCards.forEach((card) => {
    const selected = state.selectedCards.some((item) => item.instanceId === card.instanceId);
    const button = createGameCard(card, selected, state.pendingCardId === card.instanceId);
    button.dataset.cardArea = "hand";
    button.draggable = !selected;
    button.disabled = selected || state.missionSolved;
    hand.append(button);
  });
}

function renderSolution(state) {
  const selectedContainer = document.querySelector("#selectedCards");
  selectedContainer.replaceChildren();
  state.selectedCards.forEach((card) => {
    const button = createGameCard(card, true, false, true);
    button.dataset.cardArea = "solution";
    selectedContainer.append(button);
  });
  const placeholder = document.querySelector("#solutionPlaceholder");
  placeholder.hidden = state.selectedCards.length > 0 && !state.pendingCardId;
  const placeButton = document.querySelector("#solutionPlaceButton");
  placeButton.hidden = state.selectedCards.length > 0 && !state.pendingCardId;
  placeButton.disabled = !state.pendingCardId || state.missionSolved;
  const values = state.selectedCards.map((card) => Number(card.value ?? card.quantity));
  document.querySelector("#solutionTotal").textContent = values.length > 1 ? `${values.join(" + ")} = ${values.reduce((sum, value) => sum + value, 0)}` : "";
  document.querySelector("#solutionZone").classList.toggle("has-pending", Boolean(state.pendingCardId));
}

function createGameCard(card, selected, pending, compact = false) {
  const button = createElement("button", `game-card ${card.type === "puzzle-choice" ? "puzzle-card" : "number-card"}${selected ? " is-selected" : ""}${pending ? " is-pending" : ""}${compact ? " is-compact" : ""}`);
  button.type = "button";
  button.dataset.cardId = card.instanceId;
  const value = Number(card.value ?? card.quantity);
  const cardName = t("numberCardLabel", { value });
  if (compact) {
    button.setAttribute("aria-label", t("ariaRemoveCard", { card: cardName }));
  } else {
    button.setAttribute("aria-label", t("numberCardAria", { value, state: t(selected ? "selected" : pending ? "readyToPlace" : "available") }));
    button.setAttribute("aria-pressed", String(pending || selected));
  }
  const category = createElement("span", "card-category", t(card.type === "puzzle-choice" ? "puzzleCard" : "numberCard"));
  const number = createElement("strong", "card-number", String(value));
  const dots = createElement("span", "quantity-dots");
  dots.setAttribute("aria-hidden", "true");
  for (let index = 0; index < Math.min(value, 20); index += 1) dots.append(createElement("i"));
  const marker = createElement("span", "selection-marker", selected ? "✓" : pending ? "↓" : "");
  marker.setAttribute("aria-hidden", "true");
  button.append(category, number, dots, marker);
  return button;
}

function handleCardActivation(cardId, area) {
  if (area === "solution") {
    removeCardFromSolution(cardId);
    return;
  }
  const state = store.getState();
  if (state.missionSolved) return;
  const isCancelling = state.pendingCardId === cardId;
  store.setState({ pendingCardId: isCancelling ? null : cardId });
  announce(t(isCancelling ? "selectionCancelled" : "cardReadyToPlace"));
  if (isCancelling) focusHandCard(cardId);
  else focusAfterRender("#solutionPlaceButton");
}

function placePendingCard() {
  const pending = store.getState().pendingCardId;
  if (pending) addCardToSolution(pending);
}

function addCardToSolution(cardId) {
  const state = store.getState();
  const card = state.availableCards.find((item) => item.instanceId === cardId);
  if (!card || state.selectedCards.some((item) => item.instanceId === cardId) || state.missionSolved) return;
  if (state.selectedCards.length >= (state.currentMission.maximumCards ?? Infinity)) {
    setFeedback("trayIsFull", "clue");
    return;
  }
  store.setState({
    selectedCards: [...state.selectedCards, card],
    pendingCardId: null,
    history: [...state.history, state.selectedCards],
  });
  playTone("place");
  announce(t("cardPlaced", { value: card.value ?? card.quantity }));
  const selectedCount = state.selectedCards.length + 1;
  if (selectedCount >= (state.currentMission.minimumCards ?? 1)) {
    focusAfterRender("#confirmButton");
  } else {
    focusFirstAvailableCard(new Set([...state.selectedCards, card].map((item) => item.instanceId)));
  }
}

function removeCardFromSolution(cardId) {
  const state = store.getState();
  store.setState({
    selectedCards: state.selectedCards.filter((card) => card.instanceId !== cardId),
    history: [...state.history, state.selectedCards],
  });
  announce(t("cardReturned"));
  focusHandCard(cardId);
}

function undoSelection() {
  const state = store.getState();
  if (!state.history.length) {
    setFeedback("nothingToUndo", "neutral");
    return;
  }
  const previous = state.history.at(-1);
  store.setState({ selectedCards: previous, pendingCardId: null, history: state.history.slice(0, -1), missionSolved: false });
  setFeedback("undoComplete", "neutral");
}

function resetAttempt() {
  store.setState({ selectedCards: [], pendingCardId: null, history: [], missionSolved: false });
  setFeedback("freshTry", "neutral");
}

function confirmSolution() {
  const state = store.getState();
  const mission = state.currentMission;
  if (!mission) return;
  const previous = state.discoveredSolutions[mission.id] ?? [];
  const result = validateMission(mission, state.selectedCards, previous);
  if (!result.valid) {
    setFeedback(result.reasonKey || "tryAgain", "clue");
    playTone("clue");
    return;
  }
  if (previous.includes(result.canonical)) {
    setFeedback("solutionAlreadyFound", "clue");
    return;
  }
  const found = [...previous, result.canonical];
  const discoveredSolutions = { ...state.discoveredSolutions, [mission.id]: found };
  const required = mission.solutionsRequired ?? 1;
  if (found.length < required) {
    store.setState({ discoveredSolutions, selectedCards: [], pendingCardId: null, history: [] });
    setFeedback("foundOneFindAnother", "success");
    playTone("success");
    focusFirstAvailableCard();
    return;
  }

  const completedMissions = [...new Set([...state.completedMissions, mission.id])];
  const isNewReward = mission.rewardId && !state.earnedRewards.includes(mission.rewardId);
  const earnedRewards = isNewReward ? [...state.earnedRewards, mission.rewardId] : state.earnedRewards;
  store.setState({
    discoveredSolutions,
    completedMissions,
    earnedRewards,
    missionSolved: true,
    sessionCompleted: state.sessionCompleted + 1,
  });
  setFeedback(mission.type === "pattern" ? "patternSuccess" : "solutionWorks", "success");
  playTone("success");
  if (isNewReward) revealReward(mission.rewardId);
  else focusAfterRender("[data-action='next-mission']");
}

function renderDiscoveredSolutions(state) {
  const container = document.querySelector("#discoveredSolutions");
  container.replaceChildren();
  const solutions = state.currentMission ? state.discoveredSolutions[state.currentMission.id] ?? [] : [];
  if (!solutions.length) return;
  container.append(createElement("span", "discovered-label", t("waysFound", { count: solutions.length })));
  solutions.forEach((solution) => container.append(createElement("span", "solution-chip", formatSavedSolution(solution, state.currentMission))));
}

function showHint() {
  const state = store.getState();
  const hints = state.currentMission?.hintKeys ?? ["tryAgain"];
  const index = Math.min(state.hintStep, hints.length - 1);
  store.setState({ hintStep: index + 1, hintsUsed: state.hintsUsed + 1 });
  setFeedback(hints[index], "hint");
  playTone("place");
}

function renderStrategies(state) {
  const shelf = document.querySelector("#strategyShelf");
  shelf.replaceChildren(createElement("h3", "", t("strategyCards")));
  STRATEGY_CARDS.filter(
    (strategy) =>
      strategy.minimumDifficulty <= state.difficulty &&
      (!strategy.compatibleMissionTypes || strategy.compatibleMissionTypes.includes(state.currentMission?.type)),
  ).slice(0, 4).forEach((strategy) => {
    const button = createElement("button", "strategy-button");
    button.type = "button";
    button.dataset.strategyId = strategy.id;
    button.disabled = Boolean(state.strategyUsed) || state.missionSolved;
    button.append(createElement("span", "strategy-icon", strategyIcon(strategy.icon)), createElement("span", "", t(strategy.labelKey)));
    button.title = t(strategy.descriptionKey);
    shelf.append(button);
  });
}

function useStrategy(strategyId) {
  const state = store.getState();
  if (!state.currentMission || state.strategyUsed || state.missionSolved) return;
  const strategy = STRATEGY_CARDS.find((item) => item.id === strategyId);
  if (!strategy) return;
  if (strategy.action === "ask-clue") {
    showHint();
  } else if (strategy.action === "draw-extra-card") {
    const usedValues = new Set(state.availableCards.map((card) => card.value));
    const extra = NUMBER_CARDS.find((card) => card.difficulty <= state.difficulty && !usedValues.has(card.value));
    if (extra) store.setState({ availableCards: [...state.availableCards, { ...extra, instanceId: `${extra.id}-extra` }] });
  } else if (strategy.action === "swap-one") {
    const available = state.availableCards.filter((card) => !state.selectedCards.some((selected) => selected.instanceId === card.instanceId));
    const remove = available[0];
    const replacement = NUMBER_CARDS.find((card) => card.difficulty <= state.difficulty && !state.availableCards.some((item) => item.value === card.value));
    if (remove && replacement) store.setState({ availableCards: state.availableCards.map((card) => card.instanceId === remove.instanceId ? { ...replacement, instanceId: `${replacement.id}-swap` } : card) });
  } else if (strategy.action === "echo-card") {
    const last = state.selectedCards.at(-1);
    if (!last || state.selectedCards.length >= state.currentMission.maximumCards) {
      setFeedback("chooseCardFirst", "hint");
      return;
    }
    store.setState({ selectedCards: [...state.selectedCards, { ...last, instanceId: `${last.instanceId}-echo` }], history: [...state.history, state.selectedCards] });
  } else if (strategy.action === "nudge-target" && Number.isFinite(state.currentMission.target)) {
    store.setState({ currentMission: { ...state.currentMission, target: state.currentMission.target + 1 } });
  }
  store.setState({ strategyUsed: strategyId });
  setFeedback("strategyUsed", "success");
  focusFirstAvailableCard();
}

function showParentPrompt() {
  const prompts = ["parentPromptNotice", "parentPromptChoose", "parentPromptAnother", "parentPromptNext", "parentPromptExplain", "parentPromptChange"];
  lastParentPrompt = (lastParentPrompt + 1) % prompts.length;
  document.querySelector("#promptTitle").textContent = t(prompts[lastParentPrompt]);
  openModal(elements.promptModal);
}

function revealReward(rewardId) {
  const reward = getRewardById(rewardId);
  if (!reward) return;
  document.querySelector("#rewardTitle").textContent = t(reward.labelKey);
  document.querySelector("#rewardReason").textContent = t(reward.descriptionKey);
  openModal(elements.rewardModal);
}

function renderCollections(state) {
  const rewards = document.querySelector("#rewardGrid");
  rewards.replaceChildren();
  REWARDS.forEach((reward) => {
    const earned = state.earnedRewards.includes(reward.id);
    const card = createElement("article", `reward-card${earned ? " is-earned" : " is-unearned"}`);
    card.append(createElement("span", "reward-icon", earned ? "★" : "☆"), createElement("h3", "", earned ? t(reward.labelKey) : t("mysteryReward")), createElement("p", "", earned ? t(reward.descriptionKey) : t("keepExploring")));
    rewards.append(card);
  });
  const guide = document.querySelector("#cardGuide");
  guide.replaceChildren();
  const entries = [
    ["#", "numberCardsTitle", "numberCardsGuide", "number"],
    ["◫", "puzzleCardsTitle", "puzzleCardsGuide", "puzzle"],
    ["🧭", "missionCardsTitle", "missionCardsGuide", "mission"],
    ["↗", "strategyCardsTitle", "strategyCardsGuide", "strategy"],
    ["★", "rewardCardsTitle", "rewardCardsGuide", "reward"],
  ];
  entries.forEach(([icon, titleKey, bodyKey, category]) => {
    const card = createElement("article", `guide-card category-${category}`);
    card.append(createElement("span", "guide-icon", icon), createElement("h3", "", t(titleKey)), createElement("p", "", t(bodyKey)));
    guide.append(card);
  });
}

function renderParentGuide() {
  const container = document.querySelector("#parentGuideCards");
  container.replaceChildren();
  [
    ["☝", "parentFollowTitle", "parentFollowBody"],
    ["💬", "parentAskTitle", "parentAskBody"],
    ["★", "parentCelebrateTitle", "parentCelebrateBody"],
  ].forEach(([icon, titleKey, bodyKey]) => {
    const card = createElement("article", "parent-guide-card");
    card.append(createElement("span", "guide-icon", icon), createElement("h2", "", t(titleKey)), createElement("p", "", t(bodyKey)));
    container.append(card);
  });
}

function renderProfile(state) {
  document.querySelector("#profileAvatar").textContent = PROFILE_AVATARS[state.profile.avatar] ?? PROFILE_AVATARS.star;
  document.querySelector("#profileName").textContent = state.profile.name;
  document.querySelector("#profileNameInput").value = state.profile.name;
  const stats = document.querySelector("#profileStats");
  stats.replaceChildren();
  const values = [
    ["✓", "missionsCompleted", new Set(state.completedMissions).size],
    ["∞", "solutionsFound", Object.values(state.discoveredSolutions).reduce((total, solutions) => total + solutions.length, 0)],
    ["★", "rewardsEarned", new Set(state.earnedRewards).size],
    ["⌖", "placesExplored", new Set(MISSIONS.filter((mission) => state.completedMissions.includes(mission.id)).map((mission) => mission.location)).size],
  ];
  values.forEach(([icon, key, value]) => {
    const card = createElement("article", "profile-stat");
    card.append(createElement("span", "profile-stat-icon", icon), createElement("strong", "", String(value)), createElement("span", "", t(key)));
    stats.append(card);
  });
  const options = document.querySelector("#avatarOptions");
  options.replaceChildren();
  Object.entries(PROFILE_AVATARS).forEach(([id, icon]) => {
    const button = createElement("button", `avatar-option${state.profile.avatar === id ? " is-selected" : ""}`, icon);
    button.type = "button";
    button.dataset.avatar = id;
    button.setAttribute("aria-label", t(`avatar${id[0].toUpperCase()}${id.slice(1)}`));
    button.setAttribute("aria-pressed", String(state.profile.avatar === id));
    button.addEventListener("click", () => store.setState({ profile: { ...store.getState().profile, avatar: id } }));
    options.append(button);
  });
}

function saveProfile() {
  const name = document.querySelector("#profileNameInput").value.trim().replace(/\s+/g, " ").slice(0, 18);
  store.setState({ profile: { ...store.getState().profile, name: name || t("defaultPlayerName") } });
  announce(t("profileSaved"));
}

function syncSettingsForm(state) {
  elements.settingsForm.elements.language.value = state.language;
  elements.settingsForm.elements.difficulty.value = String(state.difficulty);
  elements.settingsForm.elements.sound.checked = state.settings.sound;
  elements.settingsForm.elements.reducedMotion.checked = state.settings.reducedMotion;
  elements.settingsForm.elements.animationIntensity.value = state.settings.animationIntensity;
  elements.settingsForm.elements.showQuantities.checked = state.settings.showQuantities;
}

function applySettings() {
  const data = new FormData(elements.settingsForm);
  store.setState({
    language: data.get("language") === "zh-CN" ? "zh-CN" : "en",
    difficulty: Number(data.get("difficulty")),
    settings: {
      sound: data.get("sound") === "on",
      reducedMotion: data.get("reducedMotion") === "on",
      animationIntensity: data.get("animationIntensity") === "playful" ? "playful" : "calm",
      showQuantities: data.get("showQuantities") === "on",
    },
  });
}

function handleProgressReset(button) {
  if (!resetArmed) {
    resetArmed = true;
    button.textContent = t("confirmResetProgress");
    button.classList.add("is-armed");
    return;
  }
  const language = store.getState().language;
  clearStoredState();
  resetArmed = false;
  closeModal(elements.settingsModal);
  store.setState(createInitialState(language));
  announce(t("progressResetDone"));
}

function setFeedback(key, tone = "neutral") {
  const paragraph = elements.feedback.querySelector("p");
  currentFeedbackKey = key;
  elements.feedback.dataset.tone = tone;
  paragraph.dataset.i18n = key;
  paragraph.textContent = t(key);
  announce(paragraph.textContent);
}

function formatMissionTarget(mission) {
  if (Number.isFinite(mission.target)) return String(mission.target);
  if (Number.isFinite(mission.minimumTotal)) return `${mission.minimumTotal} — ${mission.maximumTotal}`;
  if (mission.sequence) return `${mission.sequence.join("  ·  ")}  ·  ?`;
  if (mission.predicate) return `< ${mission.predicate.value}`;
  if (mission.targetQuantity) return `★ × ${mission.targetQuantity}`;
  if (mission.choices) return mission.choices.map((choice) => choice.value).join("  ◇  ");
  return "✦";
}

function formatSavedSolution(canonical, mission) {
  const detail = String(canonical).split("|").at(-1) ?? "";
  const [kind, raw = ""] = detail.split(":");
  if (kind === "add") return raw.replaceAll("+", " + ");
  if (kind === "sequence") return raw.replaceAll(",", " → ");
  if (kind === "set") return raw.replaceAll(",", ", ");
  if (kind === "choice") {
    const ids = raw.split(",");
    return ids.map((id) => mission?.choices?.find((choice) => choice.id === id)?.value ?? "✦").join(" + ");
  }
  return "✓";
}

function locationIcon(icon) {
  return { tree: "♣", cave: "◆", river: "≈", mountain: "▲", camp: "⌂" }[icon] ?? "✦";
}

function strategyIcon(icon) {
  return { swap: "⇄", pocket: "+", compass: "✦", echo: "Ⅱ", target: "◎" }[icon] ?? "✦";
}

function createElement(tag, className = "", text = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== "") element.textContent = text;
  return element;
}

function focusAfterRender(selector) {
  requestAnimationFrame(() => {
    const target = document.querySelector(selector);
    if (!target || target.hidden || target.disabled) return;
    if (/^H[1-6]$/.test(target.tagName)) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });
}

function focusHandCard(cardId) {
  requestAnimationFrame(() => {
    const target = [...document.querySelectorAll("#cardHand [data-card-id]")]
      .find((card) => card.dataset.cardId === cardId && !card.disabled);
    target?.focus({ preventScroll: true });
  });
}

function focusFirstAvailableCard(excludedIds = new Set()) {
  requestAnimationFrame(() => {
    const target = [...document.querySelectorAll("#cardHand [data-card-id]")]
      .find((card) => !card.disabled && !excludedIds.has(card.dataset.cardId));
    target?.focus({ preventScroll: true });
  });
}

function playTone(type) {
  if (!store.getState().settings.sound) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = type === "success" ? 660 : type === "clue" ? 330 : 440;
    gain.gain.setValueAtTime(0.04, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
    oscillator.addEventListener("ended", () => context.close());
  } catch {
    // Visual feedback always remains available when audio is unsupported.
  }
}
