import { SegmentedControl } from "@/components/segmented-control/SegmentedControl";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { formatSessionActivityLabel } from "@/utils/date";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdClose, MdSearch } from "react-icons/md";

import type { ChatThreadSession } from "../types";

type ChatbotThreadSearchDialogProps = {
  activeSessions: ChatThreadSession[];
  archivedSessions: ChatThreadSession[];
  onClose: () => void;
  onSelect: (session: ChatThreadSession) => void;
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
  return `flex h-9 w-full items-center rounded-full px-3 text-xs transition ${
    selected
      ? "bg-gray-100 font-medium text-[#1f1f1f] dark:bg-white/10 dark:text-gray-200"
      : "text-[#1f1f1f] hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
  }`;
}

export function ChatbotThreadSearchDialog({
  activeSessions,
  archivedSessions,
  onClose,
  onSelect,
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
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => selectResult(session)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={getSearchResultRowClass(isSelected)}
                  >
                    <span className="min-w-0 flex-1 truncate text-left font-medium">
                      {session.title?.trim() || "Cuộc trò chuyện mới"}
                    </span>
                    {activityLabel ? (
                      <span className="shrink-0 pl-2 text-[#5f6368] dark:text-gray-400">
                        {activityLabel}
                      </span>
                    ) : null}
                  </button>
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
