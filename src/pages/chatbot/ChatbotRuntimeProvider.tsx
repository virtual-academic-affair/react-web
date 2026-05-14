import { streamChat } from "@/services/chatbot/chatbot.service";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChatbotShellProvider } from "./chatbotShellContext";
import { CHAT_SYSTEM_BUSY_MESSAGE } from "./constants";
import type { ChatSourceItem, ChatStoreMessage, ChatThreadSession } from "./types";

export type { ChatStoreMessage, ChatThreadSession } from "./types";

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
};

function ChatbotRuntimeProviderInner({ children }: React.PropsWithChildren) {
  const initialThreadId = useMemo(() => newId("thread"), []);
  const [sessions, setSessions] = useState<ChatThreadSession[]>(() => [
    { id: initialThreadId, title: "Cuộc trò chuyện mới", messages: [] },
  ]);
  const [activeThreadId, setActiveThreadId] = useState(initialThreadId);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const activeThreadIdRef = useRef(activeThreadId);
  activeThreadIdRef.current = activeThreadId;

  const messages = useMemo(
    () => sessions.find((s) => s.id === activeThreadId)?.messages ?? [],
    [sessions, activeThreadId],
  );

  const messagesRef = useRef(messages);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const setThreadMessages = useCallback((msgs: readonly ChatStoreMessage[]) => {
    const tid = activeThreadIdRef.current;
    setSessions((prev) =>
      prev.map((s) => (s.id === tid ? { ...s, messages: [...msgs] } : s)),
    );
  }, []);

  const clearError = useCallback(() => setSystemError(null), []);

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
              setSessions((prev) =>
                prev.map((session) => {
                  if (session.id !== activeThreadIdRef.current) return session;
                  return {
                    ...session,
                    messages: session.messages.map((item) =>
                      item.id === assistantId
                        ? { ...item, content: `${item.content}${textChunk}` }
                        : item,
                    ),
                  };
                }),
              );
              return;
            }
            if (eventType === "reasoning" || eventType === "thought") {
              const rChunk =
                (typeof ev.content === "string" && ev.content) ||
                (typeof ev.chunk === "string" && ev.chunk) ||
                "";
              if (!rChunk) return;
              setSessions((prev) =>
                prev.map((session) => {
                  if (session.id !== activeThreadIdRef.current) return session;
                  return {
                    ...session,
                    messages: session.messages.map((item) =>
                      item.id === assistantId
                        ? { ...item, reasoning: `${item.reasoning ?? ""}${rChunk}` }
                        : item,
                    ),
                  };
                }),
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

              setSessions((prev) =>
                prev.map((session) => {
                  if (session.id !== activeThreadIdRef.current) return session;
                  return {
                    ...session,
                    messages: session.messages.map((item) => {
                      if (item.id !== assistantId) return item;
                      if (errorText) {
                        setSystemError(CHAT_SYSTEM_BUSY_MESSAGE);
                      }
                      return {
                        ...item,
                        content: item.content,
                        sources: sources.length ? sources : [],
                      };
                    }),
                  };
                }),
              );
            }
          },
          abortRef.current?.signal,
        );
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        setSystemError(CHAT_SYSTEM_BUSY_MESSAGE);
        setSessions((prev) =>
          prev.map((session) => {
            if (session.id !== activeThreadIdRef.current) return session;
            return {
              ...session,
              messages: session.messages.map((item) =>
                item.id === assistantId ? { ...item, content: "" } : item,
              ),
            };
          }),
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
      setSystemError(null);
      const text = getAppendText(message).trim();
      if (!text) return;

      const prior = messagesRef.current;
      const userId = newId("user");
      const assistantId = newId("assistant");
      const now = new Date().toISOString();

      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeThreadIdRef.current
            ? {
                ...session,
                messages: [
                  ...session.messages,
                  { id: userId, role: "user", content: text, createdAt: now },
                  {
                    id: assistantId,
                    role: "assistant",
                    content: "",
                    createdAt: now,
                  },
                ],
              }
            : session,
        ),
      );

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
    setMessages: setThreadMessages,
    convertMessage,
    onNew,
    onCancel,
    adapters: {
      threadList: {
        threadId: activeThreadId,
        threads: sessions.map((s) => ({
          id: s.id,
          title: s.title,
          status: "regular" as const,
        })),
        onSwitchToThread: async (threadId: string) => {
          abortRef.current?.abort();
          setSystemError(null);
          setActiveThreadId(threadId);
        },
        onSwitchToNewThread: async () => {
          abortRef.current?.abort();
          setSystemError(null);
          const id = newId("thread");
          setSessions((prev) => [
            { id, title: "Cuộc trò chuyện mới", messages: [] },
            ...prev,
          ]);
          setActiveThreadId(id);
        },
      },
    },
  });

  return (
    <ChatbotShellProvider
      value={{ errorMessage: systemError, clearError }}
    >
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </ChatbotShellProvider>
  );
}

export function ChatbotRuntimeProvider({ children }: React.PropsWithChildren) {
  return <ChatbotRuntimeProviderInner>{children}</ChatbotRuntimeProviderInner>;
}