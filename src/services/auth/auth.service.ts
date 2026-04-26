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
  getGoogleAuthRedirectUrl(): string {
    return `${API_CONFIG.baseURL}${API_ENDPOINTS.auth.googleUrl}`;
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
