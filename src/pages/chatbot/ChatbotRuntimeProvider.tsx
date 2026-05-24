import { streamChat } from "@/services/chatbot/chatbot.service";
import {
  archiveSession,
  deleteSession,
  listSessionMessages,
  listSessions,
  renameSession,
  type ChatHistoryMessage,
  type ChatSessionItem,
} from "@/services/chatbot/chatSessions.service";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChatbotShellProvider } from "./chatbotShellContext";
import { CHAT_SYSTEM_BUSY_MESSAGE } from "./constants";
import type {
  ChatSourceItem,
  ChatStoreMessage,
  ChatThreadSession,
} from "./types";

export type { ChatStoreMessage, ChatThreadSession } from "./types";

const DEFAULT_NEW_TITLE = "Cuộc trò chuyện mới";

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

function sessionFromServer(item: ChatSessionItem): ChatThreadSession {
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

function createDraftSession(): ChatThreadSession {
  return {
    id: newId("draft"),
    serverId: null,
    title: DEFAULT_NEW_TITLE,
    status: "active",
    messages: [],
    messagesLoaded: true,
    lastMessageAt: null,
    updatedAt: null,
  };
}

function historyMessageToStore(
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
    // Include sessionId so IDs are globally unique across sessions.
    // Without it, two sessions with the same number of messages would have
    // identical IDs (e.g. history-1-0) and the runtime may cache-hit the
    // wrong converted message.
    id: `${sessionId}-history-${msg.sequence}-${index}`,
    role: msg.role,
    content: msg.content,
    createdAt: msg.created_at,
    sources: sources.length ? sources : undefined,
  };
}

export type ChatbotShellActions = {
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  sessions: ChatThreadSession[];
  activeThreadId: string;
  renameThread: (threadId: string, title: string) => Promise<void>;
  archiveThread: (threadId: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
};

function ChatbotRuntimeProviderInner({ children }: React.PropsWithChildren) {
  const draftRef = useRef<ChatThreadSession | null>(null);
  if (!draftRef.current) {
    draftRef.current = createDraftSession();
  }
  const [sessions, setSessions] = useState<ChatThreadSession[]>([
    draftRef.current,
  ]);
  const [activeThreadId, setActiveThreadId] = useState(draftRef.current.id);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const activeThreadIdRef = useRef(activeThreadId);
  activeThreadIdRef.current = activeThreadId;
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;
  const messageLoadTokenRef = useRef(0);

  const messages = useMemo(
    () => sessions.find((s) => s.id === activeThreadId)?.messages ?? [],
    [sessions, activeThreadId],
  );

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const abortRef = useRef<AbortController | null>(null);

  const setThreadMessages = useCallback((msgs: readonly ChatStoreMessage[]) => {
    const tid = activeThreadIdRef.current;
    setSessions((prev) =>
      prev.map((s) => (s.id === tid ? { ...s, messages: [...msgs] } : s)),
    );
  }, []);

  const clearError = useCallback(() => setSystemError(null), []);

  const loadMessagesForSession = useCallback(
    async (target: ChatThreadSession) => {
      if (!target.serverId || target.messagesLoaded) return;

      const token = ++messageLoadTokenRef.current;
      setIsLoadingMessages(true);
      try {
        const data = await listSessionMessages(target.serverId, {
          pageSize: 100,
        });
        if (messageLoadTokenRef.current !== token) return;
        const ordered = [...data.items].sort((a, b) => a.sequence - b.sequence);
        const mapped = ordered.map((item, idx) =>
          historyMessageToStore(item, idx, target.id),
        );
        setSessions((prev) =>
          prev.map((s) =>
            s.id === target.id
              ? { ...s, messages: mapped, messagesLoaded: true }
              : s,
          ),
        );
      } catch {
        if (messageLoadTokenRef.current !== token) return;
        setSystemError("Không tải được lịch sử cuộc trò chuyện.");
      } finally {
        if (messageLoadTokenRef.current === token) {
          setIsLoadingMessages(false);
        }
      }
    },
    [],
  );

  const loadMessagesById = useCallback(
    async (threadId: string) => {
      const target = sessionsRef.current.find((s) => s.id === threadId);
      if (!target) return;
      await loadMessagesForSession(target);
    },
    [loadMessagesForSession],
  );

  // Initial load: fetch sessions, pick the most recent one.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listSessions({ pageSize: 50 });
        if (cancelled) return;
        const active = data.items.filter(
          (it) => it.status === "active" && !!it.sessionId,
        );
        if (active.length === 0) {
          setIsLoadingSessions(false);
          return;
        }
        const mapped = active.map(sessionFromServer);
        const first = mapped[0];
        const draftStill = sessionsRef.current.find(
          (s) => s.id === draftRef.current?.id && s.messages.length === 0,
        );
        const nextSessions = draftStill ? [...mapped, draftStill] : mapped;
        // Order matters: switch active to a thread that exists in the next
        // list before swapping the list, so the assistant-ui store never sees
        // activeThreadId pointing to a missing entry.
        setActiveThreadId(first.id);
        setSessions(nextSessions);
        setIsLoadingSessions(false);
        // Pass the session object directly — sessionsRef hasn't been refreshed
        // yet at this point because the setSessions render hasn't committed.
        await loadMessagesForSession(first);
      } catch {
        if (cancelled) return;
        setIsLoadingSessions(false);
        setSystemError("Không tải được danh sách cuộc trò chuyện.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMessagesForSession]);

  const runStreamForAssistant = useCallback(
    async (
      userText: string,
      assistantId: string,
      prior: ChatStoreMessage[],
      threadId: string,
    ) => {
      try {
        const sessionAtSendTime =
          sessionsRef.current.find((s) => s.id === threadId) ?? null;
        const sessionIdToSend = sessionAtSendTime?.serverId ?? undefined;

        await streamChat(
          {
            question: userText,
            chatHistory: prior.map((item) => ({
              role: item.role,
              content: item.content,
              timestamp: item.createdAt,
            })),
            sessionId: sessionIdToSend,
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
                  if (session.id !== threadId) return session;
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
                  if (session.id !== threadId) return session;
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
              const doneEvent = event as {
                sources?: unknown[];
                error?: unknown;
                session_id?: string;
                sessionId?: string;
              };
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

              const returnedSessionId =
                (typeof doneEvent.session_id === "string" && doneEvent.session_id) ||
                (typeof doneEvent.sessionId === "string" && doneEvent.sessionId) ||
                null;

              setSessions((prev) =>
                prev.map((session) => {
                  if (session.id !== threadId) return session;
                  if (errorText) {
                    setSystemError(CHAT_SYSTEM_BUSY_MESSAGE);
                  }
                  const nowIso = new Date().toISOString();
                  return {
                    ...session,
                    serverId: session.serverId ?? returnedSessionId,
                    lastMessageAt: nowIso,
                    updatedAt: nowIso,
                    messagesLoaded: true,
                    messages: session.messages.map((item) =>
                      item.id === assistantId
                        ? {
                            ...item,
                            sources: sources.length ? sources : [],
                          }
                        : item,
                    ),
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
            if (session.id !== threadId) return session;
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

      const threadId = activeThreadIdRef.current;
      const prior = messagesRef.current;
      const userId = newId("user");
      const assistantId = newId("assistant");
      const now = new Date().toISOString();

      setSessions((prev) =>
        prev.map((session) =>
          session.id === threadId
            ? {
                ...session,
                title:
                  session.title && session.title !== DEFAULT_NEW_TITLE
                    ? session.title
                    : text.slice(0, 60),
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

      await runStreamForAssistant(text, assistantId, prior, threadId);
    },
    [runStreamForAssistant],
  );

  const onCancel = useCallback(async () => {
    abortRef.current?.abort();
  }, []);

  const switchToThread = useCallback(
    async (threadId: string) => {
      abortRef.current?.abort();
      setSystemError(null);
      setActiveThreadId(threadId);
      await loadMessagesById(threadId);
    },
    [loadMessagesById],
  );

  const switchToNewThread = useCallback(async () => {
    abortRef.current?.abort();
    setSystemError(null);
    // Reuse existing empty draft if any to avoid stacking blank entries.
    const existingDraft = sessionsRef.current.find(
      (s) => !s.serverId && s.messages.length === 0,
    );
    if (existingDraft) {
      setActiveThreadId(existingDraft.id);
      return;
    }
    const draft = createDraftSession();
    draftRef.current = draft;
    // Add the new draft to the list FIRST, then switch active to it so the
    // store always sees activeThreadId resolving to an existing entry.
    setSessions((prev) => [draft, ...prev]);
    setActiveThreadId(draft.id);
  }, []);

  const renameThread = useCallback(
    async (threadId: string, nextTitle: string) => {
      const trimmed = nextTitle.trim();
      if (!trimmed) return;
      const target = sessionsRef.current.find((s) => s.id === threadId);
      if (!target) return;
      if (!target.serverId) {
        setSessions((prev) =>
          prev.map((s) => (s.id === threadId ? { ...s, title: trimmed } : s)),
        );
        return;
      }
      const previousTitle = target.title;
      setSessions((prev) =>
        prev.map((s) => (s.id === threadId ? { ...s, title: trimmed } : s)),
      );
      try {
        await renameSession(target.serverId, trimmed);
      } catch {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === threadId ? { ...s, title: previousTitle } : s,
          ),
        );
        setSystemError("Không đổi được tên cuộc trò chuyện.");
      }
    },
    [],
  );

  const removeThreadFromState = useCallback(
    (threadId: string) => {
      const current = sessionsRef.current;
      const remaining = current.filter((s) => s.id !== threadId);
      const wasActive = activeThreadIdRef.current === threadId;

      if (!wasActive) {
        setSessions(remaining);
        return;
      }

      if (remaining.length > 0) {
        // Switch active to an existing thread BEFORE the list mutation so the
        // assistant-ui store never observes activeThreadId → missing entry.
        const nextActive = remaining[0];
        setActiveThreadId(nextActive.id);
        setSessions(remaining);
        void loadMessagesForSession(nextActive);
        return;
      }

      const draft = createDraftSession();
      draftRef.current = draft;
      setActiveThreadId(draft.id);
      setSessions([draft]);
    },
    [loadMessagesForSession],
  );

  const archiveThread = useCallback(
    async (threadId: string) => {
      const target = sessionsRef.current.find((s) => s.id === threadId);
      if (!target) return;
      if (!target.serverId) {
        removeThreadFromState(threadId);
        return;
      }
      try {
        await archiveSession(target.serverId);
        removeThreadFromState(threadId);
      } catch {
        setSystemError("Không lưu được cuộc trò chuyện.");
      }
    },
    [removeThreadFromState],
  );

  const deleteThread = useCallback(
    async (threadId: string) => {
      const target = sessionsRef.current.find((s) => s.id === threadId);
      if (!target) return;
      if (!target.serverId) {
        removeThreadFromState(threadId);
        return;
      }
      try {
        await deleteSession(target.serverId);
        removeThreadFromState(threadId);
      } catch {
        setSystemError("Không xoá được cuộc trò chuyện.");
      }
    },
    [removeThreadFromState],
  );

  // Thread list management is handled entirely by our own React state.
  // We deliberately do NOT pass adapters.threadList to useExternalStoreRuntime
  // to avoid the assistant-ui bug where tapClientLookup calls getItemById() for
  // a thread that was just removed, throwing "Entry not available in the store"
  // inside a useEffect — which React Error Boundaries cannot catch.
  const runtimeOptions = useMemo(
    () => ({
      messages,
      isRunning,
      setMessages: setThreadMessages,
      convertMessage,
      onNew,
      onCancel,
    }),
    [messages, isRunning, setThreadMessages, onNew, onCancel],
  );

  const runtime = useExternalStoreRuntime(runtimeOptions);

  const shellValue = useMemo(
    () => ({
      errorMessage: systemError,
      clearError,
      isLoadingSessions,
      isLoadingMessages,
      sessions,
      activeThreadId,
      switchToThread,
      switchToNewThread,
      renameThread,
      archiveThread,
      deleteThread,
    }),
    [
      systemError,
      clearError,
      isLoadingSessions,
      isLoadingMessages,
      sessions,
      activeThreadId,
      switchToThread,
      switchToNewThread,
      renameThread,
      archiveThread,
      deleteThread,
    ],
  );

  return (
    <ChatbotShellProvider value={shellValue}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </ChatbotShellProvider>
  );
}

export function ChatbotRuntimeProvider({ children }: React.PropsWithChildren) {
  return <ChatbotRuntimeProviderInner>{children}</ChatbotRuntimeProviderInner>;
}
