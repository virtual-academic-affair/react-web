import { Modal } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MdAdd,
  MdArchive,
  MdCheck,
  MdClose,
  MdDelete,
  MdEdit,
  MdKeyboardArrowDown,
} from "react-icons/md";

import { useChatbotShell } from "../chatbotShellContext";
import type { ChatThreadSession } from "../types";

function useDismissOnOutsideClick<T extends HTMLElement>(
  open: boolean,
  setOpen: (value: boolean) => void,
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, setOpen]);
  return ref;
}

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
      className={`group flex w-full items-center gap-2 px-3 py-2 text-sm transition ${
        isActive
          ? "dark:bg-brand-500/20 bg-[#e8f0fe] text-[#062e6f] dark:text-white"
          : "text-[#1f1f1f] hover:bg-[#f8f9fa] dark:text-gray-200 dark:hover:bg-white/10"
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
            className="min-w-0 flex-1 truncate text-left"
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

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const containerRef = useDismissOnOutsideClick<HTMLDivElement>(open, (next) => {
    if (!next) setEditingId(null);
    setOpen(next);
  });

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeThreadId),
    [sessions, activeThreadId],
  );

  const activeTitle = activeSession?.title?.trim() || "Cuộc trò chuyện mới";

  const handleSwitch = (id: string) => {
    setOpen(false);
    setEditingId(null);
    switchToThread(id);
  };

  const handleNewThread = () => {
    setOpen(false);
    setEditingId(null);
    switchToNewThread();
  };

  const handleArchive = (session: ChatThreadSession) => {
    void archiveThread(session.id);
  };

  const handleDelete = (session: ChatThreadSession) => {
    Modal.confirm({
      title: "Xoá cuộc trò chuyện?",
      content: `"${session.title?.trim() || "Cuộc trò chuyện mới"}" sẽ bị xoá vĩnh viễn.`,
      okText: "Xoá",
      okButtonProps: { danger: true },
      cancelText: "Huỷ",
      onOk: () => deleteThread(session.id),
    });
  };

  return (
    <div className="mb-3 flex shrink-0 items-center gap-2">
      <div ref={containerRef} className="relative min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="dark:bg-navy-800 flex w-full items-center justify-between gap-2 rounded-xl border border-[#e3e3e3] bg-white px-3 py-2 text-left text-sm text-[#1f1f1f] outline-none transition hover:bg-[#f8f9fa] focus-visible:ring-2 focus-visible:ring-[#1a73e8]/30 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="truncate">
            {isLoadingSessions ? "Đang tải..." : activeTitle}
          </span>
          <MdKeyboardArrowDown
            className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {open ? (
          <div
            role="listbox"
            className="dark:bg-navy-800 absolute top-full left-0 z-50 mt-1 max-h-80 w-full overflow-y-auto overflow-x-hidden rounded-xl border border-[#e3e3e3] bg-white py-1 shadow-lg dark:border-white/10"
          >
            {sessions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-[#444746] dark:text-gray-400">
                Chưa có cuộc trò chuyện nào.
              </div>
            ) : (
              sessions.map((session, i) => (
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
              ))
            )}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={handleNewThread}
        className="dark:bg-navy-800 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#e3e3e3] bg-white px-3 py-2 text-sm font-medium text-[#1f1f1f] hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
      >
        <MdAdd className="h-4 w-4" aria-hidden />
        Tạo mới
      </button>
    </div>
  );
}
