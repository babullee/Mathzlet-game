const focusOrigins = new WeakMap();
let keyboardSupportInstalled = false;
let announcementFrame = 0;

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function visibleFocusableElements(element) {
  return [...element.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
    (candidate) =>
      !candidate.hidden &&
      candidate.getAttribute("aria-hidden") !== "true" &&
      candidate.getClientRects().length > 0,
  );
}

function visibleModals() {
  return [...document.querySelectorAll(".modal-backdrop:not([hidden])")];
}

export function openModal(element) {
  if (!element) return;
  const currentFocus = document.activeElement;
  if (currentFocus instanceof HTMLElement) {
    focusOrigins.set(element, currentFocus);
  }
  element.hidden = false;
  element.setAttribute("aria-hidden", "false");
  document.querySelector("#app")?.setAttribute("inert", "");
  document.body.classList.add("has-modal");
  requestAnimationFrame(() => {
    const firstFocusable = visibleFocusableElements(element)[0];
    if (firstFocusable) {
      firstFocusable.focus();
      return;
    }
    if (!element.hasAttribute("tabindex")) element.setAttribute("tabindex", "-1");
    element.focus();
  });
}

export function closeModal(element) {
  if (!element) return;
  element.hidden = true;
  element.setAttribute("aria-hidden", "true");

  if (visibleModals().length === 0) {
    document.querySelector("#app")?.removeAttribute("inert");
    document.body.classList.remove("has-modal");
  }

  const previousFocus = focusOrigins.get(element);
  focusOrigins.delete(element);
  if (previousFocus?.isConnected && !previousFocus.closest("[inert]")) {
    previousFocus.focus();
  } else if (visibleModals().length === 0) {
    document.querySelector("#mainContent")?.focus();
  }
}

export function installModalKeyboardSupport() {
  if (keyboardSupportInstalled) return;
  keyboardSupportInstalled = true;

  document.addEventListener("keydown", (event) => {
    const modal = visibleModals().at(-1);
    if (!modal) return;
    if (event.key === "Escape") {
      const dismissButton = modal.querySelector(
        "[data-action^='close-'], [data-action='collect-reward'], [data-action='skip-tutorial'], [data-action='skip-celebration']",
      );
      if (dismissButton) {
        event.preventDefault();
        dismissButton.click();
      }
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = visibleFocusableElements(modal);
    if (!focusable.length) {
      event.preventDefault();
      modal.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable.at(-1);
    const focusIsOutside = !modal.contains(document.activeElement);
    if (focusIsOutside || (event.shiftKey && document.activeElement === first)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

export function announce(message) {
  const region = document.querySelector("#liveRegion");
  if (!region) return;
  if (announcementFrame) cancelAnimationFrame(announcementFrame);
  region.textContent = "";
  announcementFrame = requestAnimationFrame(() => {
    region.textContent = String(message ?? "");
    announcementFrame = 0;
  });
}
