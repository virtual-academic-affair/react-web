/**
 * Email Messages Service
 * Handles email message operations
 */

import { API_ENDPOINTS } from "@/config/api.config";
import type { PaginatedResponse } from "@/types/common";
import type {
  GetMessagesParams,
  Message,
  UpdateMessageSystemLabelsDto,
} from "@/types/email";
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
    params?: GetMessagesParams & { gmailMessageId?: string; threadId?: string },
  ): Promise<PaginatedResponse<Message>> {
    const res = await http.get<PaginatedResponse<Message>>(
      API_ENDPOINTS.email.messages.base,
      { params },
    );
    return res.data;
  }

  /**
   * Convenience helper: find first message by gmailMessageId (if any)
   */
  async findFirstByGmailMessageId(
    gmailMessageId: string,
  ): Promise<Message | null> {
    const result = await this.getMessages({
      gmailMessageId,
      page: 1,
      limit: 1,
    });
    if (!result.items.length) return null;
    return result.items[0]!;
  }

  /**
   * Convenience helper: find first message by threadId (if any)
   */
  async findFirstByThreadId(threadId: string): Promise<Message | null> {
    const result = await this.getMessages({
      threadId,
      page: 1,
      limit: 1,
    });
    if (!result.items.length) return null;
    return result.items[0]!;
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

  /**
   * Replace all system labels for a specific email message
   * @param id - Message ID
   * @param data - Full list of system labels to apply
   * @requires ADMIN role
   */
  async updateMessageLabels(
    id: number,
    data: UpdateMessageSystemLabelsDto,
  ): Promise<void> {
    await http.put(API_ENDPOINTS.email.messages.byIdLabels(id), data);
  }

  /**
   * Delete a specific email message
   * @param id - Message ID
   * @param deleteTasks - Whether to delete associated tasks
   * @requires ADMIN role
   */
  async deleteMessage(id: number, deleteTasks: boolean): Promise<void> {
    await http.delete(API_ENDPOINTS.email.messages.byId(id), {
      params: { deleteTasks },
    });
  }

  /**
   * Get IDs of messages currently being processed
   */
  async getProcessingIds(): Promise<number[]> {
    const res = await http.get<{ data: number[] }>(`${API_ENDPOINTS.email.messages.base}/processing-ids`);
    return res.data.data;
  }
}

// Export singleton instance
export const messagesService = new MessagesService();
