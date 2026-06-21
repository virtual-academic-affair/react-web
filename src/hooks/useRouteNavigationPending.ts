import { useCallback, useState } from "react";
import { useLocation } from "react-router-dom";

export function useRouteNavigationPending() {
  const location = useLocation();
  const [pendingFromLocationKey, setPendingFromLocationKey] = useState<
    string | null
  >(null);

  const startNavigation = useCallback(() => {
    setPendingFromLocationKey(location.key);
  }, [location.key]);

  return {
    navigationPending: pendingFromLocationKey === location.key,
    startNavigation,
  };
}
