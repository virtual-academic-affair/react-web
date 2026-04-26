/**
 * Labels Service
 * Handles Gmail label operations and mappings
 */

import { API_ENDPOINTS } from "@/config/api.config";
import type {
  GmailLabel,
  LabelMappingDto,
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
   * (Deprecated) Mapping is now stored under /shared/settings/email.labels.
   */
  async getLabels(): Promise<LabelMappingDto> {
    const res = await http.get<LabelMappingDto>(
      API_ENDPOINTS.email.labels.base,
    );
    return res.data;
  }

  /**
   * (Deprecated) Update mapping via /shared/settings/email.labels.
   */
  async updateLabels(): Promise<void> {}

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
