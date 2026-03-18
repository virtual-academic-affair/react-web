/**
 * Services Entry Point
 * Central export for all service modules
 */

// Core HTTP client
export { ApiError, default as http } from "./http";

// Email services
export * from "./email";

// Auth services
export * from "./auth";

// Shared services
export * from "./shared";

// Users services
export * from "./users";

// Class registration services
export * from "./class-registration";

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
