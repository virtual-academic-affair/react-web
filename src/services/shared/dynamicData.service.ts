/**
 * Dynamic Data Service
 * Batch-fetches runtime settings and enum constants in a single request.
 * No authentication required.
 */

import { API_ENDPOINTS } from "@/config/api.config";
import type { DynamicDataParams, DynamicDataResponse } from "@/types/shared";
import http from "../http";

class DynamicDataService {
  /**
   * Fetch any combination of settings and enum constants in one call.
   * Designed to load all app-level config the frontend needs at startup.
   *
   * @example
   * const data = await dynamicDataService.get({
   *   settings: ["email.labels", "email.allowedDomains"],
   *   enums: ["shared.systemLabel", "authentication.role"],
   * });
   */
  async get(params?: DynamicDataParams): Promise<DynamicDataResponse> {
    const res = await http.get<DynamicDataResponse>(
      API_ENDPOINTS.shared.dynamicData,
      { params }, // no auth required; token is sent if present, which is harmless
    );
    return res.data;
  }
}

export const dynamicDataService = new DynamicDataService();
