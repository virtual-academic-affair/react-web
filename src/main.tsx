import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyIframeEmbedMode, applyIframeLightTheme, isIframeMode } from "./utils/iframeMode";
import { initTheme, watchSystemTheme } from "./utils/theme";

applyIframeEmbedMode();
initTheme();

watchSystemTheme(() => {
  // Body class is updated in applyThemeMode; MutationObserver in App/useTheme syncs UI.
});

const syncDocumentTheme = () => {
  if (isIframeMode()) {
    applyIframeLightTheme();
    return;
  }
  const isDark = document.body.classList.contains("dark");
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
};

syncDocumentTheme();

new MutationObserver(syncDocumentTheme).observe(document.body, {
  attributes: true,
  attributeFilter: ["class"],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * Default cache time: 60 seconds.
       * After this, data is considered "stale" and will be refetched in the background.
       * Override per-query with: useQuery({ ..., staleTime: 5 * 60 * 1000 })
       */
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* DevTools only included in development builds */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  </StrictMode>,
);
