import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MdArchive,
  MdCheck,
  MdClose,
  MdDelete,
  MdEdit,
  MdMoreVert,
  MdUnarchive,
} from "react-icons/md";

import {
  getFloatingDropdownPosition,
  type FloatingPosition,
} from "@/utils/floatingPosition";

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<FloatingPosition>({
    left: 0,
  });

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const close = () => setIsMenuOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isMenuOpen]);

  const commit = () => {
    const next = draft.trim();
    if (!next || next === session.title) {
      onCancelEdit();
      return;
    }
    onSaveEdit(next);
  };
  const runMenuAction = (action: () => void) => {
    setIsMenuOpen(false);
    action();
  };
  const toggleMenu = () => {
    if (!isMenuOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition(
        getFloatingDropdownPosition(rect, {
          gap: 8,
          width: 180,
          maxHeight: 180,
        }),
      );
    }
    setIsMenuOpen((current) => !current);
  };

  return (
    <div
      className={`group relative flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition ${
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
            className="min-w-0 flex-1 truncate pr-1 text-left font-medium disabled:cursor-default"
            title={session.title}
          >
            {session.title?.trim() || "Không có tiêu đề"}
          </button>
          <div className="shrink-0">
            <button
              ref={triggerRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#444746] opacity-100 transition hover:bg-black/[0.06] sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100 dark:text-gray-300 dark:hover:bg-white/10"
              aria-label="Mở tuỳ chọn cuộc trò chuyện"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              title="Tuỳ chọn"
            >
              <MdMoreVert className="h-4 w-4" />
            </button>
          </div>

          {isMenuOpen
            ? createPortal(
                <div
                  ref={menuRef}
                  role="menu"
                  style={{
                    top: menuPosition.top,
                    bottom: menuPosition.bottom,
                    left: menuPosition.left,
                    width: menuPosition.width,
                  }}
                  className="dark:bg-navy-700 fixed z-9999 rounded-xl bg-white p-1.5 text-sm text-[#1f1f1f] shadow-xl dark:text-white"
                >
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        runMenuAction(onStartEdit);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-black/[0.06] dark:hover:bg-white/10"
                      role="menuitem"
                    >
                      <MdEdit className="h-4 w-4" />
                      <span>Đổi tên</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      runMenuAction(onArchive);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-black/[0.06] dark:hover:bg-white/10"
                    role="menuitem"
                  >
                    {archiveAction === "archive" ? (
                      <MdArchive className="h-4 w-4" />
                    ) : (
                      <MdUnarchive className="h-4 w-4" />
                    )}
                    <span>
                      {archiveAction === "archive" ? "Lưu trữ" : "Khôi phục"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      runMenuAction(onDelete);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[#d93025] transition hover:bg-[#fce8e6] dark:text-[#f28b82] dark:hover:bg-white/10"
                    role="menuitem"
                  >
                    <MdDelete className="h-4 w-4" />
                    <span>Xoá</span>
                  </button>
                </div>,
                document.body,
              )
            : null}
        </>
      )}
    </div>
  );
}
