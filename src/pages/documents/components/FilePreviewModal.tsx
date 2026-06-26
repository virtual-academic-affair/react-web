import { useQuery } from "@tanstack/react-query";
import { message as toast } from "antd";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  MdCheck,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdContentCopy,
  MdDescription,
  MdErrorOutline,
  MdFileDownload,
} from "react-icons/md";

import { copyTextToClipboard } from "@/components/copyable/copyTextToClipboard";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import {
  VIEW_DOCUMENT_FORMAT_MARKDOWN,
  buildDocumentViewUrl,
} from "@/utils/documentViewUrl";
import {
  type DownloadFileFormat,
  DocumentsService,
} from "@/services/documents";

import "./FilePreviewModal.css";

const DocxPreview = React.lazy(() => import("./file-preview/DocxPreview"));
const MarkdownPreview = React.lazy(
  () => import("./file-preview/MarkdownPreview"),
);
const PdfPreview = React.lazy(() => import("./file-preview/PdfPreview"));
const PlainTextPreview = React.lazy(
  () => import("./file-preview/PlainTextPreview"),
);

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

function extensionFromUrl(url: string): string {
  const last = url.split("?")[0].split("/").pop() || "";
  return getExtension(last);
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

function categorizeFromMimeType(mime?: string): FileCategory | null {
  if (!mime) return null;
  const normalized = mime.toLowerCase();
  if (normalized === "application/pdf") return "pdf";
  if (
    normalized.includes("wordprocessingml") ||
    normalized.includes("msword") ||
    normalized === "application/doc"
  ) {
    return "docx";
  }
  if (normalized.startsWith("image/")) return "image";
  if (
    normalized.startsWith("text/") ||
    normalized === "application/json" ||
    normalized === "application/xml"
  ) {
    return "text";
  }
  return null;
}

function resolvePreviewFileName(
  fileName: string,
  fileDetail: Record<string, unknown> | undefined,
  downloadFormat: DownloadFileFormat,
  publicUrl: string | null,
): string {
  const detailOriginal = String(fileDetail?.originalFilename ?? "").trim();
  const detailDisplay = String(fileDetail?.displayName ?? "").trim();

  if (downloadFormat === "markdown") {
    const markdownUrl = String(
      fileDetail?.markdownFileUrl ?? publicUrl ?? "",
    );
    const fromUrl = markdownUrl.split("?")[0].split("/").pop() || "";
    if (fromUrl) return fromUrl;
    const baseName = detailDisplay || detailOriginal || fileName;
    return baseName ? `${baseName}.md` : "markdown.md";
  }

  if (detailOriginal) return detailOriginal;
  if (detailDisplay && getExtension(detailDisplay)) return detailDisplay;

  if (publicUrl) {
    const fromUrl = publicUrl.split("?")[0].split("/").pop() || "";
    if (getExtension(fromUrl)) return fromUrl;
  }

  return fileName || detailDisplay || "document";
}

function resolveFileCategory(
  fileName: string,
  publicUrl: string | null,
  mimeType?: string,
): FileCategory {
  const fromMime = categorizeFromMimeType(mimeType);
  if (fromMime) return fromMime;

  const fromName = categorizeFile(fileName);
  if (fromName !== "unsupported") return fromName;

  if (publicUrl) {
    const ext = extensionFromUrl(publicUrl);
    if (ext) {
      const fromUrl = categorizeFile(`file.${ext}`);
      if (fromUrl !== "unsupported") return fromUrl;
    }
  }

  return "unsupported";
}

function PreviewLoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="fpv-spinner" />
      <p className="text-sm text-gray-400">Đang tải trình xem trước...</p>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

interface FilePreviewModalProps {
  fileId?: string | null;
  fileUrl?: string | null;
  fileName: string;
  downloadFormat?: DownloadFileFormat;
  isOpen: boolean;
  initialPage?: number;
  onClose: () => void;
}

const ImagePreview: React.FC<{ url: string }> = ({ url }) => (
  <div className="flex h-full w-full items-center justify-center p-8">
    <img
      src={url}
      alt="Preview"
      className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
    />
  </div>
);

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
  fileId = null,
  fileUrl = null,
  fileName,
  downloadFormat = "original",
  isOpen,
  initialPage = 1,
  onClose,
}) => {
  const useFileDetail = isOpen && Boolean(fileId) && !fileUrl;

  const {
    data: fileDetail,
    isLoading: isDetailLoading,
    error: detailError,
  } = useQuery({
    queryKey: ["file-detail-preview", fileId],
    queryFn: () => DocumentsService.getFileDetail(fileId!),
    enabled: useFileDetail,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const publicUrl = useMemo(() => {
    if (fileUrl) return fileUrl;
    if (!fileDetail) return null;
    return downloadFormat === "markdown"
      ? fileDetail.markdownFileUrl
      : fileDetail.fileUrl;
  }, [fileDetail, downloadFormat, fileUrl]);

  const isLoading = useFileDetail && isDetailLoading;
  const error = useFileDetail ? detailError : null;

  const effectiveFileName = useMemo(
    () =>
      resolvePreviewFileName(
        fileName,
        fileDetail,
        downloadFormat,
        publicUrl,
      ),
    [downloadFormat, fileDetail, fileName, publicUrl],
  );

  const category = useMemo(
    () =>
      resolveFileCategory(
        effectiveFileName,
        publicUrl,
        typeof fileDetail?.mimeType === "string"
          ? fileDetail.mimeType
          : typeof fileDetail?.contentType === "string"
            ? fileDetail.contentType
            : undefined,
      ),
    [effectiveFileName, fileDetail, publicUrl],
  );

  // Lifted PDF states for toolbar rendering on modal header
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [scale, setScale] = useState(1.2);
  const [copied, setCopied] = useState(false);
  const pdfScrollRef = useRef<(page: number) => void>(undefined);

  useEffect(() => {
    if (!isOpen || category !== "pdf") return;
    setScale(window.innerWidth < 640 ? 0.7 : 1.2);
  }, [category, isOpen]);

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

  useBodyScrollLock(isOpen);

  // Keyboard handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleDownload = useCallback(async () => {
    if (!publicUrl) return;
    try {
      const res = await fetch(publicUrl);
      if (!res.ok) throw new Error("Network response was not ok");
      const dlBlob = await res.blob();
      const url = URL.createObjectURL(dlBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = effectiveFileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Không thể tải xuống tệp.");
    }
  }, [effectiveFileName, publicUrl]);

  const showCopyViewLink =
    Boolean(fileId) &&
    (category === "pdf" ||
      downloadFormat === "markdown" ||
      (category === "text" && getExtension(effectiveFileName) === "md"));

  const viewUrl = useMemo(() => {
    if (!fileId || !showCopyViewLink) return null;
    return buildDocumentViewUrl(fileId, {
      format:
        downloadFormat === "markdown"
          ? VIEW_DOCUMENT_FORMAT_MARKDOWN
          : undefined,
    });
  }, [downloadFormat, fileId, showCopyViewLink]);

  const handleCopyViewLink = useCallback(async () => {
    if (!viewUrl) return;
    const success = await copyTextToClipboard(viewUrl);
    if (!success) {
      toast.error("Không thể sao chép liên kết");
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [viewUrl]);

  const copyViewLinkButton = showCopyViewLink ? (
    <button
      type="button"
      onClick={() => void handleCopyViewLink()}
      disabled={!viewUrl}
      className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/12 hover:text-white active:scale-92 disabled:opacity-40"
      title={copied ? "Đã sao chép link" : "Sao chép link xem"}
    >
      {copied ? (
        <MdCheck className="h-5 w-5 text-green-400" />
      ) : (
        <MdContentCopy className="h-5 w-5" />
      )}
    </button>
  ) : null;

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
          <Suspense fallback={<PreviewLoading />}>
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
          </Suspense>
        );
      case "text":
        return (
          <Suspense fallback={<PreviewLoading />}>
            {getExtension(effectiveFileName) === "md" ? (
              <MarkdownPreview url={publicUrl} />
            ) : (
              <PlainTextPreview url={publicUrl} />
            )}
          </Suspense>
        );
      case "image":
        return <ImagePreview url={publicUrl} />;
      case "docx":
        return (
          <Suspense fallback={<PreviewLoading />}>
            <DocxPreview url={publicUrl} />
          </Suspense>
        );
      case "unsupported":
        return (
          <UnsupportedPreview
            fileName={effectiveFileName}
            onDownload={handleDownload}
          />
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
          <div className="z-1 flex shrink-0 flex-col gap-2 border-b border-white/8 bg-[#202124]/95 px-3 py-2 sm:px-5 sm:py-3 md:flex-row md:items-center md:justify-between">
            {/* File info */}
            <div className="flex w-full min-w-0 items-center justify-between gap-2 md:flex-1 md:justify-start">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <MdDescription className="h-5 w-5 text-gray-300" />
                </div>
                <div className="min-w-0">
                  <p className="max-w-[180px] truncate text-sm font-semibold text-white sm:max-w-[360px] md:max-w-[480px]">
                    {effectiveFileName}
                  </p>
                  <p className="text-xs text-gray-400 uppercase">
                    {getExtension(effectiveFileName) || "file"} file
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-1 md:hidden">
                {copyViewLinkButton}
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

            {/* PDF Toolbar in the middle */}
            {category === "pdf" && numPages > 0 && (
              <div className="w-full min-w-0 [scrollbar-width:none] overflow-x-auto [-ms-overflow-style:none] md:mx-4 md:w-auto md:shrink-0 md:overflow-visible [&::-webkit-scrollbar]:hidden">
                <div className="flex w-max min-w-full items-center justify-between gap-1 rounded-xl border border-white/8 bg-white/5 px-2 py-1 sm:gap-2 sm:px-3 md:min-w-0">
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
                  <span className="mx-1 h-4 w-px bg-white/15" />
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
              </div>
            )}

            {/* Actions */}
            <div className="hidden flex-1 items-center justify-end gap-1 md:flex">
              {copyViewLinkButton}
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
