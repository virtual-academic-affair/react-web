import { API_CONFIG, API_ENDPOINTS } from "@/config/api.config";
import { useAuthStore } from "@/stores/auth.store";
import ragHttp from "../rag-http";

const SSE_EVENT_SEPARATOR = "\n\n";
const SSE_DATA_PREFIX = "data: ";

export interface ChatStreamRequest {
  question: string;
  /** Tuỳ chọn; mặc định theo tài liệu API: false / "markdown". */
  resolveCitations?: boolean;
  citationLinkType?: string;
  /** Tiếp tục cuộc trò chuyện cũ; bỏ trống để backend tạo session mới. */
  sessionId?: string;
}

export type ChatQueryRequest = ChatStreamRequest;

export interface ChatPipelineStep {
  type: string;
  content: string;
}

export interface ChatQueryResponse {
  answer: string;
  sessionId: string;
  source: "llm" | "faq" | "bypass" | string;
  sources: unknown[];
  steps?: ChatPipelineStep[];
  processingTimeMs: number;
}

export interface ChatRetrievePreviewRequest {
  question: string;
  topK?: number;
  minScore?: number;
}

export interface ChatRetrievePreviewItem {
  rank: number;
  score: number;
  text: string;
  fileName?: string;
  [key: string]: unknown;
}

export interface ChatRetrievePreviewResponse {
  query: string;
  topK: number;
  count: number;
  items: ChatRetrievePreviewItem[];
}

export interface ChatStreamEvent {
  type?: string;
  done?: boolean;
  content?: string;
  sources?: unknown[];
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  processingTimeMs?: number;
  error?: string;
  sessionId?: string;
  steps?: ChatPipelineStep[];
  [key: string]: unknown;
}

const getAuthToken = (): string | null => {
  const storeToken = useAuthStore.getState().accessToken;
  if (storeToken) return storeToken;
  return null;
};

const buildStreamUrl = (): string => {
  return `${API_CONFIG.ragBaseURL}${API_ENDPOINTS.rag.chat.stream}`;
};

export async function queryChat(
  payload: ChatQueryRequest,
): Promise<ChatQueryResponse> {
  const response = await ragHttp.post<ChatQueryResponse>(
    API_ENDPOINTS.rag.chat.query,
    payload,
  );
  return response.data;
}

export async function retrieveChatPreview(
  payload: ChatRetrievePreviewRequest,
): Promise<ChatRetrievePreviewResponse> {
  const response = await ragHttp.post<ChatRetrievePreviewResponse>(
    API_ENDPOINTS.rag.chat.retrievePreview,
    payload,
  );
  return response.data;
}

export async function streamChat(
  payload: ChatStreamRequest,
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = getAuthToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildStreamUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify({
      question: payload.question,
      resolveCitations: payload.resolveCitations ?? false,
      citationLinkType: payload.citationLinkType ?? "markdown",
      ...(payload.sessionId ? { sessionId: payload.sessionId } : {}),
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Không thể stream hội thoại (HTTP ${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split(SSE_EVENT_SEPARATOR);
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const line = chunk
        .split("\n")
        .find((row) => row.startsWith(SSE_DATA_PREFIX));

      if (!line) continue;

      const jsonRaw = line.slice(SSE_DATA_PREFIX.length).trim();
      if (!jsonRaw) continue;

      try {
        const event = JSON.parse(jsonRaw) as ChatStreamEvent;
        onEvent(event);
        if (event.done) {
          return;
        }
      } catch {
        // Skip malformed chunks to keep stream alive.
      }
    }
  }
}
