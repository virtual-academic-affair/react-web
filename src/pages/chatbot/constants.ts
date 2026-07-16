import { message as toast } from "antd";

export const CHAT_SYSTEM_BUSY_MESSAGE =
  "Hệ thống không thể phản hồi do lượng truy cập lớn. Vui lòng thử lại sau ít phút.";

/** Mọi lỗi stream/AI ở chatbot đều hiện chung một câu quá tải. */
export function resolveChatErrorMessage(_input?: {
  error?: unknown;
  message?: unknown;
  statusCode?: unknown;
}): string {
  return CHAT_SYSTEM_BUSY_MESSAGE;
}

/** Hiện lỗi trên đầu màn hình (antd message) — dùng cho mọi lỗi chatbot tương tự. */
export function showChatTopError(text?: string) {
  const content = text?.trim() || CHAT_SYSTEM_BUSY_MESSAGE;
  toast.error(content);
  return content;
}
