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

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  messageType?: "text" | "thinking";
  content: string;
  sequence: number;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  } | null;
  sources: Array<{
    title?: string;
    score?: number;
    citationId?: number;
    citation_id?: number;
    url?: string;
    originalUrl?: string;
    original_url?: string;
    fileName?: string;
    file_name?: string;
    pages?: string[];
    markdownUrl?: string;
    markdown_url?: string;
  }> | null;
  steps?: Array<{
    type: string;
    content: string;
  }> | null;
  processingTimeMs?: number | null;
  createdAt?: string;
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
