import type { Role } from "@/types/users";
import { create } from "zustand";

const IS_AUTH_KEY = "is_authenticated";

interface AuthState {
  accessToken: string | null;
  userRole: Role | null;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
}

/**
 * Decode JWT payload (no library needed) and extract the role field.
 */
function getRoleFromToken(token: string): Role | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns true if the user was previously authenticated in this browser.
 * Stored in localStorage so it survives hard navigations.
 * Cleared immediately on logout — so AuthLayout won't call refreshTokens() after logout.
 */
export function isMarkedAuthenticated(): boolean {
  return localStorage.getItem(IS_AUTH_KEY) === "1";
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userRole: null,
  setAccessToken: (token) => {
    localStorage.setItem(IS_AUTH_KEY, "1");
    set({ accessToken: token, userRole: getRoleFromToken(token) });
  },
  clearAuth: () => {
    localStorage.removeItem(IS_AUTH_KEY);
    set({ accessToken: null, userRole: null });
  },
}));
