/**
 * Dev-only bypass: when VITE_TEMP_TOKEN is set, use it as the access token
 * and skip cookie refresh / login flows.
 */
const TEMP_AUTH_TOKEN = import.meta.env.VITE_TEMP_TOKEN?.trim() || "";

export function hasTempAuth(): boolean {
  return TEMP_AUTH_TOKEN.length > 0;
}

export function getTempAuthToken(): string | null {
  return hasTempAuth() ? TEMP_AUTH_TOKEN : null;
}
