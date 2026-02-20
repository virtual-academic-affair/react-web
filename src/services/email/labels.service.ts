/**
 * Labels Service
 * Handles Gmail label operations and mappings
 */

import { API_ENDPOINTS } from "@/config/api.config";
import type {
  GmailLabel,
  LabelMappingDto,
  UpdateLabelsDto,
} from "@/types/email";
import http from "../http";

/**
 * Labels Service
 */
class LabelsService {
  /**
   * Fetch all non-system labels from the connected Gmail account
   * @requires ADMIN role
   */
  async getGmailLabels(): Promise<GmailLabel[]> {
    const res = await http.get<GmailLabel[]>(
      API_ENDPOINTS.email.labels.gmailLabels,
    );
    return res.data;
  }

  /**
   * Get the mapping between system labels and Gmail label IDs
   * @requires ADMIN role
   */
  async getLabels(): Promise<LabelMappingDto> {
    const res = await http.get<LabelMappingDto>(
      API_ENDPOINTS.email.labels.base,
    );
    return res.data;
  }

  /**
   * Update the mapping between system labels and Gmail label IDs
   * @param data - Label mappings to update
   * @requires ADMIN role
   */
  async updateLabels(data: UpdateLabelsDto): Promise<void> {
    await http.put(API_ENDPOINTS.email.labels.base, data);
  }

  /**
   * Automatically create missing Gmail labels and update mappings
   * Creates parent label "VAA" and child labels for unmapped system labels
   * @requires ADMIN role
   */
  async autoCreateLabels(): Promise<LabelMappingDto> {
    const res = await http.post<LabelMappingDto>(
      API_ENDPOINTS.email.labels.autoCreate,
    );
    return res.data;
  }
}

// Export singleton instance
export const labelsService = new LabelsService();
