import { useEffect, useMemo, useState } from "react";
import { MdAdd, MdArchive, MdHistory } from "react-icons/md";

import { useChatbotShell } from "../chatbotShellContext";
import { sortSessionsByActivity } from "../chatbotMappers";
import { useChatbotSessionsQuery } from "../chatbotQueries";
import type { ChatThreadSession } from "../types";
import { ChatbotThreadDeleteConfirm } from "./ChatbotThreadDeleteConfirm";
import { ChatbotThreadRow } from "./ChatbotThreadRow";

type ThreadListMode = "active" | "archived";

export function ChatbotThreadToolbar() {
  const {
    sessions,
    activeThreadId,
    activeSessionStatus,
    isLoadingSessions,
    switchToThread,
    viewArchivedThread,
    switchToNewThread,
    renameThread,
    archiveThread,
    unarchiveThread,
    deleteThread,
  } = useChatbotShell();

  const [mode, setMode] = useState<ThreadListMode>("active");
  const [editingThread, setEditingThread] = useState<{
    id: string;
    draft: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatThreadSession | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const archivedSessionsQuery = useChatbotSessionsQuery(
    "archived",
    mode === "archived" || activeSessionStatus === "archived",
  );

  useEffect(() => {
    if (activeSessionStatus === "archived") {
      setMode("archived");
    }
  }, [activeSessionStatus]);

  const activeSessions = useMemo(
    () =>
      sortSessionsByActivity(
        sessions.filter(
          (session) => session.status === "active" && !!session.serverId,
        ),
        activeThreadId,
      ),
    [activeThreadId, sessions],
  );

  const archivedSessions = archivedSessionsQuery.data ?? [];
  const visibleSessions = mode === "active" ? activeSessions : archivedSessions;
  const isLoadingVisible =
    mode === "active"
      ? isLoadingSessions
      : archivedSessionsQuery.isLoading ||
        (archivedSessionsQuery.isFetching && !archivedSessionsQuery.data);

  const handleSwitch = (id: string) => {
    setEditingThread(null);
    switchToThread(id);
  };

  const handleNewThread = () => {
    setMode("active");
    setEditingThread(null);
    switchToNewThread();
  };

  const handleArchive = (session: ChatThreadSession) => {
    void archiveThread(session.id);
  };

  const handleUnarchive = async (session: ChatThreadSession) => {
    await unarchiveThread(session);
  };

  const handleDelete = (session: ChatThreadSession) => {
    setDeleteTarget(session);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteThread(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <aside className="dark:bg-navy-800 flex max-h-[260px] min-h-0 w-full shrink-0 flex-col rounded-3xl bg-white/80 p-3 shadow-[0_2px_12px_-6px_rgba(0,0,0,0.28)] ring-1 ring-black/5 backdrop-blur dark:ring-white/10 lg:h-full lg:max-h-none lg:w-[280px]">
        <div className="mb-3 flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleNewThread}
            className="dark:bg-brand-500 inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#d3e3fd] px-4 text-sm font-semibold text-[#062e6f] transition hover:bg-[#c2d7f7] dark:text-white dark:hover:bg-brand-400"
          >
            <MdAdd className="h-5 w-5 shrink-0" aria-hidden />
            Tạo mới
          </button>
        </div>

        <div className="mb-3 grid shrink-0 grid-cols-2 rounded-2xl bg-gray-100 p-1 dark:bg-white/8">
          <button
            type="button"
            onClick={() => setMode("active")}
            className={`rounded-xl px-2 py-1.5 text-xs font-semibold transition ${
              mode === "active"
                ? "bg-white text-navy-700 shadow-sm dark:bg-navy-700 dark:text-white"
                : "text-gray-600 hover:text-navy-700 dark:text-gray-300 dark:hover:text-white"
            }`}
          >
            Đang hoạt động
          </button>
          <button
            type="button"
            onClick={() => setMode("archived")}
            className={`rounded-xl px-2 py-1.5 text-xs font-semibold transition ${
              mode === "archived"
                ? "bg-white text-navy-700 shadow-sm dark:bg-navy-700 dark:text-white"
                : "text-gray-600 hover:text-navy-700 dark:text-gray-300 dark:hover:text-white"
            }`}
          >
            Lưu trữ
          </button>
        </div>

        <div className="mb-2 flex shrink-0 items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-[#5f6368] dark:text-gray-400">
          {mode === "active" ? (
            <MdHistory className="h-4 w-4" aria-hidden />
          ) : (
            <MdArchive className="h-4 w-4" aria-hidden />
          )}
          {mode === "active" ? "Lịch sử chat" : "Chat lưu trữ"}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 pb-4">
          {isLoadingVisible ? (
            <div className="rounded-xl px-3 py-2 text-sm text-[#444746] dark:text-gray-400">
              Đang tải...
            </div>
          ) : visibleSessions.length === 0 ? (
            <div className="rounded-xl px-3 py-2 text-sm text-[#444746] dark:text-gray-400">
              {mode === "active"
                ? "Chưa có cuộc trò chuyện nào."
                : "Chưa có cuộc trò chuyện lưu trữ nào."}
            </div>
          ) : (
            <div className="space-y-1">
              {visibleSessions.map((session, i) => (
                <ChatbotThreadRow
                  key={session.id || `session-${i}`}
                  session={session}
                  isActive={session.id === activeThreadId}
                  isEditing={
                    mode === "active" && editingThread?.id === session.id
                  }
                  draft={
                    editingThread?.id === session.id
                      ? editingThread.draft
                      : session.title
                  }
                  canSwitch
                  canEdit={mode === "active"}
                  archiveAction={mode === "active" ? "archive" : "unarchive"}
                  onSwitch={() =>
                    mode === "active"
                      ? handleSwitch(session.id)
                      : void viewArchivedThread(session)
                  }
                  onStartEdit={() =>
                    setEditingThread({ id: session.id, draft: session.title })
                  }
                  onDraftChange={(next) =>
                    setEditingThread((current) =>
                      current?.id === session.id
                        ? { ...current, draft: next }
                        : current,
                    )
                  }
                  onCancelEdit={() => setEditingThread(null)}
                  onSaveEdit={async (next) => {
                    setEditingThread(null);
                    await renameThread(session.id, next);
                  }}
                  onArchive={() =>
                    mode === "active"
                      ? handleArchive(session)
                      : void handleUnarchive(session)
                  }
                  onDelete={() => handleDelete(session)}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      <ChatbotThreadDeleteConfirm
        target={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  );
}
