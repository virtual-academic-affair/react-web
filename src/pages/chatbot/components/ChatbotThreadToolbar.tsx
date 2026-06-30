import { ScrollFadeArea } from "@/components/scroll-fade/ScrollFadeArea";
import Tooltip from "@/components/tooltip/Tooltip";
import { useAuthStore } from "@/stores/auth.store";
import {
  getChatbotReturnLabel,
  getChatbotReturnPath,
} from "@/utils/chatbotReturn.util";
import { useEffect, useMemo, useState } from "react";
import { LuFileText, LuPenLine } from "react-icons/lu";
import { MdAdd, MdArrowBack, MdChevronRight, MdSearch } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import { chatbotSidebarCollapsedNeutralIconClass } from "../assistantActionButton";
import { getChatbotBasePath, getChatbotInfoPath } from "../chatbotInfoRoutes";
import {
  useChatbotLayout,
  type ChatbotInfoPanelType,
} from "../chatbotLayoutContext";
import { sortSessionsByActivity } from "../chatbotMappers";
import { useChatbotSessionsQuery } from "../chatbotQueries";
import { useChatbotShell } from "../chatbotShellContext";
import type { ChatThreadSession } from "../types";
import {
  ChatbotShortcutHint,
  useChatbotModKeyLabel,
} from "./ChatbotShortcutHint";
import { ChatbotThreadDeleteConfirm } from "./ChatbotThreadDeleteConfirm";
import { ChatbotThreadRow } from "./ChatbotThreadRow";
import { ChatbotThreadSearchDialog } from "./ChatbotThreadSearchDialog";

const neutralPillClass =
  "inline-flex h-9 w-full items-center justify-start gap-2 rounded-full px-3 text-xs font-medium text-[#444746] transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10";

const primaryPillClass =
  "dark:bg-brand-500 dark:hover:bg-brand-400 inline-flex h-9 w-full items-center justify-start gap-2 rounded-full bg-[#d3e3fd] px-3 text-xs font-semibold text-[#062e6f] transition hover:bg-[#c2d7f7] dark:text-white";

const collapsedPrimaryIconClass =
  "dark:bg-brand-500 dark:hover:bg-brand-400 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d3e3fd] text-[#062e6f] transition hover:bg-[#c2d7f7] dark:text-white";

const infoIconClass = "h-4 w-4 shrink-0";
const infoIconStroke = 1.75;

const activePillClass =
  "inline-flex h-9 w-full items-center justify-start gap-2 rounded-full bg-gray-100 px-3 text-xs font-medium text-[#1f1f1f] transition dark:bg-white/10 dark:text-white";

const activeCollapsedInfoIconClass =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[#1f1f1f] transition dark:bg-white/10 dark:text-white";

function getInfoPillClass(active: boolean) {
  return active ? activePillClass : neutralPillClass;
}

function getCollapsedInfoIconClass(active: boolean) {
  return active
    ? activeCollapsedInfoIconClass
    : chatbotSidebarCollapsedNeutralIconClass;
}

export function ChatbotThreadToolbar({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const navigate = useNavigate();
  const userRole = useAuthStore((s) => s.userRole);
  const returnPath = getChatbotReturnPath();
  const {
    sessions,
    activeThreadId,
    isLoadingSessions,
    switchToThread,
    viewArchivedThread,
    switchToNewThread,
    renameThread,
    archiveThread,
    unarchiveThread,
    deleteThread,
  } = useChatbotShell();

  const [editingThread, setEditingThread] = useState<{
    id: string;
    draft: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatThreadSession | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { registerOpenSearch, infoPanel, infoPanelAudience } =
    useChatbotLayout();
  const modKeyLabel = useChatbotModKeyLabel();
  const newChatShortcutKeys = [modKeyLabel, "⇧", "O"];
  const searchShortcutKeys = [modKeyLabel, "⇧", "K"];
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [infoExpanded, setInfoExpanded] = useState(true);
  const activeSessionsQuery = useChatbotSessionsQuery("active", true);
  const archivedSessionsQuery = useChatbotSessionsQuery("archived", searchOpen);

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
  const isLoadingVisible =
    isLoadingSessions ||
    (activeSessionsQuery.isFetching && !activeSessions.length);

  const handleSwitch = (id: string) => {
    setEditingThread(null);
    switchToThread(id);
    onNavigate?.();
  };

  const handleNewThread = () => {
    setEditingThread(null);
    switchToNewThread();
    onNavigate?.();
  };

  useEffect(() => {
    registerOpenSearch(() => setSearchOpen(true));
    return () => registerOpenSearch(null);
  }, [registerOpenSearch]);

  const handleViewArchivedThread = async (session: ChatThreadSession) => {
    setEditingThread(null);
    await viewArchivedThread(session);
    onNavigate?.();
  };

  const handleSearchSelect = (session: ChatThreadSession) => {
    if (session.status === "archived") {
      void handleViewArchivedThread(session);
      return;
    }
    handleSwitch(session.id);
  };

  const handleArchive = (session: ChatThreadSession) => {
    void archiveThread(session.id);
  };

  const handleUnarchive = (session: ChatThreadSession) => {
    void unarchiveThread(session);
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

  const handleReturn = () => {
    onNavigate?.();
    navigate(returnPath);
  };

  const handleInfoSelect = (type: ChatbotInfoPanelType) => {
    const base = getChatbotBasePath(infoPanelAudience);
    if (infoPanel === type) {
      navigate({ pathname: base, search: "" });
      return;
    }
    navigate(getChatbotInfoPath(infoPanelAudience, type));
  };

  return (
    <>
      <div
        className={`flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden ${
          collapsed ? "items-center px-0 pt-1" : "pt-1"
        }`}
      >
        {collapsed ? (
          <div className="mt-4 flex w-full flex-col items-center gap-1.5">
            <Tooltip label="Tạo mới" placement="right">
              <button
                type="button"
                onClick={handleNewThread}
                className={collapsedPrimaryIconClass}
                aria-label="Tạo mới"
              >
                <MdAdd className="h-4 w-4" aria-hidden />
              </button>
            </Tooltip>

            <Tooltip label="Tìm kiếm" placement="right">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className={chatbotSidebarCollapsedNeutralIconClass}
                aria-label="Tìm kiếm"
              >
                <MdSearch className="h-4 w-4" aria-hidden />
              </button>
            </Tooltip>

            <Tooltip label="Tài liệu" placement="right">
              <button
                type="button"
                onClick={() => handleInfoSelect("documents")}
                className={getCollapsedInfoIconClass(infoPanel === "documents")}
                aria-label="Tài liệu"
                aria-pressed={infoPanel === "documents"}
              >
                <LuFileText
                  className={infoIconClass}
                  strokeWidth={infoIconStroke}
                  aria-hidden
                />
              </button>
            </Tooltip>

            <Tooltip label="Biểu mẫu & KTT" placement="right">
              <button
                type="button"
                onClick={() => handleInfoSelect("forms")}
                className={getCollapsedInfoIconClass(infoPanel === "forms")}
                aria-label="Biểu mẫu & KTT"
                aria-pressed={infoPanel === "forms"}
              >
                <LuPenLine
                  className={infoIconClass}
                  strokeWidth={infoIconStroke}
                  aria-hidden
                />
              </button>
            </Tooltip>

            {userRole === "admin" ? (
              <Tooltip
                label={getChatbotReturnLabel(returnPath)}
                placement="right"
              >
                <button
                  type="button"
                  onClick={handleReturn}
                  className={chatbotSidebarCollapsedNeutralIconClass}
                  aria-label={getChatbotReturnLabel(returnPath)}
                >
                  <MdArrowBack className="h-4 w-4" aria-hidden />
                </button>
              </Tooltip>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
            <div className="mt-3 shrink-0 px-3">
              <button
                type="button"
                onClick={handleNewThread}
                className={`${primaryPillClass} group`}
              >
                <MdAdd className="h-4 w-4 shrink-0" aria-hidden />
                Tạo mới
                <ChatbotShortcutHint keys={newChatShortcutKeys} />
              </button>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className={`${neutralPillClass} group`}
              >
                <MdSearch className="h-4 w-4 shrink-0" aria-hidden />
                Tìm kiếm
                <ChatbotShortcutHint keys={searchShortcutKeys} />
              </button>

              {userRole === "admin" ? (
                <button
                  type="button"
                  onClick={handleReturn}
                  className={neutralPillClass}
                >
                  <MdArrowBack className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">
                    {getChatbotReturnLabel(returnPath)}
                  </span>
                </button>
              ) : null}
            </div>

            {isLoadingVisible ? (
              <div className="mt-4 min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3">
                <div className="py-2 text-xs text-[#444746] dark:text-gray-400">
                  Đang tải...
                </div>
              </div>
            ) : (
              <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="shrink-0 px-3">
                  <button
                    type="button"
                    onClick={() => setInfoExpanded((current) => !current)}
                    className="group flex w-full cursor-pointer items-center px-3 py-1 text-xs font-medium text-[#5f6368] dark:text-gray-400"
                    aria-expanded={infoExpanded}
                  >
                    <span className="truncate">Thông tin</span>
                    <MdChevronRight
                      className={`ml-2 h-4 w-4 shrink-0 transition-all duration-200 ease-in-out ${
                        infoExpanded
                          ? "rotate-90 opacity-0 group-hover:opacity-100"
                          : "rotate-0 opacity-100"
                      }`}
                      aria-hidden
                    />
                  </button>
                </div>

                <div
                  className={`grid shrink-0 transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    infoExpanded
                      ? "grid-rows-[1fr] opacity-100"
                      : "pointer-events-none grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-3 pt-1 pb-3">
                      <button
                        type="button"
                        onClick={() => handleInfoSelect("documents")}
                        className={getInfoPillClass(infoPanel === "documents")}
                        aria-pressed={infoPanel === "documents"}
                      >
                        <LuFileText
                          className={infoIconClass}
                          strokeWidth={infoIconStroke}
                          aria-hidden
                        />
                        Tài liệu
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInfoSelect("forms")}
                        className={getInfoPillClass(infoPanel === "forms")}
                        aria-pressed={infoPanel === "forms"}
                      >
                        <LuPenLine
                          className={infoIconClass}
                          strokeWidth={infoIconStroke}
                          aria-hidden
                        />
                        Biểu mẫu & KTT
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-2 shrink-0 px-3">
                  <button
                    type="button"
                    onClick={() => setHistoryExpanded((current) => !current)}
                    className="group flex w-full cursor-pointer items-center px-3 py-1 text-xs font-medium text-[#5f6368] dark:text-gray-400"
                    aria-expanded={historyExpanded}
                  >
                    <span className="truncate">Gần đây</span>
                    <MdChevronRight
                      className={`ml-2 h-4 w-4 shrink-0 transition-all duration-200 ease-in-out ${
                        historyExpanded
                          ? "rotate-90 opacity-0 group-hover:opacity-100"
                          : "rotate-0 opacity-100"
                      }`}
                      aria-hidden
                    />
                  </button>
                </div>

                <div
                  className={`grid min-h-0 flex-1 transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    historyExpanded
                      ? "grid-rows-[1fr] opacity-100"
                      : "pointer-events-none grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <ScrollFadeArea
                      wrapperClassName="h-full min-h-0"
                      className="h-full min-h-0 [scrollbar-width:thin] overflow-x-hidden overflow-y-auto px-3"
                      topFadeRem={1.25}
                      bottomFadeRem={1.75}
                      thresholdPx={4}
                      watchDeps={[historyExpanded, activeSessions.length]}
                    >
                      {activeSessions.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-[#444746] dark:text-gray-400">
                          Chưa có cuộc trò chuyện nào.
                        </div>
                      ) : (
                        <div>
                          {activeSessions.map((session, i) => (
                            <ChatbotThreadRow
                              key={session.id || `session-${i}`}
                              session={session}
                              isActive={session.id === activeThreadId}
                              isEditing={editingThread?.id === session.id}
                              draft={
                                editingThread?.id === session.id
                                  ? editingThread.draft
                                  : session.title
                              }
                              canSwitch
                              canEdit
                              archiveAction="archive"
                              onSwitch={() => handleSwitch(session.id)}
                              onStartEdit={() =>
                                setEditingThread({
                                  id: session.id,
                                  draft: session.title,
                                })
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
                              onArchive={() => handleArchive(session)}
                              onDelete={() => handleDelete(session)}
                            />
                          ))}
                        </div>
                      )}
                    </ScrollFadeArea>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {searchOpen ? (
        <ChatbotThreadSearchDialog
          activeSessions={activeSessions}
          archivedSessions={archivedSessions}
          onClose={() => setSearchOpen(false)}
          onSelect={handleSearchSelect}
          onRename={(session, title) => renameThread(session.id, title)}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
          onDelete={handleDelete}
        />
      ) : null}

      <ChatbotThreadDeleteConfirm
        target={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </>
  );
}
