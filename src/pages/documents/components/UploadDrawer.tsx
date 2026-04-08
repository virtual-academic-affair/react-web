import { message as toast } from "antd";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Drawer from "@/components/drawer/Drawer";
import Tag from "@/components/tag/Tag";
import {
  DocumentsService,
  type UploadProgressEvent,
} from "@/services/documents";
import { RoleColors } from "@/types/users";
import { parseError } from "@/utils/parseError";
import AccessScopeBadge from "./AccessScopeBadge";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MetadataValue {
  value: string;
  displayName: string;
  isActive?: boolean;
  color?: string;
  visibleRoles?: string[];
}

export interface MetadataType {
  key: string;
  displayName: string;
  isActive?: boolean;
  allowedValues?: MetadataValue[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const ALLOWED_EXTENSIONS = [
  // Documents
  ".pdf",
  ".doc",
  ".docx",
  ".rtf",
  ".md",

  // Spreadsheets
  ".xls",
  ".xlsx",
  ".xlsm",
  ".xlsb",

  // Presentations
  ".ppt",
  ".pptx",
  ".pptm",

  // Data / Tabular
  ".csv",
  ".tsv",

  // Web / Markup
  ".html",
  ".xml",

  // Others
  ".json",
  ".ods",
  ".odp",
  ".odt",
];

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// ── Step indicator ────────────────────────────────────────────────────────────

/** Giống layout bước tạo đăng ký lớp: `gradient` đặt ngoài card trên nền brand; `plain` trong drawer. */
export const ProcessSteps: React.FC<{
  currentStep: number;
  variant?: "gradient" | "plain";
}> = ({ currentStep, variant = "plain" }) => {
  const steps = [
    { number: 1, label: "Chọn tệp tin" },
    { number: 2, label: "Nhãn tài liệu" },
  ];

  const labelClass =
    variant === "gradient"
      ? "text-xs font-medium text-white dark:text-white"
      : "text-xs font-medium text-gray-600 dark:text-gray-400";

  return (
    <div
      className={
        variant === "gradient"
          ? "mb-8 flex items-center justify-center gap-4"
          : "mb-6 flex items-center justify-center gap-4"
      }
    >
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                currentStep >= step.number
                  ? "border-brand-500 bg-brand-500 text-white"
                  : variant === "gradient"
                    ? "border-white/50 bg-white/10 text-white/90"
                    : "border-gray-300 bg-transparent text-gray-400 dark:border-gray-600 dark:text-gray-500"
              }`}
            >
              {currentStep > step.number ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <span className={labelClass}>{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={
                variant === "gradient"
                  ? "h-0.5 w-16 bg-white/40 transition-all"
                  : "h-0.5 w-16 bg-gray-300 transition-all dark:bg-gray-600"
              }
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ── UploadForm (shared logic) ─────────────────────────────────────────────────

interface UploadFormProps {
  /** All metadata types (active + inactive; this component filters internally) */
  metadataTypes: MetadataType[];
  /**
   * Called after a successful upload.
   * The consuming component decides what to do next
   * (navigate away, close a drawer, invalidate queries…).
   */
  onSuccess: () => void;
  /** Optional: called when the user wants to cancel / dismiss */
  onCancel?: () => void;
  /** Wrapper for the action buttons row (allows the page vs drawer to style differently) */
  actionsClassName?: string;
  /** Bước hiện tại (điều khiển từ ngoài, vd. gắn với CreatePageLayout.processSteps) */
  currentStep?: number;
  onStepChange?: (step: number) => void;
  /** Ẩn stepper trong form — dùng khi đã render ProcessSteps ở layout */
  hideProcessSteps?: boolean;
}

export const UploadForm: React.FC<UploadFormProps> = ({
  metadataTypes,
  onSuccess,
  onCancel,
  actionsClassName = "flex justify-end gap-2",
  currentStep: controlledStep,
  onStepChange,
  hideProcessSteps = false,
}) => {
  const [internalStep, setInternalStep] = useState(1);
  const isControlled = controlledStep !== undefined;
  const currentStep = isControlled ? controlledStep! : internalStep;

  const goToStep = useCallback(
    (next: number) => {
      if (isControlled) {
        onStepChange?.(next);
      } else {
        setInternalStep(next);
      }
    },
    [isControlled, onStepChange],
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [customMetadata, setCustomMetadata] = useState<Record<string, string>>(
    {},
  );
  const [uploadProgress, setUploadProgress] =
    useState<UploadProgressEvent | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const stageLabelMap = useMemo<Record<string, string>>(
    () => ({
      db_creating: "Khởi tạo bản ghi",
      uploading_original: "Upload file gốc",
      parsing_markdown: "OCR/Parse markdown",
      uploading_gemini: "Upload vào Gemini",
      saving_vector_db: "Lưu vào Vector DB",
      completed: "Hoàn tất",
    }),
    [],
  );

  const closeProgressSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsConnected(false);
  }, []);

  useEffect(() => {
    return () => {
      closeProgressSocket();
    };
  }, [closeProgressSocket]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Only active types with at least one active value
  const activeMetadataTypes = React.useMemo(
    () =>
      metadataTypes
        .filter((t) => t.isActive !== false)
        .map((t) => ({
          ...t,
          allowedValues: (t.allowedValues || []).filter(
            (v) => v.isActive !== false,
          ),
        }))
        .filter((t) => t.allowedValues.length > 0),
    [metadataTypes],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    goToStep(1);
    setSelectedFile(null);
    setDisplayName("");
    setCustomMetadata({});
    setUploadProgress(null);
    setUploading(false);
    closeProgressSocket();
  }, [closeProgressSocket, goToStep]);

  const handleFileSelect = useCallback(
    (file: File) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        toast.error(
          `Định dạng không được hỗ trợ. Cho phép: ${ALLOWED_EXTENSIONS.join(", ")}`,
        );
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Kích thước file vượt quá 20MB.");
        return;
      }
      setSelectedFile(file);
      if (!displayName) {
        setDisplayName(file.name.replace(/\.[^/.]+$/, ""));
      }
    },
    [displayName],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleMetadataChange = (key: string, value: string) =>
    setCustomMetadata((prev) => ({ ...prev, [key]: value }));

  const handleNext = () => {
    if (!selectedFile) {
      toast.error("Vui lòng chọn file.");
      return;
    }
    goToStep(2);
  };

  const handlePrev = () => goToStep(Math.max(1, currentStep - 1));

  const handleUpload = async () => {
    const hasAcademicYear = customMetadata["academic_year"];
    const hasCohort = customMetadata["cohort"];

    if (!hasAcademicYear && !hasCohort) {
      toast.error("Vui lòng chọn năm học hoặc khóa.");
      return;
    }

    setUploading(true);
    setUploadProgress(null);

    try {
      const normalizedMetadata = Object.entries(customMetadata).reduce(
        (acc, [key, value]) => {
          if (!value) return acc;
          acc[key] = [value];
          return acc;
        },
        {} as Record<string, string[]>,
      );

      // access_scope is required key in backend; empty array = nội bộ
      if (!normalizedMetadata.access_scope) {
        normalizedMetadata.access_scope = [];
      }

      const clientId =
        (globalThis.crypto?.randomUUID && globalThis.crypto.randomUUID()) ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      closeProgressSocket();
      wsRef.current = DocumentsService.createUploadProgressSocket(clientId, {
        onOpen: () => setWsConnected(true),
        onMessage: (event) => setUploadProgress(event),
        onError: () => setWsConnected(false),
        onClose: () => setWsConnected(false),
      });

      const formData = new FormData();
      formData.append("file", selectedFile!);
      if (displayName.trim()) {
        formData.append("displayName", displayName.trim());
      }
      formData.append("clientId", clientId);
      formData.append("customMetadata", JSON.stringify(normalizedMetadata));

      await DocumentsService.uploadFile(formData);
      toast.success("Tải lên thành công.");
      reset();
      onSuccess();
    } catch (err) {
      toast.error(parseError(err));
      closeProgressSocket();
    } finally {
      setUploading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      {!hideProcessSteps && (
        <ProcessSteps currentStep={currentStep} variant="plain" />
      )}

      {/* ── Step 1: Chọn tệp tin ─────────────────────────────────────── */}
      {currentStep === 1 && (
        <>
          <div>
            {uploading && (
              <div className="dark:bg-navy-800 mb-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Đang xử lý tải lên
                  </p>
                  <span
                    className={`text-xs font-medium ${
                      wsConnected ? "text-green-600" : "text-amber-600"
                    }`}
                  >
                    {wsConnected ? "Realtime connected" : "Connecting..."}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {uploadProgress?.message || "Đang khởi tạo upload..."}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Bước: {stageLabelMap[uploadProgress?.step || ""] || "—"}
                </p>
              </div>
            )}
            {!selectedFile ? (
              <div
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-colors ${
                  dragOver
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_EXTENSIONS.join(",")}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                  Kéo thả file vào đây hoặc
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
                >
                  Chọn file
                </button>
                <p className="mt-3 text-xs text-gray-500">
                  Định dạng: .pdf, .doc, .docx, .xls, .xlsx,... | Tối đa 20MB
                </p>
              </div>
            ) : (
              <div className="dark:bg-navy-800 flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-500 flex h-10 w-10 items-center justify-center rounded-xl text-white">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(() => {
                        const b = selectedFile.size;
                        if (b < 1024) return `${b} Bytes`;
                        const kb = b / 1024;
                        if (kb < 1024) return `${kb.toFixed(2)} KB`;
                        return `${(kb / 1024).toFixed(2)} MB`;
                      })()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-200 dark:hover:bg-white/10"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Tên hiển thị */}
          <div className="flex items-start gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Tên hiển thị
              </p>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="dark:bg-navy-800 w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
                placeholder="Tên hiển thị (tùy chọn)"
              />
            </div>
          </div>

          {/* Preview access scope if already set */}
          {customMetadata["access_scope"] && (
            <div className="flex items-start gap-6">
              <div className="w-40 shrink-0">
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Phạm vi truy cập
                </p>
              </div>
              <div className="flex-1">
                <AccessScopeBadge value={customMetadata["access_scope"]} />
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Step 2: Nhãn tài liệu ────────────────────────────────────── */}
      {currentStep === 2 && (
        <div>
          {activeMetadataTypes.length === 0 ? (
            <p className="text-sm text-gray-500">
              Chưa có nhãn nào được cấu hình.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {activeMetadataTypes.map((type) => {
                const currentValue = customMetadata[type.key] || "";

                // Access scope is special - show as role tags
                if (type.key === "access_scope") {
                  return (
                    <div key={type.key} className="flex items-start gap-6">
                      <div className="w-40 shrink-0">
                        <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                          {type.displayName} *
                        </p>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2">
                          {type.allowedValues?.map((val) => {
                            const isSelected = currentValue === val.value;
                            const colors = val.visibleRoles?.includes("student")
                              ? RoleColors.student
                              : RoleColors.lecture;
                            return (
                              <button
                                key={val.value}
                                type="button"
                                onClick={() =>
                                  handleMetadataChange(type.key, val.value)
                                }
                                className="cursor-pointer"
                              >
                                <Tag
                                  color={
                                    isSelected
                                      ? colors.text
                                          .replace("text-", "#")
                                          .replace("-800", "00")
                                      : "#6b7280"
                                  }
                                >
                                  {val.displayName || val.value}
                                </Tag>
                              </button>
                            );
                          })}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Quyền truy cập:{" "}
                          <span className="font-medium">
                            {currentValue === "student" && "Chỉ sinh viên"}
                            {currentValue === "lecture" && "Chỉ giảng viên"}
                            {!currentValue && "Để trống = file nội bộ"}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                }

                // All other metadata types → select dropdown
                const isRequired =
                  type.key === "academic_year" || type.key === "cohort";
                return (
                  <div key={type.key} className="flex items-start gap-6">
                    <div className="w-40 shrink-0">
                      <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                        {type.displayName} {isRequired ? "*" : ""}
                      </p>
                    </div>
                    <div className="flex-1">
                      <select
                        value={currentValue}
                        onChange={(e) =>
                          handleMetadataChange(type.key, e.target.value)
                        }
                        className="dark:bg-navy-800 w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
                      >
                        <option value="">— Chọn —</option>
                        {type.allowedValues?.map((val) => (
                          <option key={val.value} value={val.value}>
                            {val.displayName || val.value}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Action buttons ────────────────────────────────────────────── */}
      <div className={actionsClassName}>
        {onCancel && currentStep === 1 && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
          >
            Hủy
          </button>
        )}
        {currentStep > 1 && (
          <button
            type="button"
            disabled={uploading}
            onClick={handlePrev}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
          >
            Quay lại
          </button>
        )}
        {currentStep < 2 ? (
          <button
            type="button"
            disabled={!selectedFile}
            onClick={handleNext}
            className="bg-brand-500 hover:bg-brand-600 flex items-center gap-2 rounded-xl px-6 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            Tiếp tục
          </button>
        ) : (
          <button
            type="button"
            disabled={
              uploading ||
              !selectedFile ||
              (!customMetadata["academic_year"] && !customMetadata["cohort"])
            }
            onClick={handleUpload}
            className="bg-brand-500 hover:bg-brand-600 flex items-center gap-2 rounded-xl px-6 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang tải lên...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Tải lên
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ── UploadDrawer (Drawer shell) ───────────────────────────────────────────────

interface UploadDrawerProps {
  open: boolean;
  metadataTypes: MetadataType[];
  onClose: () => void;
  onSuccess: () => void;
}

const UploadDrawer: React.FC<UploadDrawerProps> = ({
  open,
  metadataTypes,
  onClose,
  onSuccess,
}) => (
  <Drawer
    isOpen={open}
    onClose={onClose}
    title="Tải lên tài liệu mới"
    width="max-w-2xl"
  >
    <UploadForm
      metadataTypes={metadataTypes}
      onSuccess={() => {
        onSuccess();
        onClose();
      }}
      onCancel={onClose}
      actionsClassName="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-white/10"
    />
  </Drawer>
);

export default UploadDrawer;
