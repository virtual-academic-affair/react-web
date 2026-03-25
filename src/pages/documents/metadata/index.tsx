import Switch from "@/components/switch";
import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout";
import { MetadataService } from "@/services/documents.service";
import type { PaginatedResponse } from "@/types/common";
import { formatDate } from "@/utils/date";
import { parseError } from "@/utils/parseError";
import { message as toast } from "antd";
import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MdDeleteOutline, MdEdit, MdAdd } from "react-icons/md";
import { useNavigate, useSearchParams } from "react-router-dom";
import MetadataTypeDrawer from "./components/MetadataTypeDrawer";

const PAGE_SIZE = 10;

interface MetadataType {
  id: string | number;
  key: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  allowedValues?: Array<{
    value: string;
    displayName: string;
    isActive: boolean;
    color?: string;
    visibleRoles?: string[];
    totalFiles?: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

const MetadataManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = React.useState(
    Number(searchParams.get("page") ?? "1") > 0
      ? Number(searchParams.get("page") ?? "1")
      : 1,
  );
  const [keyword, setKeyword] = React.useState(
    searchParams.get("keyword") ?? "",
  );
  const [updatingIds, setUpdatingIds] = React.useState<Set<string>>(new Set());

  const idParam = searchParams.get("id");
  const selectedTypeKey = idParam || null;

  const { data: allTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ["metadata-types-all"],
    queryFn: () => MetadataService.listTypes(false),
  });

  const filteredTypes = React.useMemo(() => {
    if (!keyword.trim()) return allTypes;
    const lower = keyword.toLowerCase();
    return allTypes.filter(
      (t: MetadataType) =>
        t.key.toLowerCase().includes(lower) ||
        t.displayName?.toLowerCase().includes(lower) ||
        t.description?.toLowerCase().includes(lower),
    );
  }, [allTypes, keyword]);

  const paginatedResult = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const items = filteredTypes.slice(start, end);
    return {
      items,
      pagination: {
        total: filteredTypes.length,
        totalPages: Math.ceil(filteredTypes.length / PAGE_SIZE),
        currentPage: page,
      },
    } as PaginatedResponse<MetadataType>;
  }, [filteredTypes, page]);

  const selectedType =
    selectedTypeKey && allTypes.length > 0
      ? allTypes.find((t: MetadataType) => t.key === selectedTypeKey) ?? null
      : null;

  React.useEffect(() => {
    const next = new URLSearchParams();
    if (keyword) {
      next.set("keyword", keyword);
    }
    next.set("page", String(page));
    if (selectedTypeKey) {
      next.set("id", selectedTypeKey);
    }
    setSearchParams(next, { replace: true });
  }, [keyword, page, selectedTypeKey, setSearchParams]);

  const handleSearch = () => {
    setPage(1);
  };

  const handleEdit = React.useCallback(
    (item: MetadataType) => {
      const next = new URLSearchParams(searchParams);
      next.set("id", item.key);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleDelete = React.useCallback(async (item: MetadataType) => {
    if (!window.confirm(`Xóa nhãn "${item.displayName || item.key}"?\nThao tác này không thể hoàn tác.`)) {
      return;
    }
    try {
      await MetadataService.deleteType(item.key);
      toast.success("Đã xóa nhãn.");
      queryClient.invalidateQueries({ queryKey: ["metadata-types-all"] });
    } catch (err: unknown) {
      toast.error(parseError(err));
    }
  }, [queryClient]);

  const handleToggleActive = React.useCallback(
    async (item: MetadataType, next: boolean) => {
      if (item.isActive === next) {
        return;
      }
      setUpdatingIds((prev) => new Set(prev).add(item.key));
      try {
        await MetadataService.updateType(item.key, { isActive: next });
        toast.success(next ? "Đã kích hoạt nhãn." : "Đã vô hiệu hóa nhãn.");
        queryClient.invalidateQueries({ queryKey: ["metadata-types-all"] });
      } catch (err: unknown) {
        toast.error(parseError(err));
      } finally {
        setUpdatingIds((prev) => {
          const nextSet = new Set(prev);
          nextSet.delete(item.key);
          return nextSet;
        });
      }
    },
    [queryClient],
  );

  const columns: TableColumn<MetadataType>[] = React.useMemo(
    () => [
      {
        key: "key",
        header: "Code",
        width: "20%",
        render: (x) => (
          <p className="font-mono text-sm font-semibold text-navy-700 dark:text-white">
            {x.key}
          </p>
        ),
      },
      {
        key: "displayName",
        header: "Tên hiển thị",
        width: "25%",
        render: (x) => (
          <p className="text-navy-700 text-sm font-medium dark:text-white">
            {x.displayName || "-"}
          </p>
        ),
      },
      {
        key: "description",
        header: "Mô tả",
        width: "20%",
        render: (x) => (
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
            {x.description || "-"}
          </p>
        ),
      },
      {
        key: "allowedValues",
        header: "Giá trị",
        width: "15%",
        render: (x) => {
          const count = x.allowedValues?.length ?? 0;
          return (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">
              {count} giá trị
            </span>
          );
        },
      },
      {
        key: "isActive",
        header: "Trạng thái",
        width: "10%",
        render: (x) => (
          <div className="flex items-center gap-2">
            <Switch
              checked={x.isActive}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleToggleActive(x, e.target.checked)
              }
              disabled={updatingIds.has(x.key)}
            />
          </div>
        ),
      },
      {
        key: "updatedAt",
        header: "Chỉnh sửa lần cuối",
        width: "10%",
        render: (x) => (
          <p className="text-navy-700 text-sm dark:text-white">
            {x.updatedAt ? formatDate(x.updatedAt) : "-"}
          </p>
        ),
      },
    ],
    [handleToggleActive, updatingIds],
  );

  const actions: TableAction<MetadataType>[] = React.useMemo(
    () => [
      {
        key: "edit",
        icon: <MdEdit className="h-4 w-4" />,
        label: "Sửa",
        onClick: handleEdit,
        className:
          "flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white transition-colors hover:bg-brand-600",
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

  const rightSlot = (
    <button
      type="button"
      onClick={() => navigate("/admin/documents/metadata/create")}
      className="bg-brand-500 hover:bg-brand-600 flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-white transition-colors"
    >
      <MdAdd className="h-5 w-5" />
      Tạo nhãn mới
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <TableLayout<MetadataType>
        result={paginatedResult}
        loading={typesLoading}
        page={page}
        pageSize={PAGE_SIZE}
        searchValue={keyword}
        onSearchChange={setKeyword}
        onSearch={handleSearch}
        searchPlaceholder="Tìm theo code, tên hiển thị..."
        showFilter={false}
        rightSlot={rightSlot}
        columns={columns}
        actions={actions}
        onPageChange={setPage}
        onRowClick={handleEdit}
      />

      <MetadataTypeDrawer
        typeCode={selectedTypeKey}
        initialType={selectedType}
        isOpen={selectedTypeKey !== null}
        onClose={() => {
          if (selectedTypeKey) {
            const next = new URLSearchParams(searchParams);
            next.delete("id");
            setSearchParams(next, { replace: true });
          }
        }}
        onSaved={(_type, mode) => {
          toast.success(
            mode === "create"
              ? "Đã tạo nhãn mới."
              : "Đã cập nhật nhãn.",
          );
          queryClient.invalidateQueries({ queryKey: ["metadata-types-all"] });
          if (mode === "create") {
            const next = new URLSearchParams(searchParams);
            next.delete("id");
            setSearchParams(next, { replace: true });
          }
        }}
      />
    </div>
  );
};

export default MetadataManagementPage;
