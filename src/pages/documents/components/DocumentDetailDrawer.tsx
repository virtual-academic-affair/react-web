import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { message as toast } from "antd";
import { MdDeleteOutline, MdSave } from "react-icons/md";

import Drawer from "@/components/drawer/Drawer";
import Tooltip from "@/components/tooltip/Tooltip";
import { DocumentsService } from "@/services/documents.service";
import { RoleColors } from "@/types/users";
import { formatDate } from "@/utils/date";
import { parseError } from "@/utils/parseError";

interface MetadataType {
  key: string;
  displayName: string;
  allowedValues?: Array<{
    value: string;
    displayName: string;
    color?: string;
    visibleRoles?: string[];
  }>;
}

interface DocumentDetailDrawerProps {
  fileId: string | null;
  metadataTypes: MetadataType[];
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}

const DocumentDetailDrawer: React.FC<DocumentDetailDrawerProps> = ({
  fileId,
  metadataTypes,
  isOpen,
  onClose,
  onDeleted,
  onUpdated,
}) => {
  const isEdit = Boolean(fileId);

  // File data
  const [displayName, setDisplayName] = useState("");
  const [customMetadata, setCustomMetadata] = useState<Record<string, string>>({});
  const [originalDisplayName, setOriginalDisplayName] = useState("");
  const [originalMetadata, setOriginalMetadata] = useState<Record<string, string>>({});

  // Saving states
  const [saving, setSaving] = useState(false);

  // Fetch file detail
  const { data: fileDetail, isLoading } = useQuery({
    queryKey: ["documents", fileId],
    queryFn: () => DocumentsService.getFileDetail(fileId!),
    enabled: Boolean(fileId),
  });

  // Initialize form when fileDetail changes
  useEffect(() => {
    if (fileDetail) {
      setDisplayName(fileDetail.displayName || fileDetail.originalFilename || "");
      setOriginalDisplayName(fileDetail.displayName || fileDetail.originalFilename || "");

      const meta = fileDetail.customMetadata || {};
      setCustomMetadata(meta);
      setOriginalMetadata(meta);
    }
  }, [fileDetail]);

  // Check if dirty
  const isDirty = useMemo(() => {
    if (!fileDetail) return false;
    return (
      displayName !== originalDisplayName ||
      JSON.stringify(customMetadata) !== JSON.stringify(originalMetadata)
    );
  }, [displayName, originalDisplayName, customMetadata, originalMetadata, fileDetail]);

  // Handle metadata change
  const handleMetadataChange = (key: string, value: string) => {
    setCustomMetadata((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle save
  const handleSave = async () => {
    if (!fileId) return;

    setSaving(true);
    try {
      const updated = await DocumentsService.updateFileMetadata(fileId, {
        displayName: displayName.trim() || undefined,
        customMetadata,
      });

      setOriginalDisplayName(updated.displayName || updated.originalFilename || "");
      setOriginalMetadata(updated.customMetadata || {});

      toast.success("Cập nhật thành công.");
      onUpdated();
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!fileId) return;
    if (!window.confirm(`Xóa tệp "${fileDetail?.displayName || fileDetail?.originalFilename}"?`)) {
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
      setOriginalDisplayName("");
      setOriginalMetadata({});
    }
  }, [isOpen]);

  // Footer
  const footerLeft = isEdit && (
    <Tooltip label="Xóa tệp tin">
      <button
        type="button"
        disabled={saving}
        onClick={handleDelete}
        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MdDeleteOutline className="h-4 w-4" />
      </button>
    </Tooltip>
  );

  const footerRight = isDirty ? (
    <>
      <button
        type="button"
        disabled={saving}
        onClick={() => {
          setDisplayName(originalDisplayName);
          setCustomMetadata(originalMetadata);
        }}
        className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
      >
        Hủy
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="bg-brand-500 hover:bg-brand-600 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        <MdSave className="h-4 w-4" />
        {saving ? "Đang lưu..." : "Lưu"}
      </button>
    </>
  ) : null;

  // Get metadata type display info
  const getMetadataInfo = (key: string) => {
    const type = metadataTypes.find((t) => t.key === key);
    if (!type) return { typeName: key, allowedValues: [] };

    const currentValue = customMetadata[key];
    const allowedValue = type.allowedValues?.find((v) => v.value === currentValue);

    return {
      typeName: type.displayName || key,
      allowedValues: type.allowedValues || [],
      currentColor: allowedValue?.color || RoleColors.student.bg,
    };
  };

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
        <div className="flex items-center justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* File info section */}
          <div className="border-b border-gray-100 pb-5 dark:border-white/10">
            <p className="text-navy-700 mb-4 text-xs font-semibold tracking-wide uppercase dark:text-white">
              Thông tin tệp tin
            </p>

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
                  className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
                  placeholder="Tên hiển thị"
                />
              </div>
            </div>

            {/* Tên file gốc */}
            <div className="flex items-start gap-6">
              <div className="w-40 shrink-0">
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Tên file gốc
                </p>
              </div>
              <div className="flex-1">
                <p className="text-navy-700 text-sm dark:text-white">
                  {fileDetail?.originalFilename || "—"}
                </p>
              </div>
            </div>

            {/* Kích thước */}
            <div className="flex items-start gap-6">
              <div className="w-40 shrink-0">
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Kích thước
                </p>
              </div>
              <div className="flex-1">
                <p className="text-navy-700 text-sm dark:text-white">
                  {fileDetail?.fileSize
                    ? `${(fileDetail.fileSize / 1024 / 1024).toFixed(2)} MB`
                    : "—"}
                </p>
              </div>
            </div>

            {/* Trạng thái */}
            <div className="flex items-start gap-6">
              <div className="w-40 shrink-0">
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Trạng thái
                </p>
              </div>
              <div className="flex-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    fileDetail?.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400"
                  }`}
                >
                  {fileDetail?.status === "active" ? "Hiển thị" : "Ẩn"}
                </span>
              </div>
            </div>

            {/* Ngày tải lên */}
            <div className="flex items-start gap-6">
              <div className="w-40 shrink-0">
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Ngày tải lên
                </p>
              </div>
              <div className="flex-1">
                <p className="text-navy-700 text-sm dark:text-white">
                  {fileDetail?.createdAt ? formatDate(fileDetail.createdAt) : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata section */}
          <div>
            <p className="text-navy-700 mb-4 text-xs font-semibold tracking-wide uppercase dark:text-white">
              Nhãn tài liệu
            </p>

            {metadataTypes.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có nhãn nào được cấu hình.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {metadataTypes.map((type) => {
                  const info = getMetadataInfo(type.key);
                  const currentValue = customMetadata[type.key] || "";

                  // Access scope is special - show as role tags
                  if (type.key === "access_scope") {
                    return (
                      <div key={type.key} className="flex items-start gap-6">
                        <div className="w-40 shrink-0">
                          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                            {info.typeName}
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
                                  onClick={() => handleMetadataChange(type.key, val.value)}
                                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                                    isSelected
                                      ? `${colors.bg} ${colors.text} border-transparent`
                                      : "border-gray-200 bg-gray-100 text-gray-500 dark:border-white/10 dark:bg-navy-800 dark:text-gray-400"
                                  }`}
                                >
                                  {val.displayName || val.value}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Other metadata types - dropdown select
                  return (
                    <div key={type.key} className="flex items-start gap-6">
                      <div className="w-40 shrink-0">
                        <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                          {info.typeName}
                        </p>
                      </div>
                      <div className="flex-1">
                        <select
                          value={currentValue}
                          onChange={(e) => handleMetadataChange(type.key, e.target.value)}
                          className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white dark:bg-navy-800"
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

          {/* Technical info */}
          {fileDetail && (
            <div className="border-t border-gray-100 pt-5 dark:border-white/10">
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
                    <p className="text-navy-700 text-sm dark:text-white break-all">
                      {fileDetail.fileId}
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
                    <p className="text-navy-700 text-sm dark:text-white">
                      {formatDate(fileDetail.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};

export default DocumentDetailDrawer;
