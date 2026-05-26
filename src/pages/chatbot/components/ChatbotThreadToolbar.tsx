import { useEffect, useMemo, useRef, useState } from "react";
import {
  MdAdd,
  MdArchive,
  MdCheck,
  MdClose,
  MdDelete,
  MdEdit,
  MdHistory,
} from "react-icons/md";

import ConfirmModal from "@/components/modal/ConfirmModal";

import { useChatbotShell } from "../chatbotShellContext";
import type { ChatThreadSession } from "../types";

type RowProps = {
  session: ChatThreadSession;
  isActive: boolean;
  isEditing: boolean;
  onSwitch: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (next: string) => void;
  onArchive: () => void;
  onDelete: () => void;
};

function ThreadRow({
  session,
  isActive,
  isEditing,
  onSwitch,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onArchive,
  onDelete,
}: RowProps) {
  const [draft, setDraft] = useState(session.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setDraft(session.title);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [isEditing, session.title]);

  const commit = () => {
    const next = draft.trim();
    if (!next || next === session.title) {
      onCancelEdit();
      return;
    }
    onSaveEdit(next);
  };

  return (
    <div
      className={`group flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition ${
        isActive
          ? "bg-[#d3e3fd] text-[#062e6f] dark:bg-white/[0.12] dark:text-white"
          : "text-[#1f1f1f] hover:bg-black/[0.04] dark:text-gray-200 dark:hover:bg-white/10"
      }`}
    >
      {isEditing ? (
        <>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                onCancelEdit();
              }
            }}
            className="dark:bg-navy-700 min-w-0 flex-1 rounded-md border border-[#1a73e8]/40 bg-white px-2 py-1 text-sm text-[#1f1f1f] outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]/30 dark:text-white"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              commit();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#1a73e8] hover:bg-black/[0.06] dark:text-[#a8c7fa] dark:hover:bg-white/10"
            aria-label="Lưu tên mới"
          >
            <MdCheck className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCancelEdit();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#444746] hover:bg-black/[0.06] dark:text-gray-300 dark:hover:bg-white/10"
            aria-label="Huỷ đổi tên"
          >
            <MdClose className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onSwitch}
            className="min-w-0 flex-1 truncate text-left font-medium"
            title={session.title}
          >
            {session.title?.trim() || "Không có tiêu đề"}
          </button>
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#444746] hover:bg-black/[0.06] dark:text-gray-300 dark:hover:bg-white/10"
              aria-label="Đổi tên"
              title="Đổi tên"
            >
              <MdEdit className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#444746] hover:bg-black/[0.06] dark:text-gray-300 dark:hover:bg-white/10"
              aria-label="Lưu trữ"
              title="Lưu trữ"
            >
              <MdArchive className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#d93025] hover:bg-[#fce8e6] dark:text-[#f28b82] dark:hover:bg-white/10"
              aria-label="Xoá"
              title="Xoá"
            >
              <MdDelete className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function ChatbotThreadToolbar() {
  const {
    sessions,
    activeThreadId,
    isLoadingSessions,
    switchToThread,
    switchToNewThread,
    renameThread,
    archiveThread,
    deleteThread,
  } = useChatbotShell();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatThreadSession | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedSessions = useMemo(() => {
    const getTime = (session: ChatThreadSession) => {
      const newestMessage = session.messages.reduce<string | null>(
        (latest, message) => {
          if (!latest) return message.createdAt;
          return new Date(message.createdAt).getTime() >
            new Date(latest).getTime()
            ? message.createdAt
            : latest;
        },
        null,
      );
      const raw = session.lastMessageAt ?? session.updatedAt ?? newestMessage;
      const time = raw ? Date.parse(raw) : Number.NaN;
      if (Number.isFinite(time)) return time;
      return session.id === activeThreadId ? Number.MAX_SAFE_INTEGER : 0;
    };

    return [...sessions].sort((a, b) => getTime(b) - getTime(a));
  }, [activeThreadId, sessions]);

  const handleSwitch = (id: string) => {
    setEditingId(null);
    switchToThread(id);
  };

  const handleNewThread = () => {
    setEditingId(null);
    switchToNewThread();
  };

  const handleArchive = (session: ChatThreadSession) => {
    void archiveThread(session.id);
  };

  const handleDelete = (session: ChatThreadSession) => {
    setDeleteTarget(session);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteThread(deleteTarget.id);
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

        <div className="mb-2 flex shrink-0 items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-[#5f6368] dark:text-gray-400">
          <MdHistory className="h-4 w-4" aria-hidden />
          Lịch sử chat
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 pb-4">
          {isLoadingSessions ? (
            <div className="rounded-xl px-3 py-2 text-sm text-[#444746] dark:text-gray-400">
              Đang tải...
            </div>
          ) : sortedSessions.length === 0 ? (
            <div className="rounded-xl px-3 py-2 text-sm text-[#444746] dark:text-gray-400">
              Chưa có cuộc trò chuyện nào.
            </div>
          ) : (
            <div className="space-y-1">
              {sortedSessions.map((session, i) => (
                <ThreadRow
                  key={session.id || `session-${i}`}
                  session={session}
                  isActive={session.id === activeThreadId}
                  isEditing={editingId === session.id}
                  onSwitch={() => handleSwitch(session.id)}
                  onStartEdit={() => setEditingId(session.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={async (next) => {
                    setEditingId(null);
                    await renameThread(session.id, next);
                  }}
                  onArchive={() => handleArchive(session)}
                  onDelete={() => handleDelete(session)}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      <ConfirmModal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Xoá cuộc trò chuyện"
        subTitle={`Bạn có chắc chắn muốn xoá cuộc trò chuyện "${deleteTarget?.title?.trim() || "Cuộc trò chuyện mới"}" không? Hành động này không thể hoàn tác.`}
        confirmText="Xoá"
        loading={isDeleting}
      />
    </>
  );
}
