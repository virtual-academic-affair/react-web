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
  content: string;
  sequence: number;
  token_usage: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  } | null;
  sources:
    | Array<{
        document_id?: string;
        title?: string;
        score?: number;
        url?: string;
        original_url?: string;
      }>
    | null;
  processing_time_ms: number | null;
  created_at: string;
}

export interface ChatSessionMessagesResponse {
  session_id: string;
  page: number;
  page_size: number;
  total: number;
  items: ChatHistoryMessage[];
}

export interface ChatSessionMutationResponse {
  session_id: string;
  success: boolean;
}

export async function listSessions(params: {
  page?: number;
  pageSize?: number;
} = {}) {
  const response = await ragHttp.get<ChatSessionListResponse>(
    API_ENDPOINTS.rag.chat.sessions.base,
    {
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 20,
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
        page_size: params.pageSize ?? 50,
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

export async function deleteSession(sessionId: string) {
  const response = await ragHttp.delete<ChatSessionMutationResponse>(
    API_ENDPOINTS.rag.chat.sessions.byId(sessionId),
  );
  return response.data;
}
