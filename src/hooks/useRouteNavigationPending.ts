import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export function useRouteNavigationPending() {
  const location = useLocation();
  const [navigationPending, setNavigationPending] = useState(false);

  useEffect(() => {
    setNavigationPending(false);
  }, [location.key]);

  const startNavigation = useCallback(() => {
    setNavigationPending(true);
  }, []);

  return {
    navigationPending,
    startNavigation,
  };
}
