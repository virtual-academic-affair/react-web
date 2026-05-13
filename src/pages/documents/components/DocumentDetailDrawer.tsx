import { useQuery } from "@tanstack/react-query";
import { message as toast } from "antd";
import React, { useEffect, useState } from "react";
import { MdDeleteOutline, MdPreview, MdSave } from "react-icons/md";

import Drawer from "@/components/drawer/Drawer";
import ConfirmModal from "@/components/modal/ConfirmModal";
import Tag from "@/components/tag/Tag";
import Tooltip from "@/components/tooltip/Tooltip";
import { DocumentsService } from "@/services/documents";
import { formatDate } from "@/utils/date";
import { parseError } from "@/utils/parseError";
import {
  DOCUMENT_TYPE_COLOR_MAP,
  DOCUMENT_TYPE_MAP,
  DOCUMENT_TYPES,
} from "./UploadDrawer";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DocumentDetailDrawerProps {
  fileId: string | null;
  metadataTypes?: unknown[]; // kept for backward-compat, unused
  isOpen: boolean;
  isReadOnly?: boolean;
  onClose: () => void;
  onDeleted: () => void;
  onUpdated?: () => void;
  onPreview?: () => void;
  onPreviewMarkdown?: () => void;
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ready: { label: "Sẵn sàng", color: "#22c55e" },
  processing: { label: "Đang xử lý", color: "#f59e0b" },
  uploading: { label: "Đang tải lên", color: "#f59e0b" },
  failed: { label: "Thất bại", color: "#b2161e" },
};

const ALL_YEARS_MAX = 9999;
const ALL_YEARS_MIN = 0;

const normalizeYear = (y: number | null | undefined): number | null =>
  y == null || y <= ALL_YEARS_MIN || y >= ALL_YEARS_MAX ? null : y;

/** Format a year range for read-only display */
const formatYearRangeDisplay = (
  range:
    | { fromYear?: number | null; toYear?: number | null }
    | null
    | undefined,
  allLabel: string,
): string => {
  if (!range) return allLabel;
  const from = normalizeYear(range.fromYear);
  const to = normalizeYear(range.toYear);
  if (from === null && to === null) return allLabel;
  if (from === to) return String(from ?? to);
  if (from === null) return `— ${to}`;
  if (to === null) return `${from} —`;
  return `${from} – ${to}`;
};

// ── Row layout helper ─────────────────────────────────────────────────────────

const Row: React.FC<{
  label: string;
  accent?: boolean;
  children: React.ReactNode;
}> = ({ label, accent, children }) => (
  <div className="flex items-start gap-6">
    <div className="w-40 shrink-0">
      <p
        className={`mb-1 text-xs font-semibold tracking-wide uppercase ${
          accent
            ? "text-brand-500 dark:text-brand-300"
            : "text-gray-400 dark:text-gray-500"
        }`}
      >
        {label}
      </p>
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

const DocumentDetailDrawer: React.FC<DocumentDetailDrawerProps> = ({
  fileId,
  isOpen,
  isReadOnly = false,
  onClose,
  onDeleted,
  onUpdated,
  onPreview,
  onPreviewMarkdown,
}) => {
  const [displayName, setDisplayName] = useState("");
  const [docType, setDocType] = useState("");
  const [enrollFromYear, setEnrollFromYear] = useState("");
  const [enrollToYear, setEnrollToYear] = useState("");
  const [academicFromYear, setAcademicFromYear] = useState("");
  const [academicToYear, setAcademicToYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // ── Fetch file detail ───────────────────────────────────────────────────────
  const {
    data: fileDetail,
    isLoading,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ["documents", fileId],
    queryFn: () => DocumentsService.getFileDetail(fileId!),
    enabled: Boolean(fileId),
  });

  // ── Populate form from fetched data ────────────────────────────────────────
  useEffect(() => {
    if (fileDetail) {
      setDisplayName(
        fileDetail.displayName || fileDetail.originalFilename || "",
      );

      const meta = fileDetail.customMetadata || {};
      setDocType(meta.type || "");

      const enroll = meta.enrollmentYear;
      const fromE = normalizeYear(enroll?.fromYear);
      const toE = normalizeYear(enroll?.toYear);
      setEnrollFromYear(fromE != null ? String(fromE) : "");
      setEnrollToYear(toE != null ? String(toE) : "");

      const academic = meta.academicYear;
      const fromA = normalizeYear(academic?.fromYear);
      const toA = normalizeYear(academic?.toYear);
      setAcademicFromYear(fromA != null ? String(fromA) : "");
      setAcademicToYear(toA != null ? String(toA) : "");
    }
  }, [fileDetail]);

  // ── Reset when no file selected ─────────────────────────────────────────────
  useEffect(() => {
    if (!fileId) {
      setDisplayName("");
      setDocType("");
      setEnrollFromYear("");
      setEnrollToYear("");
      setAcademicFromYear("");
      setAcademicToYear("");
    }
  }, [fileId]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const buildYearRange = (from: string, to: string) => {
    const f = from ? parseInt(from, 10) : null;
    const t = to ? parseInt(to, 10) : null;
    if (f === null && t === null) return null;
    return { fromYear: f, toYear: t };
  };

  const hasChanges =
    Boolean(fileDetail) &&
    (displayName !==
      (fileDetail?.displayName || fileDetail?.originalFilename || "") ||
      docType !== (fileDetail?.customMetadata?.type || "") ||
      enrollFromYear !==
        String(
          normalizeYear(fileDetail?.customMetadata?.enrollmentYear?.fromYear) ??
            "",
        ) ||
      enrollToYear !==
        String(
          normalizeYear(fileDetail?.customMetadata?.enrollmentYear?.toYear) ??
            "",
        ) ||
      academicFromYear !==
        String(
          normalizeYear(fileDetail?.customMetadata?.academicYear?.fromYear) ??
            "",
        ) ||
      academicToYear !==
        String(
          normalizeYear(fileDetail?.customMetadata?.academicYear?.toYear) ?? "",
        ));

  // ── Save handler ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!fileId || !hasChanges) return;
    setSaving(true);
    try {
      const customMetadata: Record<string, unknown> = {};
      if (docType) customMetadata.type = docType;
      const enroll = buildYearRange(enrollFromYear, enrollToYear);
      if (enroll) customMetadata.enrollmentYear = enroll;
      const academic = buildYearRange(academicFromYear, academicToYear);
      if (academic) customMetadata.academicYear = academic;

      await DocumentsService.updateFileMetadata(fileId, {
        displayName: displayName.trim() || undefined,
        customMetadata,
      });
      await refetchDetail();
      onUpdated?.();
      toast.success("Đã cập nhật tài liệu.");
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete handler ──────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!fileId) return;
    setSaving(true);
    try {
      await DocumentsService.deleteFile(fileId);
      toast.success("Đã xóa tệp.");
      onDeleted();
      onClose();
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setSaving(false);
      setIsConfirmDeleteOpen(false);
    }
  };

  // ── Footer ──────────────────────────────────────────────────────────────────
  const footerLeft = isReadOnly ? (
    <div className="flex items-center gap-3">
      {onPreview && (
        <Tooltip label="Xem trước tệp">
          <button
            type="button"
            onClick={onPreview}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-white transition-colors hover:bg-blue-600"
          >
            <MdPreview className="h-4 w-4" />
          </button>
        </Tooltip>
      )}
    </div>
  ) : (
    <div className="flex items-center gap-3">
      {onPreview && (
        <Tooltip label="Xem trước tệp">
          <button
            type="button"
            disabled={saving}
            onClick={onPreview}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
          >
            <MdPreview className="h-4 w-4" />
          </button>
        </Tooltip>
      )}
      <Tooltip label="Xóa tệp tin">
        <button
          type="button"
          disabled={saving}
          onClick={() => setIsConfirmDeleteOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MdDeleteOutline className="h-4 w-4" />
        </button>
      </Tooltip>
    </div>
  );

  const footerRight = isReadOnly ? undefined : (
    <button
      type="button"
      disabled={saving || !hasChanges}
      onClick={handleSave}
      className="bg-brand-500 hover:bg-brand-600 inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    >
      <MdSave className="h-4 w-4" />
      Lưu thay đổi
    </button>
  );

  const inputClass =
    "dark:bg-navy-800 w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white placeholder:text-gray-400";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết tài liệu"
      footerLeft={footerLeft}
      footerRight={footerRight}
      width="max-w-2xl"
    >
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="dark:bg-navy-700 h-5 animate-pulse rounded bg-gray-200"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* ── Metadata fields ─────────────────────────────────── */}

          {/* Tên hiển thị */}
          <Row label="Tên hiển thị">
            {isReadOnly ? (
              <p className="text-navy-700 text-sm dark:text-white">
                {fileDetail?.displayName || fileDetail?.originalFilename || "—"}
              </p>
            ) : (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
                placeholder="Tên hiển thị"
              />
            )}
          </Row>

          {/* Loại tài liệu */}
          <Row label="Loại tài liệu">
            {isReadOnly ? (
              docType ? (
                <Tag
                  color={DOCUMENT_TYPE_COLOR_MAP[docType] ?? "#94a3b8"}
                  interactive={false}
                >
                  {DOCUMENT_TYPE_MAP[docType] ?? docType}
                </Tag>
              ) : (
                <p className="text-sm text-gray-400">—</p>
              )
            ) : (
              <Tag
                variant="selection"
                value={docType}
                onChange={setDocType}
                options={DOCUMENT_TYPES}
                color={docType ? DOCUMENT_TYPE_COLOR_MAP[docType] : "#94a3b8"}
                optionColors={DOCUMENT_TYPE_COLOR_MAP}
              >
                {docType ? DOCUMENT_TYPE_MAP[docType] : "— Chọn loại —"}
              </Tag>
            )}
          </Row>

          {/* Khóa tuyển sinh */}
          <Row label="Khóa tuyển sinh">
            {isReadOnly ? (
              <p className="text-navy-700 text-sm dark:text-white">
                {formatYearRangeDisplay(
                  fileDetail?.customMetadata?.enrollmentYear,
                  "Áp dụng cho mọi khóa",
                )}
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={enrollFromYear}
                    onChange={(e) => setEnrollFromYear(e.target.value)}
                    placeholder="Từ năm"
                    min={2000}
                    max={2099}
                    className={inputClass}
                  />
                  <span className="shrink-0 text-sm text-gray-400">—</span>
                  <input
                    type="number"
                    value={enrollToYear}
                    onChange={(e) => setEnrollToYear(e.target.value)}
                    placeholder="Đến năm"
                    min={2000}
                    max={2099}
                    className={inputClass}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Để trống = áp dụng mọi khóa
                </p>
              </>
            )}
          </Row>

          {/* Năm học */}
          <Row label="Năm học">
            {isReadOnly ? (
              <p className="text-navy-700 text-sm dark:text-white">
                {formatYearRangeDisplay(
                  fileDetail?.customMetadata?.academicYear,
                  "Áp dụng cho mọi năm học",
                )}
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={academicFromYear}
                    onChange={(e) => setAcademicFromYear(e.target.value)}
                    placeholder="Từ năm"
                    min={2000}
                    max={2099}
                    className={inputClass}
                  />
                  <span className="shrink-0 text-sm text-gray-400">—</span>
                  <input
                    type="number"
                    value={academicToYear}
                    onChange={(e) => setAcademicToYear(e.target.value)}
                    placeholder="Đến năm"
                    min={2000}
                    max={2099}
                    className={inputClass}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Để trống = áp dụng mọi năm
                </p>
              </>
            )}
          </Row>

          {/* ── Read-only info ───────────────────────────────────── */}
          <div className="mt-2 border-t border-gray-100 pt-4 dark:border-white/10">
            <div className="flex flex-col gap-4">
              {/* Trạng thái */}
              <Row label="Trạng thái xử lý">
                {(() => {
                  const key = String(fileDetail?.status || "").toLowerCase();
                  const cfg = STATUS_CONFIG[key];
                  return cfg ? (
                    <Tag color={cfg.color}>{cfg.label}</Tag>
                  ) : (
                    <Tag color="#94a3b8">Đang xử lý</Tag>
                  );
                })()}
              </Row>

              {/* Mục lục */}
              <Row label="Mục lục">
                {Array.isArray(fileDetail?.tableOfContents) &&
                fileDetail.tableOfContents.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
                    {fileDetail.tableOfContents.map(
                      (item: string, idx: number) => (
                        <li key={`${idx}-${item}`}>{item}</li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">—</p>
                )}
              </Row>

              {/* Liên kết file */}
              <Row label="Liên kết file">
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="mr-2 text-gray-500">Markdown:</span>
                    {fileDetail?.markdownFileUrl ? (
                      <button
                        type="button"
                        onClick={() => onPreviewMarkdown?.()}
                        className="text-brand-500 hover:text-brand-600 underline"
                      >
                        Mở file markdown
                      </button>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </div>
                </div>
              </Row>
            </div>
          </div>

          {/* ── Technical info ───────────────────────────────────── */}
          {fileDetail && !isReadOnly && (
            <div className="border-t border-gray-100 pt-4 dark:border-white/10">
              <p className="text-navy-700 mb-3 text-xs font-semibold tracking-wide uppercase dark:text-white">
                Thông số kỹ thuật
              </p>
              <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Row label="File ID">
                  <p className="text-navy-700 break-all dark:text-white">
                    {fileDetail.fileId}
                  </p>
                </Row>
                <Row label="Kích thước">
                  <p className="text-navy-700 dark:text-white">
                    {(() => {
                      const b = fileDetail.fileSize;
                      if (b == null) return "—";
                      if (b < 1024) return `${b} Bytes`;
                      const kb = b / 1024;
                      if (kb < 1024) return `${kb.toFixed(2)} KB`;
                      return `${(kb / 1024).toFixed(2)} MB`;
                    })()}
                  </p>
                </Row>
                <Row label="Ngày tải lên">
                  <p className="text-navy-700 dark:text-white">
                    {fileDetail.createdAt
                      ? formatDate(fileDetail.createdAt)
                      : "—"}
                  </p>
                </Row>
                <Row label="Tên file gốc">
                  <p className="text-navy-700 dark:text-white">
                    {fileDetail.originalFilename || "—"}
                  </p>
                </Row>
                {fileDetail.updatedAt && (
                  <Row label="Cập nhật lần cuối">
                    <p className="text-navy-700 dark:text-white">
                      {formatDate(fileDetail.updatedAt)}
                    </p>
                  </Row>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!isReadOnly && (
        <ConfirmModal
          open={isConfirmDeleteOpen}
          onCancel={() => setIsConfirmDeleteOpen(false)}
          onConfirm={confirmDelete}
          title="Xác nhận xóa tệp"
          subTitle={`Bạn có chắc chắn muốn xóa tệp "${fileDetail?.displayName || fileDetail?.originalFilename}" không?`}
          loading={saving}
        />
      )}
    </Drawer>
  );
};

export default DocumentDetailDrawer;
