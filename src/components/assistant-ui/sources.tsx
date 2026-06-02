import type { SourceMessagePartProps } from "@assistant-ui/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { MdArticle, MdOpenInNew, MdPictureAsPdf } from "react-icons/md";
import Tooltip from "../tooltip/Tooltip";

type SourceMeta = {
  citationId?: number;
  fileName?: string;
  pages?: string[];
  markdownUrl?: string;
};

type PageRange = {
  start: number;
  end: number;
};

type HighlightRange = {
  start: number;
  end: number;
  ranges: PageRange[];
  reason: "line" | "page" | "title" | "none";
};

function getPageLabel(pages?: string[]) {
  if (!pages?.length) return "";
  return pages.length === 1 ? `Trang ${pages[0]}` : `Trang ${pages.join(", ")}`;
}

function parsePageRanges(pages?: string[]) {
  const ranges: PageRange[] = [];
  for (const page of pages ?? []) {
    const match = page.match(/(\d+)(?:\s*[-–]\s*(\d+))?/);
    if (!match) continue;
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    ranges.push({ start: Math.min(start, end), end: Math.max(start, end) });
  }
  return ranges;
}

function hasPageMarker(line: string, page: number) {
  const normalized = line.toLowerCase();
  const patterns = [
    new RegExp(`\\bpage\\s*[:#-]?\\s*${page}\\b`, "i"),
    new RegExp(`\\btrang\\s*[:#-]?\\s*${page}\\b`, "i"),
    new RegExp(`<!--[^>]*\\b${page}\\b[^>]*-->`, "i"),
    new RegExp(`^\\s*#{1,6}\\s*${page}\\b`, "i"),
  ];
  return patterns.some((pattern) => pattern.test(normalized));
}

function findLineByPage(lines: string[], page: number) {
  return lines.findIndex((line) => hasPageMarker(line, page));
}

function findHighlightRange(
  lines: string[],
  pages: string[] | undefined,
  title: string,
): HighlightRange {
  const pageRanges = parsePageRanges(pages);
  if (pageRanges.length) {
    const lineRanges = pageRanges
      .filter((range) => range.start >= 1 && range.start <= lines.length)
      .map((range) => ({
        start: range.start - 1,
        end: Math.min(lines.length - 1, range.end - 1),
      }))
      .filter((range) => range.end >= range.start);

    if (lineRanges.length) {
      const firstRange = lineRanges[0];
      return {
        start: firstRange.start,
        end: firstRange.end,
        ranges: lineRanges,
        reason: "line",
      };
    }

    const firstPageRange = pageRanges[0];
    const startLine = findLineByPage(lines, firstPageRange.start);

    if (startLine >= 0) {
      let endLine = -1;
      for (
        let page = firstPageRange.end + 1;
        page <= firstPageRange.end + 3;
        page += 1
      ) {
        const nextPageLine = findLineByPage(lines, page);
        if (nextPageLine > startLine) {
          endLine = nextPageLine - 1;
          break;
        }
      }

      const end =
        endLine >= startLine
          ? endLine
          : Math.min(lines.length - 1, startLine + 80);
      return {
        start: startLine,
        end,
        ranges: [{ start: startLine, end }],
        reason: "page",
      };
    }
  }

  const titleLine = title.trim()
    ? lines.findIndex((line) =>
        line.toLowerCase().includes(title.trim().toLowerCase()),
      )
    : -1;
  if (titleLine >= 0) {
    const end = Math.min(lines.length - 1, titleLine + 24);
    return {
      start: titleLine,
      end,
      ranges: [{ start: titleLine, end }],
      reason: "title",
    };
  }

  return { start: -1, end: -1, ranges: [], reason: "none" };
}

const SourceNumberContext = createContext({ hideCitationNumber: false });

export function Sources({
  children,
  sourceCount,
}: {
  children: ReactNode;
  sourceCount?: number;
}) {
  const hideCitationNumber = sourceCount === 1;
  return (
    <SourceNumberContext.Provider value={{ hideCitationNumber }}>
      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold tracking-wide text-[#5f6368] uppercase dark:text-gray-400">
          Tài liệu tham khảo
        </p>
        <div className="space-y-2">{children}</div>
      </div>
    </SourceNumberContext.Provider>
  );
}

function SourcePreviewDrawer({
  open,
  onClose,
  title,
  fileName,
  pageLabel,
  pages,
  markdownUrl,
  pdfUrl,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  fileName?: string;
  pageLabel: string;
  pages?: string[];
  markdownUrl?: string;
  pdfUrl: string;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !markdownUrl) return;

    const controller = new AbortController();
    setLoading(true);
    setError("");
    setContent("");

    fetch(markdownUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Không thể mở file markdown (${response.status})`);
        }
        return response.text();
      })
      .then((text) => {
        setContent(text);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Không thể mở tài liệu");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [markdownUrl, open]);

  const lines = useMemo(() => content.split(/\r?\n/), [content]);
  const highlight = useMemo(
    () => findHighlightRange(lines, pages, title),
    [lines, pages, title],
  );

  const scrollToHighlight = useCallback(() => {
    const root = scrollContainerRef.current;
    const target =
      highlightRef.current ??
      (root?.querySelector(
        `[data-line-number="${highlight.start + 1}"]`,
      ) as HTMLDivElement | null);
    const endTarget = root?.querySelector(
      `[data-line-number="${highlight.end + 1}"]`,
    ) as HTMLDivElement | null;
    if (!root || !target || highlight.start < 0) return;

    const rootRect = root.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const endRect = endTarget?.getBoundingClientRect() ?? targetRect;
    const targetTop = targetRect.top - rootRect.top + root.scrollTop;
    const targetBottom = endRect.bottom - rootRect.top + root.scrollTop;
    const targetCenter = (targetTop + targetBottom) / 2;
    const nextScrollTop = Math.max(targetCenter - root.clientHeight / 2, 0);

    root.scrollTo({
      top: nextScrollTop,
      behavior: "smooth",
    });
  }, [highlight]);

  useLayoutEffect(() => {
    if (!open || loading || !content || highlight.start < 0) return;
    scrollToHighlight();
  }, [content, highlight, loading, open, scrollToHighlight]);

  useEffect(() => {
    if (!open || loading || !content || highlight.start < 0) return;
    const frames: number[] = [];
    const timers = [0, 100, 300, 500, 800, 1200].map((delay) =>
      window.setTimeout(scrollToHighlight, delay),
    );

    frames.push(
      requestAnimationFrame(() => {
        scrollToHighlight();
        frames.push(requestAnimationFrame(scrollToHighlight));
      }),
    );

    return () => {
      frames.forEach(cancelAnimationFrame);
      timers.forEach(window.clearTimeout);
    };
  }, [content, highlight, loading, open, scrollToHighlight]);

  const headerExtra = (
    <div className="flex items-center gap-2">
      {markdownUrl ? (
        <Tooltip label={"Mở file markdown"} placement="topRight">
          <a
            href={markdownUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1a73e8] dark:hover:bg-white/10 dark:hover:text-[#a8c7fa]"
            aria-label="Mở file markdown"
          >
            <MdArticle className="h-5 w-5" />
          </a>
        </Tooltip>
      ) : null}
      <Tooltip label={"Mở file PDF"} placement="topRight">
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1a73e8] dark:hover:bg-white/10 dark:hover:text-[#a8c7fa]"
          aria-label="Mở file PDF"
        >
          <MdOpenInNew className="h-5 w-5" />
        </a>
      </Tooltip>
    </div>
  );

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="pointer-events-none fixed inset-0 z-50 flex justify-end">
        <aside className="dark:bg-navy-800 pointer-events-auto my-6 mr-6 flex h-[calc(100%-48px)] w-[min(1120px,calc(100vw-48px))] flex-col rounded-[30px] bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-4 dark:border-white/10">
            <h2 className="text-navy-700 min-w-0 flex-1 truncate text-base font-bold dark:text-white">
              {fileName || title || "Tài liệu tham khảo"}
            </h2>
            <div className="flex shrink-0 items-center gap-3">
              {headerExtra}
              <Tooltip label={"Đóng"} placement="topRight">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                  aria-label="Đóng"
                >
                  <span className="text-xl leading-none" aria-hidden>
                    ×
                  </span>
                </button>
              </Tooltip>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 text-sm leading-relaxed">
            <div className="space-y-4 text-[#1f1f1f] dark:text-white">
              <div className="rounded-2xl border border-[#d3e3fd] bg-[#f8fafd] p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1f3760]/60 dark:text-[#a8c7fa]"
                    aria-hidden
                  >
                    <MdPictureAsPdf className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs text-[#5f6368] dark:text-gray-400">
                      {pageLabel || "Không có thông tin trang"}
                    </p>
                  </div>
                </div>
              </div>

              {!markdownUrl ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                  Tài liệu này chưa có file markdown để xem trực tiếp. Bạn vẫn
                  có thể mở PDF gốc bằng nút ở góc trên.
                </div>
              ) : loading ? (
                <div className="rounded-2xl border border-[#dadce0] bg-white px-4 py-8 text-center text-sm text-[#5f6368] dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300">
                  Đang mở nội dung tài liệu...
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-100">
                  {error}
                </div>
              ) : content ? (
                <div className="overflow-hidden rounded-2xl border border-[#dadce0] bg-white dark:border-white/10 dark:bg-[#080f2f]">
                  <div
                    ref={scrollContainerRef}
                    className="min-h-[280px] overflow-y-auto py-2 font-mono text-xs leading-5"
                    style={{ height: "min(560px, calc(100vh - 280px))" }}
                  >
                    {lines.map((line, index) => {
                      const highlighted = highlight.ranges.some(
                        (range) => index >= range.start && index <= range.end,
                      );
                      const isFirstHighlight = index === highlight.start;

                      return (
                        <div
                          key={`${index}-${line.slice(0, 12)}`}
                          ref={isFirstHighlight ? highlightRef : undefined}
                          data-line-number={index + 1}
                          className={`grid grid-cols-[4rem_1fr] gap-3 px-4 ${
                            highlighted
                              ? "bg-[#fff7cc] text-[#1f1f1f] dark:bg-[#5c4a00]/55 dark:text-[#fff7cc]"
                              : "text-[#3c4043] dark:text-[#d9e2ff]"
                          }`}
                        >
                          <span className="text-right text-[#80868b] select-none dark:text-[#7d89b0]">
                            {index + 1}
                          </span>
                          <pre className="min-w-0 font-mono break-words whitespace-pre-wrap">
                            {line || " "}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </>,
    document.body,
  );
}

export function Source(props: SourceMessagePartProps) {
  const { url, title } = props;
  const meta = props as SourceMessagePartProps & SourceMeta;
  const { hideCitationNumber } = useContext(SourceNumberContext);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileName = meta.fileName?.trim();
  const label = title?.trim() || fileName || url;
  const pageLabel = getPageLabel(meta.pages);
  const citationLabel =
    !hideCitationNumber && typeof meta.citationId === "number"
      ? `#${meta.citationId}`
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="group flex w-full min-w-0 items-start gap-3 rounded-2xl border border-[#dadce0] bg-[#f8fafd] px-3 py-3 text-left text-[#1f1f1f] transition hover:border-[#1a73e8]/45 hover:bg-[#f1f6ff] dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:border-[#a8c7fa]/45 dark:hover:bg-white/[0.07]"
      >
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1f3760]/60 dark:text-[#a8c7fa]"
          aria-hidden
        >
          <MdPictureAsPdf className="h-5 w-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            {citationLabel ? (
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#062e6f] ring-1 ring-[#d3e3fd] dark:bg-white/10 dark:text-[#d3e3fd] dark:ring-white/10">
                {citationLabel}
              </span>
            ) : null}
            <span className="truncate text-sm leading-5 font-semibold">
              {fileName || label}
            </span>
          </span>

          {fileName && label !== fileName ? (
            <span className="mt-0.5 block text-sm leading-5 text-[#444746] dark:text-gray-300">
              {label}
            </span>
          ) : null}

          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#5f6368] dark:text-gray-400">
            {pageLabel ? <span>{pageLabel}</span> : null}
          </span>
        </span>

        <MdArticle
          className="mt-1 h-4 w-4 shrink-0 text-[#5f6368] transition group-hover:text-[#1a73e8] dark:text-gray-400 dark:group-hover:text-[#a8c7fa]"
          aria-hidden
        />
      </button>
      <SourcePreviewDrawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={label}
        fileName={fileName}
        pageLabel={pageLabel}
        pages={meta.pages}
        markdownUrl={meta.markdownUrl}
        pdfUrl={url}
      />
    </>
  );
}
