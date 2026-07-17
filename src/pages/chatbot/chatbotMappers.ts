import type { AppendMessage, ThreadMessageLike } from "@assistant-ui/react";

import type {
  ChatHistoryMessage,
  ChatSessionItem,
} from "@/services/chatbot/chatSessions.service";

import {
  buildCorpusTraversalFromRawSteps,
  buildDisplayReasoningSteps,
} from "./corpusTraversalUtils";
import type {
  ChatReasoningStep,
  ChatFaqRecommendation,
  ChatSourceItem,
  ChatStoreMessage,
  ChatThreadSession,
} from "./types";

export const DEFAULT_NEW_TITLE = "Cuộc trò chuyện mới";
export const STRUCTURED_REASONING_PREFIX = "__CHATBOT_REASONING_STEPS__";

/** Capitalize the first character (Vietnamese-aware) for thread list labels. */
export function capitalizeChatTitle(title: string | null | undefined) {
  const trimmed = title?.trim() ?? "";
  if (!trimmed) return "";
  return trimmed.charAt(0).toLocaleUpperCase("vi-VN") + trimmed.slice(1);
}

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
  const corpusTraversal = buildCorpusTraversalFromRawSteps(rawSteps ?? []);
  const reasoningSteps = (rawSteps ?? [])
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
      const type = step.type.trim();
      if (
        type === "corpus_tree" ||
        type === "corpus_traversal" ||
        type === "corpus_traversal_end" ||
        type === "reasoning" ||
        type === "thought"
      ) {
        return null;
      }

      const reasoningStep: ChatReasoningStep = {
        id: `${sessionId}-history-${sequence}-step-${index}`,
        type,
        content: step.content.trim(),
      };
      return reasoningStep;
    })
    .filter((step): step is ChatReasoningStep => step !== null);

  return { reasoningSteps, corpusTraversal };
}

function normalizeTokenUsage(msg: ChatHistoryMessage) {
  const camel = msg.tokenUsage;
  if (camel) {
    const tokenUsage: ChatStoreMessage["tokenUsage"] = {};
    if (typeof camel.promptTokens === "number") {
      tokenUsage.promptTokens = camel.promptTokens;
    }
    if (typeof camel.completionTokens === "number") {
      tokenUsage.completionTokens = camel.completionTokens;
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

function normalizeYearRange(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return { fromYear: 0, toYear: 9999 };
  }
  const candidate = raw as Record<string, unknown>;
  const fromYear =
    typeof candidate.fromYear === "number" ? candidate.fromYear : 0;
  const toYear = typeof candidate.toYear === "number" ? candidate.toYear : 9999;
  return { fromYear, toYear };
}

function faqRecommendationToStore(raw: unknown): ChatFaqRecommendation | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const candidate = raw as Record<string, unknown>;
  const effectiveQuestion = firstNonEmptyString(candidate.effectiveQuestion);
  if (!effectiveQuestion) return undefined;

  const metadata =
    candidate.metadata && typeof candidate.metadata === "object"
      ? (candidate.metadata as Record<string, unknown>)
      : {};

  return {
    effectiveQuestion,
    lecturerOnly: candidate.lecturerOnly === true,
    metadata: {
      academicYear: normalizeYearRange(metadata.academicYear),
      enrollmentYear: normalizeYearRange(metadata.enrollmentYear),
    },
  };
}

function parseSourceTitles(raw: {
  title?: unknown;
  titles?: unknown;
}): string[] | undefined {
  if (Array.isArray(raw.titles)) {
    const items = raw.titles
      .filter(
        (value): value is string => typeof value === "string" && !!value.trim(),
      )
      .map((value) => value.trim());
    if (items.length) return [...new Set(items)];
  }

  return undefined;
}

function historySourceToStore(
  raw: NonNullable<ChatHistoryMessage["sources"]>[number],
) {
  const url = firstNonEmptyString(raw.originalUrl);
  if (!url) return null;

  const pages = Array.isArray(raw.pages)
    ? raw.pages.filter((page): page is string => typeof page === "string")
    : undefined;
  const fileName = firstNonEmptyString(raw.fileName);
  const fileId = firstNonEmptyString(raw.fileId, raw.file_id);
  const markdownUrl = firstNonEmptyString(raw.markdownUrl);
  const titles = parseSourceTitles(raw);
  const fallbackTitle = firstNonEmptyString(raw.title) ?? fileName ?? url;

  const sourceItem: ChatSourceItem = {
    title: titles?.[0] ?? fallbackTitle,
    url,
  };
  if (titles?.length) {
    sourceItem.titles = titles;
  }
  if (typeof raw.citationId === "number") {
    sourceItem.citationId = raw.citationId;
  }
  if (fileId) {
    sourceItem.fileId = fileId;
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
  const { reasoningSteps, corpusTraversal } = historyStepsToStore(
    msg.steps,
    sessionId,
    msg.sequence,
  );
  const tokenUsage = normalizeTokenUsage(msg);
  const processingTimeMs = msg.processingTimeMs;
  const faqRecommendation = faqRecommendationToStore(msg.faqRecommendation);

  const storeMessage: ChatStoreMessage = {
    id: `${sessionId}-history-${msg.sequence}-${index}`,
    role: msg.role,
    content:
      msg.role === "assistant" && msg.messageType === "thinking"
        ? ""
        : msg.content,
    createdAt,
  };

  if (msg.role === "assistant") {
    storeMessage.reasoningDefaultOpen = false;
  }
  if (msg.role === "assistant" && msg.messageType === "thinking") {
    storeMessage.reasoning = msg.content;
  }
  if (reasoningSteps.length) {
    storeMessage.reasoningSteps = reasoningSteps;
  }
  if (corpusTraversal) {
    storeMessage.corpusTraversal = corpusTraversal;
  }
  if (tokenUsage) {
    storeMessage.tokenUsage = tokenUsage;
  }
  if (typeof processingTimeMs === "number") {
    storeMessage.processingTimeMs = processingTimeMs;
  }
  if (faqRecommendation) {
    storeMessage.faqRecommendation = faqRecommendation;
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

type ConvertMessageOptions = {
  corpusStreamPhaseActive?: boolean;
};

function encodeReasoningPayload(
  message: ChatStoreMessage,
  options?: ConvertMessageOptions,
) {
  const steps = buildDisplayReasoningSteps(
    message.reasoningSteps,
    message.corpusTraversal,
    {
      corpusStreamPhaseActive:
        options?.corpusStreamPhaseActive ?? message.corpusStreamPhaseActive,
    },
  );
  return `${STRUCTURED_REASONING_PREFIX}${JSON.stringify({
    steps,
    corpusTraversal: message.corpusTraversal,
  })}`;
}

function reasoningParentId(base: string, message: ChatStoreMessage) {
  const openState = message.reasoningDefaultOpen === false ? "closed" : "open";
  const processingTime =
    typeof message.processingTimeMs === "number" &&
    Number.isFinite(message.processingTimeMs)
      ? `:ms=${Math.round(message.processingTimeMs)}`
      : "";
  return `${base}:${openState}${processingTime}`;
}

export function convertMessage(
  m: ChatStoreMessage,
  options?: ConvertMessageOptions,
): ThreadMessageLike {
  const parts: Array<
    | { type: "text"; text: string }
    | { type: "reasoning"; text: string; parentId?: string }
    | {
        type: "source";
        sourceType: "url";
        id: string;
        url: string;
        title?: string;
        titles?: string[];
        fileName?: string;
        fileId?: string;
        pages?: string[];
        markdownUrl?: string;
        citationId?: number;
      }
  > = [];

  if (m.role === "assistant") {
    if (m.reasoningSteps?.length || m.corpusTraversal) {
      parts.push({
        type: "reasoning",
        text: encodeReasoningPayload(m, options),
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
      titles: s.titles,
      fileName: s.fileName,
      fileId: s.fileId,
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
      const urlRaw = candidate.originalUrl;
      if (typeof urlRaw !== "string" || !urlRaw.trim()) return null;
      const fileName = firstNonEmptyString(candidate.fileName);
      const title = firstNonEmptyString(candidate.title);
      const titles = parseSourceTitles(candidate);
      const pagesRaw = candidate.pages;
      const pages = Array.isArray(pagesRaw)
        ? pagesRaw.filter((page): page is string => typeof page === "string")
        : undefined;
      const item: ChatSourceItem = {
        title: titles?.[0] ?? title ?? fileName ?? urlRaw,
        url: urlRaw,
      };
      if (titles?.length) {
        item.titles = titles;
      }
      if (typeof candidate.citationId === "number") {
        item.citationId = candidate.citationId;
      }
      if (fileName) {
        item.fileName = fileName;
      }
      const fileId = firstNonEmptyString(candidate.fileId, candidate.file_id);
      if (fileId) {
        item.fileId = fileId;
      }
      if (pages?.length) {
        item.pages = pages;
      }
      if (
        typeof candidate.markdownUrl === "string" &&
        candidate.markdownUrl.trim()
      ) {
        item.markdownUrl = candidate.markdownUrl;
      }
      return item;
    })
    .filter((item): item is ChatSourceItem => item !== null);
}
