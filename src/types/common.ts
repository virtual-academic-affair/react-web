/**
 * Common types used across the application
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: ValidationError[];
}

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;
  message: string[];
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Query parameters for pagination
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Sort order enum
 */
export type SortOrder = "ASC" | "DESC";
