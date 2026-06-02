import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  convertMessage,
  createDraftSession,
  mergeFetchedSessions,
} from "./chatbotMappers";
import {
  chatbotQueryKeys,
  fetchChatbotMessages,
  fetchChatbotSessions,
  useChatbotSessionsQuery,
} from "./chatbotQueries";
import { useChatbotRoutes } from "./chatbotRoutes";
import type { ChatbotShellContextValue } from "./chatbotShellContext";
import type { ChatStoreMessage, ChatThreadSession } from "./types";
import { useChatbotSessionMutations } from "./useChatbotSessionMutations";
import { useChatbotStreaming } from "./useChatbotStreaming";

export function useChatbotRuntime() {
  const queryClient = useQueryClient();
  const { routeThreadId, navigateToThread, navigateToChatbotRoot } =
    useChatbotRoutes();
  const activeSessionsQuery = useChatbotSessionsQuery("active");
  const initialRouteThreadIdRef = useRef(routeThreadId);
  const initialResolvedRef = useRef(false);

  const draftRef = useRef<ChatThreadSession | null>(null);
  if (!draftRef.current) {
    draftRef.current = createDraftSession();
  }

  const [sessions, setSessions] = useState<ChatThreadSession[]>([]);
  const [activeThreadId, setActiveThreadId] = useState(draftRef.current.id);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [isResolvingInitial, setIsResolvingInitial] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const activeThreadIdRef = useRef(activeThreadId);
  activeThreadIdRef.current = activeThreadId;
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;
  const messageLoadTokenRef = useRef(0);
  const selectedByUserRef = useRef<string | null>(null);

  const messages = useMemo(
    () => sessions.find((s) => s.id === activeThreadId)?.messages ?? [],
    [sessions, activeThreadId],
  );
  const activeSessionStatus = useMemo(
    () => sessions.find((s) => s.id === activeThreadId)?.status ?? null,
    [sessions, activeThreadId],
  );

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const abortRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => setSystemError(null), []);

  const invalidateSessionQueries = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: chatbotQueryKeys.sessionsRoot(),
    });
  }, [queryClient]);

  const removeSessionFromQueryCache = useCallback(
    (sessionId: string) => {
      queryClient.removeQueries({
        queryKey: chatbotQueryKeys.messages(sessionId),
      });
    },
    [queryClient],
  );

  const loadMessagesForSession = useCallback(
    async (target: ChatThreadSession) => {
      if (!target.serverId || target.messagesLoaded) return;

      const serverId = target.serverId;
      const token = ++messageLoadTokenRef.current;
      setIsLoadingMessages(true);
      try {
        const mapped = await queryClient.ensureQueryData({
          queryKey: chatbotQueryKeys.messages(serverId),
          queryFn: () => fetchChatbotMessages(serverId),
        });
        if (messageLoadTokenRef.current !== token) return;
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
    [queryClient],
  );

  const loadMessagesById = useCallback(
    async (threadId: string) => {
      const target = sessionsRef.current.find((s) => s.id === threadId);
      if (!target) return;
      await loadMessagesForSession(target);
    },
    [loadMessagesForSession],
  );

  useEffect(() => {
    if (!activeSessionsQuery.isError || initialResolvedRef.current) return;
    initialResolvedRef.current = true;
    setIsResolvingInitial(false);
    setSystemError("Không tải được danh sách cuộc trò chuyện.");
  }, [activeSessionsQuery.isError]);

  useEffect(() => {
    const activeSessions = activeSessionsQuery.data;
    if (!activeSessions) return;

    if (initialResolvedRef.current) {
      setSessions((prev) => mergeFetchedSessions(activeSessions, prev));
      setIsResolvingInitial(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const initialRouteThreadId = initialRouteThreadIdRef.current;
        const activeRouteTarget = initialRouteThreadId
          ? activeSessions.find(
              (session) => session.id === initialRouteThreadId,
            )
          : undefined;
        const archivedSessions =
          initialRouteThreadId && !activeRouteTarget
            ? await queryClient.fetchQuery({
                queryKey: chatbotQueryKeys.sessions("archived"),
                queryFn: () => fetchChatbotSessions("archived"),
                staleTime: 0,
              })
            : [];
        if (cancelled) return;

        const archivedRouteTarget = initialRouteThreadId
          ? archivedSessions.find(
              (session) => session.id === initialRouteThreadId,
            )
          : undefined;
        const selectedByUserId = selectedByUserRef.current;
        const currentSessions = sessionsRef.current;
        const currentActive = currentSessions.find(
          (session) => session.id === activeThreadIdRef.current,
        );
        const shouldKeepCurrentThread =
          !!selectedByUserId ||
          (!!currentActive &&
            (currentActive.id !== draftRef.current?.id ||
              currentActive.messages.length > 0));
        const sessionsFromServer = archivedRouteTarget
          ? mergeFetchedSessions([archivedRouteTarget], activeSessions)
          : activeSessions;

        setSessions((prev) => mergeFetchedSessions(sessionsFromServer, prev));
        initialResolvedRef.current = true;
        setIsResolvingInitial(false);

        if (!initialRouteThreadId) {
          return;
        }

        if (shouldKeepCurrentThread) {
          if (currentActive) {
            await loadMessagesForSession(currentActive);
          }
          return;
        }

        const first = archivedRouteTarget ?? activeRouteTarget;
        if (!first) return;

        setActiveThreadId(first.id);
        navigateToThread(first.id, { replace: true });
        await loadMessagesForSession(first);
      } catch {
        if (cancelled) return;
        initialResolvedRef.current = true;
        setIsResolvingInitial(false);
        setSystemError("Không tải được danh sách cuộc trò chuyện.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    activeSessionsQuery.data,
    loadMessagesForSession,
    navigateToThread,
    queryClient,
  ]);

  const setThreadMessages = useCallback((msgs: readonly ChatStoreMessage[]) => {
    const tid = activeThreadIdRef.current;
    setSessions((prev) =>
      prev.map((s) => (s.id === tid ? { ...s, messages: [...msgs] } : s)),
    );
  }, []);

  const { isRunning, onNew, onCancel } = useChatbotStreaming({
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
  });

  const switchToThread = useCallback(
    async (threadId: string) => {
      abortRef.current?.abort();
      selectedByUserRef.current = threadId;
      setSystemError(null);
      setActiveThreadId(threadId);
      navigateToThread(threadId);
      await loadMessagesById(threadId);
    },
    [loadMessagesById, navigateToThread],
  );

  const viewArchivedThread = useCallback(
    async (session: ChatThreadSession) => {
      abortRef.current?.abort();
      setSystemError(null);
      const archivedSession: ChatThreadSession = {
        ...session,
        status: "archived",
        serverId: session.serverId ?? session.id,
      };
      selectedByUserRef.current = archivedSession.id;
      setSessions((prev) => mergeFetchedSessions([archivedSession], prev));
      setActiveThreadId(archivedSession.id);
      navigateToThread(archivedSession.id);
      await loadMessagesForSession(archivedSession);
    },
    [loadMessagesForSession, navigateToThread],
  );

  const switchToNewThread = useCallback(async () => {
    abortRef.current?.abort();
    selectedByUserRef.current = null;
    setSystemError(null);
    const draft = createDraftSession();
    draftRef.current = draft;
    setSessions((prev) =>
      prev.filter((session) => session.serverId || session.messages.length > 0),
    );
    setActiveThreadId(draft.id);
    navigateToChatbotRoot();
  }, [navigateToChatbotRoot]);

  const { renameThread, archiveThread, unarchiveThread, deleteThread } =
    useChatbotSessionMutations({
      sessionsRef,
      activeThreadIdRef,
      draftRef,
      setSessions,
      setActiveThreadId,
      setSystemError,
      loadMessagesForSession,
      navigateToThread,
      navigateToChatbotRoot,
      invalidateSessionQueries,
      removeSessionFromQueryCache,
    });

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

  const shellValue: ChatbotShellContextValue = useMemo(
    () => ({
      errorMessage: systemError,
      clearError,
      isLoadingSessions: activeSessionsQuery.isLoading || isResolvingInitial,
      isLoadingMessages,
      sessions,
      activeThreadId,
      activeSessionStatus,
      switchToThread,
      viewArchivedThread,
      switchToNewThread,
      renameThread,
      archiveThread,
      unarchiveThread,
      deleteThread,
    }),
    [
      systemError,
      clearError,
      activeSessionsQuery.isLoading,
      isResolvingInitial,
      isLoadingMessages,
      sessions,
      activeThreadId,
      activeSessionStatus,
      switchToThread,
      viewArchivedThread,
      switchToNewThread,
      renameThread,
      archiveThread,
      unarchiveThread,
      deleteThread,
    ],
  );

  return { runtimeOptions, shellValue };
}
