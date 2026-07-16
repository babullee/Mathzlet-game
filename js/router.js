const screens = ["home", "map", "game", "collection", "parent", "profile"];

export function showScreen(name) {
  const next = screens.includes(name) ? name : "home";
  const changed = document.body.dataset.screen !== next;
  document.querySelectorAll(".screen[data-screen]").forEach((screen) => {
    const active = screen.dataset.screen === next;
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
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => {
      const heading = document.querySelector(`#screen-${next} h1`);
      if (!heading) return;
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    });
  }
  return next;
}
