import React from "react";
import { MdMoreVert } from "react-icons/md";
import Tag from "@/components/tag/Tag";
import { formatCalendarDate } from "@/utils/date";
import {
  DOCUMENT_TYPE_MAP,
  DOCUMENT_TYPE_COLOR_MAP,
} from "@/pages/documents/components/UploadDrawer";
import FileIcon from "./FileIcon";
import { useFileActionsMenu } from "./FileActionsMenu";

interface FileItemProps {
  file: any;
  metadataTypes: any[];
  onPreview: () => void;
  onDownload: () => void;
  onCopyLink: () => void;
  /** Chatbot embedded: hover background only, keep text color. */
  embedded?: boolean;
}

const itemSurfaceClass =
  "group relative rounded-2xl bg-white transition-colors duration-150 hover:bg-gray-50 dark:bg-navy-800 dark:hover:bg-white/5";

const menuTriggerClass =
  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-transparent text-gray-400 transition-colors hover:border-gray-300 dark:text-gray-400 dark:hover:border-white/20";

// ── Grid Card ──────────────────────────────────────────────────────────────────

export const FileCard: React.FC<FileItemProps> = ({
  file,
  onPreview,
  onDownload,
  onCopyLink,
  embedded = false,
}) => {
  const name = file.displayName || file.originalFilename || "—";
  const typeKey = file.customMetadata?.type as string | undefined;
  const typeLabel = typeKey ? DOCUMENT_TYPE_MAP[typeKey] : null;
  const typeColor = typeKey ? DOCUMENT_TYPE_COLOR_MAP[typeKey] : null;
  const { triggerRef, handleContextMenu, toggleTriggerMenu, menu } =
    useFileActionsMenu({ onDownload, onCopyLink });

  return (
    <div
      className={`${itemSurfaceClass} min-w-0 p-3.5`}
      onContextMenu={handleContextMenu}
    >
      <button
        type="button"
        aria-label={`Xem trước ${name}`}
        onClick={onPreview}
        className="absolute inset-0 z-0 rounded-2xl"
      />

      <div className="relative z-10 flex min-w-0 items-start gap-2.5">
        <div className="pointer-events-none shrink-0 pt-0.5">
          <FileIcon filename={file.originalFilename || name} size="xs" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex min-w-0 items-start gap-1">
            <p
              className={`text-navy-700 pointer-events-none line-clamp-2 min-w-0 flex-1 text-sm leading-snug font-medium dark:text-white ${
                embedded ? "" : "group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors"
              }`}
            >
              {name}
            </p>
            <button
              ref={triggerRef}
              type="button"
              onClick={toggleTriggerMenu}
              className={menuTriggerClass}
              aria-label="Tuỳ chọn tài liệu"
              aria-haspopup="menu"
            >
              <MdMoreVert className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="pointer-events-none flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400">
              {formatCalendarDate(file.createdAt)}
            </span>
            {typeLabel ? (
              <Tag
                color={typeColor || "#94a3b8"}
                className="text-[10px]"
                interactive={false}
              >
                {typeLabel}
              </Tag>
            ) : null}
          </div>
        </div>
      </div>

      {menu}
    </div>
  );
};

// ── List Row ───────────────────────────────────────────────────────────────────

export const FileRow: React.FC<FileItemProps> = ({
  file,
  onPreview,
  onDownload,
  onCopyLink,
  embedded = false,
}) => {
  const name = file.displayName || file.originalFilename || "—";
  const typeKey = file.customMetadata?.type as string | undefined;
  const typeLabel = typeKey ? DOCUMENT_TYPE_MAP[typeKey] : null;
  const typeColor = typeKey ? DOCUMENT_TYPE_COLOR_MAP[typeKey] : null;
  const { triggerRef, handleContextMenu, toggleTriggerMenu, menu } =
    useFileActionsMenu({ onDownload, onCopyLink });

  return (
    <div
      className={`${itemSurfaceClass} flex items-center gap-4 px-4 py-3`}
      onContextMenu={handleContextMenu}
    >
      <button
        type="button"
        aria-label={`Xem trước ${name}`}
        onClick={onPreview}
        className="absolute inset-0 z-0 rounded-2xl"
      />

      <div className="pointer-events-none relative z-10">
        <FileIcon filename={file.originalFilename || name} size="sm" />
      </div>

      <div className="pointer-events-none relative z-10 min-w-0 flex-1">
        <p
          className={`text-navy-700 truncate text-sm font-medium dark:text-white ${
            embedded ? "" : "group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors"
          }`}
        >
          {name}
        </p>
      </div>

      {typeLabel && (
        <div className="pointer-events-none relative z-10 hidden items-center gap-1.5 sm:flex">
          <Tag
            color={typeColor || "#94a3b8"}
            className="text-[10px]"
            interactive={false}
          >
            {typeLabel}
          </Tag>
        </div>
      )}

      <p className="pointer-events-none relative z-10 hidden shrink-0 text-xs text-gray-400 md:block">
        {formatCalendarDate(file.createdAt)}
      </p>

      <button
        ref={triggerRef}
        type="button"
        onClick={toggleTriggerMenu}
        className={menuTriggerClass}
        aria-label="Tuỳ chọn tài liệu"
        aria-haspopup="menu"
      >
        <MdMoreVert className="h-4 w-4" aria-hidden />
      </button>

      {menu}
    </div>
  );
};
