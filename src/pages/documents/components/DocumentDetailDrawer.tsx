import { useQuery } from "@tanstack/react-query";
import { message as toast } from "antd";
import React, { useEffect, useState } from "react";
import { MdDeleteOutline } from "react-icons/md";

import Drawer from "@/components/drawer/Drawer";
import Tag from "@/components/tag/Tag";
import Tooltip from "@/components/tooltip/Tooltip";
import { DocumentsService, MetadataService } from "@/services/documents";
import { RoleColors } from "@/types/users";
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
}

const DocumentDetailDrawer: React.FC<DocumentDetailDrawerProps> = ({
  fileId,
  metadataTypes,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const isEdit = Boolean(fileId);

  // File data
  const [displayName, setDisplayName] = useState("");
  const [customMetadata, setCustomMetadata] = useState<Record<string, string>>(
    {},
  );

  // Saving states
  const [saving, setSaving] = useState(false);

  // Fetch file detail
  const { data: fileDetail, isLoading } = useQuery({
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
      const meta = fileDetail.customMetadata || {};
      setCustomMetadata(meta);
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
    }
  }, [isOpen]);

  // Get metadata type display info with full details
  const getMetadataInfo = (key: string) => {
    // Use fullMetadataTypes for display (includes inactive)
    const type = fullMetadataTypes.find((t: MetadataType) => t.key === key);
    if (!type) {
      // Fallback to filtered metadataTypes
      const fallback = metadataTypes.find((t: MetadataType) => t.key === key);
      return {
        typeName: key,
        allowedValues: [],
        isTypeActive: fallback?.isActive ?? true,
      };
    }

    const currentValue = customMetadata[key];
    const allowedValue = type.allowedValues?.find(
      (v: MetadataValue) => v.value === currentValue,
    );

    return {
      typeName: type.displayName || key,
      allowedValues: type.allowedValues || [],
      isTypeActive: type.isActive,
      currentColor: allowedValue?.color || RoleColors.student.bg,
      currentLabel: allowedValue?.displayName || currentValue || "—",
      currentValueActive: allowedValue?.isActive ?? true,
    };
  };

  // Footer - only show delete button
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

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Chi tiết tài liệu" : "Tải lên tài liệu mới"}
      footerLeft={footerLeft}
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
          <div className="flex items-center gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Phạm vi truy cập
              </p>
            </div>
            <div className="flex-1">
              <AccessScopeBadge
                value={fileDetail?.customMetadata?.accessScope}
              />
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

          {/* Metadata section */}
          {fullMetadataTypes.length > 0 &&
            customMetadata &&
            Object.keys(customMetadata).length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/10">
                <p className="text-navy-700 mb-4 text-xs font-semibold tracking-wide uppercase dark:text-white">
                  Nhãn tài liệu
                </p>

                <div className="flex flex-col gap-6 text-sm text-gray-600 dark:text-gray-400">
                  {fullMetadataTypes
                    .filter((type: MetadataType) => customMetadata[type.key])
                    .map((type: MetadataType) => {
                      const currentValue = customMetadata[type.key];

                      // Access scope: always show 2 tags (Giảng viên, Sinh viên)
                      if (type.key === "access_scope") {
                        return (
                          <div
                            key={type.key}
                            className="flex items-center gap-6"
                          >
                            <div className="w-40 shrink-0">
                              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                                {type.displayName}
                              </p>
                            </div>
                            <div className="flex-1">
                              <AccessScopeBadge value={currentValue} />
                            </div>
                          </div>
                        );
                      }
                      // Other metadata types
                      const info = getMetadataInfo(type.key);
                      const valueInfo = type.allowedValues?.find(
                        (v) => v.value === currentValue,
                      );

                      return (
                        <div
                          key={type.key}
                          className={`flex items-center gap-6 ${!info.isTypeActive ? "opacity-50" : ""}`}
                        >
                          <div className="w-40 shrink-0">
                            <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                              {info.typeName}
                            </p>
                            {!info.isTypeActive && (
                              <p className="text-xs text-gray-400">
                                (Đã vô hiệu hóa)
                              </p>
                            )}
                          </div>
                          <div className="flex-1">
                            <Tag
                              color={
                                valueInfo?.color ||
                                (valueInfo?.isActive !== false
                                  ? "#432afc"
                                  : "#6b7280")
                              }
                            >
                              {valueInfo?.displayName || currentValue}
                              {valueInfo && !valueInfo.isActive && (
                                <span className="ml-1 opacity-70">(Ẩn)</span>
                              )}
                            </Tag>
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
                      {fileDetail?.fileSize
                        ? `${(fileDetail.fileSize / 1024 / 1024).toFixed(2)} MB`
                        : "—"}
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
    </Drawer>
  );
};

export default DocumentDetailDrawer;
