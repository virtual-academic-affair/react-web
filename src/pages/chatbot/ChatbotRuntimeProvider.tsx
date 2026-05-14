import { streamChat } from "@/services/chatbot/chatbot.service";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { ASSISTANT_ERROR_FALLBACK } from "./constants";
import type { ChatSourceItem } from "./types";

export type ChatStoreMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  reasoning?: string;
  sources?: ChatSourceItem[];
};

function getAppendText(message: AppendMessage): string {
  const c = message.content;
  if (typeof c === "string") return c;
  const first = c[0];
  if (first?.type === "text") return first.text;
  return "";
}

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

/** Tách chuỗi suy luận thành từng bước: `---` hoặc đoạn trống `\n\n`. */
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

const convertMessage = (m: ChatStoreMessage): ThreadMessageLike => {
  const parts: Array<
    | { type: "text"; text: string }
    | { type: "reasoning"; text: string; parentId?: string }
    | { type: "source"; sourceType: "url"; id: string; url: string; title?: string }
  > = [];

  if (m.role === "assistant") {
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
};

function ChatbotRuntimeProviderInner({ children }: React.PropsWithChildren) {
  const [messages, setMessages] = useState<ChatStoreMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const messagesRef = useRef(messages);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const runStreamForAssistant = useCallback(
    async (userText: string, assistantId: string, prior: ChatStoreMessage[]) => {
      try {
        await streamChat(
          {
            question: userText,
            chatHistory: prior.map((item) => ({
              role: item.role,
              content: item.content,
              timestamp: item.createdAt,
            })),
          },
          (event) => {
            const ev = event as Record<string, unknown>;
            const eventType = typeof ev.type === "string" ? ev.type : undefined;
            const textChunk =
              typeof ev.chunk === "string" && ev.chunk
                ? ev.chunk
                : typeof ev.content === "string"
                  ? ev.content
                  : "";
            if (eventType === "text" || (!eventType && textChunk && !ev.done)) {
              if (!textChunk) return;
              setMessages((prev) =>
                prev.map((item) =>
                  item.id === assistantId
                    ? { ...item, content: `${item.content}${textChunk}` }
                    : item,
                ),
              );
              return;
            }
            if (eventType === "reasoning" || eventType === "thought") {
              const rChunk =
                (typeof ev.content === "string" && ev.content) ||
                (typeof ev.chunk === "string" && ev.chunk) ||
                "";
              if (!rChunk) return;
              setMessages((prev) =>
                prev.map((item) =>
                  item.id === assistantId
                    ? { ...item, reasoning: `${item.reasoning ?? ""}${rChunk}` }
                    : item,
                ),
              );
              return;
            }
            if (ev.done) {
              const doneEvent = event as { sources?: unknown[]; error?: unknown };
              const errorText =
                typeof doneEvent.error === "string" ? doneEvent.error.trim() : "";
              const rawSources = doneEvent.sources ?? [];
              const sources: ChatSourceItem[] = rawSources
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
                    title: typeof titleRaw === "string" && titleRaw.trim() ? titleRaw : urlRaw,
                    url: urlRaw,
                  };
                })
                .filter((item): item is ChatSourceItem => item !== null);

              setMessages((prev) =>
                prev.map((item) => {
                  if (item.id !== assistantId) return item;
                  const content =
                    errorText && !item.content.trim()
                      ? `Lỗi từ hệ thống: ${errorText}`
                      : item.content;
                  return {
                    ...item,
                    content,
                    sources: sources.length ? sources : [],
                  };
                }),
              );
            }
          },
          abortRef.current?.signal,
        );
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        setMessages((prev) =>
          prev.map((item) =>
            item.id === assistantId
              ? {
                  ...item,
                  content: `${ASSISTANT_ERROR_FALLBACK} (${String(error)})`,
                }
              : item,
          ),
        );
      } finally {
        setIsRunning(false);
        abortRef.current = null;
      }
    },
    [],
  );

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const text = getAppendText(message).trim();
      if (!text) return;

      const prior = messagesRef.current;
      const userId = newId("user");
      const assistantId = newId("assistant");
      const now = new Date().toISOString();

      setMessages([
        ...prior,
        { id: userId, role: "user", content: text, createdAt: now },
        { id: assistantId, role: "assistant", content: "", createdAt: now },
      ]);

      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setIsRunning(true);

      await runStreamForAssistant(text, assistantId, prior);
    },
    [runStreamForAssistant],
  );

  const onCancel = useCallback(async () => {
    abortRef.current?.abort();
  }, []);

  const runtime = useExternalStoreRuntime({
    messages,
    isRunning,
    setMessages: (msgs) => setMessages([...msgs]),
    convertMessage,
    onNew,
    onCancel,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>
  );
}

export function ChatbotRuntimeProvider({ children }: React.PropsWithChildren) {
  return <ChatbotRuntimeProviderInner>{children}</ChatbotRuntimeProviderInner>;
}
