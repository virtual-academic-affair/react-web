import { useCallback, useEffect, useState } from "react";

import {
  applyThemeMode,
  getStoredThemeMode,
  resolveIsDark,
  type ThemeMode,
  watchSystemTheme,
} from "@/utils/theme";

export function useTheme() {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() =>
    getStoredThemeMode(),
  );
  const [darkmode, setDarkmode] = useState(() =>
    resolveIsDark(getStoredThemeMode()),
  );

  const setThemeMode = useCallback((mode: ThemeMode) => {
    applyThemeMode(mode);
    setThemeModeState(mode);
    setDarkmode(resolveIsDark(mode));
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkmode(document.body.classList.contains("dark"));
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => watchSystemTheme(() => {
    setThemeModeState("system");
    setDarkmode(resolveIsDark("system"));
  }), []);

  return { themeMode, setThemeMode, darkmode };
}
