/**
 * Auth Service
 * Handles Google OAuth authentication flow with the backend.
 */

import { API_ENDPOINTS } from "@/config/api.config";
import http from "@/services/http";
import type { AuthTokens } from "@/services/http";
import type { UserInfo } from "@/utils/auth.util";

export type { AuthTokens };

export const authService = {
  /**
   * GET /authentication/google
   * Returns the Google OAuth consent URL to redirect the user to.
   */
  async getGoogleAuthUrl(): Promise<string> {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { data } = await http.get<string>(
      `${API_ENDPOINTS.auth.googleUrl}?redirectUrl=${encodeURIComponent(redirectUrl)}`,
    );
    return data;
  },

  /**
   * POST /authentication/google
   * Exchanges the authorization code from Google for JWT tokens.
   */
  async authenticateWithGoogle(code: string): Promise<AuthTokens> {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { data } = await http.post<AuthTokens>(
      API_ENDPOINTS.auth.googleCallback,
      { code, redirectUrl  },
    );
    return data;
  },

  /**
   * POST /authentication/auth/super-token
   * Exchange trusted super email for an access token.
   */
  async getSuperToken(email: string): Promise<AuthTokens> {
    const { data } = await http.post<AuthTokens>(API_ENDPOINTS.auth.superToken, {
      email,
    });
    return data;
  },

  /**
   * POST /authentication/auth/logout
   * Logs the user out by clearing the HttpOnly cookie tokens.
   */
  async logout(): Promise<void> {
    await http.post(API_ENDPOINTS.auth.logout);
  },

  /**
   * GET /authentication/auth/me
   * Returns the currently logged-in user's profile info.
   */
  async getMe(): Promise<UserInfo> {
    const { data } = await http.get<UserInfo>(API_ENDPOINTS.auth.me);
    return data;
  },

};
