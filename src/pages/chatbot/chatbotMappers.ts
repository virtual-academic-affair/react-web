import type { AppendMessage, ThreadMessageLike } from "@assistant-ui/react";

import type {
  ChatHistoryMessage,
  ChatSessionItem,
} from "@/services/chatbot/chatSessions.service";

import type {
  ChatSourceItem,
  ChatStoreMessage,
  ChatThreadSession,
} from "./types";

export const DEFAULT_NEW_TITLE = "Cuộc trò chuyện mới";

export function newChatbotId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function getAppendText(message: AppendMessage): string {
  const c = message.content;
  if (typeof c === "string") return c;
  const first = c[0];
  if (first?.type === "text") return first.text;
  return "";
}

export function createDraftSession(): ChatThreadSession {
  return {
    id: newChatbotId("draft"),
    serverId: null,
    title: DEFAULT_NEW_TITLE,
    status: "active",
    messages: [],
    messagesLoaded: true,
    lastMessageAt: null,
    updatedAt: null,
  };
}

export function sessionFromServer(item: ChatSessionItem): ChatThreadSession {
  return {
    id: item.sessionId,
    serverId: item.sessionId,
    title: item.title?.trim() || DEFAULT_NEW_TITLE,
    status: item.status,
    messages: [],
    messagesLoaded: false,
    lastMessageAt: item.lastMessageAt,
    updatedAt: item.updatedAt,
  };
}

export function mergeFetchedSessions(
  fetched: ChatThreadSession[],
  current: ChatThreadSession[],
) {
  const fetchedIds = new Set(fetched.map((session) => session.id));
  const mergedFetched = fetched.map((session) => {
    const existing = current.find((item) => item.id === session.id);
    if (!existing) return session;
    return {
      ...session,
      messages: existing.messages,
      messagesLoaded: existing.messagesLoaded,
    };
  });
  const preservedCurrent = current.filter(
    (session) => !fetchedIds.has(session.id),
  );
  return [...mergedFetched, ...preservedCurrent];
}

export function historyMessageToStore(
  msg: ChatHistoryMessage,
  index: number,
  sessionId: string,
): ChatStoreMessage {
  const sources: ChatSourceItem[] = [];
  for (const raw of msg.sources ?? []) {
    if (!raw) continue;
    const url =
      typeof raw.original_url === "string" && raw.original_url
        ? raw.original_url
        : typeof raw.url === "string" && raw.url
          ? raw.url
          : "";
    if (!url) continue;
    sources.push({
      title: typeof raw.title === "string" && raw.title ? raw.title : url,
      url,
    });
  }

  return {
    id: `${sessionId}-history-${msg.sequence}-${index}`,
    role: msg.role,
    content:
      msg.role === "assistant" &&
      (msg.messageType ?? msg.message_type) === "thinking"
        ? ""
        : msg.content,
    createdAt: msg.createdAt ?? msg.created_at,
    reasoning:
      msg.role === "assistant" &&
      (msg.messageType ?? msg.message_type) === "thinking"
        ? msg.content
        : undefined,
    sources: sources.length ? sources : undefined,
  };
}

function splitReasoningIntoSteps(raw: string | undefined): string[] {
  const t = (raw ?? "").trim();
  if (!t) return [];
  const byRule = t
    .split(/\n-{3,}\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byRule.length > 1) return byRule;
  const paras = t
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return paras.length ? paras : [t];
}

export function convertMessage(m: ChatStoreMessage): ThreadMessageLike {
  const parts: Array<
    | { type: "text"; text: string }
    | { type: "reasoning"; text: string; parentId?: string }
    | {
        type: "source";
        sourceType: "url";
        id: string;
        url: string;
        title?: string;
      }
    | {
        type: "tool-call";
        toolCallId: string;
        toolName: string;
        argsText: string;
        result?: unknown;
        isError?: boolean;
      }
  > = [];

  if (m.role === "assistant") {
    for (const tc of m.toolCalls ?? []) {
      parts.push({
        type: "tool-call",
        toolCallId: tc.toolCallId,
        toolName: tc.toolName,
        argsText: tc.argsText,
        result: tc.result,
        isError: tc.isError,
      });
    }
    const steps = splitReasoningIntoSteps(m.reasoning);
    const n = steps.length;
    steps.forEach((step, i) => {
      parts.push({ type: "reasoning", text: step, parentId: `r-${i}-of-${n}` });
    });
  }
  parts.push({ type: "text", text: m.content });
  for (const s of m.sources ?? []) {
    parts.push({
      type: "source",
      sourceType: "url",
      id: s.url,
      url: s.url,
      title: s.title,
    });
  }

  return {
    role: m.role,
    id: m.id,
    createdAt: new Date(m.createdAt),
    content: parts,
  };
}

export function sortSessionsByActivity(
  sessions: ChatThreadSession[],
  activeThreadId: string,
) {
  const getTime = (session: ChatThreadSession) => {
    const newestMessage = session.messages.reduce<string | null>(
      (latest, message) => {
        if (!latest) return message.createdAt;
        return new Date(message.createdAt).getTime() >
          new Date(latest).getTime()
          ? message.createdAt
          : latest;
      },
      null,
    );
    const raw = session.lastMessageAt ?? session.updatedAt ?? newestMessage;
    const time = raw ? Date.parse(raw) : Number.NaN;
    if (Number.isFinite(time)) return time;
    return session.id === activeThreadId ? Number.MAX_SAFE_INTEGER : 0;
  };

  return [...sessions].sort((a, b) => getTime(b) - getTime(a));
}

export function sourceItemsFromStream(rawSources: unknown[]) {
  return rawSources
    .map((source) => {
      if (!source || typeof source !== "object") return null;
      const candidate = source as Record<string, unknown>;
      const urlRaw = candidate.original_url;
      if (typeof urlRaw !== "string" || !urlRaw.trim()) return null;
      const titleRaw =
        candidate.title ??
        candidate.file_name ??
        candidate.name ??
        candidate.filename;
      return {
        title:
          typeof titleRaw === "string" && titleRaw.trim() ? titleRaw : urlRaw,
        url: urlRaw,
      };
    })
    .filter((item): item is ChatSourceItem => item !== null);
}
