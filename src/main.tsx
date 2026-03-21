import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App.tsx";
import "./index.css";

// Restore dark mode preference before first render to avoid flash
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

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
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
