const IFRAME_MODE_CLASS = "iframe-mode";

export function isIframeMode(search = window.location.search): boolean {
  return new URLSearchParams(search).get("iframe") === "true";
}

/** Transparent document chrome when embedded in Gmail sidebar. */
export function applyIframeModeClass(): void {
  document.documentElement.classList.toggle(
    IFRAME_MODE_CLASS,
    isIframeMode(),
  );
}
