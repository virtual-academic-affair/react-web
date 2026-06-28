const IFRAME_MODE_CLASS = "iframe-mode";

export function isIframeMode(search = window.location.search): boolean {
  return new URLSearchParams(search).get("iframe") === "true";
}

/** Force light palette in Gmail sidebar embed (ignores stored/user theme). */
export function applyIframeLightTheme(): void {
  document.body.classList.remove("dark");
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
}

/**
 * Gmail iframe embed: transparent page chrome + always light theme.
 * Card/surface backgrounds (bg-white, etc.) stay opaque via component classes + CSS.
 */
export function applyIframeEmbedMode(): void {
  const enabled = isIframeMode();
  document.documentElement.classList.toggle(IFRAME_MODE_CLASS, enabled);
  if (enabled) {
    applyIframeLightTheme();
  }
}

/** @deprecated Use applyIframeEmbedMode */
export function applyIframeModeClass(): void {
  applyIframeEmbedMode();
}
