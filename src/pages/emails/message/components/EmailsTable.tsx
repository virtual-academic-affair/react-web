import { messagesService } from "@/services/email";
import type { PaginatedResponse } from "@/types/common";
import type { Message, SystemLabel } from "@/types/email";
import type { SystemLabelEnumData } from "@/types/shared";
import { message } from "antd";
import React from "react";
import {
  MdChevronLeft,
  MdChevronRight,
  MdInfoOutline,
  MdLabel,
} from "react-icons/md";
import { SiGmail } from "react-icons/si";

import Tag from "@/components/tag/Tag";
import { formatDate, getLabelColor, getLabelVi } from "../labelUtils";
import SystemLabelSelector from "./SystemLabelSelector";
import Tooltip from "../../../../components/tooltip/Tooltip.tsx";

interface EmailsTableProps {
  result: PaginatedResponse<Message> | null;
  loading: boolean;
  page: number;
  systemLabelEnum?: SystemLabelEnumData | null;
  gmailAccount?: string;
  onPageChange: (p: number) => void;
  onOpenDetail: (msg: Message) => void;
  onLabelChanged?: () => void;
}

const EmailsTable: React.FC<EmailsTableProps> = ({
  result,
  loading,
  page,
  systemLabelEnum,
  gmailAccount,
  onPageChange,
  onOpenDetail,
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

  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <div className="rounded-2xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/10">
              <th className="w-[400px] max-w-[450px] px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Tiêu đề
              </th>
              <th className="w-[400px] max-w-[250px] px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Người gửi
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Nhãn hệ thống
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Thời gian gửi
              </th>
              <th className="py-3 text-center text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Thao tác
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
                    <td key={c} className="px-4 py-3">
                      <div className="dark:bg-navy-700 h-4 animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-base font-semibold text-gray-500"
                >
                  Không tìm thấy dữ liệu.
                </td>
              </tr>
            ) : (
              items.map((msg) => (
                <tr
                  key={msg.id}
                  className="hover:bg-lightPrimary dark:hover:bg-navy-700 cursor-pointer border-b border-gray-50 transition-colors dark:border-white/5"
                >
                  <td className="max-w-[400px] py-3">
                    <Tooltip label={msg.subject || "(Không có tiêu đề)"}>
                      <p className="text-navy-700 w-full max-w-[400px] truncate px-4 text-base font-medium dark:text-white">
                        {msg.subject || "(Không có tiêu đề)"}
                      </p>
                    </Tooltip>
                  </td>
                  <td className="max-w-[200px] py-3">
                    <Tooltip label={msg.senderName}>
                      <p className="text-navy-700 w-full max-w-[250px] truncate px-4 text-sm dark:text-white">
                        {msg.senderName}
                      </p>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {msg.systemLabels?.length ? (
                        msg.systemLabels.map((sl) => (
                          <Tag
                            key={sl}
                            color={getLabelColor(sl, systemLabelEnum)}
                          >
                            {getLabelVi(sl, systemLabelEnum)}
                          </Tag>
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
                  <td className="text-navy-700 px-4 py-3 text-sm dark:text-white">
                    {formatDate(msg.sentAt)}
                  </td>
                  <td className="py-3 pr-2">
                    <div className="flex items-center justify-center gap-2">
                      <Tooltip label="Chi tiết">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetail(msg);
                          }}
                          className="bg-brand-500 hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-400 flex h-10 w-10 items-center justify-center rounded-2xl text-white transition-colors dark:text-white"
                        >
                          <MdInfoOutline className="h-4 w-4" />
                        </button>
                      </Tooltip>

                      <Tooltip label="Gmail">
                        <a
                          href={
                            gmailAccount
                              ? `https://mail.google.com/mail/u/${gmailAccount}/#inbox/${msg.threadId}`
                              : `https://mail.google.com/mail/u/0/#inbox/${msg.threadId}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-500 text-white transition-colors hover:bg-pink-600 dark:bg-pink-500 dark:text-white dark:hover:bg-pink-400"
                        >
                          <SiGmail className="h-4 w-4" />
                        </a>
                      </Tooltip>
                    </div>
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
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Trang {pagination.currentPage} trên {pagination.totalPages}{" "}
            <span className="mx-2">·</span> {pagination.total} bản ghi
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="flex items-center rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/10"
            >
              <MdChevronLeft className="h-5 w-5" />
            </button>
            {/* Condensed page numbers: 1 ... prev, current, next ... last */}
            {(() => {
              const total = pagination.totalPages;
              const current = pagination.currentPage;
              const pages: (number | "...")[] = [];

              if (total <= 5) {
                for (let i = 1; i <= total; i += 1) {
                  pages.push(i);
                }
              } else {
                pages.push(1);

                const start = Math.max(2, current - 1);
                const end = Math.min(total - 1, current + 1);

                if (start > 2) {
                  pages.push("...");
                }

                for (let i = start; i <= end; i += 1) {
                  pages.push(i);
                }

                if (end < total - 1) {
                  pages.push("...");
                }

                pages.push(total);
              }

              return pages.map((p, idx) =>
                p === "..." ? (
                  <span
                    key={`dots-${idx}`}
                    className="flex h-8 w-8 items-center justify-center text-sm text-gray-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-2xl text-sm font-medium transition-colors ${
                      p === current
                        ? "bg-brand-500 text-white"
                        : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                    }`}
                  >
                    {p}
                  </button>
                ),
              );
            })()}

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pagination.totalPages}
              className="dark:hover:bg:white/10 flex items-center rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400"
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
            className="dark:bg-navy-900 fixed z-50 min-w-44 rounded-2xl border border-gray-100 bg-white p-3 shadow-lg dark:border-white/10"
          >
            <p className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              Nhãn hệ thống
            </p>
            <SystemLabelSelector
              value={draftLabels}
              onChange={setDraftLabels}
              systemLabelEnum={systemLabelEnum}
              className="flex flex-wrap gap-2"
            />
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

export default EmailsTable;
