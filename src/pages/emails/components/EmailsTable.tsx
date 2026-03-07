import type { PaginatedResponse } from "@/types/common";
import type { Message } from "@/types/email";
import React from "react";
import { MdChevronLeft, MdChevronRight, MdSearch } from "react-icons/md";

const SYSTEM_LABEL_VI: Record<string, string> = {
  classRegistration: "Đăng ký lớp",
  task: "Nhiệm vụ",
  inquiry: "Thắc mắc",
  other: "Khác",
};

const SYSTEM_LABEL_COLOR: Record<string, string> = {
  classRegistration: "bg-blue-100 text-blue-700",
  task: "bg-amber-100 text-amber-700",
  inquiry: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-600",
};

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
  onKeywordChange: (v: string) => void;
  onSearch: () => void;
  onPageChange: (p: number) => void;
  onRowClick: (msg: Message) => void;
}

const EmailsTable: React.FC<EmailsTableProps> = ({
  result,
  loading,
  keyword,
  page,
  onKeywordChange,
  onSearch,
  onPageChange,
  onRowClick,
}) => {
  const { items = [], pagination } = result ?? { items: [], pagination: null };

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
                    <div className="flex flex-wrap gap-1">
                      {msg.systemLabels?.length ? (
                        msg.systemLabels.map((sl) => (
                          <span
                            key={sl}
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${SYSTEM_LABEL_COLOR[sl] ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {SYSTEM_LABEL_VI[sl] ?? sl}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
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
    </div>
  );
};

export { formatDate, SYSTEM_LABEL_COLOR, SYSTEM_LABEL_VI };
export default EmailsTable;
