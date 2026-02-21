/**
 * Axios HTTP Client
 * Centralized axios instance with auth interceptor and response unwrapping
 */

import { API_CONFIG } from "@/config/api.config";
import type { ApiErrorResponse, ApiResponse } from "@/types/common";
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import axios from "axios";

/**
 * Typed API error thrown on non-2xx responses
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

const http: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: { "Content-Type": "application/json" },
  // Serialize arrays as repeated keys: ?systemLabels=a&systemLabels=b
  paramsSerializer: { indexes: null },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = import.meta.env.VITE_TEMP_TOKEN;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: unwrap ApiResponse wrapper, map errors ─────────────
http.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    // Unwrap { success, data, ... } → return raw data so services receive T
    response.data = response.data.data as never;
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const body = error.response.data as ApiErrorResponse;
      throw new ApiError(body.statusCode, body.message, body.errors);
    }
    throw new ApiError(0, error?.message ?? "Unknown error");
  },
);

export default http;
