export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface ChatStreamStats {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface ChatStreamSummary {
  sources: unknown[];
  tokenUsage: ChatStreamStats | null;
  processingTimeMs: number | null;
  error: string | null;
}

export interface ChatConversationItem {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ContentSegment {
  type: "text" | "code";
  content: string;
  language?: string;
}

