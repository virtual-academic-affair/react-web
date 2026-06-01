import { useQuery } from "@tanstack/react-query";
import { message as toast } from "antd";
import * as docx from "docx-preview";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdDescription,
  MdErrorOutline,
  MdFileDownload,
} from "react-icons/md";
import { Document, Page, pdfjs } from "react-pdf";

import {
  type DownloadFileFormat,
  DocumentsService,
} from "@/services/documents";

import "./FilePreviewModal.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ── Helpers ──────────────────────────────────────────────────────────────────

const TEXT_EXTENSIONS = [
  "txt",
  "csv",
  "json",
  "md",
  "xml",
  "yml",
  "yaml",
  "log",
  "ini",
  "cfg",
  "env",
  "html",
  "htm",
  "css",
  "js",
  "ts",
  "tsx",
  "jsx",
  "py",
  "java",
  "c",
  "cpp",
  "h",
  "sh",
  "bat",
  "sql",
];

const IMAGE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "bmp",
  "webp",
  "svg",
  "ico",
  "tiff",
  "tif",
];

function getExtension(filename: string): string {
  return (filename.split(".").pop() || "").toLowerCase();
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInlineMarkdown(input: string): string {
  let out = escapeHtml(input);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  return out;
}

function markdownToHtml(markdown: string): string {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const html: string[] = [];
  let inList = false;

  const closeListIfNeeded = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  lines.forEach((line) => {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    const listMatch = line.match(/^[-*]\s+(.+)$/);

    if (!line.trim()) {
      closeListIfNeeded();
      return;
    }

    if (headingMatch) {
      closeListIfNeeded();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
      return;
    }

    if (listMatch) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${renderInlineMarkdown(listMatch[1])}</li>`);
      return;
    }

    closeListIfNeeded();
    html.push(`<p>${renderInlineMarkdown(line)}</p>`);
  });

  closeListIfNeeded();
  return html.join("\n");
}

type FileCategory = "pdf" | "text" | "image" | "docx" | "unsupported";

function categorizeFile(filename: string): FileCategory {
  const ext = getExtension(filename);
  if (ext === "pdf") return "pdf";
  if (TEXT_EXTENSIONS.includes(ext)) return "text";
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (ext === "docx" || ext === "doc") return "docx";
  return "unsupported";
}

// ── Props ────────────────────────────────────────────────────────────────────

interface FilePreviewModalProps {
  fileId: string | null;
  fileName: string;
  downloadFormat?: DownloadFileFormat;
  isOpen: boolean;
  initialPage?: number;
  onClose: () => void;
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface PdfPreviewProps {
  url: string;
  initialPage?: number;
  scale: number;
  currentPage: number;
  numPages: number;
  setNumPages: (n: number) => void;
  setCurrentPage: (p: number) => void;
  pdfScrollRef: React.MutableRefObject<((page: number) => void) | undefined>;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({
  url,
  initialPage = 1,
  scale,
  currentPage,
  numPages,
  setNumPages,
  setCurrentPage,
  pdfScrollRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleScroll = () => {
    if (!containerRef.current || numPages === 0) return;
    const { scrollTop, clientHeight } = containerRef.current;

    // Tìm trang nào đang chiếm phần lớn diện tích nhìn thấy (viewport)
    // Tọa độ giữa màn hình
    const middleY = scrollTop + clientHeight / 2;

    let closestPage = 1;
    let minDistance = Infinity;

    for (let i = 0; i < numPages; i++) {
      const el = pageRefs.current[i];
      if (!el) continue;
      const pageTop = el.offsetTop;
      const pageMiddle = pageTop + el.offsetHeight / 2;

      const distance = Math.abs(middleY - pageMiddle);
      if (distance < minDistance) {
        minDistance = distance;
        closestPage = i + 1;
      }
    }

    if (closestPage !== currentPage) {
      setCurrentPage(closestPage);
    }
  };

  useEffect(() => {
    pdfScrollRef.current = (page: number) => {
      const target = pageRefs.current[page - 1];
      if (containerRef.current && target) {
        containerRef.current.scrollTo({
          top: target.offsetTop - 32, // trừ hao padding
          behavior: "smooth",
        });
      }
    };
    return () => {
      pdfScrollRef.current = undefined;
    };
  }, [numPages]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* PDF content */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative flex flex-1 justify-center overflow-auto bg-gray-800/50 p-8"
      >
        <Document
          file={url}
          onLoadSuccess={({ numPages: n }) => {
            const safeInitialPage = Math.min(Math.max(initialPage, 1), n || 1);
            setNumPages(n);
            setCurrentPage(safeInitialPage);
            pageRefs.current = new Array(n).fill(null);

            // Wait refs mounted, then jump to requested page (for deep-link from inquiry TOC)
            setTimeout(() => {
              const container = containerRef.current;
              const target = pageRefs.current[safeInitialPage - 1];
              if (!container || !target) return;
              container.scrollTo({
                top: Math.max(target.offsetTop - 32, 0),
                behavior: "auto",
              });
            }, 0);
          }}
          loading={
            <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-2 py-20 text-white/70">
              <div className="fpv-spinner" />
              <span>Đang tải PDF...</span>
            </div>
          }
          error={
            <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3 py-20 text-gray-400">
              <MdErrorOutline className="h-12 w-12" />
              <p className="text-sm">Không thể hiển thị PDF.</p>
            </div>
          }
        >
          <div className="flex flex-col items-center gap-6">
            {Array.from(new Array(numPages), (_, index) => (
              <div
                key={`page_${index + 1}`}
                ref={(el) => {
                  if (pageRefs.current) {
                    pageRefs.current[index] = el;
                  }
                }}
              >
                <Page
                  pageNumber={index + 1}
                  scale={scale}
                  className="bg-white shadow-lg"
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            ))}
          </div>
        </Document>
      </div>
    </div>
  );
};

const TextPreview: React.FC<{ url: string; fileName: string }> = ({
  url,
  fileName,
}) => {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchText = async () => {
      try {
        setLoading(true);
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch text");
        const text = await res.text();
        setContent(text);
      } catch {
        setContent("Không thể đọc nội dung tệp.");
      } finally {
        setLoading(false);
      }
    };
    fetchText();
  }, [url]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="fpv-spinner" />
      </div>
    );
  }

  const isMarkdown = getExtension(fileName) === "md";

  return (
    <div className="h-full overflow-auto bg-gray-800/50 p-8">
      {isMarkdown ? (
        <article
          className="mx-auto min-h-[80vh] max-w-[816px] rounded bg-white p-12 text-gray-800 shadow-lg [&_a]:text-blue-600 [&_a]:underline [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:mb-1 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
        />
      ) : (
        <pre className="mx-auto min-h-[80vh] max-w-[816px] rounded bg-white p-12 font-mono text-[13px] leading-relaxed break-all whitespace-pre-wrap text-gray-800 shadow-lg">
          {content}
        </pre>
      )}
    </div>
  );
};

const ImagePreview: React.FC<{ url: string }> = ({ url }) => (
  <div className="flex h-full w-full items-center justify-center p-8">
    <img
      src={url}
      alt="Preview"
      className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
    />
  </div>
);

const DocxPreview: React.FC<{ url: string }> = ({ url }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDocx = async () => {
      try {
        if (!containerRef.current) return;
        setLoading(true);
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch docx file");
        const blob = await res.blob();

        // docx-preview natively renders word document pages with formatting preserved
        // Tắt inWrapper để không sinh ra lớp nền trắng/xám dư thừa của thư viện
        await docx.renderAsync(blob, containerRef.current, undefined, {
          className: "docx-viewer-section",
          inWrapper: false,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
        });
      } catch (err) {
        console.error(err);
        setError("Không thể hiển thị tệp DOCX. Vui lòng tải xuống để xem.");
      } finally {
        setLoading(false);
      }
    };
    renderDocx();
  }, [url]);

  return (
    <div className="flex-1 overflow-auto bg-gray-800/50 p-8">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-800/50">
          <div className="flex flex-col items-center justify-center gap-2 text-white/70">
            <div className="fpv-spinner" />
            <span>Đang tải DOCX...</span>
          </div>
        </div>
      )}

      {error ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
          <MdErrorOutline className="h-12 w-12" />
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <div className="flex min-h-full flex-col items-center justify-center">
          {/* Lớp bọc chính chứa nội dung Word. Thư viện sẽ render <section> vào đây */}
          <div
            ref={containerRef}
            className="w-full max-w-[816px] overflow-hidden rounded bg-white shadow-lg [&>section]:m-0! [&>section]:bg-transparent! [&>section]:p-12! [&>section]:shadow-none!"
          />
        </div>
      )}
    </div>
  );
};

const UnsupportedPreview: React.FC<{
  fileName: string;
  onDownload: () => void;
}> = ({ fileName, onDownload }) => (
  <div className="flex h-full flex-col items-center justify-center gap-4">
    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10">
      <MdDescription className="h-10 w-10 text-gray-400" />
    </div>
    <div className="text-center">
      <p className="text-lg font-semibold text-white">{fileName}</p>
      <p className="mt-1 text-sm text-gray-400">
        Không hỗ trợ xem trước định dạng này
      </p>
    </div>
    <button
      type="button"
      onClick={onDownload}
      className="bg-brand-500 hover:bg-brand-600 mt-2 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all active:scale-95"
    >
      <MdFileDownload className="h-4 w-4" />
      Tải xuống
    </button>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  fileId,
  fileName,
  downloadFormat = "original",
  isOpen,
  initialPage = 1,
  onClose,
}) => {
  const category = useMemo(() => categorizeFile(fileName), [fileName]);

  // Lifted PDF states for toolbar rendering on modal header
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [scale, setScale] = useState(1.2);
  const pdfScrollRef = useRef<(page: number) => void>(undefined);

  const handlePrevPage = useCallback(() => {
    if (currentPage <= 1) return;
    const prev = currentPage - 1;
    pdfScrollRef.current?.(prev);
    setCurrentPage(prev);
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage >= numPages) return;
    const next = currentPage + 1;
    pdfScrollRef.current?.(next);
    setCurrentPage(next);
  }, [currentPage, numPages]);

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(0.5, s - 0.2));
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(3, s + 0.2));
  }, []);

  // Fetch the file detail metadata instead of downloading the whole blob via Python RAG proxy
  const {
    data: fileDetail,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["file-detail-preview", fileId],
    queryFn: () => DocumentsService.getFileDetail(fileId!),
    enabled: isOpen && Boolean(fileId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const publicUrl = useMemo(() => {
    if (!fileDetail) return null;
    return downloadFormat === "markdown" ? fileDetail.markdownFileUrl : fileDetail.fileUrl;
  }, [fileDetail, downloadFormat]);

  // Keyboard handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleDownload = useCallback(async () => {
    if (!publicUrl) return;
    try {
      const res = await fetch(publicUrl);
      if (!res.ok) throw new Error("Network response was not ok");
      const dlBlob = await res.blob();
      const url = URL.createObjectURL(dlBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Không thể tải xuống tệp.");
    }
  }, [publicUrl, fileName]);

  if (!isOpen) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <div className="fpv-spinner" />
          <p className="text-sm text-gray-400">Đang tải xem trước...</p>
        </div>
      );
    }

    if (error || !publicUrl) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
          <MdErrorOutline className="h-12 w-12" />
          <p className="text-sm">Không thể tải tệp tin.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
          >
            Đóng
          </button>
        </div>
      );
    }

    switch (category) {
      case "pdf":
        return (
          <PdfPreview
            url={publicUrl}
            initialPage={initialPage}
            scale={scale}
            currentPage={currentPage}
            numPages={numPages}
            setNumPages={setNumPages}
            setCurrentPage={setCurrentPage}
            pdfScrollRef={pdfScrollRef}
          />
        );
      case "text":
        return <TextPreview url={publicUrl} fileName={fileName} />;
      case "image":
        return <ImagePreview url={publicUrl} />;
      case "docx":
        return <DocxPreview url={publicUrl} />;
      case "unsupported":
        return (
          <UnsupportedPreview fileName={fileName} onDownload={handleDownload} />
        );
      default:
        return null;
    }
  };

  if (!document.body) return null;

  return createPortal(
    <div className="animate-in fade-in fixed inset-0 z-9999 flex items-center justify-center duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm">
        {/* Modal container */}
        <div className="relative flex h-full w-full flex-col">
          {/* Header */}
          <div className="z-1 flex shrink-0 items-center justify-between border-b border-white/8 bg-[#202124]/95 px-5 py-3">
            {/* File info */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <MdDescription className="h-5 w-5 text-gray-300" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white max-w-[240px] sm:max-w-[360px] md:max-w-[480px]">
                  {fileName}
                </p>
                <p className="text-xs text-gray-400 uppercase">
                  {getExtension(fileName)} file
                </p>
              </div>
            </div>

            {/* PDF Toolbar in the middle */}
            {category === "pdf" && numPages > 0 && (
              <div className="mx-4 flex shrink-0 items-center gap-2 rounded-xl bg-white/5 px-3 py-1 border border-white/8">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="rounded-lg p-1 text-white/70 transition-colors hover:bg-white/10 disabled:opacity-30"
                  title="Trang trước"
                >
                  <MdChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[45px] text-center text-xs font-semibold text-white/80">
                  {currentPage} / {numPages}
                </span>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPage >= numPages}
                  className="rounded-lg p-1 text-white/70 transition-colors hover:bg-white/10 disabled:opacity-30"
                  title="Trang sau"
                >
                  <MdChevronRight className="h-4 w-4" />
                </button>
                <span className="h-4 w-px bg-white/15 mx-1" />
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="rounded-lg px-2 py-0.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10"
                  title="Thu nhỏ"
                >
                  −
                </button>
                <span className="min-w-[35px] text-center text-xs font-semibold text-white/80">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="rounded-lg px-2 py-0.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10"
                  title="Phóng to"
                >
                  +
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-1 justify-end items-center gap-1">
              <button
                type="button"
                onClick={handleDownload}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/12 hover:text-white active:scale-92"
                title="Tải xuống"
              >
                <MdFileDownload className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/12 hover:text-white active:scale-92"
                title="Đóng"
              >
                <MdClose className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="relative flex-1 overflow-auto text-white">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default FilePreviewModal;
