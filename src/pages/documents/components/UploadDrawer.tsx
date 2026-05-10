import { message as toast } from "antd";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { MdClose, MdCloudUpload, MdDescription } from "react-icons/md";

import Drawer from "@/components/drawer/Drawer";
import SelectField from "@/components/fields/SelectField";
import { DocumentsService } from "@/services/documents";
import { parseError } from "@/utils/parseError";

// ── Constants ─────────────────────────────────────────────────────────────────

export const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".rtf",
  ".md",
  ".xls",
  ".xlsx",
  ".xlsm",
  ".xlsb",
  ".ppt",
  ".pptx",
  ".pptm",
  ".csv",
  ".tsv",
  ".html",
  ".xml",
  ".json",
  ".ods",
  ".odp",
  ".odt",
];

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// ── Document type config ──────────────────────────────────────────────────────

export const DOCUMENT_TYPES = [
  { value: "ctdt", label: "Chương trình đề án", color: "#6366f1" },
  { value: "cong_van", label: "Công văn", color: "#0ea5e9" },
  { value: "quyet_dinh", label: "Quyết định", color: "#f59e0b" },
];

export const DOCUMENT_TYPE_MAP: Record<string, string> = Object.fromEntries(
  DOCUMENT_TYPES.map((t) => [t.value, t.label]),
);

export const DOCUMENT_TYPE_COLOR_MAP: Record<string, string> =
  Object.fromEntries(DOCUMENT_TYPES.map((t) => [t.value, t.color]));

// ── Year range input ──────────────────────────────────────────────────────────

interface YearRangeInputProps {
  label: string;
  fromYear: string;
  toYear: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}

const YearRangeInput: React.FC<YearRangeInputProps> = ({
  label,
  fromYear,
  toYear,
  onFromChange,
  onToChange,
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
      {label}{" "}
      <span className="font-normal text-gray-400 normal-case">
        (để trống = áp dụng tất cả)
      </span>
    </label>
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={fromYear}
        onChange={(e) => onFromChange(e.target.value)}
        placeholder="Từ năm"
        min={2000}
        max={2099}
        className="dark:bg-navy-800 w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-400 dark:border-white/10 dark:text-white dark:placeholder:text-white/30"
      />
      <span className="shrink-0 text-sm text-gray-400">—</span>
      <input
        type="number"
        value={toYear}
        onChange={(e) => onToChange(e.target.value)}
        placeholder="Đến năm"
        min={2000}
        max={2099}
        className="dark:bg-navy-800 w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-400 dark:border-white/10 dark:text-white dark:placeholder:text-white/30"
      />
    </div>
  </div>
);

// ── UploadForm ────────────────────────────────────────────────────────────────

interface UploadFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
  actionsClassName?: string;
}

export const UploadForm: React.FC<UploadFormProps> = ({
  onSuccess,
  onCancel,
  actionsClassName = "flex justify-end gap-2",
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [docType, setDocType] = useState("");
  const [enrollFromYear, setEnrollFromYear] = useState("");
  const [enrollToYear, setEnrollToYear] = useState("");
  const [academicFromYear, setAcademicFromYear] = useState("");
  const [academicToYear, setAcademicToYear] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const closeSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => () => closeSocket(), [closeSocket]);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setDisplayName("");
    setDocType("");
    setEnrollFromYear("");
    setEnrollToYear("");
    setAcademicFromYear("");
    setAcademicToYear("");
    setUploading(false);
    closeSocket();
  }, [closeSocket]);

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

  const buildYearRange = (from: string, to: string) => {
    const fromNum = from ? parseInt(from, 10) : null;
    const toNum = to ? parseInt(to, 10) : null;
    if (fromNum === null && toNum === null) return null;
    return { fromYear: fromNum, toYear: toNum };
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Vui lòng chọn file.");
      return;
    }

    setUploading(true);
    try {
      const customMetadata: Record<string, unknown> = {};

      if (docType) customMetadata.type = docType;

      const enrollRange = buildYearRange(enrollFromYear, enrollToYear);
      if (enrollRange) customMetadata.enrollmentYear = enrollRange;

      const academicRange = buildYearRange(academicFromYear, academicToYear);
      if (academicRange) customMetadata.academicYear = academicRange;

      const clientId =
        (globalThis.crypto?.randomUUID && globalThis.crypto.randomUUID()) ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      closeSocket();
      wsRef.current = DocumentsService.createUploadProgressSocket(clientId, {
        onOpen: () => {},
        onMessage: () => {},
        onError: () => {},
        onClose: () => {},
      });

      const formData = new FormData();
      formData.append("file", selectedFile);
      if (displayName.trim()) {
        formData.append("displayName", displayName.trim());
      }
      formData.append("clientId", clientId);
      if (Object.keys(customMetadata).length > 0) {
        formData.append("customMetadata", JSON.stringify(customMetadata));
      }

      await DocumentsService.uploadFile(formData);
      toast.success("Tải lên thành công. Hệ thống đang xử lý tài liệu.");
      reset();
      onSuccess();
    } catch (err) {
      toast.error(parseError(err));
      closeSocket();
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Bytes`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── File drop zone ─────────────────────────────────────────── */}
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
          <MdCloudUpload className="mb-3 h-10 w-10 text-gray-400" />
          <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Kéo thả file vào đây
          </p>
          <p className="mb-3 text-xs text-gray-500">hoặc</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-brand-500 hover:bg-brand-600 rounded-xl px-5 py-2 text-sm font-medium text-white transition-colors"
          >
            Chọn file
          </button>
          <p className="mt-3 text-xs text-gray-500">
            .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx,... | Tối đa 20MB
          </p>
        </div>
      ) : (
        <div className="dark:bg-navy-800 flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-brand-500 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white">
              <MdDescription className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800 dark:text-white">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="ml-2 shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-200 dark:hover:bg-white/10"
          >
            <MdClose className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* ── Tên hiển thị ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
          Tên hiển thị{" "}
          <span className="font-normal text-gray-400 normal-case">
            (tùy chọn)
          </span>
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="dark:bg-navy-800 w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-400 dark:border-white/10 dark:text-white dark:placeholder:text-white/30"
          placeholder="Nhập tên hiển thị của tài liệu"
        />
      </div>

      {/* ── Loại tài liệu ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
          Loại tài liệu
        </label>
        <SelectField
          value={docType}
          onChange={setDocType}
          options={[{ value: "", label: "— Chọn loại —" }, ...DOCUMENT_TYPES]}
        />
      </div>

      {/* ── Năm tuyển sinh ─────────────────────────────────────────── */}
      <YearRangeInput
        label="Khóa tuyển sinh"
        fromYear={enrollFromYear}
        toYear={enrollToYear}
        onFromChange={setEnrollFromYear}
        onToChange={setEnrollToYear}
      />

      {/* ── Năm học ────────────────────────────────────────────────── */}
      <YearRangeInput
        label="Năm học"
        fromYear={academicFromYear}
        toYear={academicToYear}
        onFromChange={setAcademicFromYear}
        onToChange={setAcademicToYear}
      />

      {/* ── Action buttons ─────────────────────────────────────────── */}
      <div className={actionsClassName}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
          >
            Hủy
          </button>
        )}
        <button
          type="button"
          disabled={uploading || !selectedFile}
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
              <MdCloudUpload className="h-4 w-4" />
              Tải lên
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ── UploadDrawer (Drawer shell) ───────────────────────────────────────────────

interface UploadDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadDrawer: React.FC<UploadDrawerProps> = ({
  open,
  onClose,
  onSuccess,
}) => (
  <Drawer
    isOpen={open}
    onClose={onClose}
    title="Tải lên tài liệu mới"
    width="max-w-xl"
  >
    <UploadForm
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
