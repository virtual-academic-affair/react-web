import type { FileStatus } from "@/services/documents";

export const DOCUMENT_STATUS_CONFIG: Record<
  FileStatus,
  { label: string; color: string }
> = {
  uploading: { label: "Đang tải lên", color: "#f59e0b" },
  processing: { label: "Đang xử lý", color: "#f59e0b" },
  awaiting_review: { label: "Chờ duyệt OCR", color: "#8b5cf6" },
  ready: { label: "Sẵn sàng", color: "#22c55e" },
  failed: { label: "Thất bại", color: "#b2161e" },
};

export const DOCUMENT_STATUS_FILTER_OPTIONS = Object.entries(
  DOCUMENT_STATUS_CONFIG,
).map(([value, config]) => ({
  value: value as FileStatus,
  displayName: config.label,
  color: config.color,
}));

export const getDocumentStatusConfig = (status: unknown) => {
  const normalized = String(status || "").toLowerCase() as FileStatus;
  return (
    DOCUMENT_STATUS_CONFIG[normalized] ?? {
      label: String(status || "Không xác định"),
      color: "#94a3b8",
    }
  );
};
