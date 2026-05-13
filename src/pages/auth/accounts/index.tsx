import Drawer from "@/components/drawer/Drawer";
import DetailFormLayout, { FormRow } from "@/components/layouts/DetailFormLayout";
import Switch from "@/components/switch";
import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout.tsx";
import { usersService } from "@/services/users";
import type { PaginatedResponse } from "@/types/common.ts";
import type { DynamicDataResponse } from "@/types/shared.ts";
import type { Role, UpdateUserDto, User } from "@/types/users.ts";
import { RoleColors, RoleLabels } from "@/types/users.ts";
import { message as toast } from "antd";
import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MdInfoOutline } from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import ActiveFilterChips from "@/pages/user/documents/components/ActiveFilterChips";
import FilterGroup from "@/pages/user/documents/components/FilterGroup";
import RoleSelector from "./components/RoleSelector.tsx";
import UserDetailDrawer from "./components/UserDetailDrawer.tsx";

const PAGE_SIZE = 10;

// ── Filter options ──────────────────────────────────────────────────────────

const ROLE_OPTIONS: Role[] = ["student", "admin", "lecture"];

const ROLE_FILTER_OPTIONS = ROLE_OPTIONS.map((role) => ({
  value: role,
  displayName: RoleLabels[role],
  color: RoleColors[role].hex,
}));

const STATUS_OPTIONS = [
  { value: "active", displayName: "Hoạt động", color: "#22c55e" },
  { value: "inactive", displayName: "Vô hiệu hóa", color: "#ef4444" },
];

const ROLE_EXTRA_TYPE = {
  key: "roles",
  displayName: "Vai trò",
  allowedValues: ROLE_FILTER_OPTIONS,
};

const STATUS_EXTRA_TYPE = {
  key: "status",
  displayName: "Trạng thái",
  allowedValues: STATUS_OPTIONS,
};

// ── Component ───────────────────────────────────────────────────────────────

interface UsersPageProps {
  data: DynamicDataResponse | null;
}

const UsersPage: React.FC<UsersPageProps> = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialKeyword = searchParams.get("keyword") ?? "";
  const initialPage =
    Number(searchParams.get("page") ?? "1") > 0
      ? Number(searchParams.get("page") ?? "1")
      : 1;

  const [keyword, setKeyword] = React.useState(initialKeyword);
  const [searchValue, setSearchValue] = React.useState(initialKeyword);
  const [page, setPage] = React.useState(initialPage);

  // ── Filters (initialized from URL) ──────────────────────────────────────
  const [roleFilter, setRoleFilter] = React.useState<string[]>(() => {
    const raw = searchParams.get("roles");
    return raw ? raw.split(",").filter(Boolean) : [];
  });
  const [statusFilter, setStatusFilter] = React.useState<string[]>(() => {
    const raw = searchParams.get("status");
    return raw ? raw.split(",").filter(Boolean) : [];
  });

  // Derive isActive from statusFilter for the API
  const apiIsActive = React.useMemo(() => {
    if (statusFilter.length === 0 || statusFilter.length === 2) return undefined;
    return statusFilter.includes("active");
  }, [statusFilter]);

  const hasFilters = roleFilter.length > 0 || statusFilter.length > 0;

  const handleClearAllFilters = React.useCallback(() => {
    setRoleFilter([]);
    setStatusFilter([]);
    setPage(1);
  }, []);

  // ── URL sync ────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const next = new URLSearchParams(searchParams);
    // roles
    if (roleFilter.length > 0) next.set("roles", roleFilter.join(","));
    else next.delete("roles");
    // status
    if (statusFilter.length > 0) next.set("status", statusFilter.join(","));
    else next.delete("status");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, statusFilter]);

  const [updatingUsers, setUpdatingUsers] = React.useState<Set<number>>(
    new Set(),
  );
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState("");
  const [newRole, setNewRole] = React.useState<Role>("student");

  const idParam = searchParams.get("id");
  const selectedId = idParam ? Number(idParam) : null;

  const { data: result = null, isLoading: loading } = useQuery({
    queryKey: ["users", { page, keyword, roles: roleFilter, isActive: apiIsActive }],
    queryFn: () =>
      usersService.getUsers({
        page,
        limit: PAGE_SIZE,
        keyword: keyword || undefined,
        roles: roleFilter.length > 0 ? (roleFilter as Role[]) : undefined,
        isActive: apiIsActive,
      }),
    staleTime: 30 * 1000,
  });

  // Keep URL params in sync
  React.useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (keyword) next.set("keyword", keyword);
    else next.delete("keyword");
    next.set("page", String(page));
    if (idParam) next.set("id", idParam);
    setSearchParams(next, { replace: true });
  }, [keyword, page, idParam, setSearchParams]);

  const handleSearch = () => {
    setKeyword(searchValue);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    next.set("keyword", searchValue);
    next.set("page", "1");
    setSearchParams(next, { replace: true });
  };

  const handleKeywordChange = (value: string) => setSearchValue(value);

  const handlePageChange = (p: number) => {
    setPage(p);
  };

  const handleOpenDetail = React.useCallback(
    (user: User) => {
      const next = new URLSearchParams(searchParams);
      next.set("id", String(user.id));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleCloseDetail = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("id");
    setSearchParams(next, { replace: true });
  };

  const handleRoleChange = React.useCallback(
    async (user: User, newRole: Role) => {
      if (user.role === newRole) {
        return;
      }

      setUpdatingUsers((prev) => new Set(prev).add(user.id));
      try {
        const dto: UpdateUserDto = { role: newRole };
        const updated = await usersService.updateUser(user.id, dto);
        toast.success("Cập nhật thành công.");

        // Optimistic local update
        queryClient.setQueryData(
          ["users", { page, keyword, roles: roleFilter, isActive: apiIsActive }],
          (prev: PaginatedResponse<User> | undefined) =>
            prev
              ? {
                  ...prev,
                  items: prev.items.map((u) =>
                    u.id === user.id ? { ...u, role: updated.role } : u,
                  ),
                }
              : prev,
        );
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Cập nhật thất bại.";
        toast.error(msg);
      } finally {
        setUpdatingUsers((prev) => {
          const next = new Set(prev);
          next.delete(user.id);
          return next;
        });
      }
    },
    [queryClient, page, keyword, roleFilter, apiIsActive],
  );

  const handleStatusChange = React.useCallback(
    async (user: User, newStatus: boolean) => {
      if (user.isActive === newStatus) {
        return;
      }

      setUpdatingUsers((prev) => new Set(prev).add(user.id));
      try {
        const dto: UpdateUserDto = { isActive: newStatus };
        const updated = await usersService.updateUser(user.id, dto);
        toast.success(
          newStatus ? "Đã kích hoạt tài khoản." : "Đã vô hiệu hóa tài khoản.",
        );

        // Optimistic local update
        queryClient.setQueryData(
          ["users", { page, keyword, roles: roleFilter, isActive: apiIsActive }],
          (prev: PaginatedResponse<User> | undefined) =>
            prev
              ? {
                  ...prev,
                  items: prev.items.map((u) =>
                    u.id === user.id ? { ...u, isActive: updated.isActive } : u,
                  ),
                }
              : prev,
        );
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Cập nhật thất bại.";
        toast.error(msg);
      } finally {
        setUpdatingUsers((prev) => {
          const next = new Set(prev);
          next.delete(user.id);
          return next;
        });
      }
    },
    [queryClient, page, keyword, roleFilter, apiIsActive],
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      toast.error("Vui lòng nhập email.");
      return;
    }

    setCreating(true);
    try {
      await usersService.assignRole({
        email: newEmail.trim(),
        role: newRole,
      });
      toast.success("Thêm tài khoản thành công.");
      setCreateOpen(false);
      setNewEmail("");
      setNewRole("student");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thêm tài khoản thất bại.";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };


  // Define table columns
  const columns: TableColumn<User>[] = React.useMemo(
    () => [
      {
        key: "name",
        header: "Thông tin",
        width: "350px",
        render: (user) => (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || user.email}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="bg-brand-500 flex h-full w-full items-center justify-center text-sm font-bold text-white">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-navy-700 truncate text-sm font-medium dark:text-white">
                {user.name || user.email}
              </p>
              <p className="text-xs truncate text-gray-400 dark:text-gray-500">
                {user.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        header: "Vai trò",
        render: (user) => (
          <RoleSelector
            value={user.role}
            onChange={(newRole) => handleRoleChange(user, newRole)}
            disabled={updatingUsers.has(user.id)}
          />
        ),
      },
      {
        key: "isActive",
        header: "Trạng thái hoạt động",
        render: (user) => (
          <Switch
            checked={user.isActive}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleStatusChange(user, e.target.checked)
            }
            disabled={updatingUsers.has(user.id)}
          />
        ),
      },
    ],
    [updatingUsers, handleRoleChange, handleStatusChange],
  );

  // Define table actions
  const actions: TableAction<User>[] = React.useMemo(
    () => [
      {
        key: "detail",
        icon: <MdInfoOutline className="h-4 w-4" />,
        label: "Chi tiết",
        onClick: handleOpenDetail,
      },
    ],
    [handleOpenDetail],
  );

  return (
    <>
      <TableLayout
        result={result}
        loading={loading}
        page={page}
        pageSize={PAGE_SIZE}
        searchValue={searchValue}
        onSearchChange={handleKeywordChange}
        onSearch={handleSearch}
        searchPlaceholder="Tìm kiếm theo tên, email..."
        columns={columns}
        actions={actions}
        onPageChange={handlePageChange}
        middleSlot={
          <div className="flex flex-col gap-3">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="shrink-0 text-xs font-medium text-gray-400">
                Lọc theo:
              </span>
              <FilterGroup
                label="Vai trò"
                typeKey="role"
                options={ROLE_FILTER_OPTIONS}
                selected={roleFilter}
                onChange={(next) => { setRoleFilter(next); setPage(1); }}
              />
              <FilterGroup
                label="Trạng thái"
                typeKey="status"
                options={STATUS_OPTIONS}
                selected={statusFilter}
                onChange={(next) => { setStatusFilter(next); setPage(1); }}
              />
            </div>

            {/* Active filter chips */}
            {hasFilters && (
              <ActiveFilterChips
                filters={{ roles: roleFilter, status: statusFilter }}
                metadataTypes={[]}
                extraTypes={[ROLE_EXTRA_TYPE, STATUS_EXTRA_TYPE]}
                onRemove={(typeKey, value) => {
                  if (typeKey === "roles") {
                    setRoleFilter((prev) => prev.filter((x) => x !== value));
                  } else if (typeKey === "status") {
                    setStatusFilter((prev) => prev.filter((x) => x !== value));
                  }
                  setPage(1);
                }}
                onClearAll={handleClearAllFilters}
              />
            )}
          </div>
        }
        rightSlot={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            Thêm
          </button>
        }
        detailDrawer={
          <UserDetailDrawer
            userId={selectedId}
            onClose={handleCloseDetail}
            onUserChanged={(updated) =>
              queryClient.setQueryData(
                ["users", { page, keyword, roles: roleFilter, isActive: apiIsActive }],
                (prev: PaginatedResponse<User> | undefined) =>
                  prev
                    ? {
                        ...prev,
                        items: prev.items.map((u) =>
                          u.id === updated.id ? updated : u,
                        ),
                      }
                    : prev,
              )
            }
          />
        }
      />

      <Drawer
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Thêm tài khoản"
      >
        <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
          <DetailFormLayout>
            <FormRow label="Email" required={true}>
              <input
                type="email"
                value={newEmail}
                onChange={(ev) => setNewEmail(ev.target.value)}
                disabled={creating}
                className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
              />
            </FormRow>
            <FormRow label="Vai trò" required={true}>
              <div className="flex w-fit items-center">
                <RoleSelector
                  value={newRole}
                  onChange={setNewRole}
                  disabled={creating}
                  className="relative! top-0! translate-y-0!"
                />
              </div>
            </FormRow>
          </DetailFormLayout>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={creating}
              className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {creating ? "Đang xử lý..." : "Thêm"}
            </button>
          </div>
        </form>
      </Drawer>
    </>
  );
};

export default UsersPage;
