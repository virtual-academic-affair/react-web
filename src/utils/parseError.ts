/**
 * Parse backend error response and return user-friendly message.
 * Handles formats like: {"detail": "..."} or plain string messages
 * Also handles axios error format with response.data
 */
export function parseError(err: unknown): string {
  // Try to extract detail from axios error first
  if (err && typeof err === "object") {
    // Axios error format: error.response.data.detail
    const axiosErr = err as Record<string, unknown>;
    if (axiosErr.response) {
      const response = axiosErr.response as Record<string, unknown>;
      if (response && typeof response.data === "object" && response.data !== null) {
        const data = response.data as Record<string, unknown>;
        if (typeof data.detail === "string") {
          return data.detail;
        }
      }
    }

    // Direct object with detail field
    if (typeof axiosErr.detail === "string") {
      return axiosErr.detail;
    }
  }

  // Already a plain Error with message
  if (err instanceof Error) {
    return err.message;
  }

  // Fallback
  return "Đã xảy ra lỗi. Vui lòng thử lại.";
}
