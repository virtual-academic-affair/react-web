import { useCallback, useState } from "react";

export function useTheme() {
  const [darkmode, setDarkmode] = useState(
    () => document.body.classList.contains("dark"),
  );

  const toggleDarkMode = useCallback(() => {
    if (darkmode) {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkmode(false);
      return;
    }

    document.body.classList.add("dark");
    localStorage.setItem("theme", "dark");
    setDarkmode(true);
  }, [darkmode]);

  return { darkmode, toggleDarkMode };
}
