/**
 * Polyfill URL.parse for browsers that don't support it.
 *
 * pdfjs-dist v5 uses `URL.parse(val, window.location)` internally.
 * This static method is only available in:
 *   - Chrome 120+
 *   - Firefox 126+
 *   - Edge 120+
 *   - Safari: NOT YET SUPPORTED (as of 2025)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (URL as any).parse !== "function") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (URL as any).parse = (url: string | URL, base?: string | URL): URL | null => {
    try {
      return new URL(url, base);
    } catch {
      return null;
    }
  };
}
