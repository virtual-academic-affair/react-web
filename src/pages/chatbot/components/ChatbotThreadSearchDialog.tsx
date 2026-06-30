import { SegmentedControl } from "@/components/segmented-control/SegmentedControl";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { formatSessionActivityLabel } from "@/utils/date";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MdArchive,
  MdCheck,
  MdClose,
  MdDelete,
  MdEdit,
  MdMoreVert,
  MdSearch,
  MdUnarchive,
} from "react-icons/md";

import {
  dropdownMenuItemClass,
  dropdownMenuItemDangerClass,
  dropdownMenuPanelClass,
} from "@/components/navbar/UserMenu";
import {
  getFloatingDropdownPosition,
  type FloatingPosition,
} from "@/utils/floatingPosition";

import type { ChatThreadSession } from "../types";

type ChatbotThreadSearchDialogProps = {
  activeSessions: ChatThreadSession[];
  archivedSessions: ChatThreadSession[];
  onClose: () => void;
  onSelect: (session: ChatThreadSession) => void;
  onRename: (session: ChatThreadSession, title: string) => Promise<void>;
  onArchive: (session: ChatThreadSession) => void;
  onUnarchive: (session: ChatThreadSession) => void;
  onDelete: (session: ChatThreadSession) => void;
};

type StatusFilter = "active" | "archived";

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase("vi")
    .trim();
}

function getFuzzyScore(title: string, query: string) {
  const normalizedTitle = normalizeSearchText(title);
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 1;
  if (normalizedTitle === normalizedQuery) return 1000;
  if (normalizedTitle.startsWith(normalizedQuery)) return 800;

  const directIndex = normalizedTitle.indexOf(normalizedQuery);
  if (directIndex >= 0) return 600 - directIndex;

  const words = normalizedTitle.split(/\s+/);
  const wordIndex = words.findIndex((word) => word.startsWith(normalizedQuery));
  if (wordIndex >= 0) return 450 - wordIndex;

  let queryIndex = 0;
  let firstMatch = -1;
  let previousMatch = -1;
  let gapPenalty = 0;

  for (
    let titleIndex = 0;
    titleIndex < normalizedTitle.length && queryIndex < normalizedQuery.length;
    titleIndex += 1
  ) {
    if (normalizedTitle[titleIndex] !== normalizedQuery[queryIndex]) continue;
    if (firstMatch < 0) firstMatch = titleIndex;
    if (previousMatch >= 0) {
      gapPenalty += titleIndex - previousMatch - 1;
    }
    previousMatch = titleIndex;
    queryIndex += 1;
  }

  if (queryIndex !== normalizedQuery.length) return null;
  return 250 - firstMatch - gapPenalty * 2;
}

function getSessionActivityDate(session: ChatThreadSession) {
  return session.lastMessageAt ?? session.updatedAt;
}

function getSearchResultRowClass(selected: boolean) {
  return `group relative flex h-9 w-full items-center rounded-full px-3 text-xs transition ${
    selected
      ? "bg-gray-100 font-medium text-[#1f1f1f] dark:bg-white/10 dark:text-gray-200"
      : "text-[#1f1f1f] hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
  }`;
}

type SearchResultRowProps = {
  session: ChatThreadSession;
  selected: boolean;
  activityLabel: string;
  onHover: () => void;
  onSelect: () => void;
  onRename: (title: string) => Promise<void>;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
};

function ChatbotThreadSearchResultRow({
  session,
  selected,
  activityLabel,
  onHover,
  onSelect,
  onRename,
  onArchive,
  onUnarchive,
  onDelete,
}: SearchResultRowProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(session.title);
  const [menuPosition, setMenuPosition] = useState<FloatingPosition>({
    left: 0,
  });
  const isArchived = session.status === "archived";

  useEffect(() => {
    setDraft(session.title);
  }, [session.title]);

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

  const toggleMenu = () => {
    if (!isMenuOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition(
        getFloatingDropdownPosition(rect, {
          gap: 8,
          width: 208,
          maxHeight: 220,
        }),
      );
    }
    setIsMenuOpen((current) => !current);
  };

  const runMenuAction = (action: () => void) => {
    setIsMenuOpen(false);
    action();
  };

  const cancelEdit = () => {
    setDraft(session.title);
    setIsEditing(false);
  };

  const commitEdit = async () => {
    const next = draft.trim();
    if (!next || next === session.title) {
      cancelEdit();
      return;
    }
    setIsEditing(false);
    await onRename(next);
  };

  return (
    <div
      className={getSearchResultRowClass(selected)}
      onMouseEnter={onHover}
      onFocus={onHover}
    >
      {isEditing ? (
        <>
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter") {
                event.preventDefault();
                void commitEdit();
              } else if (event.key === "Escape") {
                event.preventDefault();
                cancelEdit();
              }
            }}
            className="dark:bg-navy-700 min-w-0 flex-1 rounded-md border border-[#1a73e8]/40 bg-white px-2 py-1 text-sm text-[#1f1f1f] outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]/30 dark:text-white"
            aria-label="Tên cuộc trò chuyện"
          />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void commitEdit();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#1a73e8] hover:bg-black/[0.06] dark:text-[#a8c7fa] dark:hover:bg-white/10"
            aria-label="Lưu tên mới"
          >
            <MdCheck className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              cancelEdit();
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
            onClick={onSelect}
            className={`min-w-0 flex-1 truncate text-left font-medium transition-[padding] duration-150 ${
              isMenuOpen ? "pr-1" : "group-hover:pr-1 group-focus-within:pr-1"
            }`}
            title={session.title}
          >
            {session.title?.trim() || "Cuộc trò chuyện mới"}
          </button>
          {activityLabel ? (
            <span className="shrink-0 pl-2 text-[#5f6368] dark:text-gray-400">
              {activityLabel}
            </span>
          ) : null}
          <button
            ref={triggerRef}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleMenu();
            }}
            onKeyDown={(event) => event.stopPropagation()}
            className={`flex h-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-[#444746] transition-all duration-150 hover:bg-black/[0.06] focus:w-7 focus:opacity-100 dark:text-gray-300 dark:hover:bg-white/10 ${
              isMenuOpen
                ? "w-7 opacity-100"
                : "w-0 opacity-0 group-hover:w-7 group-hover:opacity-100 group-focus-within:w-7 group-focus-within:opacity-100"
            }`}
            aria-label="Mở tuỳ chọn cuộc trò chuyện"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            title="Tuỳ chọn"
          >
            <MdMoreVert className="h-4 w-4 shrink-0" />
          </button>

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
                  className={`${dropdownMenuPanelClass} fixed z-[99999]`}
                >
                  {!isArchived ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        runMenuAction(() => setIsEditing(true));
                      }}
                      className={dropdownMenuItemClass}
                      role="menuitem"
                    >
                      <MdEdit className="h-4 w-4 shrink-0" />
                      <span>Đổi tên</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      runMenuAction(isArchived ? onUnarchive : onArchive);
                    }}
                    className={dropdownMenuItemClass}
                    role="menuitem"
                  >
                    {isArchived ? (
                      <MdUnarchive className="h-4 w-4 shrink-0" />
                    ) : (
                      <MdArchive className="h-4 w-4 shrink-0" />
                    )}
                    <span>{isArchived ? "Khôi phục" : "Lưu trữ"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      runMenuAction(onDelete);
                    }}
                    className={dropdownMenuItemDangerClass}
                    role="menuitem"
                  >
                    <MdDelete className="h-4 w-4 shrink-0" />
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

export function ChatbotThreadSearchDialog({
  activeSessions,
  archivedSessions,
  onClose,
  onSelect,
  onRename,
  onArchive,
  onUnarchive,
  onDelete,
}: ChatbotThreadSearchDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useBodyScrollLock(true);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");

  const searchableSessions = useMemo(
    () => (statusFilter === "archived" ? archivedSessions : activeSessions),
    [activeSessions, archivedSessions, statusFilter],
  );

  const results = useMemo(() => {
    return searchableSessions
      .map((session, index) => ({
        session,
        index,
        score: getFuzzyScore(session.title || "Cuộc trò chuyện mới", query),
      }))
      .filter(
        (
          result,
        ): result is {
          session: ChatThreadSession;
          index: number;
          score: number;
        } => result.score !== null,
      )
      .sort(
        (left, right) => right.score - left.score || left.index - right.index,
      )
      .slice(0, 30);
  }, [query, searchableSessions]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() =>
      inputRef.current?.focus(),
    );

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [statusFilter]);

  const activeResultIndex = results.length
    ? Math.min(selectedIndex, results.length - 1)
    : 0;

  const selectResult = (session: ChatThreadSession) => {
    onSelect(session);
    onClose();
  };

  return createPortal(
    <div
      data-chatbot-search-dialog
      className="fixed inset-0 z-10000 flex items-start justify-center bg-black/30 px-4 pt-[12vh] backdrop-blur-sm sm:pt-[16vh]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-search-title"
        className="dark:bg-navy-800 flex max-h-[68vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-white shadow-2xl dark:text-white"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelectedIndex((current) =>
              results.length ? (current + 1) % results.length : 0,
            );
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelectedIndex((current) =>
              results.length
                ? (current - 1 + results.length) % results.length
                : 0,
            );
          } else if (event.key === "Enter" && results[activeResultIndex]) {
            event.preventDefault();
            selectResult(results[activeResultIndex].session);
          }
        }}
      >
        <div className="shrink-0 px-5 pt-5 pb-3">
          <div className="dark:bg-navy-900/60 flex items-center gap-2 rounded-2xl bg-gray-50 px-3 py-2 dark:bg-white/5">
            <MdSearch
              className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500"
              aria-hidden
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Tìm kiếm cuộc trò chuyện..."
              className="min-w-0 flex-1 bg-transparent py-1 text-sm text-[#1f1f1f] outline-none placeholder:text-gray-500 dark:text-white dark:placeholder:text-gray-400"
              aria-label="Tìm kiếm cuộc trò chuyện"
            />
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-transparent text-gray-400 transition-colors hover:border-gray-300 dark:text-gray-400 dark:hover:border-white/20"
              aria-label="Đóng tìm kiếm"
            >
              <MdClose className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="shrink-0 px-5 pb-3">
          <SegmentedControl
            value={statusFilter}
            onChange={setStatusFilter}
            fullWidth
            aria-label="Lọc cuộc trò chuyện"
            options={[
              { value: "active", label: "Đang hoạt động" },
              { value: "archived", label: "Lưu trữ" },
            ]}
          />
        </div>

        <h2 id="chat-search-title" className="sr-only">
          Tìm kiếm cuộc trò chuyện
        </h2>

        <div className="min-h-0 overflow-y-auto px-3 pb-3">
          {results.length ? (
            <div>
              {results.map(({ session }, index) => {
                const isSelected = index === activeResultIndex;
                const activityLabel = formatSessionActivityLabel(
                  getSessionActivityDate(session),
                );

                return (
                  <ChatbotThreadSearchResultRow
                    key={session.id}
                    session={session}
                    selected={isSelected}
                    activityLabel={activityLabel}
                    onHover={() => setSelectedIndex(index)}
                    onSelect={() => selectResult(session)}
                    onRename={(title) => onRename(session, title)}
                    onArchive={() => onArchive(session)}
                    onUnarchive={() => onUnarchive(session)}
                    onDelete={() => onDelete(session)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              {statusFilter === "archived"
                ? "Không có cuộc trò chuyện lưu trữ."
                : "Không tìm thấy cuộc trò chuyện."}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
