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
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  LuCheck,
  LuCopy,
  LuExternalLink,
  LuFileText,
  LuX,
} from "react-icons/lu";
import {
  MdArrowDownward,
  MdArrowUpward,
  MdArticle,
  MdPictureAsPdf,
} from "react-icons/md";
import { Streamdown } from "streamdown";

import { copyTextToClipboard } from "@/components/copyable/copyTextToClipboard";
import {
  STREAMDOWN_CONTROLS,
  STREAMDOWN_LINK_SAFETY,
} from "@/components/markdown/streamdown-config";
import { useStreamdownMathPlugins } from "@/components/markdown/useStreamdownMathPlugins";

import Tooltip from "../tooltip/Tooltip";
import { useSourcePreview } from "./source-preview-context";

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

type SourcePreviewMode = "preview" | "code";

const HIGHLIGHT_START_VIEWPORT_ANCHOR = 0.35;

function getPageLabel(pages?: string[]) {
  if (!pages?.length) return "";
  return pages.length === 1 ? `Dòng ${pages[0]}` : `Dòng ${pages.join(", ")}`;
}

function parsePageRanges(pages?: string[]) {
  const ranges: PageRange[] = [];
  for (const page of pages ?? []) {
    const matches = page.matchAll(/(\d+)(?:\s*[-–]\s*(\d+))?/g);
    for (const match of matches) {
      const start = Number(match[1]);
      const end = Number(match[2] ?? match[1]);
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      ranges.push({ start: Math.min(start, end), end: Math.max(start, end) });
    }
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

function buildMarkdownSegments(lines: string[], ranges: PageRange[]) {
  const segments: Array<{
    start: number;
    end: number;
    highlighted: boolean;
    content: string;
  }> = [];

  lines.forEach((line, index) => {
    const highlighted = ranges.some(
      (range) => index >= range.start && index <= range.end,
    );
    const previous = segments.at(-1);

    if (previous && previous.highlighted === highlighted) {
      previous.end = index;
      previous.content += `\n${line}`;
      return;
    }

    segments.push({
      start: index,
      end: index,
      highlighted,
      content: line,
    });
  });

  return segments;
}

function clampPanelWidth(width: number, containerWidth: number) {
  const minWidth = Math.min(420, containerWidth);
  const maxWidth = Math.max(minWidth, containerWidth - 360);
  return Math.min(Math.max(width, minWidth), maxWidth);
}

export function SourcePreviewPanel() {
  const { preview, closePreview } = useSourcePreview();
  // @ts-ignore
  const [mode, setMode] = useState<SourcePreviewMode>("preview");
  const [panelWidth, setPanelWidth] = useState(() =>
    Math.min(720, Math.max(480, window.innerWidth * 0.3)),
  );
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(Boolean(preview?.markdownUrl));
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const [jumpState, setJumpState] = useState<{
    up: PageRange | null;
    down: PageRange | null;
  }>({ up: null, down: null });
  const plugins = useStreamdownMathPlugins();
  const markdownUrl = preview?.markdownUrl;
  const title = preview?.title;
  const pages = preview?.pages;

  useEffect(() => {
    if (!markdownUrl) return;

    const controller = new AbortController();

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
  }, [markdownUrl]);

  const lines = useMemo(() => content.split(/\r?\n/), [content]);
  const highlight = useMemo(
    () => findHighlightRange(lines, pages, title ?? ""),
    [lines, pages, title],
  );
  const markdownSegments = useMemo(
    () => buildMarkdownSegments(lines, highlight.ranges),
    [highlight.ranges, lines],
  );

  const scrollToRange = useCallback((range: PageRange) => {
    const root = scrollContainerRef.current;
    const target = root?.querySelector(
      `[data-line-number="${range.start + 1}"]`,
    ) as HTMLDivElement | null;
    if (!root || !target || range.start < 0) return;

    const rootRect = root.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetTop = targetRect.top - rootRect.top + root.scrollTop;
    const nextScrollTop = Math.max(
      targetTop - root.clientHeight * HIGHLIGHT_START_VIEWPORT_ANCHOR,
      0,
    );

    root.scrollTo({
      top: nextScrollTop,
      behavior: "smooth",
    });
  }, []);

  const scrollToHighlight = useCallback(() => {
    if (highlight.start >= 0) {
      scrollToRange({ start: highlight.start, end: highlight.end });
    }
  }, [highlight, scrollToRange]);

  const handleScroll = useCallback(() => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const root = scrollContainerRef.current;
      if (!root || highlight.ranges.length === 0) {
        setJumpState({ up: null, down: null });
        return;
      }

      const rootRect = root.getBoundingClientRect();
      let upTarget: PageRange | null = null;
      let downTarget: PageRange | null = null;

      for (const range of highlight.ranges) {
        const startEl = root.querySelector(
          `[data-line-number="${range.start + 1}"]`,
        );
        const endEl = root.querySelector(`[data-line-end="${range.end + 1}"]`);
        if (!startEl) continue;

        const startRect = startEl.getBoundingClientRect();
        const endRect = (endEl || startEl).getBoundingClientRect();

        if (endRect.bottom < rootRect.top + 10) {
          upTarget = range;
        } else if (startRect.top > rootRect.bottom - 10) {
          if (downTarget === null) {
            downTarget = range;
          }
        }
      }

      setJumpState((prev) =>
        prev.up?.start === upTarget?.start &&
        prev.down?.start === downTarget?.start
          ? prev
          : { up: upTarget, down: downTarget },
      );
    });
  }, [highlight.ranges]);

  useLayoutEffect(() => {
    if (loading || !content || highlight.start < 0) return;
    scrollToHighlight();
    handleScroll();
  }, [content, handleScroll, highlight, loading, mode, scrollToHighlight]);

  useEffect(() => {
    if (loading || !content || highlight.start < 0) return;
    const frames: number[] = [];
    const timers = [0, 100, 300, 500, 800, 1200].map((delay) =>
      window.setTimeout(() => {
        scrollToHighlight();
        handleScroll();
      }, delay),
    );

    frames.push(
      requestAnimationFrame(() => {
        scrollToHighlight();
        handleScroll();
        frames.push(requestAnimationFrame(scrollToHighlight));
      }),
    );

    return () => {
      frames.forEach(cancelAnimationFrame);
      timers.forEach(window.clearTimeout);
    };
  }, [content, handleScroll, highlight, loading, mode, scrollToHighlight]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePreview();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePreview]);

  const handleResizeStart = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      const container = panelRef.current?.parentElement;
      if (!container) return;

      event.preventDefault();
      const containerRect = container.getBoundingClientRect();
      const previousCursor = document.body.style.cursor;
      const previousUserSelect = document.body.style.userSelect;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const handlePointerMove = (moveEvent: PointerEvent) => {
        setPanelWidth(
          clampPanelWidth(
            containerRect.right - moveEvent.clientX,
            containerRect.width,
          ),
        );
      };
      const handlePointerUp = () => {
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousUserSelect;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    const success = await copyTextToClipboard(content);
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [content]);

  if (!preview) return null;

  const headerTitle = preview.fileName || preview.title || "Tài liệu tham khảo";
  const panelStyle = {
    "--source-preview-width": `${panelWidth}px`,
  } as CSSProperties;

  return (
    <aside
      ref={panelRef}
      style={panelStyle}
      className="dark:bg-navy-800 relative z-50 flex h-dvh min-h-0 w-screen shrink-0 flex-col overflow-hidden bg-white shadow-2xl lg:z-20 lg:mx-[30px] lg:my-5 lg:h-[calc(100dvh-2.5rem)] lg:w-(--source-preview-width) lg:rounded-[24px] lg:border lg:border-gray-200 lg:shadow-xl dark:lg:border-white/10"
    >
      <button
        type="button"
        onPointerDown={handleResizeStart}
        className="group absolute inset-y-0 -left-2 z-30 hidden w-4 cursor-col-resize items-center justify-center lg:flex"
        aria-label="Điều chỉnh độ rộng bản xem trước"
      >
        <span className="h-16 w-1 cursor-col-resize rounded-full bg-gray-300 transition group-hover:bg-[#1a73e8] dark:bg-white/20 dark:group-hover:bg-[#a8c7fa]" />
      </button>

      <header className="flex shrink-0 items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-white/10">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1f3760]/60 dark:text-[#a8c7fa]">
          <LuFileText className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            className="truncate text-sm font-semibold text-[#1f1f1f] dark:text-white"
            title={headerTitle}
          >
            {headerTitle}
          </h2>
          <p className="mt-0.5 truncate text-xs text-[#5f6368] dark:text-gray-400">
            {preview.pageLabel || "Không có thông tin dòng"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {/* <div className="flex items-center rounded-xl bg-gray-100 p-1 dark:bg-white/8">
            <Tooltip label="Preview" placement="topRight">
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition ${
                  mode === "preview"
                    ? "bg-white text-[#1a73e8] shadow-sm dark:bg-white/12 dark:text-[#a8c7fa]"
                    : "text-[#5f6368] hover:text-[#1f1f1f] dark:text-gray-400 dark:hover:text-white"
                }`}
                aria-pressed={mode === "preview"}
              >
                <LuEye className="h-4 w-4" aria-hidden />
              </button>
            </Tooltip>
            <Tooltip label="Code" placement="topRight">
              <button
                type="button"
                onClick={() => setMode("code")}
                className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition ${
                  mode === "code"
                    ? "bg-white text-[#1a73e8] shadow-sm dark:bg-white/12 dark:text-[#a8c7fa]"
                    : "text-[#5f6368] hover:text-[#1f1f1f] dark:text-gray-400 dark:hover:text-white"
                }`}
                aria-pressed={mode === "code"}
              >
                <LuCodeXml className="h-4 w-4" aria-hidden />
              </button>
            </Tooltip>
          </div> */}

          <Tooltip label={copied ? "Đã sao chép" : "Sao chép"}>
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={!content}
              className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-[#5f6368] transition hover:bg-gray-100 hover:text-[#1f1f1f] disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label={copied ? "Đã sao chép" : "Sao chép nội dung"}
            >
              {copied ? (
                <LuCheck className="h-4 w-4 text-green-500" aria-hidden />
              ) : (
                <LuCopy className="h-4 w-4" aria-hidden />
              )}
            </button>
          </Tooltip>

          {preview.pdfUrl ? (
            <Tooltip label="Mở file gốc" placement="topRight">
              <a
                href={preview.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#5f6368] transition hover:bg-gray-100 hover:text-[#1a73e8] dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-[#a8c7fa]"
                aria-label="Mở file gốc"
              >
                <LuExternalLink className="h-4 w-4" />
              </a>
            </Tooltip>
          ) : null}

          <Tooltip label="Đóng" placement="topRight">
            <button
              type="button"
              onClick={closePreview}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#5f6368] transition hover:bg-gray-100 hover:text-[#1f1f1f] dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Đóng bản xem trước"
            >
              <LuX className="h-5 w-5" aria-hidden />
            </button>
          </Tooltip>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 bg-[#fbfcfe] dark:bg-[#080f2f]">
        {!markdownUrl ? (
          <div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            Tài liệu này chưa có file markdown để xem trực tiếp.
          </div>
        ) : loading ? (
          <div className="flex h-full items-center justify-center text-sm text-[#5f6368] dark:text-gray-300">
            Đang mở nội dung tài liệu...
          </div>
        ) : error ? (
          <div className="m-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-100">
            {error}
          </div>
        ) : content ? (
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="h-full overflow-auto"
          >
            {mode === "preview" ? (
              <div className="mx-auto max-w-4xl px-6 py-7">
                {markdownSegments.map((segment) => (
                  <div
                    key={`${segment.start}-${segment.end}`}
                    data-line-number={segment.start + 1}
                    data-line-end={segment.end + 1}
                    className={`rounded-md px-2 ${
                      segment.highlighted
                        ? "bg-[#fff3a3] text-[#1f1f1f] dark:bg-[#5c4a00]/65 dark:text-[#fff7cc]"
                        : ""
                    }`}
                  >
                    <Streamdown
                      mode="static"
                      controls={STREAMDOWN_CONTROLS}
                      linkSafety={STREAMDOWN_LINK_SAFETY}
                      plugins={plugins}
                      className="text-[15px] leading-7 text-[#24292f] dark:text-[#e6edf3]"
                    >
                      {segment.content || " "}
                    </Streamdown>
                  </div>
                ))}
              </div>
            ) : (
              <div className="min-w-max py-3 font-mono text-xs leading-6">
                {lines.map((line, index) => {
                  const highlighted = highlight.ranges.some(
                    (range) => index >= range.start && index <= range.end,
                  );

                  return (
                    <div
                      key={`${index}-${line.slice(0, 12)}`}
                      data-line-number={index + 1}
                      data-line-end={index + 1}
                      className={`grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 px-4 ${
                        highlighted
                          ? "bg-[#fff3a3] text-[#1f1f1f] dark:bg-[#5c4a00]/65 dark:text-[#fff7cc]"
                          : "text-[#3c4043] dark:text-[#d9e2ff]"
                      }`}
                    >
                      <span className="text-right text-[#80868b] select-none dark:text-[#7d89b0]">
                        {index + 1}
                      </span>
                      <pre className="min-w-0 font-mono whitespace-pre">
                        {line || " "}
                      </pre>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {jumpState.up ? (
          <button
            type="button"
            onClick={() => scrollToRange(jumpState.up!)}
            className="absolute top-4 left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-gray-900/80 text-white shadow-md backdrop-blur transition hover:bg-gray-900 dark:bg-[#1f3760] dark:text-[#a8c7fa] dark:hover:bg-[#1a73e8] dark:hover:text-white"
            aria-label="Đoạn đánh dấu trước đó"
          >
            <MdArrowUpward className="h-5 w-5" />
          </button>
        ) : null}
        {jumpState.down ? (
          <button
            type="button"
            onClick={() => scrollToRange(jumpState.down!)}
            className="absolute bottom-4 left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-gray-900/80 text-white shadow-md backdrop-blur transition hover:bg-gray-900 dark:bg-[#1f3760] dark:text-[#a8c7fa] dark:hover:bg-[#1a73e8] dark:hover:text-white"
            aria-label="Đoạn đánh dấu tiếp theo"
          >
            <MdArrowDownward className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </aside>
  );
}

export function SourcePreviewCanvas() {
  const { preview } = useSourcePreview();
  return preview ? <SourcePreviewPanel key={preview.key} /> : null;
}

export function Source(props: SourceMessagePartProps) {
  const { url, title } = props;
  const meta = props as SourceMessagePartProps & SourceMeta;
  const { hideCitationNumber } = useContext(SourceNumberContext);
  const { openPreview } = useSourcePreview();
  const fileName = meta.fileName?.trim();
  const label = title?.trim() || fileName || url;
  const pageLabel = getPageLabel(meta.pages);
  const citationLabel =
    !hideCitationNumber && typeof meta.citationId === "number"
      ? `#${meta.citationId}`
      : null;

  return (
    <button
      type="button"
      onClick={() =>
        openPreview({
          key: [
            meta.markdownUrl || url || fileName || label,
            meta.pages?.join(",") || "",
          ].join(":"),
          title: label,
          fileName,
          pageLabel,
          pages: meta.pages,
          markdownUrl: meta.markdownUrl,
          pdfUrl: url,
        })
      }
      className="source-card-shimmer group flex w-full min-w-0 items-start gap-3 rounded-2xl border border-[#dadce0] bg-[#f8fafd] px-3 py-3 text-left text-[#1f1f1f] transition hover:border-[#1a73e8]/45 hover:bg-[#f1f6ff] dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:border-[#a8c7fa]/45 dark:hover:bg-white/[0.07]"
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

        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#5f6368] dark:text-gray-400">
          {pageLabel ? <span>{pageLabel}</span> : "Không có thông tin dòng"}
        </span>
      </span>

      <MdArticle
        className="mt-1 h-4 w-4 shrink-0 text-[#5f6368] transition group-hover:text-[#1a73e8] dark:text-gray-400 dark:group-hover:text-[#a8c7fa]"
        aria-hidden
      />
    </button>
  );
}
