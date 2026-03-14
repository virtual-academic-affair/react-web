import Switch from "@/components/switch";
import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout";
import Tooltip from "@/components/tooltip/Tooltip.tsx";
import { cancelReasonsService } from "@/services/class-registration";
import type { CancelReason } from "@/types/classRegistration";
import type { PaginatedResponse } from "@/types/common";
import { formatDate } from "@/utils/date";
import { message as toast } from "antd";
import React from "react";
import { MdAdd, MdDeleteOutline, MdEdit } from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import CancelReasonDrawer from "./components/CancelReasonDrawer";

const PAGE_SIZE = 10;

const CancelReasonsPage: React.FC = () => {
  const [result, setResult] =
    React.useState<PaginatedResponse<CancelReason> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [keyword, setKeyword] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [updatingIds, setUpdatingIds] = React.useState<Set<number>>(new Set());

  const idParam = searchParams.get("id");
  const selectedId = idParam ? Number(idParam) : null;
  const selectedReason =
    selectedId && result?.items
      ? (result.items.find((x) => x.id === selectedId) ?? null)
      : null;

  const fetchList = React.useCallback(async (p: number, kw: string) => {
    setLoading(true);
    try {
      const resp = await cancelReasonsService.getList({
        page: p,
        limit: PAGE_SIZE,
        keyword: kw || undefined,
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
  }, []);

  React.useEffect(() => {
    fetchList(page, keyword);
  }, [fetchList, page, keyword]);

  const handleOpenCreate = () => {
    setCreateOpen(true);
  };

  const handleEdit = (item: CancelReason) => {
    const next = new URLSearchParams(searchParams);
    next.set("id", String(item.id));
    setSearchParams(next, { replace: true });
  };

  const handleDelete = async (item: CancelReason) => {
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
  };

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
      const msg =
        err instanceof Error ? err.message : "Cập nhật trạng thái thất bại.";
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
        onSearch={() => fetchList(1, keyword)}
        searchPlaceholder="Tìm theo nội dung..."
        columns={columns}
        actions={actions}
        onPageChange={setPage}
        rightSlot={
          <Tooltip label="Thêm">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="bg-brand-500 hover:bg-brand-600 flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-bold text-white transition-colors dark:bg-brand-500 dark:hover:bg-brand-400"
            >
              <MdAdd className="h-5 w-5" />
            </button>
          </Tooltip>
        }
      />

      <CancelReasonDrawer
        reasonId={selectedId}
        initialReason={selectedReason}
        isOpen={createOpen || selectedId != null}
        onClose={() => {
          setCreateOpen(false);
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
    </div>
  );
};

export default CancelReasonsPage;
