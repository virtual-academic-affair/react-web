import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function useIsolatedSearchParams(isolated: boolean) {
  const [routerParams, setRouterParams] = useSearchParams();
  const [localParams, setLocalParams] = useState(
    () => new URLSearchParams(isolated ? window.location.search : ""),
  );

  const setParams = useCallback(
    (
      next:
        | URLSearchParams
        | ((prev: URLSearchParams) => URLSearchParams),
      options?: { replace?: boolean },
    ) => {
      if (isolated) {
        setLocalParams((prev) => {
          const resolved =
            typeof next === "function" ? next(prev) : next;
          return new URLSearchParams(resolved);
        });
        return;
      }
      setRouterParams(next, options);
    },
    [isolated, setRouterParams],
  );

  if (isolated) {
    return [localParams, setParams] as const;
  }

  return [routerParams, setParams] as const;
}
