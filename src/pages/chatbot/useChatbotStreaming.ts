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
import type {
  ChatReasoningStep,
  ChatStoreMessage,
  ChatThreadSession,
} from "./types";

type MutableRef<T> = {
  current: T;
};

type UseChatbotStreamingArgs = {
  activeThreadIdRef: MutableRef<string>;
  sessionsRef: MutableRef<ChatThreadSession[]>;
  abortRef: MutableRef<AbortController | null>;
  setSessions: Dispatch<SetStateAction<ChatThreadSession[]>>;
  setActiveThreadId: Dispatch<SetStateAction<string>>;
  setSystemError: Dispatch<SetStateAction<string | null>>;
  selectedByUserRef: MutableRef<string | null>;
  navigateToThread: (threadId: string, options?: { replace?: boolean }) => void;
  invalidateSessionQueries: () => void;
};

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

function appendReasoningStep(
  item: ChatStoreMessage,
  type: string,
  content: string,
) {
  const steps = [...(item.reasoningSteps ?? [])];
  const last = steps[steps.length - 1];

  if (type === "reasoning" || type === "thought") {
    if (last?.type === type) {
      steps[steps.length - 1] = {
        ...last,
        content: `${last.content}${content}`,
      };
    } else {
      steps.push({
        id: newChatbotId("reasoning-step"),
        type,
        content,
      });
    }
    return {
      ...item,
      reasoning: `${item.reasoning ?? ""}${content}`,
      reasoningSteps: steps,
    };
  }

  steps.push({
    id: newChatbotId("reasoning-step"),
    type,
    content,
  });
  return { ...item, reasoningSteps: steps };
}

function reasoningStepsFromDoneEvent(rawSteps: unknown[]): ChatReasoningStep[] {
  return rawSteps
    .map((step): ChatReasoningStep | null => {
      if (!step || typeof step !== "object") return null;
      const candidate = step as Record<string, unknown>;
      if (
        typeof candidate.type !== "string" ||
        !candidate.type.trim() ||
        typeof candidate.content !== "string" ||
        !candidate.content.trim()
      ) {
        return null;
      }
      const reasoningStep: ChatReasoningStep = {
        id: newChatbotId("reasoning-step"),
        type: candidate.type.trim(),
        content: candidate.content.trim(),
      };
      return reasoningStep;
    })
    .filter((step): step is ChatReasoningStep => step !== null);
}

export function useChatbotStreaming({
  activeThreadIdRef,
  sessionsRef,
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
    async (userText: string, assistantId: string, threadId: string) => {
      try {
        const sessionAtSendTime =
          sessionsRef.current.find((s) => s.id === threadId) ?? null;
        const sessionIdToSend = sessionAtSendTime?.serverId ?? undefined;

        await streamChat(
          {
            question: userText,
            sessionId: sessionIdToSend,
            resolveCitations: true,
          },
          (event) => {
            const ev = event as Record<string, unknown>;
            const eventType = typeof ev.type === "string" ? ev.type : undefined;
            const textChunk = typeof ev.content === "string" ? ev.content : "";

            if (eventType && eventType !== "text" && textChunk) {
              updateAssistantMessage(
                setSessions,
                threadId,
                assistantId,
                (item) => appendReasoningStep(item, eventType, textChunk),
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

            if (ev.done) {
              const doneEvent = event as {
                sources?: unknown[];
                steps?: unknown[];
                error?: unknown;
                session_id?: string;
                sessionId?: string;
                processing_time_ms?: unknown;
                processingTimeMs?: unknown;
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
              const processingTimeMs =
                typeof doneEvent.processing_time_ms === "number"
                  ? doneEvent.processing_time_ms
                  : typeof doneEvent.processingTimeMs === "number"
                    ? doneEvent.processingTimeMs
                    : undefined;

              if (errorText) {
                setSystemError(CHAT_SYSTEM_BUSY_MESSAGE);
              }

              const nowIso = new Date().toISOString();
              setSessions((prev) =>
                prev.map((session) => {
                  if (session.id !== threadId) return session;
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
                            reasoningSteps: item.reasoningSteps?.length
                              ? item.reasoningSteps
                              : reasoningStepsFromDoneEvent(
                                  doneEvent.steps ?? [],
                                ),
                            sources: sources.length ? sources : [],
                            processingTimeMs,
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
              return;
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

      const userId = newChatbotId("user");
      const assistantId = newChatbotId("assistant");
      const now = new Date().toISOString();

      setSessions((prev) => {
        const existing = prev.find((session) => session.id === threadId);
        const nextSession: ChatThreadSession = {
          ...(existing ?? {
            id: threadId,
            serverId: null,
            title: DEFAULT_NEW_TITLE,
            status: "active",
            messages: [],
            messagesLoaded: true,
            lastMessageAt: null,
            updatedAt: null,
          }),
          title:
            existing?.title && existing.title !== DEFAULT_NEW_TITLE
              ? existing.title
              : text.slice(0, 60),
          messages: [
            ...(existing?.messages ?? []),
            { id: userId, role: "user", content: text, createdAt: now },
            {
              id: assistantId,
              role: "assistant",
              content: "",
              createdAt: now,
              reasoningDefaultOpen: true,
            },
          ],
        };

        if (!existing) return [nextSession, ...prev];
        return prev.map((session) =>
          session.id === threadId ? nextSession : session,
        );
      });

      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setIsRunning(true);

      await runStreamForAssistant(text, assistantId, threadId);
    },
    [
      abortRef,
      activeThreadIdRef,
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
