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
 * Paginated response structure (matches ResourceQueryDto response shape)
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Common query parameters shared by all list endpoints (ResourceQueryDto)
 */
export interface ResourceQueryDto {
  page?: number;
  limit?: number;
  keyword?: string;
  orderCol?: string;
  orderDir?: SortOrder;
}

/** @deprecated Use ResourceQueryDto */
export type PaginationParams = Pick<ResourceQueryDto, "page" | "limit">;

/**
 * Sort direction
 */
export type SortOrder = "ASC" | "DESC";
