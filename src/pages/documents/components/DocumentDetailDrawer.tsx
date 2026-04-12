import { useQuery } from "@tanstack/react-query";
import { Modal, message as toast } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  MdAdd,
  MdDeleteOutline,
  MdExpandMore,
  MdPreview,
  MdSave,
} from "react-icons/md";

import Drawer from "@/components/drawer/Drawer";
import Tag from "@/components/tag/Tag";
import Tooltip from "@/components/tooltip/Tooltip";
import { DocumentsService, MetadataService } from "@/services/documents";
import { Role, RoleColors } from "@/types/users";
import { formatDate } from "@/utils/date";
import { parseError } from "@/utils/parseError";
import AccessScopeBadge from "./AccessScopeBadge";

interface MetadataValue {
  value: string;
  displayName: string;
  isActive: boolean;
  color?: string;
  visibleRoles?: string[];
}

interface MetadataType {
  key: string;
  displayName: string;
  isActive: boolean;
  allowedValues?: MetadataValue[];
}

interface DocumentDetailDrawerProps {
  fileId: string | null;
  metadataTypes: MetadataType[];
  isOpen: boolean;
  isReadOnly?: boolean;
  onClose: () => void;
  onDeleted: () => void;
  onUpdated?: () => void;
  onPreview?: () => void;
  onPreviewMarkdown?: () => void;
}

const ACCESS_SCOPE_KEY = "accessScope";
const ACCESS_SCOPE_VALUES = ["lecture", "student"] as const;
const COHORT_KEY = "cohort";
const EXCLUDED_COHORT_VALUES = ["test"] as const;

const ACCESS_SCOPE_COLORS: Record<(typeof ACCESS_SCOPE_VALUES)[number], string> = {
  student: RoleColors[Role.Student].hex,
  lecture: RoleColors[Role.Lecture].hex,
};

const ACCESS_SCOPE_TEXT: Record<(typeof ACCESS_SCOPE_VALUES)[number], string> = {
  lecture: "Giảng viên",
  student: "Sinh viên",
};

const normalizeToArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (typeof value === "string") {
    return value ? [value] : [];
  }
  return [];
};

const normalizeCustomMetadata = (
  metadata: Record<string, unknown> | undefined,
): Record<string, string[]> => {
  if (!metadata) return {};
  return Object.entries(metadata).reduce<Record<string, string[]>>(
    (acc, [key, value]) => {
      const normalized = normalizeToArray(value);
      const sanitized =
        key === COHORT_KEY
          ? normalized.filter(
              (item) =>
                !EXCLUDED_COHORT_VALUES.includes(
                  item as (typeof EXCLUDED_COHORT_VALUES)[number],
                ),
            )
          : normalized;
      if (sanitized.length > 0) {
        acc[key] = sanitized;
      }
      return acc;
    },
    {},
  );
};

const metadataFingerprint = (metadata: Record<string, string[]>) => {
  const normalized = Object.keys(metadata)
    .sort()
    .map((key) => [key, [...(metadata[key] || [])].sort()]);
  return JSON.stringify(normalized);
};

const DocumentDetailDrawer: React.FC<DocumentDetailDrawerProps> = ({
  fileId,
  metadataTypes,
  isOpen,
  onClose,
  onDeleted,
  onUpdated,
  onPreview,
  onPreviewMarkdown,
}) => {
  const isEdit = Boolean(fileId);

  // File data
  const [displayName, setDisplayName] = useState("");
  const [customMetadata, setCustomMetadata] = useState<Record<string, string[]>>(
    {},
  );
  const [initialCustomMetadata, setInitialCustomMetadata] = useState<
    Record<string, string[]>
  >({});
  const [pickerKey, setPickerKey] = useState<string | null>(null);
  const [accessScopeEditorOpen, setAccessScopeEditorOpen] = useState(false);
  const [accessScopeDraft, setAccessScopeDraft] = useState<string[]>([]);
  const [accessScopeDropdownPos, setAccessScopeDropdownPos] = useState({
    top: 0,
    left: 0,
  });

  // Saving states
  const [saving, setSaving] = useState(false);

  // Fetch file detail
  const { data: fileDetail, isLoading, refetch: refetchDetail } = useQuery({
    queryKey: ["documents", fileId],
    queryFn: () => DocumentsService.getFileDetail(fileId!),
    enabled: Boolean(fileId),
  });

  // Fetch full metadata types for display (including inactive)
  const { data: fullMetadataTypes = [] } = useQuery({
    queryKey: ["metadata-types-full"],
    queryFn: () => MetadataService.listTypes(),
    enabled: Boolean(fileId),
  });

  // Initialize form when fileDetail changes
  useEffect(() => {
    if (fileDetail) {
      setDisplayName(
        fileDetail.displayName || fileDetail.originalFilename || "",
      );
      const normalized = normalizeCustomMetadata(fileDetail.customMetadata);
      const accessScope = normalizeToArray(
        fileDetail?.customMetadata?.access_scope,
      );
      if (accessScope.length > 0 && normalized[ACCESS_SCOPE_KEY]?.length === 0) {
        normalized[ACCESS_SCOPE_KEY] = accessScope;
      }
      setCustomMetadata(normalized);
      setInitialCustomMetadata(normalized);
      setPickerKey(null);
    }
  }, [fileDetail]);

  // Handle delete
  const handleDelete = async () => {
    if (!fileId) return;
    if (
      !window.confirm(
        `Xóa tệp "${fileDetail?.displayName || fileDetail?.originalFilename}"?`,
      )
    ) {
      return;
    }

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
    }
  };

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setDisplayName("");
      setCustomMetadata({});
      setInitialCustomMetadata({});
      setPickerKey(null);
      setAccessScopeEditorOpen(false);
      setAccessScopeDraft([]);
    }
  }, [isOpen]);

  const editableMetadataTypes = useMemo(() => {
    const merged = [...fullMetadataTypes];
    metadataTypes.forEach((item) => {
      if (!merged.some((m: MetadataType) => m.key === item.key)) {
        merged.push(item);
      }
    });
    return merged.filter(
      (type: MetadataType) =>
        type.key !== "access_scope" &&
        type.key !== ACCESS_SCOPE_KEY &&
        type.key !== "department" &&
        type.isActive !== false &&
        type.key !== "cohort_test",
    );
  }, [fullMetadataTypes, metadataTypes]);

  const handleAddMetadataValue = (key: string, value: string) => {
    const normalizedValue = key === ACCESS_SCOPE_KEY ? value.toLowerCase() : value;

    if (
      key === ACCESS_SCOPE_KEY &&
      !ACCESS_SCOPE_VALUES.includes(
        normalizedValue as (typeof ACCESS_SCOPE_VALUES)[number],
      )
    ) {
      toast.error("Phạm vi truy cập chỉ hỗ trợ: student, lecture.");
      return;
    }

    setCustomMetadata((prev) => {
      const existing = prev[key] || [];
      if (existing.includes(normalizedValue)) return prev;
      return { ...prev, [key]: [...existing, normalizedValue] };
    });
    setPickerKey(null);
  };

  const pickerType = useMemo(() => {
    if (!pickerKey) return null;
    return editableMetadataTypes.find((type) => type.key === pickerKey) || null;
  }, [editableMetadataTypes, pickerKey]);

  const pickerOptions = useMemo(() => {
    if (!pickerKey) return [] as { value: string; label: string }[];


    return (pickerType?.allowedValues || [])
      .filter((item: MetadataValue) => item.isActive !== false)
      .filter(
        (item: MetadataValue) =>
          !(
            pickerKey === COHORT_KEY &&
            EXCLUDED_COHORT_VALUES.includes(
              item.value as (typeof EXCLUDED_COHORT_VALUES)[number],
            )
          ),
      )
      .map((item: MetadataValue) => ({
        value: item.value,
        label: item.displayName || item.value,
      }));
  }, [pickerKey, pickerType]);

  const handleRemoveMetadataValue = (key: string, value: string) => {
    setCustomMetadata((prev) => {
      const existing = prev[key] || [];
      const nextValues = existing.filter((item) => item !== value);
      if (nextValues.length === 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: nextValues };
    });
  };

  const handleOpenAccessScopeEditor = (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (saving) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setAccessScopeDropdownPos({ top: rect.bottom + 4, left: rect.left });
    setAccessScopeDraft([...(customMetadata[ACCESS_SCOPE_KEY] || [])]);
    setAccessScopeEditorOpen(true);
  };

  const handleToggleAccessScope = (
    scope: (typeof ACCESS_SCOPE_VALUES)[number],
  ) => {
    setAccessScopeDraft((prev) =>
      prev.includes(scope) ? prev.filter((item) => item !== scope) : [...prev, scope],
    );
  };

  const handleSaveAccessScope = () => {
    setCustomMetadata((prev) => {
      if (accessScopeDraft.length === 0) {
        const { [ACCESS_SCOPE_KEY]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [ACCESS_SCOPE_KEY]: accessScopeDraft };
    });
    setAccessScopeEditorOpen(false);
  };

  const hasMetadataChanges = useMemo(() => {
    return (
      metadataFingerprint(customMetadata) !==
      metadataFingerprint(initialCustomMetadata)
    );
  }, [customMetadata, initialCustomMetadata]);

  const handleSaveMetadata = async () => {
    if (!fileId || !hasMetadataChanges) return;
    setSaving(true);
    try {
      await DocumentsService.updateFileMetadata(fileId, {
        customMetadata,
      });
      await refetchDetail();
      onUpdated?.();
      toast.success("Đã cập nhật nhãn tài liệu.");
      setInitialCustomMetadata(customMetadata);
      onClose();
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setSaving(false);
    }
  };

  // Footer trái: cùng cỡ / gap như drawer chi tiết đăng ký lớp (h-10 w-10, rounded-2xl, icon h-4 w-4, gap-3)
  const footerLeft = isEdit && (
    <div className="flex items-center gap-3">
      {onPreview ? (
        <Tooltip label="Xem trước tệp">
          <button
            type="button"
            disabled={saving}
            onClick={onPreview}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <MdPreview className="h-4 w-4" />
          </button>
        </Tooltip>
      ) : null}
      <Tooltip label="Xóa tệp tin">
        <button
          type="button"
          disabled={saving}
          onClick={handleDelete}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
        >
          <MdDeleteOutline className="h-4 w-4" />
        </button>
      </Tooltip>
    </div>
  );

  const footerRight = isEdit ? (
    <button
      type="button"
      disabled={saving || !hasMetadataChanges}
      onClick={handleSaveMetadata}
      className="inline-flex h-10 items-center gap-2 rounded-2xl bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <MdSave className="h-4 w-4" />
      Lưu metadata
    </button>
  ) : null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Chi tiết tài liệu" : "Tải lên tài liệu mới"}
      footerLeft={footerLeft}
      footerRight={footerRight}
      width="max-w-2xl"
    >
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="dark:bg-navy-700 h-5 animate-pulse rounded bg-gray-200"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* File info section */}
          {/* Tên hiển thị */}
          <div className="flex items-center gap-6">
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
                className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
                placeholder="Tên hiển thị"
              />
            </div>
          </div>

          {/* Phạm vi truy cập */}
          <div className="flex items-start gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-brand-500 uppercase dark:text-brand-300">
                Phạm vi truy cập
              </p>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {(customMetadata[ACCESS_SCOPE_KEY] || []).map((scope) => (
                  <span key={scope} className="relative inline-flex">
                    <Tag
                      color={
                        ACCESS_SCOPE_COLORS[
                          scope as (typeof ACCESS_SCOPE_VALUES)[number]
                        ] || "#4225ff"
                      }
                      className="pr-5"
                      interactive={false}
                    >
                      {ACCESS_SCOPE_TEXT[
                        scope as (typeof ACCESS_SCOPE_VALUES)[number]
                      ] || scope}
                    </Tag>
                    <button
                      type="button"
                      onClick={() => handleRemoveMetadataValue(ACCESS_SCOPE_KEY, scope)}
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full border border-gray-200 bg-gray-100 text-[10px] leading-4 text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={handleOpenAccessScopeEditor}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  <MdExpandMore className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Trạng thái */}
          <div className="flex items-center gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Trạng thái xử lý
              </p>
            </div>
            <div className="flex-1">
              <Tag
                color={fileDetail?.status === "active" ? "#22c55e" : "#b2161e"}
              >
                {fileDetail?.status === "active"
                  ? "Đang hoạt động"
                  : "Thất bại"}
              </Tag>
            </div>
          </div>

          {/* Tóm tắt */}
          <div className="flex items-start gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Tóm tắt
              </p>
            </div>
            <div className="flex-1">
              <p className="text-navy-700 text-sm whitespace-pre-wrap dark:text-white">
                {fileDetail?.summary || "—"}
              </p>
            </div>
          </div>

          {/* Mục lục */}
          <div className="flex items-start gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Mục lục
              </p>
            </div>
            <div className="flex-1">
              {Array.isArray(fileDetail?.tableOfContents) &&
              fileDetail.tableOfContents.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
                  {fileDetail.tableOfContents.map((item: string, idx: number) => (
                    <li key={`${idx}-${item}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">—</p>
              )}
            </div>
          </div>

          {/* Liên kết file */}
          <div className="flex items-start gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Liên kết file
              </p>
            </div>
            <div className="flex-1 space-y-1 text-sm">
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
          </div>

          {/* Metadata section */}
          {editableMetadataTypes.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/10">
              <p className="mb-4 text-xs font-semibold tracking-wide text-brand-500 uppercase dark:text-brand-300">
                Nhãn tài liệu
              </p>

              <div className="flex flex-col gap-4 text-sm text-gray-600 dark:text-gray-400">
                {editableMetadataTypes.map((type: MetadataType) => {
                  const values = customMetadata[type.key] || [];
                  const allowedValues = type.allowedValues || [];

                  return (
                    <div key={type.key} className="flex items-start gap-6">
                      <div className="w-40 shrink-0">
                        <p className="mb-1 text-xs font-semibold tracking-wide text-brand-500 uppercase dark:text-brand-300">
                          {type.displayName || type.key}
                        </p>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {values.length > 0 ? (
                            values.map((value) => {
                              const valueMeta = allowedValues.find(
                                (v) => v.value === value,
                              );
                              const valueColor = valueMeta?.color || "#6366f1";
                              return (
                                <span
                                  key={`${type.key}-${value}`}
                                  className="relative inline-flex"
                                >
                                  <Tag color={valueColor} interactive={false}>
                                    {valueMeta?.displayName || value}
                                  </Tag>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveMetadataValue(type.key, value)
                                    }
                                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full border border-gray-200 bg-gray-100 text-[10px] leading-4 text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-gray-500">—</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setPickerKey(type.key)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-600 hover:bg-gray-100"
                          >
                            <MdAdd className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Technical info */}
          {fileDetail && (
            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/10">
              <p className="text-navy-700 mb-3 text-xs font-semibold tracking-wide uppercase dark:text-white">
                Thông số kỹ thuật
              </p>
              <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-6">
                  <div className="w-40 shrink-0">
                    <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      File ID
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-navy-700 text-base break-all dark:text-white">
                      {fileDetail.fileId}
                    </p>
                  </div>
                </div>
                {/* Kích thước */}
                <div className="flex items-center gap-6">
                  <div className="w-40 shrink-0">
                    <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Kích thước
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-navy-700 text-base dark:text-white">
                      {(() => {
                        if (!fileDetail?.fileSize && fileDetail?.fileSize !== 0)
                          return "—";
                        const bytes = fileDetail.fileSize;
                        if (bytes < 1024) return `${bytes} Bytes`;
                        const kb = bytes / 1024;
                        if (kb < 1024) return `${kb.toFixed(2)} KB`;
                        const mb = kb / 1024;
                        return `${mb.toFixed(2)} MB`;
                      })()}
                    </p>
                  </div>
                </div>
                {/* Ngày tải lên */}
                <div className="flex items-center gap-6">
                  <div className="w-40 shrink-0">
                    <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Ngày tải lên
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-navy-700 text-base dark:text-white">
                      {fileDetail?.createdAt
                        ? formatDate(fileDetail.createdAt)
                        : "—"}
                    </p>
                  </div>
                </div>
                {/* Tên file gốc */}
                <div className="flex items-center gap-6">
                  <div className="w-40 shrink-0">
                    <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Tên file gốc
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-navy-700 text-base dark:text-white">
                      {fileDetail?.originalFilename || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-40 shrink-0">
                    <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Cập nhật lần cuối
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-navy-700 text-base dark:text-white">
                      {formatDate(fileDetail.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {accessScopeEditorOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-200"
              onClick={() => setAccessScopeEditorOpen(false)}
            />
            <div
              style={{
                top: accessScopeDropdownPos.top,
                left: accessScopeDropdownPos.left,
              }}
              className="dark:bg-navy-900 fixed z-210 w-64 max-w-[calc(100vw-24px)] rounded-2xl border border-gray-100 bg-white p-3 shadow-lg dark:border-white/10"
            >
              <p className="mb-2 pl-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Phạm vi truy cập
              </p>

              <div className="flex flex-wrap gap-2 p-1">
                {ACCESS_SCOPE_VALUES.map((scope) => {
                  const active = accessScopeDraft.includes(scope);
                  return (
                    <span
                      key={scope}
                      onClick={() => handleToggleAccessScope(scope)}
                      className={`cursor-pointer rounded-full transition-opacity ${
                        active ? "" : "opacity-45"
                      }`}
                    >
                      <AccessScopeBadge value={[scope]} />
                    </span>
                  );
                })}
                <span
                  onClick={() => setAccessScopeDraft([])}
                  className={`cursor-pointer rounded-full transition-opacity ${
                    accessScopeDraft.length === 0 ? "" : "opacity-45"
                  }`}
                >
                  <AccessScopeBadge value={[]} />
                </span>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAccessScopeEditorOpen(false)}
                  className="rounded-xl px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveAccessScope}
                  className="bg-brand-500 hover:bg-brand-600 rounded-xl px-3 py-1.5 text-xs font-medium text-white transition-colors"
                >
                  Lưu
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}

      <Modal
        title={pickerType?.displayName || "Chọn giá trị"}
        open={Boolean(pickerKey)}
        onCancel={() => setPickerKey(null)}
        footer={null}
      >
        <div className="flex flex-wrap gap-2">
          {pickerOptions
            .filter(
              (option: { value: string; label: string }) =>
                !(customMetadata[pickerKey || ""] || []).includes(option.value),
            )
            .map((option: { value: string; label: string }) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleAddMetadataValue(pickerKey!, option.value)}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
              >
                {option.label}
              </button>
            ))}
          {pickerOptions.filter(
            (option: { value: string; label: string }) =>
              !(customMetadata[pickerKey || ""] || []).includes(option.value),
          ).length === 0 && (
            <span className="text-sm text-gray-500">Không còn giá trị để thêm.</span>
          )}
        </div>
      </Modal>
    </Drawer>
  );
};

export default DocumentDetailDrawer;
