import Card from "@/components/card";
import type { PaginatedResponse } from "@/types/common";
import React from "react";
import {
  MdChevronLeft,
  MdChevronRight,
  MdFilterList,
  MdSearch,
} from "react-icons/md";
import Tooltip from "@/components/tooltip/Tooltip.tsx";

export interface TableColumn<T> {
  key: string;
  header: string;
  width?: string;
  maxWidth?: string;
  render: (item: T, index: number) => React.ReactNode;
}

export interface TableAction<T> {
  key: string;
  icon: React.ReactNode;
  label: string;
  onClick: (item: T) => void;
  className?: string;
}

interface TableLayoutProps<T> {
  // Data
  result: PaginatedResponse<T> | null;
  loading: boolean;
  page: number;
  pageSize?: number;

  // Search
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  searchPlaceholder?: string;

  // Filter (optional)
  showFilter?: boolean;
  onFilterClick?: () => void;

  // Optional right-side slot in search bar (e.g. create button)
  rightSlot?: React.ReactNode;

  // Table
  columns: TableColumn<T>[];
  emptyMessage?: string;

  // Actions
  actions?: TableAction<T>[];
  onRowClick?: (item: T) => void;

  // Pagination
  onPageChange: (page: number) => void;

  // Detail drawer (optional)
  detailDrawer?: React.ReactNode;
}

function TableLayout<T extends { id: number | string }>({
  result,
  loading,
  page,
  pageSize = 10,
  searchValue,
  onSearchChange,
  onSearch,
  searchPlaceholder = "Tìm...",
  showFilter = false,
  onFilterClick,
  rightSlot,
  columns,
  emptyMessage = "Không tìm thấy dữ liệu.",
  actions = [],
  onRowClick,
  onPageChange,
  detailDrawer,
}: TableLayoutProps<T>) {
  const { items = [], pagination } = result ?? { items: [], pagination: null };

  return (
    <div className="flex flex-col gap-4 pb-10">
      {/* Search + filter bar */}
      <div className="flex items-center gap-3">
        <div className="dark:bg-navy-800 flex flex-1 items-center gap-2 rounded-2xl bg-white px-3 py-2">
          <MdSearch className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
          <input
            name="keyword"
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearch();
              }
            }}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent py-1 text-sm text-gray-700 outline-none placeholder:text-gray-500 dark:bg-transparent dark:text-white dark:placeholder:text-gray-400"
          />
        </div>
        {showFilter && onFilterClick && (
          <button
            type="button"
            onClick={onFilterClick}
            className="bg-brand-500 hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-400 flex h-10 w-10 items-center justify-center rounded-2xl text-white transition-colors dark:text-white"
          >
            <MdFilterList className="h-5 w-5" />
          </button>
        )}
        {rightSlot}
      </div>

      {/* Table Card */}
      <Card extra="p-6">
        <div className="flex flex-col gap-4">
          {/* Table */}
          <div className="overflow-x-auto overflow-y-hidden rounded-2xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500 ${
                        col.width ? col.width : ""
                      } ${col.maxWidth ? `max-w-[${col.maxWidth}]` : ""}`}
                      style={
                        col.width
                          ? { width: col.width }
                          : col.maxWidth
                            ? { maxWidth: col.maxWidth }
                            : undefined
                      }
                    >
                      {col.header}
                    </th>
                  ))}
                  {actions.length > 0 && (
                    <th className="py-3 text-center text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Thao tác
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-50 dark:border-white/5"
                    >
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3">
                          <div className="dark:bg-navy-700 h-4 animate-pulse rounded bg-gray-200" />
                        </td>
                      ))}
                      {actions.length > 0 && (
                        <td className="px-4 py-3">
                          <div className="dark:bg-navy-700 h-4 animate-pulse rounded bg-gray-200" />
                        </td>
                      )}
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                      className="py-12 text-center text-base font-medium text-gray-500"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr
                      key={String(item.id)}
                      className={`hover:bg-lightPrimary dark:hover:bg-navy-700 border-b border-gray-50 transition-colors dark:border-white/5 ${
                        onRowClick ? "cursor-pointer" : ""
                      }`}
                      onClick={() => onRowClick?.(item)}
                    >
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3">
                          {col.render(item, index)}
                        </td>
                      ))}
                      {actions.length > 0 && (
                        <td className="py-3 pr-2">
                          <div className="flex items-center justify-center gap-2">
                            {actions.map((action) => (
                              <Tooltip key={action.key} label={action.label}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick(item);
                                  }}
                                  title={action.label}
                                  className={
                                    action.className ||
                                    "bg-brand-500 hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-400 flex h-10 w-10 items-center justify-center rounded-2xl text-white transition-colors dark:text-white"
                                  }
                                >
                                  {action.icon}
                                </button>
                              </Tooltip>
                            ))}
                          </div>
                        </td>
                      )}
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
                {/* Condensed page numbers */}
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
                  className="flex items-center rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/10"
                >
                  <MdChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Detail Drawer */}
      {detailDrawer}
    </div>
  );
}

export default TableLayout;
