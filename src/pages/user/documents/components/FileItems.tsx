import React, { useMemo } from "react";
import {
  MdFileDownload,
  MdInfoOutline,
  MdVisibility,
} from "react-icons/md";
import Tag from "@/components/tag/Tag";
import { formatDate } from "@/utils/date";
import FileIcon from "./FileIcon";

interface FileItemProps {
  file: any;
  metadataTypes: any[];
  onDetail: () => void;
  onPreview: () => void;
  onDownload: () => void;
}

function useVisibleTags(
  meta: Record<string, string>,
  metadataTypes: any[],
  limit: number
) {
  return useMemo(() => {
    const tags: Array<{ label: string; color?: string }> = [];
    metadataTypes.forEach((type) => {
      if (type.key === "access_scope") return;
      const val = meta[type.key];
      if (!val) return;
      const valDef = type.allowedValues?.find((v: any) => v.value === val);
      if (valDef) tags.push({ label: valDef.displayName || val, color: valDef.color });
    });
    return tags.slice(0, limit);
  }, [meta, metadataTypes, limit]);
}

// ── Grid Card ──────────────────────────────────────────────────────────────────

export const FileCard: React.FC<FileItemProps> = ({
  file,
  metadataTypes,
  onDetail,
  onPreview,
  onDownload,
}) => {
  const name = file.displayName || file.originalFilename || "—";
  const meta = file.customMetadata || {};
  const visibleTags = useVisibleTags(meta, metadataTypes, 2);

  return (
    <div className="group dark:bg-navy-800 relative flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md dark:border-white/8 dark:hover:border-white/16">
      {/* Top: icon + actions */}
      <div className="flex items-start justify-between">
        <FileIcon filename={file.originalFilename || name} size="md" />

        <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            type="button"
            title="Xem trước"
            onClick={onPreview}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 transition-colors hover:bg-brand-500/20 dark:bg-brand-500/15 dark:hover:bg-brand-500/25"
          >
            <MdVisibility className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Tải xuống"
            onClick={onDownload}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-500/10 text-green-600 transition-colors hover:bg-green-500/20 dark:bg-green-500/15 dark:hover:bg-green-500/25"
          >
            <MdFileDownload className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Chi tiết"
            onClick={onDetail}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-white/8 dark:text-gray-400 dark:hover:bg-white/12"
          >
            <MdInfoOutline className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Name */}
      <button type="button" className="text-left" onClick={onPreview}>
        <p className="text-navy-700 line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-brand-500 dark:text-white dark:group-hover:text-brand-400">
          {name}
        </p>
        <p className="mt-0.5 truncate text-xs text-gray-400">
          {formatDate(file.createdAt)}
        </p>
      </button>

      {/* Tags */}
      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleTags.map((tag, i) => (
            <Tag key={i} color={tag.color || "#6366f1"} className="text-[10px]">
              {tag.label}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
};

// ── List Row ───────────────────────────────────────────────────────────────────

export const FileRow: React.FC<FileItemProps> = ({
  file,
  metadataTypes,
  onDetail,
  onPreview,
  onDownload,
}) => {
  const name = file.displayName || file.originalFilename || "—";
  const meta = file.customMetadata || {};
  const visibleTags = useVisibleTags(meta, metadataTypes, 3);

  return (
    <div className="group dark:bg-navy-800 flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-4 py-3 transition-all duration-150 hover:border-gray-200 hover:shadow-sm dark:border-white/8 dark:hover:border-white/16">
      <FileIcon filename={file.originalFilename || name} size="sm" />

      <div className="min-w-0 flex-1">
        <button type="button" className="w-full text-left" onClick={onPreview}>
          <p className="text-navy-700 truncate text-sm font-semibold transition-colors group-hover:text-brand-500 dark:text-white dark:group-hover:text-brand-400">
            {name}
          </p>
          <p className="truncate text-xs text-gray-400">{file.originalFilename}</p>
        </button>
      </div>

      <div className="hidden items-center gap-1.5 sm:flex">
        {visibleTags.map((tag, i) => (
          <Tag key={i} color={tag.color || "#6366f1"} className="text-[10px]">
            {tag.label}
          </Tag>
        ))}
      </div>

      <p className="hidden shrink-0 text-xs text-gray-400 lg:block">
        {formatDate(file.createdAt)}
      </p>

      <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <button
          type="button"
          title="Xem trước"
          onClick={onPreview}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 dark:bg-brand-500/15"
        >
          <MdVisibility className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Tải xuống"
          onClick={onDownload}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:bg-green-500/15"
        >
          <MdFileDownload className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Chi tiết"
          onClick={onDetail}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/8 dark:text-gray-400 dark:hover:bg-white/12"
        >
          <MdInfoOutline className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
