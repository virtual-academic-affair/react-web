export type ChatRole = "user" | "assistant";

export type ChatReasoningStep = {
  id: string;
  type: string;
  content: string;
};

export type ChatStoreMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  reasoning?: string;
  reasoningSteps?: ChatReasoningStep[];
  reasoningDefaultOpen?: boolean;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  processingTimeMs?: number;
  sources?: ChatSourceItem[];
};

export type ChatSessionStatus = "active" | "archived";

export type ChatThreadSession = {
  /** Local thread id used by assistant-ui runtime. Equal to serverId once persisted. */
  id: string;
  /** Server-side session id once the conversation has been persisted. */
  serverId: string | null;
  title: string;
  status: ChatSessionStatus;
  messages: ChatStoreMessage[];
  /** Đã fetch danh sách messages từ server chưa. */
  messagesLoaded: boolean;
  lastMessageAt: string | null;
  updatedAt: string | null;
};

export interface ChatSourceItem {
  title: string;
  url: string;
  citationId?: number;
  fileName?: string;
  pages?: string[];
  markdownUrl?: string;
}
