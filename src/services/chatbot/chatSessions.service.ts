import { API_ENDPOINTS } from "@/config/api.config";
import ragHttp from "../rag-http";

export type ChatSessionStatus = "active" | "archived";

export interface ChatSessionItem {
  sessionId: string;
  title: string | null;
  status: ChatSessionStatus;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSessionListResponse {
  page: number;
  pageSize: number;
  total: number;
  items: ChatSessionItem[];
}

export interface ChatHistoryTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatHistorySource {
  citationId: number;
  fileName: string;
  title: string;
  fileId: string;
  pages: string[];
  originalUrl: string;
  markdownUrl: string;
}

export interface ChatHistoryStep {
  type: string;
  content: string;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  messageType: "text" | "thinking";
  content: string;
  sequence: number;
  tokenUsage: ChatHistoryTokenUsage | null;
  sources: ChatHistorySource[];
  steps: ChatHistoryStep[] | null;
  processingTimeMs: number | null;
  createdAt: string;
}

export interface ChatSessionMessagesResponse {
  sessionId: string;
  page: number;
  pageSize: number;
  total: number;
  items: ChatHistoryMessage[];
}

export interface ChatSessionMutationResponse {
  sessionId: string;
  success: boolean;
}

export async function listSessions(
  params: {
    page?: number;
    pageSize?: number;
    statusFilter?: ChatSessionStatus;
  } = {},
) {
  const response = await ragHttp.get<ChatSessionListResponse>(
    API_ENDPOINTS.rag.chat.sessions.base,
    {
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 50,
        ...(params.statusFilter ? { statusFilter: params.statusFilter } : {}),
      },
    },
  );
  return response.data;
}

export async function listSessionMessages(
  sessionId: string,
  params: { page?: number; pageSize?: number } = {},
) {
  const response = await ragHttp.get<ChatSessionMessagesResponse>(
    API_ENDPOINTS.rag.chat.sessions.messages(sessionId),
    {
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 50,
      },
    },
  );
  return response.data;
}

export async function renameSession(sessionId: string, title: string) {
  const response = await ragHttp.patch<ChatSessionMutationResponse>(
    API_ENDPOINTS.rag.chat.sessions.byId(sessionId),
    { title },
  );
  return response.data;
}

export async function archiveSession(sessionId: string) {
  const response = await ragHttp.post<ChatSessionMutationResponse>(
    API_ENDPOINTS.rag.chat.sessions.archive(sessionId),
  );
  return response.data;
}

export async function unarchiveSession(sessionId: string) {
  const response = await ragHttp.post<ChatSessionMutationResponse>(
    API_ENDPOINTS.rag.chat.sessions.unarchive(sessionId),
  );
  return response.data;
}

export async function deleteSession(sessionId: string) {
  const response = await ragHttp.delete<ChatSessionMutationResponse>(
    API_ENDPOINTS.rag.chat.sessions.byId(sessionId),
  );
  return response.data;
}
