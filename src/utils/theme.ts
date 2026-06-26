export type ThemeMode = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";

const THEME_MODES: ThemeMode[] = ["light", "dark", "system"];

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value != null && THEME_MODES.includes(value as ThemeMode);
}

export function getStoredThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (isThemeMode(stored)) return stored;
  return "system";
}

export function getSystemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return getSystemPrefersDark();
}

export function applyThemeMode(mode: ThemeMode): void {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  document.body.classList.toggle("dark", resolveIsDark(mode));
}

export function initTheme(): void {
  applyThemeMode(getStoredThemeMode());
}

export function watchSystemTheme(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    if (getStoredThemeMode() === "system") {
      applyThemeMode("system");
      onChange();
    }
  };

  mediaQuery.addEventListener("change", handler);
  return () => mediaQuery.removeEventListener("change", handler);
}
