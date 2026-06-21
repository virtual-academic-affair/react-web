import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

const MOBILE_BREAKPOINT = 1024;

export function useMobileBodyScrollLock(locked: boolean) {
  useBodyScrollLock(locked, { maxViewportWidth: MOBILE_BREAKPOINT });
}
