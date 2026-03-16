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
import { MdInfoOutline } from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import AdvancedFilterModal from "./components/AdvancedFilterModal.tsx";
import RoleSelector from "./components/RoleSelector.tsx";
import UserDetailDrawer from "./components/UserDetailDrawer.tsx";
import { getUserAvatarUrl } from "./utils.ts";

const PAGE_SIZE = 10;

interface UsersPageProps {
  data: DynamicDataResponse | null;
}

const UsersPage: React.FC<UsersPageProps> = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialKeyword = searchParams.get("keyword") ?? "";
  const initialPage =
    Number(searchParams.get("page") ?? "1") > 0
      ? Number(searchParams.get("page") ?? "1")
      : 1;
  const rolesParam = searchParams.get("roles");
  const initialRoles = rolesParam
    ? (rolesParam.split(",").filter(Boolean) as Role[])
    : [];

  const [result, setResult] = React.useState<PaginatedResponse<User> | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [keyword, setKeyword] = React.useState(initialKeyword);
  const [page, setPage] = React.useState(initialPage);
  const [rolesFilter, setRolesFilter] = React.useState<Role[]>(initialRoles);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [draftRoles, setDraftRoles] = React.useState<Role[]>([]);
  const [updatingUsers, setUpdatingUsers] = React.useState<Set<number>>(
    new Set(),
  );

  const idParam = searchParams.get("id");
  const selectedId = idParam ? Number(idParam) : null;

  const fetchUsers = React.useCallback(
    async (p: number, kw: string, roles: Role[]) => {
      setLoading(true);
      try {
        const resp = await usersService.getUsers({
          page: p,
          limit: PAGE_SIZE,
          keyword: kw || undefined,
          roles: roles.length > 0 ? roles : undefined,
        });
        setResult(resp);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách tài khoản.";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    fetchUsers(page, keyword, rolesFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rolesFilter]);

  // Keep URL params in sync
  React.useEffect(() => {
    const next = new URLSearchParams();
    if (keyword) {
      next.set("keyword", keyword);
    }
    next.set("page", String(page));
    next.set("limit", String(PAGE_SIZE));
    if (rolesFilter.length) {
      next.set("roles", rolesFilter.join(","));
    }
    if (idParam) {
      next.set("id", idParam);
    }
    setSearchParams(next, { replace: true });
  }, [keyword, page, rolesFilter, idParam, setSearchParams]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers(1, keyword, rolesFilter);
  };

  const handleOpenFilter = () => {
    setDraftRoles(rolesFilter);
    setFilterOpen(true);
  };

  const handleApplyFilter = () => {
    setRolesFilter(draftRoles);
    setPage(1);
    setFilterOpen(false);
    fetchUsers(1, keyword, draftRoles);
  };

  const handleCloseFilter = () => {
    setFilterOpen(false);
  };

  const handleClearFilter = () => {
    setDraftRoles([]);
    setRolesFilter([]);
    setPage(1);
    fetchUsers(1, keyword, []);
    setFilterOpen(false);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
  };

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
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
        setResult((prev) =>
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
        setResult((prev) =>
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
            <img
              src={getUserAvatarUrl(user)}
              alt={user.name || user.email}
              className="h-12 w-12 rounded-[14px] object-cover"
            />
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
        searchValue={keyword}
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
              setResult((prev) =>
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
        value={draftRoles}
        onChange={setDraftRoles}
        onClear={handleClearFilter}
        onApply={handleApplyFilter}
        onRequestClose={handleCloseFilter}
      />
    </>
  );
};

export default UsersPage;
