/**
 * Cookie Utilities
 * Helpers for managing auth tokens in cookies using js-cookie.
 */

import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

/** Cookie options shared across set/remove */
const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  secure: window.location.protocol === "https:",
  sameSite: "Lax",
  path: "/",
};

export function setAccessToken(token: string): void {
  Cookies.set(ACCESS_TOKEN_KEY, token, {
    ...COOKIE_OPTIONS,
    expires: 1, 
  });
}

export function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS_TOKEN_KEY);
}

export function removeAccessToken(): void {
  Cookies.remove(ACCESS_TOKEN_KEY, COOKIE_OPTIONS);
}

export function setRefreshToken(token: string): void {
  Cookies.set(REFRESH_TOKEN_KEY, token, {
    ...COOKIE_OPTIONS,
    expires: 7,
  });
}

export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_KEY);
}

export function removeRefreshToken(): void {
  Cookies.remove(REFRESH_TOKEN_KEY, COOKIE_OPTIONS);
}

export function removeAllTokens(): void {
  removeAccessToken();
  removeRefreshToken();
}

