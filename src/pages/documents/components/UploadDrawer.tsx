import { message as toast } from "antd";
import React, { useCallback, useRef, useState } from "react";

import Drawer from "@/components/drawer/Drawer";
import { DocumentsService } from "@/services/documents";
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

export const ProcessSteps: React.FC<{ currentStep: number }> = ({
  currentStep,
}) => {
  const steps = [
    { number: 1, label: "Chọn tệp tin" },
    { number: 2, label: "Nhãn tài liệu" },
  ];

  return (
    <div className="mb-6 flex items-center justify-center gap-4">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                currentStep >= step.number
                  ? "border-brand-500 bg-brand-500 text-white"
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
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="h-0.5 w-16 bg-gray-300 transition-all dark:bg-gray-600" />
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
}

export const UploadForm: React.FC<UploadFormProps> = ({
  metadataTypes,
  onSuccess,
  onCancel,
  actionsClassName = "flex justify-end gap-2",
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [customMetadata, setCustomMetadata] = useState<Record<string, string>>(
    {},
  );
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
    setCurrentStep(1);
    setSelectedFile(null);
    setDisplayName("");
    setCustomMetadata({});
    setUploading(false);
  }, []);

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
    setCurrentStep(2);
  };

  const handlePrev = () => setCurrentStep((s) => Math.max(1, s - 1));

  const handleUpload = async () => {
    const hasAccessScope = customMetadata["access_scope"];
    const hasAcademicYear = customMetadata["academic_year"];
    const hasCohort = customMetadata["cohort"];

    if (!hasAccessScope) {
      toast.error("Vui lòng chọn phạm vi truy cập.");
      return;
    }
    if (!hasAcademicYear && !hasCohort) {
      toast.error("Vui lòng chọn năm học hoặc khóa.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile!);
      if (displayName.trim())
        formData.append("displayName", displayName.trim());
      formData.append("customMetadata", JSON.stringify(customMetadata));
      await DocumentsService.uploadFile(formData);
      toast.success("Tải lên thành công.");
      reset();
      onSuccess();
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setUploading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      <ProcessSteps currentStep={currentStep} />

      {/* ── Step 1: Chọn tệp tin ─────────────────────────────────────── */}
      {currentStep === 1 && (
        <>
          <div>
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

                // access_scope → role toggle buttons
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
                          {(
                            [
                              { role: "lecture", label: "Giảng viên" },
                              { role: "student", label: "Sinh viên" },
                            ] as const
                          ).map(({ role, label }) => {
                            const isSelected =
                              currentValue === role || currentValue === "both";
                            const colors = RoleColors[role];
                            return (
                              <button
                                key={role}
                                type="button"
                                onClick={() => {
                                  // Toggle logic: both / single / private
                                  const isLecture =
                                    currentValue === "lecture" ||
                                    currentValue === "both";
                                  const isStudent =
                                    currentValue === "student" ||
                                    currentValue === "both";
                                  let next: string;
                                  if (role === "lecture") {
                                    const nowLecture = !isLecture;
                                    next =
                                      nowLecture && isStudent
                                        ? "both"
                                        : nowLecture
                                          ? "lecture"
                                          : isStudent
                                            ? "student"
                                            : "private";
                                  } else {
                                    const nowStudent = !isStudent;
                                    next =
                                      isLecture && nowStudent
                                        ? "both"
                                        : isLecture
                                          ? "lecture"
                                          : nowStudent
                                            ? "student"
                                            : "private";
                                  }
                                  handleMetadataChange(type.key, next);
                                }}
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                                  isSelected
                                    ? `${colors.bg} ${colors.text} border-transparent`
                                    : "dark:bg-navy-800 border-gray-200 bg-gray-100 text-gray-500 dark:border-white/10 dark:text-gray-400"
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Quyền truy cập:{" "}
                          <span className="font-medium">
                            {currentValue === "private" && "Nội bộ"}
                            {currentValue === "student" && "Chỉ sinh viên"}
                            {currentValue === "lecture" && "Chỉ giảng viên"}
                            {currentValue === "both" && "Tất cả mọi người"}
                            {!currentValue && "—"}
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
