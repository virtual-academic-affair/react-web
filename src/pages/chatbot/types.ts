export type ChatRole = "user" | "assistant";

export type ChatStoreToolCall = {
  toolCallId: string;
  toolName: string;
  argsText: string;
  result?: unknown;
  isError?: boolean;
};

export type ChatStoreMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  reasoning?: string;
  sources?: ChatSourceItem[];
  toolCalls?: ChatStoreToolCall[];
};

export type ChatThreadSession = {
  id: string;
  title: string;
  messages: ChatStoreMessage[];
};

export interface ChatSourceItem {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  reasoning?: string;
  sources?: ChatSourceItem[];
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
