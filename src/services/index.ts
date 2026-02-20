/**
 * Services Entry Point
 * Central export for all service modules
 */

// Core HTTP client
export { ApiError, default as http } from "./http";

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
