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
// import { CHAT_SYSTEM_BUSY_MESSAGE } from "./constants";
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
  threadIdAliasRef: MutableRef<Record<string, string>>;
  navigateToThread: (threadId: string, options?: { replace?: boolean }) => void;
  refreshActiveSessions: () => Promise<ChatThreadSession[]>;
};

function matchesStreamingThread(
  session: ChatThreadSession,
  threadId: string,
  threadIdAlias: Record<string, string>,
) {
  return session.id === threadId || session.id === threadIdAlias[threadId];
}

function updateAssistantMessage(
  setSessions: Dispatch<SetStateAction<ChatThreadSession[]>>,
  threadId: string,
  threadIdAlias: Record<string, string>,
  assistantId: string,
  updater: (message: ChatStoreMessage) => ChatStoreMessage,
) {
  setSessions((prev) =>
    prev.map((session) => {
      if (!matchesStreamingThread(session, threadId, threadIdAlias)) {
        return session;
      }
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
  threadIdAliasRef,
  navigateToThread,
  refreshActiveSessions,
}: UseChatbotStreamingArgs) {
  const [isRunning, setIsRunning] = useState(false);

  const runStreamForAssistant = useCallback(
    async (userText: string, assistantId: string, threadId: string) => {
      try {
        const sessionAtSendTime =
          sessionsRef.current.find((s) => s.id === threadId) ?? null;
        const sessionIdToSend = sessionAtSendTime?.serverId ?? undefined;
        const isNewSession = !sessionIdToSend;
        let returnedSessionIdFromStream: string | null = null;

        await streamChat(
          {
            question: userText,
            sessionId: sessionIdToSend,
            resolveCitations: true,
            citationLinkType: "original",
          },
          (event) => {
            const ev = event as Record<string, unknown>;
            const eventType = typeof ev.type === "string" ? ev.type : undefined;
            const textChunk = typeof ev.content === "string" ? ev.content : "";

            if (eventType && eventType !== "text" && textChunk) {
              updateAssistantMessage(
                setSessions,
                threadId,
                threadIdAliasRef.current,
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
                threadIdAliasRef.current,
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
                sessionId?: string;
                processingTimeMs?: unknown;
              };
              const errorText =
                typeof doneEvent.error === "string"
                  ? doneEvent.error.trim()
                  : "";
              const sources = sourceItemsFromStream(doneEvent.sources ?? []);
              const returnedSessionId =
                (typeof doneEvent.sessionId === "string" &&
                  doneEvent.sessionId) ||
                null;
              returnedSessionIdFromStream = returnedSessionId;
              const processingTimeMs =
                typeof doneEvent.processingTimeMs === "number"
                  ? doneEvent.processingTimeMs
                  : undefined;

              if (errorText) {
                // setSystemError(CHAT_SYSTEM_BUSY_MESSAGE);
                setSystemError(errorText);
              }

              const nowIso = new Date().toISOString();
              if (returnedSessionId) {
                threadIdAliasRef.current[threadId] = returnedSessionId;
              }

              setSessions((prev) =>
                prev.map((session) => {
                  if (
                    !matchesStreamingThread(
                      session,
                      threadId,
                      threadIdAliasRef.current,
                    )
                  ) {
                    return session;
                  }
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
                (activeThreadIdRef.current === threadId ||
                  activeThreadIdRef.current === threadIdAliasRef.current[threadId])
              ) {
                selectedByUserRef.current = returnedSessionId;
                setActiveThreadId(returnedSessionId);
                navigateToThread(returnedSessionId, { replace: true });
              }
              return;
            }
          },
          abortRef.current?.signal,
        );

        let activeSessionsAfterStream: ChatThreadSession[] = [];
        try {
          activeSessionsAfterStream = await refreshActiveSessions();
        } catch {
          activeSessionsAfterStream = [];
        }

        if (
          isNewSession &&
          !returnedSessionIdFromStream &&
          (activeThreadIdRef.current === threadId ||
            activeThreadIdRef.current === threadIdAliasRef.current[threadId])
        ) {
          const latestSession = activeSessionsAfterStream[0];
          const latestSessionId = latestSession?.serverId ?? latestSession?.id;
          if (latestSessionId) {
            threadIdAliasRef.current[threadId] = latestSessionId;
            selectedByUserRef.current = latestSessionId;
            setActiveThreadId(latestSessionId);
            setSessions((prev) => {
              const draftSession =
                prev.find((session) => session.id === threadId) ??
                prev.find((session) => session.id === latestSessionId);
              const resolvedSession: ChatThreadSession = {
                ...(latestSession ?? draftSession),
                id: latestSessionId,
                serverId: latestSessionId,
                title:
                  latestSession?.title ??
                  draftSession?.title ??
                  DEFAULT_NEW_TITLE,
                status:
                  latestSession?.status ?? draftSession?.status ?? "active",
                messages:
                  draftSession?.messages ?? latestSession?.messages ?? [],
                messagesLoaded:
                  draftSession?.messagesLoaded ??
                  latestSession?.messagesLoaded ??
                  true,
                lastMessageAt:
                  latestSession?.lastMessageAt ??
                  draftSession?.lastMessageAt ??
                  null,
                updatedAt:
                  latestSession?.updatedAt ?? draftSession?.updatedAt ?? null,
              };

              return [
                resolvedSession,
                ...prev.filter(
                  (session) =>
                    session.id !== threadId && session.id !== latestSessionId,
                ),
              ];
            });
            navigateToThread(latestSessionId, { replace: true });
          }
        }
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        // setSystemError(CHAT_SYSTEM_BUSY_MESSAGE + (error as Error)?.message);
        setSystemError((error as Error)?.message);
        setSessions((prev) =>
          prev.map((session) => {
            if (
              !matchesStreamingThread(
                session,
                threadId,
                threadIdAliasRef.current,
              )
            ) {
              return session;
            }
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
      refreshActiveSessions,
      navigateToThread,
      selectedByUserRef,
      threadIdAliasRef,
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
              reasoningDefaultOpen: false,
            },
          ],
        };

        if (!existing) return [nextSession, ...prev];
        return prev.map((session) =>
          session.id === threadId ? nextSession : session,
        );
      });

      if (!sessionAtSendTime?.serverId) {
        selectedByUserRef.current = threadId;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setIsRunning(true);

      await runStreamForAssistant(text, assistantId, threadId);
    },
    [
      abortRef,
      activeThreadIdRef,
      runStreamForAssistant,
      selectedByUserRef,
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
