import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const PENDING_TIMEOUT_MS = 4000;

/**
 * Shows a brief overlay after menu navigation starts.
 * Clears when the location changes, or after a timeout if navigation
 * is short-circuited (e.g. catch-all replace back to the same page).
 */
export function useRouteNavigationPending() {
  const location = useLocation();
  const [pending, setPending] = useState(false);
  const locationKeyRef = useRef(location.key);

  useEffect(() => {
    if (locationKeyRef.current === location.key) return;
    locationKeyRef.current = location.key;
    setPending(false);
  }, [location.key]);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => setPending(false), PENDING_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [pending]);

  const startNavigation = useCallback(() => {
    setPending(true);
  }, []);

  return {
    navigationPending: pending,
    startNavigation,
  };
}
