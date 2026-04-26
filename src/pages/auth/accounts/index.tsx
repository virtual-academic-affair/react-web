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
import { message as toast } from "antd";
import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MdInfoOutline } from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import AdvancedFilterModal, {
  type AccountFilters,
} from "./components/AdvancedFilterModal.tsx";
import RoleSelector from "./components/RoleSelector.tsx";
import UserDetailDrawer from "./components/UserDetailDrawer.tsx";
import { parseSearchString, stringifySearchQuery } from "@/utils/search";


const PAGE_SIZE = 10;

const defaultFilters: AccountFilters = {
  roles: [],
  enableIsActiveFilter: false,
  isActive: true,
};

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
  const [page, setPage] = React.useState(initialPage);
  const [filters, setFilters] = React.useState<AccountFilters>(() => {
    const rolesParam = searchParams.get("roles");
    const roles = rolesParam
      ? (rolesParam.split(",").filter(Boolean) as Role[])
      : [];
    const enableFilter = searchParams.get("enableIsActiveFilter") === "true";
    const isActive = searchParams.get("isActive") !== "false"; // default true
    return {
      roles,
      enableIsActiveFilter: enableFilter,
      isActive,
    };
  });
  const [searchValue, setSearchValue] = React.useState(() => {
    const params = { ...filters };
    if (!filters.enableIsActiveFilter) {
      delete (params as Record<string, unknown>).isActive;
      delete (params as Record<string, unknown>).enableIsActiveFilter;
    }
    return stringifySearchQuery(
      searchParams.get("keyword") ?? "",
      params as unknown as Record<string, unknown>,
    );
  });

  const [draftFilters, setDraftFilters] =
    React.useState<AccountFilters>(defaultFilters);

  const [filterOpen, setFilterOpen] = React.useState(false);
  const [updatingUsers, setUpdatingUsers] = React.useState<Set<number>>(
    new Set(),
  );
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState("");
  const [newRole, setNewRole] = React.useState<Role>("student");
  const filterButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const idParam = searchParams.get("id");
  const selectedId = idParam ? Number(idParam) : null;

  const { data: result = null, isLoading: loading } = useQuery({
    queryKey: ["users", { page, keyword, ...filters }],
    queryFn: () =>
      usersService.getUsers({
        page,
        limit: PAGE_SIZE,
        keyword: keyword || undefined,
        roles: filters.roles.length > 0 ? filters.roles : undefined,
        isActive: filters.enableIsActiveFilter ? filters.isActive : undefined,
      }),
    staleTime: 30 * 1000,
  });

  // Update searchValue when keyword or filters change
  React.useEffect(() => {
    const paramsToSerialize = { ...filters };
    if (!filters.enableIsActiveFilter) {
      delete (paramsToSerialize as Record<string, unknown>).isActive;
      delete (paramsToSerialize as Record<string, unknown>).enableIsActiveFilter;
    }


    setSearchValue(
      stringifySearchQuery(keyword, paramsToSerialize as unknown as Record<string, unknown>, [
        "page",
        "limit",
      ]),
    );

  }, [keyword, filters]);


  // Keep URL params in sync
  React.useEffect(() => {
    const next = new URLSearchParams();
    if (keyword) {
      next.set("keyword", keyword);
    }
    next.set("page", String(page));
    next.set("limit", String(PAGE_SIZE));
    if (filters.roles.length) {
      next.set("roles", filters.roles.join(","));
    }
    if (filters.enableIsActiveFilter) {
      next.set("enableIsActiveFilter", "true");
      next.set("isActive", String(filters.isActive));
    }
    if (idParam) {
      next.set("id", idParam);
    }
    setSearchParams(next, { replace: true });
  }, [keyword, page, filters, idParam, setSearchParams]);

  const handleSearch = () => {
    const parsed = parseSearchString(searchValue);
    setKeyword(parsed.keyword);

    const nextFilters: AccountFilters = {
      roles: parsed.params.roles
        ? (parsed.params.roles.split(",") as Role[])
        : [],
      // For isActive, we handle it specially
      isActive: parsed.params.isActive !== "false",
      enableIsActiveFilter: parsed.params.isActive !== undefined,
    };
    setFilters(nextFilters);
    setPage(1);
  };


  const handleOpenFilter = () => {
    setDraftFilters(filters);
    setFilterOpen(true);
  };

  const handleApplyFilter = () => {
    const parsed = parseSearchString(searchValue);
    setKeyword(parsed.keyword);
    setFilters(draftFilters);
    setPage(1);
    setFilterOpen(false);
  };

  const handleCloseFilter = () => {
    setFilterOpen(false);
  };

  const handleClearFilter = () => {
    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);
    setPage(1);
    setFilterOpen(false);
  };


  const handlePageChange = (p: number) => {
    setPage(p);
  };

  const handleKeywordChange = (value: string) => {
    setSearchValue(value);
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
          ["users", { page, keyword, ...filters }],
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
    [queryClient, page, keyword, filters],
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
          ["users", { page, keyword, ...filters }],
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
    [queryClient, page, keyword, filters],
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
        middleSlot={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              Thêm
            </button>
          </div>
        }

        searchPlaceholder="Tìm kiếm theo tên, email..."
        showFilter={true}
        onFilterClick={handleOpenFilter}
        filterButtonRef={filterButtonRef}
        columns={columns}
        actions={actions}
        onPageChange={handlePageChange}
        detailDrawer={
          <UserDetailDrawer
            userId={selectedId}
            onClose={handleCloseDetail}
            onUserChanged={(updated) =>
              queryClient.setQueryData(
                ["users", { page, keyword, ...filters }],
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

      <AdvancedFilterModal
        open={filterOpen}
        value={draftFilters}
        onChange={setDraftFilters}

        onClear={handleClearFilter}
        onApply={handleApplyFilter}
        onRequestClose={handleCloseFilter}
        anchorRef={filterButtonRef}
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
