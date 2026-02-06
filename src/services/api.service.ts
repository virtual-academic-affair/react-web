/**
 * Generic API Service
 * Wrapper around fetch API with authentication, error handling, and response parsing
 */

import { API_CONFIG } from "../config/api.config";
import type { ApiErrorResponse, ApiResponse } from "../types/common";

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  statusCode: number;
  errors?: ApiErrorResponse["errors"];

  constructor(
    statusCode: number,
    message: string,
    errors?: ApiErrorResponse["errors"],
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * Request options interface
 */
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | string[] | undefined>;
  requiresAuth?: boolean;
  timeout?: number;
}

/**
 * Generic API client class
 */
class ApiService {
  private baseURL: string;
  private defaultHeaders: HeadersInit;
  private defaultTimeout: number;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.defaultHeaders = API_CONFIG.headers;
    this.defaultTimeout = API_CONFIG.timeout;
  }

  /**
   * Get authentication token from storage
   */
  private getAuthToken(): string | null {
    // TODO: Implement based on your auth storage mechanism
    // Example: return localStorage.getItem('authToken');
    return localStorage.getItem("authToken");
  }

  /**
   * Build URL with query parameters
   */
  private buildURL(
    endpoint: string,
    params?: RequestOptions["params"],
  ): string {
    const url = new URL(endpoint, this.baseURL);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // Handle array parameters
            value.forEach((item) => url.searchParams.append(key, String(item)));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }

    return url.toString();
  }

  /**
   * Build request headers
   */
  private buildHeaders(
    requiresAuth: boolean,
    customHeaders?: HeadersInit,
  ): HeadersInit {
    const headers: HeadersInit = {
      ...this.defaultHeaders,
      ...customHeaders,
    };

    if (requiresAuth) {
      const token = this.getAuthToken();
      if (token) {
        (headers as Record<string, string>)["Authorization"] =
          `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError(408, "Request timeout");
      }
      throw error;
    }
  }

  /**
   * Parse response and handle errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    let data: ApiResponse<T> | ApiErrorResponse;

    try {
      data = await response.json();
    } catch (error) {
      throw new ApiError(response.status, "Invalid JSON response from server");
    }

    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      throw new ApiError(
        errorData.statusCode,
        errorData.message,
        errorData.errors,
      );
    }

    return (data as ApiResponse<T>).data;
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const {
      params,
      requiresAuth = true,
      timeout = this.defaultTimeout,
      headers: customHeaders,
      ...fetchOptions
    } = options;

    const url = this.buildURL(endpoint, params);
    const headers = this.buildHeaders(requiresAuth, customHeaders);

    try {
      const response = await this.fetchWithTimeout(
        url,
        {
          ...fetchOptions,
          headers,
        },
        timeout,
      );

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or other errors
      if (error instanceof Error) {
        throw new ApiError(0, error.message);
      }

      throw new ApiError(0, "An unknown error occurred");
    }
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
