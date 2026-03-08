import { messagesService } from "@/services/email";
import type { PaginatedResponse } from "@/types/common";
import type { Message, SystemLabel } from "@/types/email";
import type { SystemLabelEnumData } from "@/types/shared";
import { message } from "antd";
import React from "react";
import {
  MdChevronLeft,
  MdChevronRight,
  MdLabel,
  MdSearch,
} from "react-icons/md";

function getLabelVi(sl: string, enumData?: SystemLabelEnumData | null): string {
  return enumData?.[sl]?.vi ?? sl;
}

function getLabelColor(
  sl: string,
  enumData?: SystemLabelEnumData | null,
): string {
  return enumData?.[sl]?.color ?? "#888";
}

function labelPillStyle(color: string): React.CSSProperties {
  return { backgroundColor: color + "20", color };
}

function formatDate(iso: string | Date): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface EmailsTableProps {
  result: PaginatedResponse<Message> | null;
  loading: boolean;
  keyword: string;
  page: number;
  systemLabelEnum?: SystemLabelEnumData | null;
  onKeywordChange: (v: string) => void;
  onSearch: () => void;
  onPageChange: (p: number) => void;
  onRowClick: (msg: Message) => void;
  onLabelChanged?: () => void;
}

const EmailsTable: React.FC<EmailsTableProps> = ({
  result,
  loading,
  keyword,
  page,
  systemLabelEnum,
  onKeywordChange,
  onSearch,
  onPageChange,
  onRowClick,
  onLabelChanged,
}) => {
  const { items = [], pagination } = result ?? { items: [], pagination: null };

  // ── inline label editor state ──────────────────────────────────────────────
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [draftLabels, setDraftLabels] = React.useState<SystemLabel[]>([]);
  const [dropdownPos, setDropdownPos] = React.useState({ top: 0, left: 0 });
  const [saving, setSaving] = React.useState(false);

  const openEdit = (e: React.MouseEvent, msg: Message) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    setEditingId(msg.id);
    setDraftLabels([...msg.systemLabels]);
  };

  const closeEdit = () => {
    setEditingId(null);
    setDraftLabels([]);
  };

  const toggleDraftLabel = (label: SystemLabel) => {
    setDraftLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  };

  const saveLabels = async (msgId: number) => {
    setSaving(true);
    try {
      await messagesService.updateMessageLabels(msgId, {
        systemLabels: draftLabels,
      });
      message.success("Cập nhật nhãn thành công.");
      closeEdit();
      onLabelChanged?.();
    } catch {
      message.error("Không thể cập nhật nhãn.");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearch();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="bg-lightPrimary dark:bg-navy-800 flex flex-1 items-center gap-2 rounded-xl px-3 py-2">
          <MdSearch className="h-5 w-5 shrink-0 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm theo tiêu đề, người gửi..."
            className="bg-lightPrimary dark:bg-navy-800 w-full text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
          />
        </div>
        <button
          onClick={onSearch}
          className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          Tìm kiếm
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/10">
              <th className="py-3 pr-4 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Tiêu đề
              </th>
              <th className="py-3 pr-4 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Người gửi
              </th>
              <th className="py-3 pr-4 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Nhãn hệ thống
              </th>
              <th className="py-3 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Thời gian gửi
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-50 dark:border-white/5"
                >
                  {[1, 2, 3, 4].map((c) => (
                    <td key={c} className="py-3 pr-4">
                      <div className="dark:bg-navy-700 h-4 animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="py-12 text-center text-sm text-gray-400"
                >
                  Không tìm thấy email nào.
                </td>
              </tr>
            ) : (
              items.map((msg) => (
                <tr
                  key={msg.id}
                  onClick={() => onRowClick(msg)}
                  className="hover:bg-lightPrimary dark:hover:bg-navy-700 cursor-pointer border-b border-gray-50 transition-colors dark:border-white/5"
                >
                  <td className="max-w-70 truncate py-3 pr-4 text-sm font-medium text-gray-800 dark:text-white">
                    {msg.subject || "(Không có tiêu đề)"}
                  </td>
                  <td className="py-3 pr-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {msg.senderName}
                    </p>
                    <p className="text-xs text-gray-400">{msg.senderEmail}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap items-center gap-1">
                      {msg.systemLabels?.length ? (
                        msg.systemLabels.map((sl) => (
                          <span
                            key={sl}
                            style={labelPillStyle(
                              getLabelColor(sl, systemLabelEnum),
                            )}
                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                          >
                            {getLabelVi(sl, systemLabelEnum)}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
                      <button
                        onClick={(e) => openEdit(e, msg)}
                        title="Chỉnh sửa nhãn"
                        className="hover:text-brand-500 dark:hover:text-brand-400 ml-0.5 rounded p-0.5 text-gray-300 transition-colors dark:text-gray-600"
                      >
                        <MdLabel className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(msg.sentAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-gray-400">
            Trang {pagination.currentPage} / {pagination.totalPages}{" "}
            &nbsp;·&nbsp; {pagination.total} email
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="flex items-center rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/10"
            >
              <MdChevronLeft className="h-5 w-5" />
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`min-w-8 rounded-lg px-2 py-1 text-sm font-medium transition-colors ${
                    p === pagination.currentPage
                      ? "bg-brand-500 text-white"
                      : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pagination.totalPages}
              className="flex items-center rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/10"
            >
              <MdChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Inline label editor dropdown (fixed so table overflow doesn't clip) */}
      {editingId !== null && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={closeEdit} />
          {/* Dropdown panel */}
          <div
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
            className="dark:bg-navy-800 fixed z-50 min-w-44 rounded-2xl border border-gray-100 bg-white p-3 shadow-lg dark:border-white/10"
          >
            <p className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              Nhãn hệ thống
            </p>
            <div className="flex flex-col gap-2">
              {(Object.keys(systemLabelEnum ?? {}) as SystemLabel[]).map(
                (sl) => (
                  <label
                    key={sl}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={draftLabels.includes(sl)}
                      onChange={() => toggleDraftLabel(sl)}
                      className="accent-brand-500 h-3.5 w-3.5 rounded"
                    />
                    <span
                      style={labelPillStyle(getLabelColor(sl, systemLabelEnum))}
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                    >
                      {getLabelVi(sl, systemLabelEnum)}
                    </span>
                  </label>
                ),
              )}
            </div>
            <button
              onClick={() => saveLabels(editingId)}
              disabled={saving}
              className="bg-brand-500 hover:bg-brand-600 mt-3 w-full rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export { formatDate, getLabelColor, getLabelVi, labelPillStyle };
export default EmailsTable;
