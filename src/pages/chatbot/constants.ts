import { message as toast } from "antd";

export const CHAT_SYSTEM_BUSY_MESSAGE =
  "Hệ thống không thể phản hồi do lượng truy cập lớn. Vui lòng thử lại sau ít phút.";

const GENERIC_ERROR_CODES = new Set([
  "ai_service_error",
  "app_error",
  "internal_error",
  "rate_limit_exceeded",
]);

/** Chọn câu lỗi hiển thị cho user từ payload SSE / HTTP. */
export function resolveChatErrorMessage(input?: {
  error?: unknown;
  message?: unknown;
  statusCode?: unknown;
}): string {
  const code = typeof input?.error === "string" ? input.error.trim() : "";
  const msg = typeof input?.message === "string" ? input.message.trim() : "";
  const statusCode =
    typeof input?.statusCode === "number" ? input.statusCode : undefined;

  if (
    statusCode === 429 ||
    code === "rate_limit_exceeded" ||
    code.toLowerCase().includes("rate_limit")
  ) {
    return CHAT_SYSTEM_BUSY_MESSAGE;
  }

  if (msg) return msg;
  if (code && !GENERIC_ERROR_CODES.has(code)) return code;
  return CHAT_SYSTEM_BUSY_MESSAGE;
}

/** Hiện lỗi trên đầu màn hình (antd message) — dùng cho mọi lỗi chatbot tương tự. */
export function showChatTopError(text: string) {
  const content = text.trim() || CHAT_SYSTEM_BUSY_MESSAGE;
  toast.error(content);
  return content;
}
