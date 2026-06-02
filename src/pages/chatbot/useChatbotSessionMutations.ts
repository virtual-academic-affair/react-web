import { useCallback, type Dispatch, type SetStateAction } from "react";

import {
  archiveSession,
  deleteSession,
  renameSession,
  unarchiveSession,
} from "@/services/chatbot/chatSessions.service";

import { createDraftSession } from "./chatbotMappers";
import type { ChatThreadSession } from "./types";

type MutableRef<T> = {
  current: T;
};

type UseChatbotSessionMutationsArgs = {
  sessionsRef: MutableRef<ChatThreadSession[]>;
  activeThreadIdRef: MutableRef<string>;
  draftRef: MutableRef<ChatThreadSession | null>;
  setSessions: Dispatch<SetStateAction<ChatThreadSession[]>>;
  setActiveThreadId: Dispatch<SetStateAction<string>>;
  setSystemError: Dispatch<SetStateAction<string | null>>;
  loadMessagesForSession: (target: ChatThreadSession) => Promise<void>;
  navigateToThread: (threadId: string, options?: { replace?: boolean }) => void;
  navigateToChatbotRoot: (options?: { replace?: boolean }) => void;
  invalidateSessionQueries: () => Promise<void>;
  removeSessionFromQueryCache: (sessionId: string) => void;
};

export function useChatbotSessionMutations({
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
}: UseChatbotSessionMutationsArgs) {
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
        const nextActive = remaining[0];
        setActiveThreadId(nextActive.id);
        setSessions(remaining);
        navigateToThread(nextActive.id, { replace: true });
        void loadMessagesForSession(nextActive);
        return;
      }

      const draft = createDraftSession();
      draftRef.current = draft;
      setActiveThreadId(draft.id);
      setSessions([draft]);
      navigateToChatbotRoot({ replace: true });
    },
    [
      activeThreadIdRef,
      draftRef,
      loadMessagesForSession,
      navigateToChatbotRoot,
      navigateToThread,
      sessionsRef,
      setActiveThreadId,
      setSessions,
    ],
  );

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
        await invalidateSessionQueries();
      } catch {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === threadId ? { ...s, title: previousTitle } : s,
          ),
        );
        setSystemError("Không đổi được tên cuộc trò chuyện.");
      }
    },
    [invalidateSessionQueries, sessionsRef, setSessions, setSystemError],
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
        removeSessionFromQueryCache(target.id);
        removeThreadFromState(threadId);
        await invalidateSessionQueries();
      } catch {
        setSystemError("Không lưu được cuộc trò chuyện.");
      }
    },
    [
      invalidateSessionQueries,
      removeSessionFromQueryCache,
      removeThreadFromState,
      sessionsRef,
      setSystemError,
    ],
  );

  const unarchiveThread = useCallback(
    async (session: ChatThreadSession) => {
      const serverId = session.serverId ?? session.id;
      if (!serverId) return;
      try {
        await unarchiveSession(serverId);
        removeSessionFromQueryCache(session.id);
        setSessions((prev) => {
          if (prev.some((item) => item.id === session.id)) {
            return prev.map((item) =>
              item.id === session.id ? { ...item, status: "active" } : item,
            );
          }
          return [
            {
              ...session,
              status: "active",
              serverId,
              messages: [],
              messagesLoaded: false,
            },
            ...prev,
          ];
        });
        await invalidateSessionQueries();
      } catch {
        setSystemError("Không khôi phục được cuộc trò chuyện.");
      }
    },
    [
      invalidateSessionQueries,
      removeSessionFromQueryCache,
      setSessions,
      setSystemError,
    ],
  );

  const deleteThread = useCallback(
    async (session: ChatThreadSession) => {
      const target =
        sessionsRef.current.find((s) => s.id === session.id) ?? session;
      if (!target) return;
      const openNewChat = () => {
        const draft = createDraftSession();
        draftRef.current = draft;
        setActiveThreadId(draft.id);
        setSessions((prev) =>
          prev.filter((item) => item.id !== target.id && !!item.serverId),
        );
        navigateToChatbotRoot({ replace: true });
      };
      if (!target.serverId) {
        openNewChat();
        return;
      }
      try {
        await deleteSession(target.serverId);
        removeSessionFromQueryCache(target.id);
        openNewChat();
        await invalidateSessionQueries();
      } catch {
        setSystemError("Không xoá được cuộc trò chuyện.");
      }
    },
    [
      invalidateSessionQueries,
      removeSessionFromQueryCache,
      draftRef,
      navigateToChatbotRoot,
      sessionsRef,
      setActiveThreadId,
      setSessions,
      setSystemError,
    ],
  );

  return {
    renameThread,
    archiveThread,
    unarchiveThread,
    deleteThread,
  };
}
