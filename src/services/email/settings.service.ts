/**
 * Email Settings Service
 * Handles email-specific application settings
 */

import { API_ENDPOINTS } from "@/config/api.config";
import http from "../http";

/**
 * Email Settings Service
 */
class EmailSettingsService {
  /**
   * Get the current status of saving email content
   * @requires ADMIN role
   */
  async getCanSaveContent(): Promise<boolean> {
    const res = await http.get<boolean>(API_ENDPOINTS.email.canSaveContent.base);
    return !!res.data;
  }

  /**
   * Update the status of saving email content
   * @param canSaveContent - Whether to save email content to the database
   * @requires ADMIN role
   */
  async updateCanSaveContent(canSaveContent: boolean): Promise<void> {
    await http.put(API_ENDPOINTS.email.canSaveContent.base, { canSaveContent });
  }
}

// Export singleton instance
export const emailSettingsService = new EmailSettingsService();
