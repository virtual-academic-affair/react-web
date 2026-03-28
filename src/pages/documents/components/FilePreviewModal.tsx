import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { useQuery } from "@tanstack/react-query";
import { message as toast } from "antd";
import mammoth from "mammoth";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  MdClose,
  MdDescription,
  MdErrorOutline,
  MdFileDownload,
} from "react-icons/md";

import { DocumentsService } from "@/services/documents";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "./FilePreviewModal.css";

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
  onClose: () => void;
}

// ── Sub-components ───────────────────────────────────────────────────────────

const PdfPreview: React.FC<{ url: string }> = ({ url }) => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <div className="fpv-pdf-container h-full w-full">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
        <Viewer fileUrl={url} plugins={[defaultLayoutPluginInstance]} />
      </Worker>
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
    <div className="h-full overflow-auto bg-[#1e1e2e] p-8">
      <pre className="mx-auto max-w-[900px] rounded-xl border border-white/5 bg-[#282a36] p-8 font-mono text-[13px] leading-relaxed break-all whitespace-pre-wrap text-slate-200 shadow-2xl">
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
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const convert = async () => {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtml(result.value);
      } catch {
        setError("Không thể hiển thị tệp DOCX. Vui lòng tải xuống để xem.");
      } finally {
        setLoading(false);
      }
    };
    convert();
  }, [blob]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="fpv-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
        <MdErrorOutline className="h-12 w-12" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-100 p-8">
      <div
        className="fpv-docx-content mx-auto min-h-[80vh] max-w-[816px] rounded bg-white px-16 py-12 text-sm leading-relaxed text-gray-800 shadow-lg"
        dangerouslySetInnerHTML={{ __html: html }}
      />
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
        return objectUrl ? <PdfPreview url={objectUrl} /> : null;
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

  return createPortal(
    <div className="animate-in fade-in fixed inset-0 z-[9999] flex items-center justify-center duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="relative flex h-full w-full flex-col">
        {/* Header */}
        <div className="z-1 flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#202124]/95 px-5 py-3">
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
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/[0.12] hover:text-white active:scale-92"
              title="Tải xuống"
            >
              <MdFileDownload className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/[0.12] hover:text-white active:scale-92"
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
    </div>,
    document.body,
  );
};

export default FilePreviewModal;
