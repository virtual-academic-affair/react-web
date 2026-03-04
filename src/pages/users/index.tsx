/**
 * Users Overview Page
 * Displays paginated list of users with search, filter, and management capabilities.
 */

import Card from "@/components/card";
import { usersService } from "@/services/users";
import type { PaginatedResponse } from "@/types/common";
import type { GetUsersParams, User } from "@/types/users";
import { Role, RoleLabels } from "@/types/users";
import { message, Spin } from "antd";
import React from "react";
import { MdAdd, MdSearch } from "react-icons/md";
import AssignRoleDrawer from "./components/AssignRoleDrawer";
import UserDetailDrawer from "./components/UserDetailDrawer";
import UsersTable from "./components/UsersTable";

const UsersOverview: React.FC = () => {
  // ── State ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<PaginatedResponse<User> | null>(null);

  // Filter state
  const [keyword, setKeyword] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<Role | "">("");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);

  // Drawer state
  const [assignDrawerOpen, setAssignDrawerOpen] = React.useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: GetUsersParams = {
        page,
        limit,
        keyword: keyword || undefined,
        role: roleFilter || undefined,
      };
      const result = await usersService.getUsers(params);
      setData(result);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Không thể tải danh sách users";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, keyword, roleFilter]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value as Role | "");
    setPage(1);
  };

  const handleViewDetail = (user: User) => {
    setSelectedUser(user);
    setDetailDrawerOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleAssignSuccess = () => {
    setAssignDrawerOpen(false);
    setPage(1);
    fetchUsers();
  };

  const handleUpdateSuccess = () => {
    setDetailDrawerOpen(false);
    fetchUsers();
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-navy-700 text-2xl font-bold dark:text-white">
          Quản lý người dùng
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Xem và quản lý tài khoản người dùng trong hệ thống
        </p>
      </div>

      {/* Main Card */}
      <Card extra="w-full pb-6 px-6 pt-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left: Search & Filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="relative">
              <MdSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo email, tên..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="dark:bg-navy-700 dark:border-navy-600 h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 dark:text-white sm:w-64"
              />
            </form>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              className="dark:bg-navy-700 dark:border-navy-600 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 dark:text-white"
            >
              <option value="">Tất cả vai trò</option>
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {RoleLabels[role]}
                </option>
              ))}
            </select>
          </div>

          {/* Right: Assign Role Button */}
          <button
            onClick={() => setAssignDrawerOpen(true)}
            className="bg-brand-500 hover:bg-brand-600 active:bg-brand-700 flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-colors"
          >
            <MdAdd className="h-5 w-5" />
            Gán vai trò
          </button>
        </div>

        {/* Table */}
        <div className="mt-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Spin size="large" />
            </div>
          ) : (
            <UsersTable
              data={data}
              onViewDetail={handleViewDetail}
              onPageChange={handlePageChange}
              currentPage={page}
            />
          )}
        </div>
      </Card>

      {/* Assign Role Drawer */}
      <AssignRoleDrawer
        open={assignDrawerOpen}
        onClose={() => setAssignDrawerOpen(false)}
        onSuccess={handleAssignSuccess}
      />

      {/* User Detail Drawer */}
      <UserDetailDrawer
        open={detailDrawerOpen}
        user={selectedUser}
        onClose={() => {
          setDetailDrawerOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={handleUpdateSuccess}
      />
    </div>
  );
};

export default UsersOverview;
