/**
 * Axios HTTP Client
 * Centralized axios instance with:
 * - Auto-attach JWT to requests
 * - Auto-unwrap backend ApiResponse ({ success, data }) format
 * - Auto-refresh tokens on 401
 */

import { API_CONFIG, API_ENDPOINTS } from "@/config/api.config";
import type { ApiErrorResponse, ApiResponse } from "@/types/common";
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/stores/auth.store";
import axios from "axios";

// ── ApiError ─────────────────────────────────────────────────────────────────
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

// ── Main HTTP instance (used by all services) ────────────────────────────────
const http: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  // Serialize arrays as repeated keys: ?systemLabels=a&systemLabels=b
  paramsSerializer: { indexes: false },
});

// ── Plain instance for refresh calls only (no interceptors → no loops) ───────
const refreshHttp = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ── Shared refresh helper (used by interceptor + ProtectedRoute) ─────────────
export interface AuthTokens {
  accessToken: string;
}

export async function refreshTokens(): Promise<AuthTokens> {
  const { data } = await refreshHttp.post<ApiResponse<AuthTokens>>(
    API_ENDPOINTS.auth.refresh
  );
  return data.data as AuthTokens;
}

// ── Request interceptor: attach JWT ──────────────────────────────────────────
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Refresh queue (handles concurrent 401s) ──────────────────────────────────
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

function processQueue(error: unknown, token: string | null = null) {
  for (const p of failedQueue) {
    if (error) p.reject(error);
    else p.resolve(token!);
  }
  failedQueue = [];
}

// ── Response interceptor: unwrap data + handle 401 ───────────────────────────
http.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    response.data = response.data.data as never;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ── 401 → thử refresh token ──────────────────────────────────────────
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return http(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokens = await refreshTokens();
        useAuthStore.getState().setAccessToken(tokens.accessToken);

        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        processQueue(null, tokens.accessToken);
        return http(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── Lỗi khác → chuyển thành ApiError ─────────────────────────────────
    if (axios.isAxiosError(error) && error.response) {
      const body = error.response.data as ApiErrorResponse;
      throw new ApiError(body.statusCode, body.message, body.errors);
    }
    throw new ApiError(0, error?.message ?? "Unknown error");
  },
);

export default http;
