import type { ChatStreamSummary } from "./types";

export const CHAT_INPUT_PLACEHOLDER = "Nhập nội dung cần hỗ trợ...";

export const CHAT_SYSTEM_BUSY_MESSAGE =
  "Hệ thống đang phản hồi chậm do lượng truy cập lớn. Bạn vui lòng đợi trong giây lát hoặc quay lại sau";

export const ASSISTANT_THINKING_TEXT = "Đang xử lý";
export const ASSISTANT_ERROR_FALLBACK = "Đã có lỗi xảy ra khi gọi chatbot.";

export const PROCESS_STATUS_STEPS = [
  "Đang xử lý câu hỏi...",
  "Đang phân tích ngữ cảnh...",
  "Đang tìm kiếm tài liệu liên quan...",
  "Đang tổng hợp thông tin...",
  "Đang soạn phản hồi...",
] as const;

export const PROCESS_STATUS_INTERVAL_MS = 2500;

export const CHATBOT_METADATA_FILTER = {
  academicYear: ["2025-2026"],
  accessScope: ["student"],
} as const;

export const CHAT_LAYOUT_CLASSNAME = "h-screen min-h-0 p-0";

export const createEmptyStreamSummary = (): ChatStreamSummary => ({
  sources: [],
  tokenUsage: null,
  processingTimeMs: null,
  error: null,
});

