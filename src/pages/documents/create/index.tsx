import React, { useState, useRef, useCallback, useMemo } from "react";
import { message as toast } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MdCloudUpload } from "react-icons/md";

import CreatePageLayout from "@/components/layouts/CreatePageLayout";
import { DocumentsService, MetadataService } from "@/services/documents.service";
import { RoleColors } from "@/types/users";
import { parseError } from "@/utils/parseError";

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

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".md", ".html"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const DocumentCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [customMetadata, setCustomMetadata] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: metadataTypes = [] } = useQuery({
    queryKey: ["metadata-types"],
    queryFn: () => MetadataService.listTypes(true),
  });

  // Filter to only show active metadata types with active allowed values
  const activeMetadataTypes = useMemo(() => {
    return metadataTypes
      .filter((type: MetadataType) => type.isActive)
      .map((type: MetadataType) => ({
        ...type,
        allowedValues: (type.allowedValues || []).filter((v: MetadataValue) => v.isActive),
      }));
  }, [metadataTypes]);

  const handleFileSelect = useCallback((file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Định dạng không được hỗ trợ. Cho phép: ${ALLOWED_EXTENSIONS.join(", ")}`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Kích thước file vượt quá 20MB.");
      return;
    }
    setSelectedFile(file);
    if (!displayName) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setDisplayName(nameWithoutExt);
    }
  }, [displayName]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleMetadataChange = (key: string, value: string) => {
    setCustomMetadata((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Vui lòng chọn file.");
      return;
    }

    const hasAccessScope = customMetadata.accessScope;
    const hasAcademicYear = customMetadata.academicYear;
    const hasCohort = customMetadata.cohort;

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
      formData.append("file", selectedFile);
      if (displayName.trim()) {
        formData.append("displayName", displayName.trim());
      }
      formData.append("customMetadata", JSON.stringify(customMetadata));

      await DocumentsService.uploadFile(formData);
      toast.success("Tải lên thành công.");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      navigate("/admin/documents/list");
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setUploading(false);
    }
  };

  const getMetadataInfo = (key: string) => {
    const type = activeMetadataTypes.find((t: MetadataType) => t.key === key);
    if (!type) return { typeName: key, allowedValues: [] as MetadataValue[] };
    return {
      typeName: type.displayName || key,
      allowedValues: type.allowedValues || [],
    };
  };

  return (
    <CreatePageLayout title="Tải lên tài liệu">
      <div className="flex flex-col gap-5">
        {/* File upload area */}
        <div>
          <p className="text-navy-700 mb-3 text-xs font-semibold tracking-wide uppercase dark:text-white">
            Chọn tệp tin
          </p>

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
                Định dạng: {ALLOWED_EXTENSIONS.join(", ")} | Tối đa 20MB
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-navy-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-200 dark:hover:bg-white/10"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
              className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white dark:bg-navy-800"
              placeholder="Tên hiển thị (tùy chọn)"
            />
          </div>
        </div>

        {/* Metadata section */}
        <div>
          <p className="text-navy-700 mb-3 text-xs font-semibold tracking-wide uppercase dark:text-white">
            Nhãn tài liệu
          </p>

          {activeMetadataTypes.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có nhãn nào được cấu hình.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {activeMetadataTypes.map((type: MetadataType) => {
                const info = getMetadataInfo(type.key);
                const currentValue = customMetadata[type.key] || "";

                if (type.key === "access_scope") {
                  return (
                    <div key={type.key} className="flex items-start gap-6">
                      <div className="w-40 shrink-0">
                        <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                          {info.typeName} *
                        </p>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2">
                          {info.allowedValues.map((val: MetadataValue) => {
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

                const isRequired = type.key === "academic_year" || type.key === "cohort";

                return (
                  <div key={type.key} className="flex items-start gap-6">
                    <div className="w-40 shrink-0">
                      <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                        {info.typeName} {isRequired ? "*" : ""}
                      </p>
                    </div>
                    <div className="flex-1">
                      <select
                        value={currentValue}
                        onChange={(e) => handleMetadataChange(type.key, e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white dark:bg-navy-800"
                      >
                        <option value="">— Chọn —</option>
                        {info.allowedValues.map((val: MetadataValue) => (
                          <option key={val.value} value={val.value}>
                            {val.displayName || val.value}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}

              <p className="text-xs text-gray-500">
                * Bắt buộc
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-white/10">
          <button
            type="button"
            disabled={uploading}
            onClick={() => navigate("/admin/documents/list")}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={uploading || !selectedFile}
            onClick={handleUpload}
            className="bg-brand-500 hover:bg-brand-600 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
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
    </CreatePageLayout>
  );
};

export default DocumentCreatePage;
