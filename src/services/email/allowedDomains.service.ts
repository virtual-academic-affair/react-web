/**
 * Allowed Domains Service
 * Handles email domain whitelist operations
 */

import { API_ENDPOINTS } from "@/config/api.config";
import type { UpdateAllowedDomainsDto } from "@/types/email";
import { apiService } from "../api.service";

/**
 * Allowed Domains Service
 */
class AllowedDomainsService {
  /**
   * Get the list of allowed email domains for synchronization
   * @requires ADMIN role
   */
  async getAllowedDomains(): Promise<string[]> {
    return apiService.get<string[]>(API_ENDPOINTS.email.allowedDomains.base);
  }

  /**
   * Update the list of allowed email domains
   * Only emails from these domains will be synchronized
   * @param data - Array of allowed domain names (must be unique)
   * @requires ADMIN role
   */
  async updateAllowedDomains(data: UpdateAllowedDomainsDto): Promise<void> {
    return apiService.put<void>(API_ENDPOINTS.email.allowedDomains.base, data);
  }
}

// Export singleton instance
export const allowedDomainsService = new AllowedDomainsService();
