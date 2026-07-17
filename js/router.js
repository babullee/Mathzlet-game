const screens = [
  "home",
  "map",
  "level-select",
  "game",
  "mission-complete",
  "level-complete",
  "world-complete",
  "game-complete",
  "collection",
  "parent",
  "profile",
];
const completionScreens = new Set([
  "mission-complete",
  "level-complete",
  "world-complete",
  "game-complete",
]);

export function showScreen(name) {
  const next = screens.includes(name) ? name : "home";
  const changed = document.body.dataset.screen !== next;
  document.querySelectorAll(".screen[data-screen]").forEach((screen) => {
    const active =
      screen.dataset.screen === next ||
      (screen.dataset.screen === "mission-complete" && completionScreens.has(next));
    screen.hidden = !active;
    screen.classList.toggle("is-active", active);
  });
  document.querySelectorAll("[data-nav]").forEach((button) => {
    const active = button.dataset.nav === next;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  document.body.dataset.screen = next;
  if (changed) {
    if (!completionScreens.has(next) && next !== "game") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    requestAnimationFrame(() => {
      const heading = document.querySelector(
        completionScreens.has(next) ? "#screen-mission-complete h1" : `#screen-${next} h1`,
      );
      if (!heading) return;
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    });
  }
  return next;
}
