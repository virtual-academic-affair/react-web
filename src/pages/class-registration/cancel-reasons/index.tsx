import Switch from "@/components/switch";
import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout";
import { cancelReasonsService } from "@/services/class-registration";
import type { CancelReason } from "@/types/classRegistration";
import type { PaginatedResponse } from "@/types/common";
import { formatDate } from "@/utils/date";
import { message as toast } from "antd";
import React from "react";
import { MdDeleteOutline, MdEdit } from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import AdvancedFilterModal, {
  type CancelReasonFilters,
} from "./components/AdvancedFilterModal";
import CancelReasonDrawer from "./components/CancelReasonDrawer";

const PAGE_SIZE = 10;

const defaultFilters: CancelReasonFilters = {
  enableIsActiveFilter: false,
  isActive: true,
};

const CancelReasonsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] =
    React.useState<PaginatedResponse<CancelReason> | null>(null);
  const [loading, setLoading] = React.useState(true);
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
  const [draftFilters, setDraftFilters] =
    React.useState<CancelReasonFilters>(defaultFilters);
  const [filterOpen, setFilterOpen] = React.useState(false);

  const idParam = searchParams.get("id");
  const selectedId = idParam ? Number(idParam) : null;
  const selectedReason =
    selectedId && result?.items
      ? (result.items.find((x) => x.id === selectedId) ?? null)
      : null;

  const fetchList = React.useCallback(
    async (p: number, kw: string, f: CancelReasonFilters) => {
      setLoading(true);
      try {
        const resp = await cancelReasonsService.getList({
          page: p,
          limit: PAGE_SIZE,
          keyword: kw || undefined,
          isActive: f.enableIsActiveFilter ? f.isActive : undefined,
          orderCol: "id",
          orderDir: "DESC",
        });
        setResult(resp);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Không thể tải lý do hủy.";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    fetchList(page, keyword, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

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

  const handleEdit = React.useCallback(
    (item: CancelReason) => {
      const next = new URLSearchParams(searchParams);
      next.set("id", String(item.id));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleDelete = React.useCallback(async (item: CancelReason) => {
    if (!window.confirm(`Xóa lý do hủy #${item.id}?`)) {
      return;
    }
    try {
      await cancelReasonsService.remove(item.id);
      toast.success("Đã xóa.");
      setResult((prev) =>
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
      setResult((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((x) => (x.id === updated.id ? updated : x)),
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
        icon: <MdEdit className="h-4 w-4" />,
        label: "Sửa",
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
        searchValue={keyword}
        onSearchChange={setKeyword}
        onSearch={() => {
          setPage(1);
          fetchList(1, keyword, filters);
        }}
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
        onSaved={(reason, mode) =>
          setResult((prev) =>
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
          )
        }
      />

      <AdvancedFilterModal
        open={filterOpen}
        value={draftFilters}
        onChange={setDraftFilters}
        onApply={() => {
          setFilters(draftFilters);
          setPage(1);
          setFilterOpen(false);
          fetchList(1, keyword, draftFilters);
        }}
        onClear={() => {
          setDraftFilters(defaultFilters);
          setFilters(defaultFilters);
          setPage(1);
          setFilterOpen(false);
          fetchList(1, keyword, defaultFilters);
        }}
        onRequestClose={() => setFilterOpen(false)}
      />
    </div>
  );
};

export default CancelReasonsPage;
