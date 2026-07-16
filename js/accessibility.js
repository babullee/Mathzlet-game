let previousFocus = null;

export function openModal(element) {
  if (!element) return;
  previousFocus = document.activeElement;
  element.hidden = false;
  document.querySelector("#app")?.setAttribute("inert", "");
  document.body.classList.add("has-modal");
  requestAnimationFrame(() => element.querySelector("button, select, input, [tabindex='0']")?.focus());
}

export function closeModal(element) {
  if (!element) return;
  element.hidden = true;
  document.querySelector("#app")?.removeAttribute("inert");
  document.body.classList.remove("has-modal");
  previousFocus?.focus?.();
}

export function installModalKeyboardSupport() {
  document.addEventListener("keydown", (event) => {
    const modal = document.querySelector(".modal-backdrop:not([hidden])");
    if (!modal) return;
    if (event.key === "Escape") {
      event.preventDefault();
      modal.querySelector("[data-action^='close-'], [data-action='collect-reward'], [data-action='skip-tutorial']")?.click();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...modal.querySelectorAll("button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex='0']")];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

export function announce(message) {
  const region = document.querySelector("#liveRegion");
  if (!region) return;
  region.textContent = "";
  requestAnimationFrame(() => { region.textContent = message; });
}
