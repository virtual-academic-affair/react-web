import type { ChatConversationItem, ChatMessage, ChatStreamSummary } from "./types";

export const CHATBOT_PAGE_TITLE = "Trợ lý AI nội bộ";
export const CHATBOT_PAGE_SUBTITLE =
  "Hỗ trợ tra cứu nhanh quy trình, tài liệu và công việc hằng ngày";
export const CHAT_INPUT_PLACEHOLDER = "Nhập nội dung cần hỗ trợ...";

export const NEW_CHAT_TITLE = "Cuộc trò chuyện mới";
export const ASSISTANT_THINKING_TEXT = "Đang xử lý";
export const ASSISTANT_ERROR_FALLBACK = "Đã có lỗi xảy ra khi gọi chatbot.";

export const CHAT_SUGGESTIONS = [
  "Tóm tắt các việc cần làm hôm nay",
  "Gợi ý email phản hồi cho sinh viên",
  "Viết checklist chuẩn bị lớp học",
  "Soạn mẫu nhắc deadline lịch sự",
] as const;

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

export const CHAT_LAYOUT_CLASSNAME =
  "h-screen bg-gradient-to-br from-white via-gray-50 to-brand-50/30 p-0 dark:from-navy-900 dark:via-navy-900 dark:to-navy-800";

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "assistant-1",
    role: "assistant",
    content:
      "Xin chào! Mình là trợ lý AI nội bộ. Bạn có thể bắt đầu bằng cách hỏi về công tác, tài liệu hoặc quy trình làm việc.",
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_CONVERSATIONS: ChatConversationItem[] = [
  {
    id: "conv-1",
    title: NEW_CHAT_TITLE,
    updatedAt: new Date().toISOString(),
  },
];

export const createEmptyStreamSummary = (): ChatStreamSummary => ({
  sources: [],
  tokenUsage: null,
  processingTimeMs: null,
  error: null,
});

