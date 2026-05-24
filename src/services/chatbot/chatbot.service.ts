import { API_CONFIG, API_ENDPOINTS } from "@/config/api.config";
import { useAuthStore } from "@/stores/auth.store";

const SSE_EVENT_SEPARATOR = "\n\n";
const SSE_DATA_PREFIX = "data: ";

export type ChatStreamRole = "user" | "assistant";

export interface ChatStreamHistoryItem {
  role: ChatStreamRole;
  content: string;
  timestamp?: string;
}

export interface ChatStreamRequest {
  question: string;
  chatHistory: ChatStreamHistoryItem[];
  /** Tuỳ chọn; mặc định gửi true / "original" / true khi gọi API. */
  resolveCitations?: boolean;
  citationLinkType?: string;
  toRichText?: boolean;
  /** Tiếp tục cuộc trò chuyện cũ; bỏ trống để backend tạo session mới. */
  sessionId?: string;
}

interface StreamBaseEvent {
  done?: boolean;
}

export interface StreamTextEvent extends StreamBaseEvent {
  type: "text";
  content: string;
}

export interface StreamReasoningEvent extends StreamBaseEvent {
  type: "reasoning" | "thought";
  content?: string;
}

export interface StreamCallEvent extends StreamBaseEvent {
  type: "call";
  name?: string;
  args?: unknown;
}

export interface StreamToolOutputEvent extends StreamBaseEvent {
  type: "tool_output";
  name?: string;
  output?: unknown;
}

export interface StreamDoneEvent extends StreamBaseEvent {
  done: true;
  sources?: unknown[];
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  token_usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  processing_time_ms?: number;
  error?: string;
  session_id?: string;
  sessionId?: string;
}

export type ChatStreamEvent =
  | StreamTextEvent
  | StreamReasoningEvent
  | StreamCallEvent
  | StreamToolOutputEvent
  | StreamDoneEvent
  | (Record<string, unknown> & StreamBaseEvent);

const getAuthToken = (): string | null => {
  const storeToken = useAuthStore.getState().accessToken;
  if (storeToken) return storeToken;
  return null;
};

const buildStreamUrl = (): string => {
  return `${API_CONFIG.ragBaseURL}${API_ENDPOINTS.rag.chat.stream}`;
};

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

  const { sessionId, ...rest } = payload;

  const response = await fetch(buildStreamUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...rest,
      resolveCitations: payload.resolveCitations ?? true,
      citationLinkType: payload.citationLinkType ?? "original",
      toRichText: payload.toRichText ?? true,
      ...(sessionId ? { session_id: sessionId } : {}),
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

