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

import { DocumentsService } from "@/services/documents";

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
  isOpen: boolean;
  initialPage?: number;
  onClose: () => void;
}

// ── Sub-components ───────────────────────────────────────────────────────────

const PdfPreview: React.FC<{ url: string; initialPage?: number }> = ({
  url,
  initialPage = 1,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [scale, setScale] = useState(1.2);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleScroll = () => {
    if (!containerRef.current) return;
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

  const handlePrevPage = () => {
    if (currentPage <= 1 || !containerRef.current) return;
    const prevPageRef = pageRefs.current[currentPage - 2];
    if (prevPageRef) {
      containerRef.current.scrollTo({
        top: prevPageRef.offsetTop - 32, // trừ hao padding
        behavior: "smooth",
      });
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage >= numPages || !containerRef.current) return;
    const nextPageRef = pageRefs.current[currentPage];
    if (nextPageRef) {
      containerRef.current.scrollTo({
        top: nextPageRef.offsetTop - 32,
        behavior: "smooth",
      });
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* PDF toolbar */}
      <div className="z-10 flex shrink-0 items-center justify-center gap-3 border-b border-white/8 bg-[#202124]/80 px-4 py-2">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 disabled:opacity-30"
        >
          <MdChevronLeft className="h-5 w-5" />
        </button>
        <span className="w-16 text-center text-sm text-white/80">
          {currentPage} / {numPages || "–"}
        </span>
        <button
          type="button"
          onClick={handleNextPage}
          disabled={currentPage >= numPages}
          className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 disabled:opacity-30"
        >
          <MdChevronRight className="h-5 w-5" />
        </button>
        <span className="mx-2 h-5 w-px bg-white/20" />
        <button
          type="button"
          onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
          className="rounded-lg px-2 py-1 text-sm text-white/70 transition-colors hover:bg-white/10"
        >
          −
        </button>
        <span className="w-12 text-center text-sm text-white/80">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(3, s + 0.2))}
          className="rounded-lg px-2 py-1 text-sm text-white/70 transition-colors hover:bg-white/10"
        >
          +
        </button>
      </div>

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

const TextPreview: React.FC<{ blob: Blob }> = ({ blob }) => {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => {
      setContent(reader.result as string);
      setLoading(false);
    };
    reader.onerror = () => {
      setContent("Không thể đọc nội dung tệp.");
      setLoading(false);
    };
    reader.readAsText(blob, "utf-8");
  }, [blob]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="fpv-spinner" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-800/50 p-8">
      <pre className="mx-auto min-h-[80vh] max-w-[816px] rounded bg-white p-12 font-mono text-[13px] leading-relaxed break-all whitespace-pre-wrap text-gray-800 shadow-lg">
        {content}
      </pre>
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

const DocxPreview: React.FC<{ blob: Blob }> = ({ blob }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDocx = async () => {
      try {
        if (!containerRef.current) return;
        setLoading(true);
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
  }, [blob]);

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
  isOpen,
  initialPage = 1,
  onClose,
}) => {
  const category = useMemo(() => categorizeFile(fileName), [fileName]);

  // Fetch the file blob
  const {
    data: blob,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["file-preview", fileId],
    queryFn: () => DocumentsService.downloadFile(fileId!),
    enabled: isOpen && Boolean(fileId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Object URL management
  const objectUrl = useMemo(() => {
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }, [blob]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

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
    try {
      const downloadBlob =
        blob || (await DocumentsService.downloadFile(fileId!));
      const url = URL.createObjectURL(downloadBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Không thể tải xuống tệp.");
    }
  }, [blob, fileId, fileName]);

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

    if (error || !blob) {
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
        return objectUrl ? (
          <PdfPreview url={objectUrl} initialPage={initialPage} />
        ) : null;
      case "text":
        return <TextPreview blob={blob} />;
      case "image":
        return objectUrl ? <ImagePreview url={objectUrl} /> : null;
      case "docx":
        return <DocxPreview blob={blob} />;
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
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <MdDescription className="h-5 w-5 text-gray-300" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {fileName}
                </p>
                <p className="text-xs text-gray-400 uppercase">
                  {getExtension(fileName)} file
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
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
