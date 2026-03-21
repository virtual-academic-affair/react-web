import Switch from "@/components/switch";
import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout.tsx";
import { usersService } from "@/services/users";
import type { PaginatedResponse } from "@/types/common.ts";
import type { DynamicDataResponse } from "@/types/shared.ts";
import type { Role, UpdateUserDto, User } from "@/types/users.ts";
import { formatDate } from "@/utils/date";
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
    [],
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
    [],
  );


  // Define table columns
  const columns: TableColumn<User>[] = React.useMemo(
    () => [
      {
        key: "name",
        header: "Tên",
        width: "300px",
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
            <div className="flex flex-col">
              <p className="text-navy-700 text-sm font-medium dark:text-white">
                {user.name || user.email}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {user.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "createdAt",
        header: "Ngày tham gia",
        render: (user) => (
          <p className="text-navy-700 text-sm dark:text-white">
            {formatDate(user.createdAt)}
          </p>
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
        showFilter={true}
        onFilterClick={handleOpenFilter}
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
      />
    </>
  );
};

export default UsersPage;
