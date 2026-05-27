import { useEffect, useRef } from "react";
import {
  MdArchive,
  MdCheck,
  MdClose,
  MdDelete,
  MdEdit,
  MdUnarchive,
} from "react-icons/md";

import type { ChatThreadSession } from "../types";

type ThreadRowProps = {
  session: ChatThreadSession;
  isActive: boolean;
  isEditing: boolean;
  draft: string;
  canSwitch?: boolean;
  canEdit?: boolean;
  archiveAction?: "archive" | "unarchive";
  onSwitch: () => void;
  onStartEdit: () => void;
  onDraftChange: (next: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (next: string) => void;
  onArchive: () => void;
  onDelete: () => void;
};

export function ChatbotThreadRow({
  session,
  isActive,
  isEditing,
  draft,
  canSwitch = true,
  canEdit = true,
  archiveAction = "archive",
  onSwitch,
  onStartEdit,
  onDraftChange,
  onCancelEdit,
  onSaveEdit,
  onArchive,
  onDelete,
}: ThreadRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [isEditing]);

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
            onChange={(e) => onDraftChange(e.target.value)}
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
            disabled={!canSwitch}
            className="min-w-0 flex-1 truncate text-left font-medium disabled:cursor-default"
            title={session.title}
          >
            {session.title?.trim() || "Không có tiêu đề"}
          </button>
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            {canEdit ? (
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
            ) : null}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#444746] hover:bg-black/[0.06] dark:text-gray-300 dark:hover:bg-white/10"
              aria-label={archiveAction === "archive" ? "Lưu trữ" : "Khôi phục"}
              title={archiveAction === "archive" ? "Lưu trữ" : "Khôi phục"}
            >
              {archiveAction === "archive" ? (
                <MdArchive className="h-4 w-4" />
              ) : (
                <MdUnarchive className="h-4 w-4" />
              )}
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
