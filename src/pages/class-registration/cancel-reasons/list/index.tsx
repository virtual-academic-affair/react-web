import Switch from "@/components/switch";
import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout";
import { cancelReasonsService } from "@/services/class-registration";
import type { CancelReason } from "@/types/classRegistration";
import type { PaginatedResponse } from "@/types/common";
import { formatDate } from "@/utils/date";
import { parseSearchString, stringifySearchQuery } from "@/utils/search";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import React from "react";
import { MdDeleteOutline, MdInfoOutline } from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import AdvancedFilterModal, {
  type CancelReasonFilters,
} from "../components/AdvancedFilterModal";
import CancelReasonDrawer from "../components/CancelReasonDrawer";

const PAGE_SIZE = 10;

const defaultFilters: CancelReasonFilters = {
  enableIsActiveFilter: false,
  isActive: true,
};

const CancelReasonsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = React.useState(
    Number(searchParams.get("page") ?? "1") > 0
      ? Number(searchParams.get("page") ?? "1")
      : 1,
  );
  const [keyword, setKeyword] = React.useState(
    searchParams.get("keyword") ?? "",
  );
  const [updatingIds, setUpdatingIds] = React.useState<Set<number>>(new Set());
  const [filters, setFilters] = React.useState<CancelReasonFilters>(() => {
    const enableFilter = searchParams.get("enableIsActiveFilter") === "true";
    const isActive = searchParams.get("isActive") === "true";
    return {
      enableIsActiveFilter: enableFilter,
      isActive: enableFilter ? isActive : true,
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
      ["page", "limit"],
    );
  });

  const [draftFilters, setDraftFilters] =
    React.useState<CancelReasonFilters>(defaultFilters);
  const [filterOpen, setFilterOpen] = React.useState(false);

  const idParam = searchParams.get("id");
  const selectedId = idParam ? Number(idParam) : null;
  const { data: result = null, isLoading: loading } = useQuery({
    queryKey: ["cancel-reasons", { page, keyword, ...filters }],
    queryFn: () =>
      cancelReasonsService.getList({
        page,
        limit: PAGE_SIZE,
        keyword: keyword || undefined,
        isActive: filters.enableIsActiveFilter ? filters.isActive : undefined,
        orderCol: "id",
        orderDir: "DESC",
      }),
    staleTime: 30 * 1000,
  });

  const selectedReason =
    selectedId && result?.items
      ? (result.items.find((x) => x.id === selectedId) ?? null)
      : null;

  React.useEffect(() => {
    const paramsToSerialize = { ...filters };
    if (!filters.enableIsActiveFilter) {
      delete (paramsToSerialize as Record<string, unknown>).isActive;
      delete (paramsToSerialize as Record<string, unknown>)
        .enableIsActiveFilter;
    }

    setSearchValue(
      stringifySearchQuery(
        keyword,
        paramsToSerialize as unknown as Record<string, unknown>,
        ["page", "limit"],
      ),
    );
  }, [keyword, filters]);

  React.useEffect(() => {
    const next = new URLSearchParams();
    if (keyword) {
      next.set("keyword", keyword);
    }
    next.set("page", String(page));
    next.set("limit", String(PAGE_SIZE));
    if (filters.enableIsActiveFilter) {
      next.set("enableIsActiveFilter", "true");
      next.set("isActive", String(filters.isActive));
    }
    if (selectedId != null) {
      next.set("id", String(selectedId));
    }
    setSearchParams(next, { replace: true });
  }, [filters, keyword, page, selectedId, setSearchParams]);

  const handleSearch = () => {
    const parsed = parseSearchString(searchValue);
    setKeyword(parsed.keyword);

    const nextFilters: CancelReasonFilters = {
      isActive: parsed.params.isActive === "true",
      enableIsActiveFilter: parsed.params.isActive !== undefined,
    };
    setFilters(nextFilters);
    setPage(1);
  };

  const handleEdit = React.useCallback(
    (item: CancelReason) => {
      const next = new URLSearchParams(searchParams);
      next.set("id", String(item.id));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleDelete = React.useCallback(async (item: CancelReason) => {
    if (!window.confirm(`Xóa lý do từ chối #${item.id}?`)) {
      return;
    }
    try {
      await cancelReasonsService.remove(item.id);
      toast.success("Đã xóa.");
      queryClient.setQueryData(
        ["cancel-reasons", { page, keyword, ...filters }],
        (prev: PaginatedResponse<CancelReason> | null) =>
          prev
            ? {
                ...prev,
                items: prev.items.filter((x) => x.id !== item.id),
              }
            : prev,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xóa thất bại.";
      toast.error(msg);
    }
  }, []);

  const handleToggleActive = async (item: CancelReason, next: boolean) => {
    if (item.isActive === next) {
      return;
    }
    setUpdatingIds((prev) => new Set(prev).add(item.id));
    try {
      const updated = await cancelReasonsService.update(item.id, {
        isActive: next,
      });
      toast.success(next ? "Đã kích hoạt lý do." : "Đã vô hiệu hóa lý do.");
      queryClient.setQueryData(
        ["cancel-reasons", { page, keyword, ...filters }],
        (prev: PaginatedResponse<CancelReason> | null) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((x) =>
                  x.id === updated.id ? updated : x,
                ),
              }
            : prev,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại.";
      toast.error(msg);
    } finally {
      setUpdatingIds((prev) => {
        const nextSet = new Set(prev);
        nextSet.delete(item.id);
        return nextSet;
      });
    }
  };

  const columns: TableColumn<CancelReason>[] = React.useMemo(
    () => [
      {
        key: "content",
        header: "Nội dung",
        render: (x) => (
          <p className="text-navy-700 text-sm font-medium dark:text-white">
            {x.content}
          </p>
        ),
      },
      {
        key: "updatedAt",
        header: "Chỉnh sửa lần cuối",
        render: (x) => (
          <p className="text-navy-700 text-sm dark:text-white">
            {formatDate(x.updatedAt)}
          </p>
        ),
      },
      {
        key: "isActive",
        header: "Trạng thái hiển thị",
        render: (x) => (
          <div className="flex items-center gap-2">
            <Switch
              checked={x.isActive}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleToggleActive(x, e.target.checked)
              }
              disabled={updatingIds.has(x.id)}
            />
          </div>
        ),
      },
    ],
    [updatingIds],
  );

  const actions: TableAction<CancelReason>[] = React.useMemo(
    () => [
      {
        key: "edit",
        icon: <MdInfoOutline className="h-4 w-4" />,
        label: "Chi tiết",
        onClick: handleEdit,
      },
      {
        key: "delete",
        icon: <MdDeleteOutline className="h-4 w-4" />,
        label: "Xóa",
        onClick: handleDelete,
        className:
          "flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600",
      },
    ],
    [handleEdit, handleDelete],
  );

  return (
    <div className="flex flex-col gap-4">
      <TableLayout
        result={result}
        loading={loading}
        page={page}
        pageSize={PAGE_SIZE}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearch={handleSearch}
        searchPlaceholder="Tìm theo nội dung..."
        showFilter={true}
        onFilterClick={() => {
          setDraftFilters(filters);
          setFilterOpen(true);
        }}
        columns={columns}
        actions={actions}
        onPageChange={setPage}
      />

      <CancelReasonDrawer
        reasonId={selectedId}
        initialReason={selectedReason}
        isOpen={selectedId != null}
        onClose={() => {
          if (selectedId != null) {
            const next = new URLSearchParams(searchParams);
            next.delete("id");
            setSearchParams(next, { replace: true });
          }
        }}
        onSaved={(reason, mode) => {
          toast.success(
            mode === "create" ? "Đã tạo lý do hủy." : "Đã cập nhật lý do hủy."
          );
          queryClient.setQueryData(
            ["cancel-reasons", { page, keyword, ...filters }],
            (prev: PaginatedResponse<CancelReason> | null) =>
              prev
                ? {
                    ...prev,
                    items:
                      mode === "create"
                        ? [reason, ...prev.items]
                        : prev.items.map((x) =>
                            x.id === reason.id ? reason : x,
                          ),
                  }
                : prev,
          );
        }}
      />

      <AdvancedFilterModal
        open={filterOpen}
        value={draftFilters}
        onChange={setDraftFilters}
        onApply={() => {
          const parsed = parseSearchString(searchValue);
          setKeyword(parsed.keyword);
          setFilters(draftFilters);
          setPage(1);
          setFilterOpen(false);
        }}
        onClear={() => {
          const parsed = parseSearchString(searchValue);
          setKeyword(parsed.keyword);
          setDraftFilters(defaultFilters);
          setFilters(defaultFilters);
          setPage(1);
          setFilterOpen(false);
        }}
        onRequestClose={() => setFilterOpen(false)}
      />
    </div>
  );
};

export default CancelReasonsPage;
