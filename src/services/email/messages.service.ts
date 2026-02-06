/**
 * Email Messages Service
 * Handles email message operations
 */

import { API_ENDPOINTS } from "@/config/api.config";
import type { PaginatedResponse } from "@/types/common";
import type { GetMessagesParams, Message } from "@/types/email";
import { apiService } from "../api.service";

/**
 * Email Messages Service
 */
class MessagesService {
  /**
   * Manually trigger email synchronization from Gmail
   * @requires ADMIN role
   */
  async syncEmails(): Promise<void> {
    return apiService.post<void>(API_ENDPOINTS.email.messages.sync);
  }

  /**
   * Get paginated list of emails with optional filters
   * @param params - Query parameters for filtering, sorting, and pagination
   * @requires ADMIN role
   */
  async getMessages(
    params?: GetMessagesParams,
  ): Promise<PaginatedResponse<Message>> {
    return apiService.get<PaginatedResponse<Message>>(
      API_ENDPOINTS.email.messages.base,
      {
        params: params as Record<
          string,
          string | number | boolean | string[] | undefined
        >,
      },
    );
  }

  /**
   * Get detailed information about a specific email message
   * @param id - Message ID
   * @requires ADMIN role
   */
  async getMessageById(id: number): Promise<Message> {
    return apiService.get<Message>(API_ENDPOINTS.email.messages.byId(id));
  }
}

// Export singleton instance
export const messagesService = new MessagesService();
