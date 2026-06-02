import type { AppendMessage, ThreadMessageLike } from "@assistant-ui/react";

import type {
  ChatHistoryMessage,
  ChatSessionItem,
} from "@/services/chatbot/chatSessions.service";

import type {
  ChatReasoningStep,
  ChatSourceItem,
  ChatStoreMessage,
  ChatThreadSession,
} from "./types";

export const DEFAULT_NEW_TITLE = "Cuộc trò chuyện mới";
export const STRUCTURED_REASONING_PREFIX = "__CHATBOT_REASONING_STEPS__";

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

function historyStepsToStore(
  rawSteps: ChatHistoryMessage["steps"],
  sessionId: string,
  sequence: number,
) {
  return (rawSteps ?? [])
    .map((step, index): ChatReasoningStep | null => {
      if (
        !step ||
        typeof step.type !== "string" ||
        !step.type.trim() ||
        typeof step.content !== "string" ||
        !step.content.trim()
      ) {
        return null;
      }

      const reasoningStep: ChatReasoningStep = {
        id: `${sessionId}-history-${sequence}-step-${index}`,
        type: step.type.trim(),
        content: step.content.trim(),
      };
      return reasoningStep;
    })
    .filter((step): step is ChatReasoningStep => step !== null);
}

function normalizeTokenUsage(msg: ChatHistoryMessage) {
  const camel = msg.tokenUsage;
  if (camel) {
    const tokenUsage: ChatStoreMessage["tokenUsage"] = {};
    const promptTokens = camel.promptTokens ?? camel.promptTokenCount;
    const completionTokens =
      camel.completionTokens ?? camel.candidatesTokenCount;
    if (typeof promptTokens === "number") {
      tokenUsage.promptTokens = promptTokens;
    }
    if (typeof completionTokens === "number") {
      tokenUsage.completionTokens = completionTokens;
    }
    if (typeof camel.totalTokens === "number") {
      tokenUsage.totalTokens = camel.totalTokens;
    }
    return Object.keys(tokenUsage).length ? tokenUsage : undefined;
  }
  return undefined;
}

function firstNonEmptyString(...values: unknown[]) {
  return values.find(
    (value): value is string => typeof value === "string" && !!value.trim(),
  );
}

function historySourceToStore(raw: NonNullable<ChatHistoryMessage["sources"]>[number]) {
  const url = firstNonEmptyString(raw.originalUrl, raw.original_url, raw.url);
  if (!url) return null;

  const pages = Array.isArray(raw.pages)
    ? raw.pages.filter((page): page is string => typeof page === "string")
    : undefined;
  const citationId = raw.citationId ?? raw.citation_id;
  const fileName = firstNonEmptyString(raw.fileName, raw.file_name);
  const markdownUrl = firstNonEmptyString(raw.markdownUrl, raw.markdown_url);

  const sourceItem: ChatSourceItem = {
    title: firstNonEmptyString(raw.title) ?? url,
    url,
  };
  if (typeof citationId === "number") {
    sourceItem.citationId = citationId;
  }
  if (fileName) {
    sourceItem.fileName = fileName;
  }
  if (pages?.length) {
    sourceItem.pages = pages;
  }
  if (markdownUrl) {
    sourceItem.markdownUrl = markdownUrl;
  }
  return sourceItem;
}

export function historyMessageToStore(
  msg: ChatHistoryMessage,
  index: number,
  sessionId: string,
): ChatStoreMessage {
  const sources = (msg.sources ?? [])
    .map(historySourceToStore)
    .filter((source): source is ChatSourceItem => source !== null);
  const createdAt = msg.createdAt ?? new Date().toISOString();
  const reasoningSteps = historyStepsToStore(msg.steps, sessionId, msg.sequence);
  const tokenUsage = normalizeTokenUsage(msg);
  const processingTimeMs = msg.processingTimeMs;

  const storeMessage: ChatStoreMessage = {
    id: `${sessionId}-history-${msg.sequence}-${index}`,
    role: msg.role,
    content:
      msg.role === "assistant" &&
      msg.messageType === "thinking"
        ? ""
        : msg.content,
    createdAt,
  };

  if (msg.role === "assistant") {
    storeMessage.reasoningDefaultOpen = false;
  }
  if (
    msg.role === "assistant" &&
    msg.messageType === "thinking"
  ) {
    storeMessage.reasoning = msg.content;
  }
  if (reasoningSteps.length) {
    storeMessage.reasoningSteps = reasoningSteps;
  }
  if (tokenUsage) {
    storeMessage.tokenUsage = tokenUsage;
  }
  if (typeof processingTimeMs === "number") {
    storeMessage.processingTimeMs = processingTimeMs;
  }
  if (sources.length) {
    storeMessage.sources = sources;
  }

  return storeMessage;
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

function encodeReasoningSteps(steps: ChatReasoningStep[]) {
  return `${STRUCTURED_REASONING_PREFIX}${JSON.stringify(steps)}`;
}

function reasoningParentId(base: string, message: ChatStoreMessage) {
  const openState =
    message.reasoningDefaultOpen === false ? "closed" : "open";
  const processingTime =
    typeof message.processingTimeMs === "number" &&
    Number.isFinite(message.processingTimeMs)
      ? `:ms=${Math.round(message.processingTimeMs)}`
      : "";
  return `${base}:${openState}${processingTime}`;
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
        fileName?: string;
        pages?: string[];
        markdownUrl?: string;
        citationId?: number;
      }
  > = [];

  if (m.role === "assistant") {
    if (m.reasoningSteps?.length) {
      parts.push({
        type: "reasoning",
        text: encodeReasoningSteps(m.reasoningSteps),
        parentId: reasoningParentId("structured-reasoning", m),
      });
    } else {
      const steps = splitReasoningIntoSteps(m.reasoning);
      const n = steps.length;
      steps.forEach((step, i) => {
        parts.push({
          type: "reasoning",
          text: step,
          parentId: reasoningParentId(`r-${i}-of-${n}`, m),
        });
      });
    }
  }
  parts.push({ type: "text", text: m.content });
  for (const s of m.sources ?? []) {
    parts.push({
      type: "source",
      sourceType: "url",
      id: s.url,
      url: s.url,
      title: s.title,
      fileName: s.fileName,
      pages: s.pages,
      markdownUrl: s.markdownUrl,
      citationId: s.citationId,
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
    .map((source): ChatSourceItem | null => {
      if (!source || typeof source !== "object") return null;
      const candidate = source as Record<string, unknown>;
      const urlRaw = candidate.originalUrl ?? candidate.original_url;
      if (typeof urlRaw !== "string" || !urlRaw.trim()) return null;
      const titleRaw =
        candidate.title ??
        candidate.fileName ??
        candidate.file_name ??
        candidate.name ??
        candidate.filename;
      const pagesRaw = candidate.pages;
      const pages = Array.isArray(pagesRaw)
        ? pagesRaw.filter((page): page is string => typeof page === "string")
        : undefined;
      const item: ChatSourceItem = {
        title:
          typeof titleRaw === "string" && titleRaw.trim() ? titleRaw : urlRaw,
        url: urlRaw,
      };
      const citationId = candidate.citationId ?? candidate.citation_id;
      if (typeof citationId === "number") {
        item.citationId = citationId;
      }
      const fileName = candidate.fileName ?? candidate.file_name;
      if (typeof fileName === "string" && fileName.trim()) {
        item.fileName = fileName;
      }
      if (pages?.length) {
        item.pages = pages;
      }
      if (
        (typeof candidate.markdownUrl === "string" &&
          candidate.markdownUrl.trim()) ||
        (typeof candidate.markdown_url === "string" &&
          candidate.markdown_url.trim())
      ) {
        item.markdownUrl =
          typeof candidate.markdownUrl === "string"
            ? candidate.markdownUrl
            : (candidate.markdown_url as string);
      }
      return item;
    })
    .filter((item): item is ChatSourceItem => item !== null);
}
