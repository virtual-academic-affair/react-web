/**
 * Email Messages Service
 * Handles email message operations
 */

import { API_ENDPOINTS } from "@/config/api.config";
import type { PaginatedResponse } from "@/types/common";
import type { GetMessagesParams, Message } from "@/types/email";
import http from "../http";

/**
 * Email Messages Service
 */
class MessagesService {
  /**
   * Manually trigger email synchronization from Gmail
   * @requires ADMIN role
   */
  async syncEmails(): Promise<void> {
    await http.post(API_ENDPOINTS.email.messages.sync);
  }

  /**
   * Get paginated list of emails with optional filters
   * @param params - Query parameters for filtering, sorting, and pagination
   * @requires ADMIN role
   */
  async getMessages(
    params?: GetMessagesParams,
  ): Promise<PaginatedResponse<Message>> {
    const res = await http.get<PaginatedResponse<Message>>(
      API_ENDPOINTS.email.messages.base,
      { params },
    );
    return res.data;
  }

  /**
   * Get detailed information about a specific email message
   * @param id - Message ID
   * @requires ADMIN role
   */
  async getMessageById(id: number): Promise<Message> {
    const res = await http.get<Message>(API_ENDPOINTS.email.messages.byId(id));
    return res.data;
  }
}

// Export singleton instance
export const messagesService = new MessagesService();
