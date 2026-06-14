import React from "react";
import { MdFileDownload, MdInfoOutline, MdVisibility } from "react-icons/md";
import Tag from "@/components/tag/Tag";
import { formatDate } from "@/utils/date";
import {
  DOCUMENT_TYPE_MAP,
  DOCUMENT_TYPE_COLOR_MAP,
} from "@/pages/documents/components/UploadDrawer";
import FileIcon from "./FileIcon";

interface FileItemProps {
  file: any;
  metadataTypes: any[];
  onDetail: () => void;
  onPreview: () => void;
  onDownload: () => void;
}

// ── Grid Card ──────────────────────────────────────────────────────────────────

export const FileCard: React.FC<FileItemProps> = ({
  file,
  onDetail,
  onPreview,
  onDownload,
}) => {
  const name = file.displayName || file.originalFilename || "—";
  const typeKey = file.customMetadata?.type as string | undefined;
  const typeLabel = typeKey ? DOCUMENT_TYPE_MAP[typeKey] : null;
  const typeColor = typeKey ? DOCUMENT_TYPE_COLOR_MAP[typeKey] : null;

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
            className="bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 dark:bg-brand-500/15 dark:hover:bg-brand-500/25 flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
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
        <p className="text-navy-700 group-hover:text-brand-500 dark:group-hover:text-brand-400 line-clamp-2 h-10 text-sm leading-snug font-semibold transition-colors dark:text-white">
          {name}
        </p>
        <p className="mt-0.5 truncate text-xs text-gray-400">
          {formatDate(file.createdAt)}
        </p>
      </button>

      {/* Type chip */}
      {typeLabel && (
        <div className="flex flex-wrap gap-1">
          <Tag
            color={typeColor || "#94a3b8"}
            className="text-[10px]"
            interactive={false}
          >
            {typeLabel}
          </Tag>
        </div>
      )}
    </div>
  );
};

// ── List Row ───────────────────────────────────────────────────────────────────

export const FileRow: React.FC<FileItemProps> = ({
  file,
  onDetail,
  onPreview,
  onDownload,
}) => {
  const name = file.displayName || file.originalFilename || "—";
  const typeKey = file.customMetadata?.type as string | undefined;
  const typeLabel = typeKey ? DOCUMENT_TYPE_MAP[typeKey] : null;
  const typeColor = typeKey ? DOCUMENT_TYPE_COLOR_MAP[typeKey] : null;

  return (
    <div className="group dark:bg-navy-800 flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-4 py-3 transition-all duration-150 hover:border-gray-200 hover:shadow-sm dark:border-white/8 dark:hover:border-white/16">
      <FileIcon filename={file.originalFilename || name} size="sm" />

      <div className="min-w-0 flex-1">
        <button type="button" className="w-full text-left" onClick={onPreview}>
          <p className="text-navy-700 group-hover:text-brand-500 dark:group-hover:text-brand-400 truncate text-sm font-semibold transition-colors dark:text-white">
            {name}
          </p>
          <p className="truncate text-xs text-gray-400">
            {file.originalFilename}
          </p>
        </button>
      </div>

      {/* Type chip */}
      {typeLabel && (
        <div className="hidden items-center gap-1.5 sm:flex">
          <Tag
            color={typeColor || "#94a3b8"}
            className="text-[10px]"
            interactive={false}
          >
            {typeLabel}
          </Tag>
        </div>
      )}

      <p className="hidden shrink-0 text-xs text-gray-400 lg:block">
        {formatDate(file.createdAt)}
      </p>

      <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <button
          type="button"
          title="Xem trước"
          onClick={onPreview}
          className="bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 dark:bg-brand-500/15 flex h-8 w-8 items-center justify-center rounded-xl"
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
