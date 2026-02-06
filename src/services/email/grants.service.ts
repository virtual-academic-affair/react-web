/**
 * Grants Service
 * Handles Gmail OAuth operations
 */

import { API_ENDPOINTS } from "@/config/api.config";
import type { CodeDto } from "@/types/email";
import { apiService } from "../api.service";

/**
 * Grants Service
 */
class GrantsService {
  /**
   * Generate Google OAuth2 authorization URL for granting Gmail API access
   * @requires ADMIN role
   * @returns Google OAuth URL
   */
  async getGmailAuthUrl(): Promise<string> {
    return apiService.get<string>(API_ENDPOINTS.email.grants.base);
  }

  /**
   * Exchange OAuth authorization code for refresh token and save Gmail credentials
   * @param data - Authorization code from Google OAuth redirect
   * @requires ADMIN role
   */
  async grantGmailAccess(data: CodeDto): Promise<void> {
    return apiService.post<void>(API_ENDPOINTS.email.grants.base, data);
  }
}

// Export singleton instance
export const grantsService = new GrantsService();
