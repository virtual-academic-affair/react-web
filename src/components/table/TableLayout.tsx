import Card from "@/components/card";
import Tooltip from "@/components/tooltip/Tooltip.tsx";
import type { PaginatedResponse } from "@/types/common";
import React from "react";
import {
  MdChevronLeft,
  MdChevronRight,
  MdFilterList,
  MdSearch,
} from "react-icons/md";

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
  render?: (item: T) => React.ReactNode;
}

interface TableLayoutProps<T> {
  // Data
  result:
    | PaginatedResponse<T>
    | { items: T[]; total?: number; page?: number; limit?: number }
    | null;
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
  filterButtonRef?: React.RefObject<HTMLButtonElement | null>;

  // Optional right-side slot in search bar (e.g. create button)
  rightSlot?: React.ReactNode;
  // Optional slot between search bar and table card
  middleSlot?: React.ReactNode;

  // Hide the built-in search + filter bar (when parent owns search UI)
  hideSearchBar?: boolean;

  // Table
  columns: TableColumn<T>[];
  emptyMessage?: React.ReactNode;

  // Actions
  actions?: TableAction<T>[];
  onRowClick?: (item: T) => void;

  // Pagination
  onPageChange: (page: number) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    total: number;
  };

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
  filterButtonRef,
  rightSlot,
  middleSlot,
  hideSearchBar = false,
  columns,
  emptyMessage = "Không tìm thấy dữ liệu.",
  actions = [],
  onRowClick,
  onPageChange,
  pagination: paginationProp,
  detailDrawer,
}: TableLayoutProps<T>) {
  const { items = [] } = result ?? { items: [] };

  // Calculate pagination info from multiple possible sources
  const paginationInfo = React.useMemo(() => {
    // 1. Prioritize explicitly passed pagination prop
    if (paginationProp) return paginationProp;

    // 2. Try nested pagination object (NestJS style)
    if (result && (result as any).pagination) {
      const p = (result as any).pagination;
      return {
        total: p.total,
        currentPage: p.currentPage || p.page,
        totalPages: p.totalPages,
      };
    }

    // 3. Try flat structure (Python RAG style)
    if (result && (result as any).total !== undefined) {
      const r = result as any;
      const limit = r.limit || pageSize;
      return {
        total: r.total,
        currentPage: r.page || r.currentPage || 1,
        totalPages: Math.ceil(r.total / limit),
      };
    }

    return null;
  }, [paginationProp, result, pageSize]);

  return (
    <div className="flex flex-col gap-4 pb-10">
      {/* Search + filter bar */}
      {!hideSearchBar && (
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
              ref={filterButtonRef}
              type="button"
              onClick={onFilterClick}
              className="bg-brand-500 hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-400 flex h-10 w-10 items-center justify-center rounded-2xl text-white dark:text-white"
            >
              <MdFilterList className="h-5 w-5" />
            </button>
          )}
          {rightSlot}
        </div>
      )}
      {middleSlot}

      {/* Table Card */}
      <Card extra="p-6">
        <div className="flex flex-col gap-4">
          {/* Table */}
          <div className="overflow-x-auto overflow-y-hidden rounded-2xl">
            <table className="w-full min-w-[800px] table-fixed">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500 table-column-header-${col.key}`}
                      style={{
                        width: col.width,
                        maxWidth: col.maxWidth,
                      }}
                    >
                      {col.header}
                    </th>
                  ))}
                  {actions.length > 0 && (
                    <th
                      className="dark:bg-navy-800 sticky right-0 z-20 bg-white px-4 py-3 text-center text-xs font-semibold tracking-wide whitespace-nowrap text-gray-400 uppercase dark:text-gray-500"
                      style={{
                        width: `${Math.max(100, actions.length * 55)}px`,
                        boxShadow: "-10px 0 10px -10px rgba(0,0,0,0.15)",
                      }}
                    >
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
                        <td
                          key={col.key}
                          className="px-4 py-3"
                          style={{
                            width: col.width,
                            maxWidth: col.maxWidth,
                          }}
                        >
                          <div className="dark:bg-navy-700 h-4 animate-pulse rounded bg-gray-200" />
                        </td>
                      ))}
                      {actions.length > 0 && (
                        <td
                          className="dark:bg-navy-800 sticky right-0 z-10 bg-white px-4 py-3"
                          style={{
                            boxShadow: "-10px 0 10px -10px rgba(0,0,0,0.15)",
                          }}
                        >
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
                  items.map((item, index) => {
                    const rowKey =
                      (item as any).id ||
                      (item as any).faqId ||
                      (item as any).candidateId ||
                      index;
                    return (
                      <tr
                        key={String(rowKey)}
                        className={`group hover:bg-lightPrimary dark:hover:bg-navy-700 border-b border-gray-50 dark:border-white/5 ${
                          onRowClick ? "cursor-pointer" : ""
                        }`}
                        onClick={() => onRowClick?.(item)}
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className="max-w-0 px-4 py-3"
                            style={{
                              width: col.width,
                              maxWidth: col.maxWidth,
                            }}
                          >
                            <div className="w-full min-w-0 truncate">
                              {col.render(item, index)}
                            </div>
                          </td>
                        ))}
                        {actions.length > 0 && (
                          <td
                            className="group-hover:bg-lightPrimary dark:bg-navy-800 dark:group-hover:bg-navy-700 sticky right-0 z-10 bg-white py-3 pr-2 whitespace-nowrap"
                            style={{
                              boxShadow: "-10px 0 10px -10px rgba(0,0,0,0.15)",
                            }}
                          >
                            <div className="flex items-center justify-center gap-2">
                              {actions.map((action) => {
                                const customRendered = action.render
                                  ? action.render(item)
                                  : undefined;
                                return (
                                  <Tooltip
                                    key={action.key}
                                    label={action.label}
                                  >
                                    {customRendered !== undefined ? (
                                      customRendered
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          action.onClick(item);
                                        }}
                                        aria-label={action.label}
                                        className={
                                          action.className ||
                                          "bg-brand-500 hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-400 flex h-10 w-10 items-center justify-center rounded-2xl text-white dark:text-white"
                                        }
                                      >
                                        {action.icon}
                                      </button>
                                    )}
                                  </Tooltip>
                                );
                              })}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {paginationInfo && paginationInfo.total > 0 && (
            <PaginationBar
              paginationInfo={paginationInfo}
              page={page}
              onPageChange={onPageChange}
            />
          )}
        </div>
      </Card>

      {/* Detail Drawer */}
      {detailDrawer}
    </div>
  );
}

interface PaginationBarProps {
  paginationInfo: { currentPage: number; totalPages: number; total: number };
  page: number;
  onPageChange: (page: number) => void;
}

function PaginationBar({
  paginationInfo,
  page,
  onPageChange,
}: PaginationBarProps) {
  const [jumpKey, setJumpKey] = React.useState<"left" | "right" | null>(null);
  const [jumpValue, setJumpValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  const total = paginationInfo.totalPages;
  const current = paginationInfo.currentPage;

  // Build page list (same logic as before, but computed first so we can derive neighbor pages)
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  const pages: (number | "...")[] = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i += 1) pages.push(i);
  } else {
    pages.push(1);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i += 1) pages.push(i);
    if (end < total - 1) pages.push("...");
    pages.push(total);
  }

  // Neighbor pages: left dots → first hidden page after 1 = 2
  //                 right dots → first hidden page before total = end + 1
  const leftSeed = 2;
  const rightSeed = end + 1;

  const openJump = (key: "left" | "right") => {
    const seed = key === "left" ? leftSeed : rightSeed;
    setJumpKey(key);
    setJumpValue(String(seed));
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const closeJump = () => {
    setJumpKey(null);
    setJumpValue("");
  };

  const commitJump = () => {
    const n = parseInt(jumpValue, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= total) {
      onPageChange(n);
    }
    closeJump();
  };

  // Close on outside click
  React.useEffect(() => {
    if (!jumpKey) return undefined;
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        closeJump();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [jumpKey]);

  const numValue = parseInt(jumpValue, 10);
  const isValid = !Number.isNaN(numValue) && numValue >= 1 && numValue <= total;

  // Track which dots position we're rendering (left or right)
  let dotsIndex = 0;

  return (
    <div className="flex flex-col items-end gap-2 pt-1">
      {/* Main nav row */}
      <div className="flex w-full items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Trang {paginationInfo.currentPage} trên {paginationInfo.totalPages}{" "}
          <span className="mx-2">·</span> {paginationInfo.total} bản ghi
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex items-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/10"
          >
            <MdChevronLeft className="h-5 w-5" />
          </button>

          {pages.map((p, idx) => {
            if (p === "...") {
              // First dots encountered = left, second = right
              dotsIndex += 1;
              const thisKey: "left" | "right" = dotsIndex === 1 ? "left" : "right";
              const isActive = jumpKey === thisKey;
              return (
                <button
                  key={`dots-${idx}`}
                  type="button"
                  onClick={() => openJump(thisKey)}
                  title="Nhập trang cụ thể"
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-500 dark:bg-brand-500/20 dark:text-brand-400"
                      : "text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-white/10"
                  }`}
                >
                  ···
                </button>
              );
            }
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-2xl text-sm font-medium ${
                  p === current
                    ? "bg-brand-500 text-white"
                    : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= paginationInfo.totalPages}
            className="flex items-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/10"
          >
            <MdChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Go-to-page panel — appears below the nav row, right-aligned */}
      {jumpKey && (
        <div
          ref={popoverRef}
          className="dark:bg-navy-800 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-white/10"
        >
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Đến trang
          </p>
          <div className="flex items-center gap-2">
            {/* Stepper − */}
            <button
              type="button"
              onClick={() =>
                setJumpValue((v) => {
                  const n = parseInt(v, 10);
                  return String(Number.isNaN(n) ? page : Math.max(1, n - 1));
                })
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/10"
            >
              <span className="text-base leading-none">−</span>
            </button>

            {/* Number input */}
            <input
              ref={inputRef}
              type="number"
              min={1}
              max={total}
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitJump();
                if (e.key === "Escape") closeJump();
              }}
              className="h-9 w-16 rounded-xl border border-gray-200 bg-transparent px-2 text-center text-sm font-medium text-gray-700 outline-none focus:border-brand-400 dark:border-white/10 dark:text-white dark:focus:border-brand-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />

            {/* Stepper + */}
            <button
              type="button"
              onClick={() =>
                setJumpValue((v) => {
                  const n = parseInt(v, 10);
                  return String(Number.isNaN(n) ? page : Math.min(total, n + 1));
                })
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/10"
            >
              <span className="text-base leading-none">+</span>
            </button>

            {/* Confirm */}
            <button
              type="button"
              onClick={commitJump}
              disabled={!isValid}
              className="bg-brand-500 hover:bg-brand-600 h-9 rounded-xl px-4 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              Thực hiện
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


export default TableLayout;
