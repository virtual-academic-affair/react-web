/**
 * Auth Service
 * Handles Google OAuth authentication flow with the backend.
 */

import { API_ENDPOINTS } from "@/config/api.config";
import { API_CONFIG } from "@/config/api.config";
import http from "@/services/http";
import type { AuthTokens } from "@/services/http";
import type { UserInfo } from "@/utils/auth.util";

export type { AuthTokens };

export const authService = {
  /**
   * Start Google OAuth sign-in via Passport redirect.
   */
  getGoogleAuthRedirectUrl(state: string = API_CONFIG.appURL): string {
    const url = new URL(`${API_CONFIG.baseURL}${API_ENDPOINTS.auth.googleUrl}`);
    if (state) {
      url.searchParams.set("state", state);
    }
    return url.toString();
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
