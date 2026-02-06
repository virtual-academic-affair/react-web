/**
 * Services Entry Point
 * Central export for all service modules
 */

// Core API service
export { ApiError, apiService } from "./api.service";

// Email services
export * from "./email";

// Re-export common types
export type {
  ApiErrorResponse,
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
  PaginationParams,
  SortOrder,
  ValidationError,
} from "../types/common";
