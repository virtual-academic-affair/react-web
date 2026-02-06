/**
 * Message Labels Service
 * Handles message label operations
 */

import { API_ENDPOINTS } from "@/config/api.config";
import type { UpdateMessageLabelDto } from "@/types/email";
import { apiService } from "../api.service";

/**
 * Message Labels Service
 */
class MessageLabelsService {
  /**
   * Add or remove a system label from an email message
   * Updates both database and Gmail labels
   * @param data - Label update data
   * @requires ADMIN role
   */
  async updateMessageLabel(data: UpdateMessageLabelDto): Promise<void> {
    return apiService.put<void>(API_ENDPOINTS.email.messageLabels.update, data);
  }
}

// Export singleton instance
export const messageLabelsService = new MessageLabelsService();
