import type { YearRange } from "@/types/faqs";

export type ChatRole = "user" | "assistant";

export type CorpusTraversalAction = "expand" | "inspect" | "select" | "no_match";

export type CorpusNodeVisualState = "default" | "active" | "opened" | "skipped";

export type ChatCorpusTreeNode = {
  nodeKey: string;
  title: string;
  children: ChatCorpusTreeNode[];
};

export type ChatCorpusTraversalStep = {
  id: string;
  action: CorpusTraversalAction;
  content: string;
  nodeKey?: string;
  nodeKeys?: string[];
};

export type ChatCorpusTraversal = {
  tree: ChatCorpusTreeNode[];
  steps: ChatCorpusTraversalStep[];
};

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
  corpusTraversal?: ChatCorpusTraversal;
  corpusStreamPhaseActive?: boolean;
  reasoningDefaultOpen?: boolean;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  faqRecommendation?: ChatFaqRecommendation;
  processingTimeMs?: number;
  sources?: ChatSourceItem[];
};

export type ChatFaqRecommendation = {
  effectiveQuestion: string;
  lecturerOnly: boolean;
  metadata: {
    academicYear: YearRange;
    enrollmentYear: YearRange;
  };
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
  titles?: string[];
  url: string;
  citationId?: number;
  fileId?: string;
  fileName?: string;
  pages?: string[];
  markdownUrl?: string;
}
