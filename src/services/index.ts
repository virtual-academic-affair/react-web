/**
 * Services Entry Point
 * Central export for all service modules
 */

// Core HTTP client
export { ApiError, default as http } from "./http";

// Email services
export * from "./email";

// Shared services
export * from "./shared";

// Re-export common types
export type {
  ApiErrorResponse,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  ResourceQueryDto,
  SortOrder,
  ValidationError,
} from "../types/common";
