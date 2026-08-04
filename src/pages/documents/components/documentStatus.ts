import type { FileStatus } from "@/services/documents";

/** Shared purple color for inline status text in the documents list. */
export const DOCUMENT_STATUS_TEXT_COLOR = "#8b5cf6";

export const DOCUMENT_STATUS_CONFIG: Record<
  FileStatus,
  { label: string; color: string }
> = {
  uploading: { label: "Đang tải lên", color: "#f59e0b" },
  processing: { label: "Đang xử lý", color: "#f59e0b" },
  awaiting_review: { label: "Cần kiểm tra văn bản đã chuyển đổi", color: "#8b5cf6" },
  ready: { label: "Sẵn sàng", color: "#22c55e" },
  failed: { label: "Thất bại", color: "#b2161e" },
};

/** Fine-grained WebSocket upload/processing steps from python-rag. */
export const UPLOAD_PROGRESS_STEP_LABELS: Record<string, string> = {
  db_creating: "Đang tạo bản ghi",
  uploading_original: "Đang lưu tệp tin gốc",
  queued_background: "Tiến hành xử lý",
  ocr_processing: "Đang chuyển đổi văn bản",
  review_required: "Cần kiểm tra văn bản đã chuyển đổi",
  review_saved: "Đã lưu chỉnh sửa",
  indexing: "Đang bổ sung vào kho tri thức",
  completed: "Bổ sung vào kho tri thức thành công",
  failed: "Thất bại",
  deleted: "Đã xóa",
};

export const TERMINAL_UPLOAD_PROGRESS_STEPS = new Set([
  "review_required",
  "completed",
  "failed",
  "deleted",
]);

export const DOCUMENT_STATUS_FILTER_OPTIONS = Object.entries(
  DOCUMENT_STATUS_CONFIG,
).map(([value, config]) => ({
  value: value as FileStatus,
  displayName: config.label,
  color: config.color,
}));

export const normalizeDocumentStatus = (
  status: unknown,
): FileStatus | undefined => {
  const normalized = String(status || "").toLowerCase();
  if (normalized in DOCUMENT_STATUS_CONFIG) {
    return normalized as FileStatus;
  }
  return undefined;
};

export const getUploadProgressStepLabel = (
  step: unknown,
  message?: string | null,
): string | undefined => {
  const normalized = String(step || "").toLowerCase();
  if (!normalized) return undefined;
  if (UPLOAD_PROGRESS_STEP_LABELS[normalized]) {
    return UPLOAD_PROGRESS_STEP_LABELS[normalized];
  }
  const trimmed = String(message || "").trim();
  return trimmed || normalized;
};

export const shouldAnimateDocumentStatusText = (status: unknown): boolean => {
  const normalized = normalizeDocumentStatus(status);
  return (
    normalized === "uploading" ||
    normalized === "processing" ||
    normalized === "awaiting_review"
  );
};

export const getDocumentStatusConfig = (status: unknown) => {
  const normalized = normalizeDocumentStatus(status);
  if (normalized) return DOCUMENT_STATUS_CONFIG[normalized];
  return {
    label: String(status || "Không xác định"),
    color: DOCUMENT_STATUS_TEXT_COLOR,
  };
};
