/**
 * Users Table Component
 * Displays users in a table with pagination and actions
 */

import type { PaginatedResponse } from "@/types/common";
import type { User } from "@/types/users";
import { Role, RoleColors, RoleLabels } from "@/types/users";
import React from "react";
import { MdVisibility } from "react-icons/md";

interface UsersTableProps {
  data: PaginatedResponse<User> | null;
  onViewDetail: (user: User) => void;
  onPageChange: (page: number) => void;
  currentPage: number;
}

const UsersTable: React.FC<UsersTableProps> = ({
  data,
  onViewDetail,
  onPageChange,
  currentPage,
}) => {
  if (!data || data.items.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-gray-500">
        <svg
          className="mb-4 h-16 w-16 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <p className="text-lg font-medium">Không có người dùng nào</p>
        <p className="text-sm">Thử thay đổi bộ lọc hoặc thêm người dùng mới</p>
      </div>
    );
  }

  const { items, pagination } = data;
  const { total, totalPages, limit } = pagination;

  return (
    <div className="overflow-x-auto">
      {/* Table */}
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="pb-3 text-left text-sm font-semibold tracking-wide text-gray-600 dark:text-gray-400">
              NGƯỜI DÙNG
            </th>
            <th className="pb-3 text-left text-sm font-semibold tracking-wide text-gray-600 dark:text-gray-400">
              EMAIL
            </th>
            <th className="pb-3 text-center text-sm font-semibold tracking-wide text-gray-600 dark:text-gray-400">
              VAI TRÒ
            </th>
            <th className="pb-3 text-center text-sm font-semibold tracking-wide text-gray-600 dark:text-gray-400">
              TRẠNG THÁI
            </th>
            <th className="pb-3 text-center text-sm font-semibold tracking-wide text-gray-600 dark:text-gray-400">
              NGÀY TẠO
            </th>
            <th className="pb-3 text-center text-sm font-semibold tracking-wide text-gray-600 dark:text-gray-400">
              THAO TÁC
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((user) => (
            <tr
              key={user.id}
              className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
            >
              {/* User Info */}
              <td className="py-4">
                <div className="flex items-center gap-3">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || user.email}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-brand-100 text-brand-600 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-navy-700 text-base font-semibold dark:text-white">
                      {user.name || "Chưa cập nhật"}
                    </p>
                    <p className="text-sm text-gray-500">ID: {user.id}</p>
                  </div>
                </div>
              </td>

              {/* Email */}
              <td className="py-4">
                <p className="text-navy-700 text-base font-medium dark:text-white">
                  {user.email}
                </p>
              </td>

              {/* Role Badge */}
              <td className="py-4 text-center">
                <span
                  className={`inline-flex rounded-full px-3 py-1.5 text-sm font-medium ${RoleColors[user.role as Role]?.bg || "bg-gray-100"} ${RoleColors[user.role as Role]?.text || "text-gray-800"}`}
                >
                  {RoleLabels[user.role as Role] || user.role}
                </span>
              </td>

              {/* Status */}
              <td className="py-4 text-center">
                <span
                  className={`inline-flex rounded-full px-3 py-1.5 text-sm font-medium ${
                    user.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {user.isActive ? "Hoạt động" : "Vô hiệu"}
                </span>
              </td>

              {/* Created Date */}
              <td className="py-4 text-center">
                <p className="text-navy-700 text-base font-medium dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </td>

              {/* Actions */}
              <td className="py-4">
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => onViewDetail(user)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-all hover:bg-blue-100 hover:text-blue-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                    title="Xem chi tiết"
                  >
                    <MdVisibility className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-base text-gray-600 dark:text-gray-400">
          Hiển thị {total > 0 ? (currentPage - 1) * limit + 1 : 0} -{" "}
          {Math.min(currentPage * limit, total)} / {total} người dùng
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              // Show first, last, current, and adjacent pages
              return (
                p === 1 ||
                p === totalPages ||
                Math.abs(p - currentPage) <= 1
              );
            })
            .reduce<(number | string)[]>((acc, p, i, arr) => {
              if (i > 0 && arr[i - 1] !== p - 1) {
                acc.push("...");
              }
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              typeof p === "string" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-2 text-gray-400"
                >
                  {p}
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    currentPage === p
                      ? "bg-brand-500 text-white"
                      : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || totalPages === 0}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsersTable;
