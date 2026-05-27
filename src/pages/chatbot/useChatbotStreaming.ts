import type { AppendMessage } from "@assistant-ui/react";
import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { streamChat } from "@/services/chatbot/chatbot.service";

import {
  DEFAULT_NEW_TITLE,
  getAppendText,
  newChatbotId,
  sourceItemsFromStream,
} from "./chatbotMappers";
import { CHAT_SYSTEM_BUSY_MESSAGE } from "./constants";
import type { ChatStoreMessage, ChatThreadSession } from "./types";

type MutableRef<T> = {
  current: T;
};

type UseChatbotStreamingArgs = {
  activeThreadIdRef: MutableRef<string>;
  sessionsRef: MutableRef<ChatThreadSession[]>;
  messagesRef: MutableRef<ChatStoreMessage[]>;
  abortRef: MutableRef<AbortController | null>;
  setSessions: Dispatch<SetStateAction<ChatThreadSession[]>>;
  setActiveThreadId: Dispatch<SetStateAction<string>>;
  setSystemError: Dispatch<SetStateAction<string | null>>;
  selectedByUserRef: MutableRef<string | null>;
  navigateToThread: (threadId: string, options?: { replace?: boolean }) => void;
  invalidateSessionQueries: () => void;
};

function toArgsText(args: unknown) {
  if (args === undefined) return "";
  if (typeof args === "string") return args;
  try {
    return JSON.stringify(args, null, 2);
  } catch {
    return String(args);
  }
}

function updateAssistantMessage(
  setSessions: Dispatch<SetStateAction<ChatThreadSession[]>>,
  threadId: string,
  assistantId: string,
  updater: (message: ChatStoreMessage) => ChatStoreMessage,
) {
  setSessions((prev) =>
    prev.map((session) => {
      if (session.id !== threadId) return session;
      return {
        ...session,
        messages: session.messages.map((item) =>
          item.id === assistantId ? updater(item) : item,
        ),
      };
    }),
  );
}

export function useChatbotStreaming({
  activeThreadIdRef,
  sessionsRef,
  messagesRef,
  abortRef,
  setSessions,
  setActiveThreadId,
  setSystemError,
  selectedByUserRef,
  navigateToThread,
  invalidateSessionQueries,
}: UseChatbotStreamingArgs) {
  const [isRunning, setIsRunning] = useState(false);

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

            if (eventType === "call") {
              const toolName =
                typeof ev.name === "string" && ev.name.trim()
                  ? ev.name.trim()
                  : "tool";
              const argsText = toArgsText(ev.args);
              updateAssistantMessage(
                setSessions,
                threadId,
                assistantId,
                (item) => ({
                  ...item,
                  toolCalls: [
                    ...(item.toolCalls ?? []),
                    {
                      toolCallId: newChatbotId("tool"),
                      toolName,
                      argsText,
                    },
                  ],
                }),
              );
              return;
            }

            if (eventType === "tool_output") {
              const toolName =
                typeof ev.name === "string" && ev.name.trim()
                  ? ev.name.trim()
                  : "tool";
              updateAssistantMessage(
                setSessions,
                threadId,
                assistantId,
                (item) => {
                  const toolCalls = [...(item.toolCalls ?? [])];
                  const idx = (() => {
                    for (let i = toolCalls.length - 1; i >= 0; i -= 1) {
                      if (
                        toolCalls[i].toolName === toolName &&
                        toolCalls[i].result === undefined
                      ) {
                        return i;
                      }
                    }
                    return -1;
                  })();
                  if (idx >= 0) {
                    toolCalls[idx] = {
                      ...toolCalls[idx],
                      result: ev.output,
                    };
                  } else {
                    toolCalls.push({
                      toolCallId: newChatbotId("tool"),
                      toolName,
                      argsText: "",
                      result: ev.output,
                    });
                  }
                  return { ...item, toolCalls };
                },
              );
              return;
            }

            if (eventType === "text" || (!eventType && textChunk && !ev.done)) {
              if (!textChunk) return;
              updateAssistantMessage(
                setSessions,
                threadId,
                assistantId,
                (item) => ({
                  ...item,
                  content: `${item.content}${textChunk}`,
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
              updateAssistantMessage(
                setSessions,
                threadId,
                assistantId,
                (item) => ({
                  ...item,
                  reasoning: `${item.reasoning ?? ""}${rChunk}`,
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
                typeof doneEvent.error === "string"
                  ? doneEvent.error.trim()
                  : "";
              const sources = sourceItemsFromStream(doneEvent.sources ?? []);
              const returnedSessionId =
                (typeof doneEvent.session_id === "string" &&
                  doneEvent.session_id) ||
                (typeof doneEvent.sessionId === "string" &&
                  doneEvent.sessionId) ||
                null;

              setSessions((prev) =>
                prev.map((session) => {
                  if (session.id !== threadId) return session;
                  if (errorText) {
                    setSystemError(CHAT_SYSTEM_BUSY_MESSAGE);
                  }
                  const nowIso = new Date().toISOString();
                  const nextId =
                    !session.serverId && returnedSessionId
                      ? returnedSessionId
                      : session.id;
                  return {
                    ...session,
                    id: nextId,
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

              if (
                returnedSessionId &&
                !sessionAtSendTime?.serverId &&
                activeThreadIdRef.current === threadId
              ) {
                selectedByUserRef.current = returnedSessionId;
                setActiveThreadId(returnedSessionId);
                navigateToThread(returnedSessionId, { replace: true });
              }
              invalidateSessionQueries();
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
    [
      abortRef,
      activeThreadIdRef,
      invalidateSessionQueries,
      messagesRef,
      navigateToThread,
      selectedByUserRef,
      sessionsRef,
      setActiveThreadId,
      setSessions,
      setSystemError,
    ],
  );

  const onNew = useCallback(
    async (message: AppendMessage) => {
      setSystemError(null);
      const text = getAppendText(message).trim();
      if (!text) return;

      const threadId = activeThreadIdRef.current;
      const sessionAtSendTime =
        sessionsRef.current.find((s) => s.id === threadId) ?? null;
      if (sessionAtSendTime?.status === "archived") {
        setSystemError("Cuộc trò chuyện đã lưu trữ chỉ có thể xem lại.");
        return;
      }

      const prior = messagesRef.current;
      const userId = newChatbotId("user");
      const assistantId = newChatbotId("assistant");
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
    [
      abortRef,
      activeThreadIdRef,
      messagesRef,
      runStreamForAssistant,
      sessionsRef,
      setSessions,
      setSystemError,
    ],
  );

  const onCancel = useCallback(async () => {
    abortRef.current?.abort();
  }, [abortRef]);

  return { isRunning, onNew, onCancel };
}
