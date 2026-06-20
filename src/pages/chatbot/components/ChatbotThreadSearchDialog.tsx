import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdChatBubbleOutline, MdClose, MdSearch } from "react-icons/md";

import type { ChatThreadSession } from "../types";

type ChatbotThreadSearchDialogProps = {
  sessions: ChatThreadSession[];
  activeThreadId: string;
  onClose: () => void;
  onSelect: (threadId: string) => void;
};

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

export function ChatbotThreadSearchDialog({
  sessions,
  activeThreadId,
  onClose,
  onSelect,
}: ChatbotThreadSearchDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = useMemo(() => {
    return sessions
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
      .sort((left, right) => right.score - left.score || left.index - right.index)
      .slice(0, 30);
  }, [query, sessions]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => inputRef.current?.focus());
    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;
    const previousHtmlOverflow = documentElement.style.overflow;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    documentElement.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(frameId);
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      documentElement.style.overflow = previousHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const activeResultIndex = results.length
    ? Math.min(selectedIndex, results.length - 1)
    : 0;

  const selectResult = (threadId: string) => {
    onSelect(threadId);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-10000 flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-[1px] sm:pt-[16vh]"
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
            selectResult(results[activeResultIndex].session.id);
          }
        }}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-white/10">
          <MdSearch
            className="h-6 w-6 shrink-0 text-gray-500 dark:text-gray-400"
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
            className="min-w-0 flex-1 bg-transparent text-base text-[#1f1f1f] outline-none placeholder:text-gray-500 dark:text-white dark:placeholder:text-gray-400"
            aria-label="Tìm kiếm cuộc trò chuyện"
          />
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Đóng tìm kiếm"
          >
            <MdClose className="h-5 w-5" />
          </button>
        </div>

        <h2 id="chat-search-title" className="sr-only">
          Tìm kiếm cuộc trò chuyện
        </h2>

        <div className="min-h-0 overflow-y-auto p-3">
          {results.length ? (
            <div className="space-y-1">
              {results.map(({ session }, index) => {
                const isSelected = index === activeResultIndex;
                const isActive = session.id === activeThreadId;
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => selectResult(session.id)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                      isSelected
                        ? "bg-gray-100 dark:bg-white/10"
                        : "hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <MdChatBubbleOutline
                      className="h-5 w-5 shrink-0 text-[#5f6368] dark:text-gray-300"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#1f1f1f] dark:text-white">
                      {session.title?.trim() || "Cuộc trò chuyện mới"}
                    </span>
                    {isActive ? (
                      <span className="shrink-0 text-xs font-medium text-[#1a73e8] dark:text-[#a8c7fa]">
                        Đang mở
                      </span>
                    ) : index === activeResultIndex ? (
                      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                        Enter
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              Không tìm thấy cuộc trò chuyện phù hợp.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
