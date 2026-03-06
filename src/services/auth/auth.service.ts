/**
 * Auth Service
 * Handles Google OAuth authentication flow with the backend.
 */

import { API_ENDPOINTS } from "@/config/api.config";
import http from "@/services/http";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  /**
   * GET /authentication/google
   * Returns the Google OAuth consent URL to redirect the user to.
   */
  async getGoogleAuthUrl(): Promise<string> {
    const { data } = await http.get<string>(API_ENDPOINTS.auth.googleUrl);
    return data;
  },

  /**
   * POST /authentication/google
   * Exchanges the authorization code from Google for JWT tokens.
   */
  async authenticateWithGoogle(code: string): Promise<AuthTokens> {
    const { data } = await http.post<AuthTokens>(
      API_ENDPOINTS.auth.googleCallback,
      { code },
    );
    return data;
  },

};
