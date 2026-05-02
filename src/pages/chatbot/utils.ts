import type { ChatStreamEvent } from "@/services/chatbot/chatbot.service";
import type { ContentSegment } from "./types";

const SSE_CODE_BLOCK_REGEX = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
const IMAGE_URL_REGEX = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|svg))/i;
const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

export const normalizeTokenUsage = (event: ChatStreamEvent) => {
  const eventRecord = event as Record<string, unknown>;

  const camel = eventRecord.tokenUsage as
    | { promptTokens?: number; completionTokens?: number; totalTokens?: number }
    | undefined;
  if (camel) {
    return {
      promptTokens: camel.promptTokens,
      completionTokens: camel.completionTokens,
      totalTokens: camel.totalTokens,
    };
  }

  const snake = eventRecord.token_usage as
    | { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
    | undefined;
  if (snake) {
    return {
      promptTokens: snake.prompt_tokens,
      completionTokens: snake.completion_tokens,
      totalTokens: snake.total_tokens,
    };
  }

  return null;
};

export const formatMessageTime = (isoString: string) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const parseContentSegments = (content: string): ContentSegment[] => {
  const segments: ContentSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(SSE_CODE_BLOCK_REGEX)) {
    const fullMatch = match[0] ?? "";
    const language = (match[1] ?? "text").toLowerCase();
    const code = match[2] ?? "";
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      segments.push({
        type: "text",
        content: content.slice(lastIndex, matchIndex),
      });
    }

    segments.push({ type: "code", content: code.trimEnd(), language });
    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", content: content.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: "text", content }];
};

export const isImageMessage = (content: string) => IMAGE_URL_REGEX.test(content.trim());

export const splitTextAndLinks = (content: string): string[] => {
  return content.split(URL_REGEX).filter(Boolean);
};

export const isUrl = (value: string) => /^https?:\/\//i.test(value);

