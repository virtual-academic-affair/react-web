import type { SourceMessagePartProps } from "@assistant-ui/react";
import {
  Children,
  createContext,
  isValidElement,
  lazy,
  Suspense,
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
import { Streamdown } from "streamdown";
import { MdArrowDownward, MdArrowUpward, MdCheck, MdClose, MdContentCopy, MdDescription } from "react-icons/md";

import { copyTextToClipboard } from "@/components/copyable/copyTextToClipboard";
import { ScrollFadeArea } from "@/components/scroll-fade/ScrollFadeArea";
import Tooltip from "@/components/tooltip/Tooltip";
import {
  buildDocumentViewUrl,
  VIEW_DOCUMENT_FORMAT_MARKDOWN,
} from "@/utils/documentViewUrl";
import {
  STREAMDOWN_CONTROLS,
  STREAMDOWN_LINK_SAFETY,
} from "@/components/markdown/streamdown-config";
import {
  SOURCE_PREVIEW_STREAMDOWN_CLASS,
  SOURCE_PREVIEW_STREAMDOWN_COMPONENTS,
} from "@/components/markdown/streamdown-prose";
import { useStreamdownMathPlugins } from "@/components/markdown/useStreamdownMathPlugins";

import {
  buildInAppPreviewKey,
  InAppMarkdownAnchor,
  SourcePreviewScrollContext,
} from "./in-app-markdown-anchor";
import { useSourcePreview } from "./source-preview-context";

const FilePreviewModal = lazy(
  () => import("@/pages/documents/components/FilePreviewModal"),
);

type SourceMeta = {
  citationId?: number;
  fileId?: string;
  fileName?: string;
  titles?: string[];
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

const HIGHLIGHT_START_VIEWPORT_ANCHOR = 0.35;

function parseInitialPage(pages?: string[]) {
  if (!pages?.length) return undefined;
  const match = pages[0].match(/(\d+)/);
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : undefined;
}

function fileIdFromUrl(url: string) {
  const match = url.match(/\/api\/files\/([^/?#]+)/);
  return match?.[1] ?? null;
}

function resolveSourceFileId(meta: SourceMeta, url: string) {
  return meta.fileId?.trim() || fileIdFromUrl(url) || null;
}

function getDisplayTitles(
  titles: string[] | undefined,
  fileName: string | undefined,
  url: string,
) {
  const trimmedUrl = url.trim();
  const trimmedFileName = fileName?.trim() || "";
  const merged = (titles ?? []).map((item) => item.trim()).filter(Boolean);

  return [...new Set(merged)].filter(
    (item) => item !== trimmedUrl && item !== trimmedFileName,
  );
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

const SourceIndexContext = createContext(0);

const sourcePreviewIconButtonNeutralClass =
  "flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 transition-all hover:bg-gray-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15";

const sourcePreviewIconButtonPrimaryClass =
  "flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-white transition-all hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

const sourcePreviewJumpButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-[#5f6368] shadow-md transition-all hover:bg-gray-100 hover:text-[#202124] active:scale-95 dark:border-white/10 dark:bg-navy-800 dark:text-[#9aa0a6] dark:hover:bg-white/10 dark:hover:text-white";

const PANEL_TRANSITION_MS = 300;

const SOURCE_LINK_CLASS =
  "cursor-pointer text-sm font-normal text-[#1a73e8] underline-offset-2 hover:underline dark:text-[#a8c7fa]";

const SOURCE_FILE_LINK_CLASS =
  "cursor-pointer text-sm font-normal text-[#5f6368] underline-offset-2 hover:underline dark:text-gray-300";

export function Sources({
  children,
}: {
  children: ReactNode;
  sourceCount?: number;
}) {
  let index = 0;
  const numberedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    index += 1;
    return (
      <SourceIndexContext.Provider key={index} value={index}>
        {child}
      </SourceIndexContext.Provider>
    );
  });

  return (
    <div className="pt-1">
      <p className="py-1 text-xs font-medium text-[#5f6368] dark:text-gray-400">
        Tài liệu tham khảo
      </p>
      <ul className="my-1 list-none space-y-1.5">{numberedChildren}</ul>
    </div>
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

const SOURCE_PREVIEW_MIN_WIDTH = 320;
const SOURCE_PREVIEW_MIN_MAIN_WIDTH = 400;

function clampPanelWidth(width: number, rowWidth: number) {
  const minWidth = Math.min(SOURCE_PREVIEW_MIN_WIDTH, rowWidth);
  const maxWidth = Math.max(
    minWidth,
    rowWidth - SOURCE_PREVIEW_MIN_MAIN_WIDTH,
  );
  return Math.min(Math.max(width, minWidth), maxWidth);
}

function getSourcePreviewRow(panel: HTMLElement | null) {
  return panel?.closest<HTMLElement>("[data-source-preview-row]") ?? null;
}

export function SourcePreviewPanel() {
  const { preview, closePreview, openFilePreview } = useSourcePreview();
  const [panelWidth, setPanelWidth] = useState(() =>
    Math.min(720, Math.max(480, window.innerWidth * 0.3)),
  );
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(Boolean(preview?.markdownUrl));
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);
  const closingRef = useRef(false);
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

  const previewStreamdownComponents = useMemo(
    () => ({
      ...SOURCE_PREVIEW_STREAMDOWN_COMPONENTS,
      a: InAppMarkdownAnchor,
    }),
    [],
  );

  useLayoutEffect(() => {
    closingRef.current = false;
    setVisible(false);
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [preview?.key]);

  const handleCloseAnimated = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setVisible(false);
    window.setTimeout(() => {
      closePreview();
      closingRef.current = false;
    }, PANEL_TRANSITION_MS);
  }, [closePreview]);

  useEffect(() => {
    setLoading(Boolean(markdownUrl));
    setContent("");
    setError("");
  }, [markdownUrl, preview?.key]);

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
  }, [content, handleScroll, highlight, loading, scrollToHighlight]);

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
  }, [content, handleScroll, highlight, loading, scrollToHighlight]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleCloseAnimated();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCloseAnimated]);

  const handleResizeStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const row = getSourcePreviewRow(panelRef.current);
      if (!row) return;

      event.preventDefault();
      const handleEl = event.currentTarget;
      handleEl.setPointerCapture(event.pointerId);
      const rowRect = row.getBoundingClientRect();
      const previousUserSelect = document.body.style.userSelect;
      const previousCursor = document.body.style.cursor;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "ew-resize";

      const handlePointerMove = (moveEvent: PointerEvent) => {
        setPanelWidth(
          clampPanelWidth(rowRect.right - moveEvent.clientX, rowRect.width),
        );
      };
      const handlePointerUp = (upEvent: PointerEvent) => {
        if (handleEl.hasPointerCapture(upEvent.pointerId)) {
          handleEl.releasePointerCapture(upEvent.pointerId);
        }
        document.body.style.userSelect = previousUserSelect;
        document.body.style.cursor = previousCursor;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    const fileId =
      preview?.fileId?.trim() ||
      (preview?.pdfUrl ? fileIdFromUrl(preview.pdfUrl) : null);
    if (!fileId) return;

    const success = await copyTextToClipboard(
      buildDocumentViewUrl(fileId, {
        format: preview?.markdownUrl
          ? VIEW_DOCUMENT_FORMAT_MARKDOWN
          : undefined,
      }),
    );
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [preview]);

  if (!preview) return null;

  const headerFileName =
    preview.fileName?.trim() || preview.title?.trim() || "Tài liệu";
  const resolvedFileId =
    preview.fileId?.trim() ||
    (preview.pdfUrl ? fileIdFromUrl(preview.pdfUrl) : null);
  const panelStyle = {
    "--source-preview-width": `${panelWidth}px`,
  } as CSSProperties;

  return (
    <SourcePreviewScrollContext.Provider value={scrollContainerRef}>
      <aside
        ref={panelRef}
        style={panelStyle}
        className={`dark:bg-navy-800 relative z-50 flex h-dvh min-h-0 w-screen shrink-0 flex-col bg-white transition-[transform,opacity] duration-300 ease-out lg:z-20 lg:h-full lg:w-(--source-preview-width) ${
          visible
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 lg:translate-x-0 lg:opacity-0"
        }`}
      >
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Điều chỉnh độ rộng bản xem trước"
          onPointerDown={handleResizeStart}
          className="absolute inset-y-0 left-0 z-40 hidden w-4 -translate-x-1/2 cursor-ew-resize touch-none select-none lg:flex lg:justify-center"
        >
          <div
            aria-hidden
            className="h-full w-px bg-gray-200 dark:bg-white/10"
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 md:gap-3 md:px-5 md:py-3 dark:border-white/10">
          <h2
            className="text-navy-700 min-w-0 flex-1 truncate text-base font-bold dark:text-white"
            title={headerFileName}
          >
            {headerFileName}
          </h2>

          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <Tooltip label={copied ? "Đã sao chép link" : "Sao chép link"}>
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={!resolvedFileId}
                className={sourcePreviewIconButtonNeutralClass}
                aria-label={copied ? "Đã sao chép link" : "Sao chép link"}
              >
                {copied ? (
                  <MdCheck className="h-4 w-4 text-green-500" />
                ) : (
                  <MdContentCopy className="h-4 w-4" />
                )}
              </button>
            </Tooltip>

            {resolvedFileId ? (
              <Tooltip label="File gốc">
                <button
                  type="button"
                  onClick={() =>
                    openFilePreview({
                      fileId: resolvedFileId,
                      fileName: preview.fileName || headerFileName,
                      initialPage: parseInitialPage(preview.pages),
                    })
                  }
                  className={sourcePreviewIconButtonPrimaryClass}
                  aria-label="File gốc"
                >
                  <MdDescription className="h-4 w-4" />
                </button>
              </Tooltip>
            ) : null}

            <button
              type="button"
              onClick={handleCloseAnimated}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
              aria-label="Đóng"
            >
              <MdClose className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 bg-white dark:bg-navy-800">
        {!markdownUrl ? (
          <div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            {resolvedFileId ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>Tài liệu này chưa có bản markdown để xem trực tiếp.</p>
                <button
                  type="button"
                  onClick={() =>
                    openFilePreview({
                      fileId: resolvedFileId,
                      fileName: preview.fileName || headerFileName,
                      initialPage: parseInitialPage(preview.pages),
                    })
                  }
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-3 py-2 text-sm font-medium text-[#1a73e8] shadow-sm transition hover:bg-[#f8faff] dark:bg-white/10 dark:text-[#a8c7fa] dark:hover:bg-white/15"
                >
                  Xem file gốc
                </button>
              </div>
            ) : (
              "Tài liệu này chưa có file markdown để xem trực tiếp."
            )}
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
          <ScrollFadeArea
            ref={scrollContainerRef}
            wrapperClassName="h-full min-h-0"
            className="h-full min-h-0 overflow-auto px-4 py-5 [scrollbar-width:thin] md:px-5 md:py-6"
            topFadeRem={1.25}
            bottomFadeRem={1.75}
            thresholdPx={4}
            watchDeps={[content, markdownSegments]}
            onScroll={handleScroll}
          >
            <article className="mx-auto w-full max-w-3xl">
              {markdownSegments.map((segment) => (
                <div
                  key={`${segment.start}-${segment.end}`}
                  data-line-number={segment.start + 1}
                  data-line-end={segment.end + 1}
                  className={
                    segment.highlighted
                      ? "bg-[#fff3a3] text-[#1f1f1f] dark:bg-[#5c4a00]/55 dark:text-[#fff7cc]"
                      : undefined
                  }
                >
                  <Streamdown
                    mode="static"
                    controls={STREAMDOWN_CONTROLS}
                    linkSafety={STREAMDOWN_LINK_SAFETY}
                    plugins={plugins}
                    components={previewStreamdownComponents}
                    className={SOURCE_PREVIEW_STREAMDOWN_CLASS}
                  >
                    {segment.content || " "}
                  </Streamdown>
                </div>
              ))}
            </article>
          </ScrollFadeArea>
        ) : null}

        {jumpState.up ? (
          <Tooltip label="Đoạn trước">
            <button
              type="button"
              onClick={() => scrollToRange(jumpState.up!)}
              className={`absolute top-4 left-1/2 z-10 -translate-x-1/2 ${sourcePreviewJumpButtonClass}`}
              aria-label="Đoạn trước"
            >
              <MdArrowUpward className="h-4 w-4" aria-hidden />
            </button>
          </Tooltip>
        ) : null}
        {jumpState.down ? (
          <Tooltip label="Đoạn sau">
            <button
              type="button"
              onClick={() => scrollToRange(jumpState.down!)}
              className={`absolute bottom-4 left-1/2 z-10 -translate-x-1/2 ${sourcePreviewJumpButtonClass}`}
              aria-label="Đoạn sau"
            >
              <MdArrowDownward className="h-4 w-4" aria-hidden />
            </button>
          </Tooltip>
        ) : null}
      </div>
        </div>
    </aside>
    </SourcePreviewScrollContext.Provider>
  );
}

export function SourcePreviewCanvas() {
  const { preview, filePreview, closeFilePreview } = useSourcePreview();

  return (
    <>
      {preview ? <SourcePreviewPanel key={preview.key} /> : null}
      {filePreview ? (
        <Suspense fallback={null}>
          <FilePreviewModal
            fileId={filePreview.fileId}
            fileUrl={filePreview.fileUrl}
            fileName={filePreview.fileName}
            isOpen
            initialPage={filePreview.initialPage ?? 1}
            onClose={closeFilePreview}
          />
        </Suspense>
      ) : null}
    </>
  );
}

export function Source(props: SourceMessagePartProps) {
  const { url: sourceUrl } = props;
  if (!sourceUrl) return null;

  const meta = props as SourceMessagePartProps & SourceMeta;
  const sourceIndex = useContext(SourceIndexContext);
  const { openPreview, openFilePreview } = useSourcePreview();
  const resolvedFileId = resolveSourceFileId(meta, sourceUrl);
  const trimmedFileName = meta.fileName?.trim() || "";
  const displayTitles = getDisplayTitles(meta.titles, trimmedFileName, sourceUrl);
  const citationNumber =
    typeof meta.citationId === "number" ? meta.citationId : sourceIndex;
  const citationLabel = citationNumber > 0 ? `[${citationNumber}]` : null;

  const openMarkdownPreview = (selectedTitle: string) => {
    openPreview({
      key: buildInAppPreviewKey(meta, sourceUrl, selectedTitle),
      title: selectedTitle,
      fileName: trimmedFileName || undefined,
      fileId: resolvedFileId ?? undefined,
      pages: meta.pages,
      markdownUrl: meta.markdownUrl,
      pdfUrl: sourceUrl,
    });
  };

  const handleOpenTitle = (selectedTitle: string) => {
    if (meta.markdownUrl) {
      openMarkdownPreview(selectedTitle);
      return;
    }

    if (resolvedFileId) {
      openFilePreview({
        fileId: resolvedFileId,
        fileName: trimmedFileName || selectedTitle,
        initialPage: parseInitialPage(meta.pages),
      });
    }
  };

  const handleOpenOriginalFile = () => {
    if (!resolvedFileId) return;
    openFilePreview({
      fileId: resolvedFileId,
      fileName: trimmedFileName || "Tài liệu gốc",
      initialPage: parseInitialPage(meta.pages),
    });
  };

  return (
    <li className="text-sm leading-relaxed text-[#1f1f1f] dark:text-[#e3e3e3]">
      {citationLabel ? (
        <span className="mr-1 text-sm font-normal text-gray-500 dark:text-gray-400">
          {citationLabel}
        </span>
      ) : null}

      {displayTitles.length > 0 ? (
        <span className="inline">
          {displayTitles.map((item, index) => (
            <span key={`${item}-${index}`}>
              {index > 0 ? <span className="text-gray-400">, </span> : null}
              <button
                type="button"
                onClick={() => handleOpenTitle(item)}
                className={SOURCE_LINK_CLASS}
              >
                {item}
              </button>
            </span>
          ))}
        </span>
      ) : null}

      {resolvedFileId ? (
        <>
          {displayTitles.length > 0 ? (
            <span className="text-gray-400"> · </span>
          ) : null}
          <button
            type="button"
            onClick={handleOpenOriginalFile}
            className={SOURCE_FILE_LINK_CLASS}
          >
            {trimmedFileName || "Xem file gốc"}
          </button>
        </>
      ) : null}
    </li>
  );
}
