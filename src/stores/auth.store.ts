import type { Role } from "@/types/users";
import { create } from "zustand";

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

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userRole: null,
  setAccessToken: (token) =>
    set({ accessToken: token, userRole: getRoleFromToken(token) }),
  clearAuth: () => set({ accessToken: null, userRole: null }),
}));
