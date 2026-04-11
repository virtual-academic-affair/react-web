import Switch from "@/components/switch";
import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout";
import Tag from "@/components/tag/Tag";
import Tooltip from "@/components/tooltip/Tooltip";
import { MetadataService } from "@/services/documents";
import type { PaginatedResponse } from "@/types/common";
import { parseError } from "@/utils/parseError";
import { parseSearchString, stringifySearchQuery } from "@/utils/search";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import React from "react";
import { MdDeleteOutline, MdInfoOutline } from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import MetadataFilterModal, {
  type MetadataFilters,
  metadataDefaultFilters,
} from "./components/MetadataFilterModal";
import MetadataTypeDrawer from "./components/MetadataTypeDrawer";

const PAGE_SIZE = 10;

interface AllowedValue {
  value: string;
  displayName: string;
  isActive: boolean;
  color?: string;
  visibleRoles?: string[];
  totalFiles?: number;
}

interface MetadataType {
  id: string | number;
  key: string;
  displayName: string;
  description?: string;
  isSystem?: boolean;
  isActive: boolean;
  allowedValues?: AllowedValue[];
  totalFiles?: number;
  createdAt?: string;
  updatedAt?: string;
}

const MetadataManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = React.useState(
    Number(searchParams.get("page") ?? "1") > 0
      ? Number(searchParams.get("page") ?? "1")
      : 1,
  );
  const [updatingIds, setUpdatingIds] = React.useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = React.useState(false);

  const [filters, setFilters] = React.useState<MetadataFilters>(() => {
    const enableFilter = searchParams.get("enableIsActiveFilter") === "true";
    const isActive = searchParams.get("isActive") !== "false";
    return {
      enableIsActiveFilter: enableFilter,
      isActive,
    };
  });

  const initialKeyword = searchParams.get("keyword") ?? "";
  const [keyword, setKeyword] = React.useState(initialKeyword);
  const [searchValue, setSearchValue] = React.useState(() =>
    stringifySearchQuery(
      initialKeyword,
      { enableIsActiveFilter: false } as unknown as Record<string, unknown>,
      ["page", "limit"],
    ),
  );

  const [draftFilters, setDraftFilters] = React.useState<MetadataFilters>(
    metadataDefaultFilters,
  );

  const idParam = searchParams.get("id");
  const selectedTypeKey = idParam || null;

  const { data: allTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ["metadata-types-all", keyword, filters],
    queryFn: () =>
      MetadataService.listTypes({
        keywords: keyword.trim() || undefined,
        isActive: filters.isActive,
        enableIsActiveFilter: filters.enableIsActiveFilter,
      }),
  });

  const filteredTypes = React.useMemo(() => {
    return allTypes.filter((t: MetadataType) => t.key !== "access_scope");
  }, [allTypes]);

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
      ? (allTypes.find((t: MetadataType) => t.key === selectedTypeKey) ?? null)
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
    if (filters.enableIsActiveFilter) {
      next.set("enableIsActiveFilter", "true");
      next.set("isActive", String(filters.isActive));
    }
    setSearchParams(next, { replace: true });
  }, [filters, keyword, page, selectedTypeKey, setSearchParams]);

  // Sync searchValue when keyword or filters change (from filter modal or URL)
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

  const handleSearch = () => {
    const parsed = parseSearchString(searchValue);
    setKeyword(parsed.keyword);

    // Sync filters from typed params
    const nextFilters: MetadataFilters = {
      isActive: parsed.params.isActive !== "false",
      enableIsActiveFilter: parsed.params.isActive !== undefined,
    };
    setFilters(nextFilters);
    setPage(1);
  };

  const handleKeywordChange = (value: string) => {
    setSearchValue(value);
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
    const parsed = parseSearchString(searchValue);
    setKeyword(parsed.keyword);
    setDraftFilters(metadataDefaultFilters);
    setFilters(metadataDefaultFilters);
    setPage(1);
    setFilterOpen(false);
  };

  const handleOpenDetail = React.useCallback(
    (item: MetadataType) => {
      const next = new URLSearchParams(searchParams);
      next.set("id", item.key);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleDelete = React.useCallback(
    async (item: MetadataType) => {
      if (item.isSystem) {
        toast.error("Không thể xóa nhãn hệ thống.");
        return;
      }
      const totalFiles =
        item.allowedValues?.reduce((sum, v) => sum + (v.totalFiles || 0), 0) ||
        0;
      if (totalFiles > 0) {
        toast.error(`Không thể xóa nhãn đã có tài liệu.`);
        return;
      }
      if (
        !window.confirm(
          `Xóa nhãn "${item.displayName || item.key}"?\nThao tác này không thể hoàn tác.`,
        )
      ) {
        return;
      }
      try {
        await MetadataService.deleteType(item.key);
        toast.success("Đã xóa nhãn.");
        queryClient.invalidateQueries({ queryKey: ["metadata-types-all"] });
      } catch (err: unknown) {
        toast.error(parseError(err));
      }
    },
    [queryClient],
  );

  const handleToggleActive = React.useCallback(
    async (item: MetadataType, next: boolean) => {
      if (item.isSystem) {
        return;
      }
      if (item.isActive === next) {
        return;
      }
      setUpdatingIds((prev) => new Set(prev).add(item.key));
      try {
        await MetadataService.updateType(item.key, { isActive: next });
        toast.success(next ? "Cập nhật thành công" : "Cập nhật thành công");
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
        key: "displayName",
        header: "Tên hiển thị",
        width: "30%",
        render: (x) => (
          <div className="flex flex-col">
            <Tooltip
              label={x.displayName || "-"}
              placement="topLeft"
              wrap
              className="flex items-center gap-2"
            >
              <p className="text-navy-700 text-sm font-medium dark:text-white">
                {x.displayName || "-"}
              </p>
              {x.isSystem && <Tag>Hệ thống</Tag>}
            </Tooltip>
            <Tooltip
              label={`#${x.key}`}
              placement="topLeft"
              wrap
              className="flex items-center gap-2"
            >
              <p className="text-xs text-gray-400 dark:text-gray-500">
                #{x.key}
              </p>
            </Tooltip>
          </div>
        ),
      },
      {
        key: "values",
        header: "SL giá trị",
        width: "100px",
        render: (x) => (
          <span className="text-navy-700 text-sm dark:text-white">
            {x.allowedValues?.length ?? 0}
          </span>
        ),
      },
      {
        key: "files",
        header: "SL tài liệu",
        width: "100px",
        render: (x) => {
          const totalFiles =
            x.allowedValues?.reduce((sum, v) => sum + (v.totalFiles || 0), 0) ||
            0;
          return (
            <span className="text-navy-700 flex text-sm dark:text-white">
              {totalFiles}
            </span>
          );
        },
      },
      {
        key: "isActive",
        header: "Trạng thái hiển thị",
        width: "16%",
        render: (x) => {
          const isUpdating = updatingIds.has(x.key);
          const isSystem = x.isSystem;
          const tooltip = isSystem
            ? "Không thể thay đổi trạng thái nhãn hệ thống."
            : undefined;

          const switchButton = (
            <Switch
              checked={x.isActive}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleToggleActive(x, e.target.checked)
              }
              disabled={isUpdating || isSystem}
            />
          );

          return (
            <div className="flex items-center gap-2">
              {isSystem ? (
                <Tooltip label={tooltip}>{switchButton}</Tooltip>
              ) : (
                switchButton
              )}
            </div>
          );
        },
      },
    ],
    [handleToggleActive, updatingIds],
  );

  const actions: TableAction<MetadataType>[] = React.useMemo(
    () => [
      {
        key: "detail",
        icon: <MdInfoOutline className="h-4 w-4" />,
        label: "Chi tiết",
        onClick: handleOpenDetail,
        className:
          "flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white transition-colors hover:bg-brand-600",
      },
      {
        key: "delete",
        label: "Xóa",
        onClick: handleDelete,
        className:
          "flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600",
        icon: <MdDeleteOutline className="h-4 w-4" />,
        render: (x) => {
          const isSystem = x.isSystem;
          const totalFiles =
            x.allowedValues?.reduce((sum, v) => sum + (v.totalFiles || 0), 0) ||
            0;
          const isDisabled = isSystem || totalFiles > 0;
          let tooltip = "";
          if (isSystem) {
            tooltip = "Không thể xóa nhãn hệ thống.";
          } else if (totalFiles > 0) {
            tooltip = `Không thể xóa nhãn đã có tài liệu.`;
          }
          const button = (
            <button
              type="button"
              onClick={() => handleDelete(x)}
              disabled={isDisabled}
              className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white transition-colors ${
                isDisabled
                  ? "cursor-not-allowed bg-gray-300 opacity-50 dark:bg-gray-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              <MdDeleteOutline className="h-4 w-4" />
            </button>
          );
          if (isDisabled) {
            return <Tooltip label={tooltip}>{button}</Tooltip>;
          }
          return button;
        },
      },
    ],
    [handleOpenDetail, handleDelete],
  );

  return (
    <div className="flex flex-col gap-4">
      <TableLayout<MetadataType>
        result={paginatedResult}
        loading={typesLoading}
        page={page}
        pageSize={PAGE_SIZE}
        searchValue={searchValue}
        onSearchChange={handleKeywordChange}
        onSearch={handleSearch}
        searchPlaceholder="Tìm theo tên, code..."
        showFilter={true}
        onFilterClick={handleOpenFilter}
        columns={columns}
        actions={actions}
        onPageChange={setPage}
        onRowClick={() => {}}
      />

      <MetadataFilterModal
        open={filterOpen}
        value={draftFilters}
        onChange={setDraftFilters}
        onClear={handleClearFilter}
        onApply={handleApplyFilter}
        onRequestClose={handleCloseFilter}
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
          // Thông báo do MetadataTypeDrawer xử lý (tránh toast trùng)
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
