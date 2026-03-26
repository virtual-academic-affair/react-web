import React, { useState, useMemo, useCallback } from "react";
import { message as toast } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  MdDeleteOutline,
  MdFileDownload,
  MdInfoOutline,
} from "react-icons/md";

import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout";
import Tag from "@/components/tag/Tag";
import { DocumentsService, MetadataService } from "@/services/documents.service";
import { formatDate } from "@/utils/date";
import { parseError } from "@/utils/parseError";
import { parseSearchString, stringifySearchQuery } from "@/utils/search";
import { RoleColors } from "@/types/users";

import DocumentDetailDrawer from "../components/DocumentDetailDrawer";
import AdvancedFilterModal, {
  type DocumentFilters,
} from "../components/AdvancedFilterModal";

const PAGE_SIZE = 10;

const DocumentListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── State ────────────────────────────────────────────────────────────────────
  const [page, setPage] = useState(
    Number(searchParams.get("page") ?? "1") > 0
      ? Number(searchParams.get("page") ?? "1")
      : 1,
  );
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [filters, setFilters] = useState<DocumentFilters>(() => ({
    accessScope: searchParams.get("accessScope") || undefined,
    academicYear: searchParams.get("academicYear") || undefined,
    cohort: searchParams.get("cohort") || undefined,
  }));

  const [searchValue, setSearchValue] = useState(() =>
    stringifySearchQuery(
      searchParams.get("keyword") ?? "",
      filters as any,
      ["page", "limit"],
    ),
  );

  const [draftFilters, setDraftFilters] = useState<DocumentFilters>(filters);
  const [filterOpen, setFilterOpen] = useState(false);

  // Detail drawer
  const idParam = searchParams.get("id");
  const selectedFileId = idParam || null;

  // ── Queries ───────────────────────────────────────────────────────────────────
  const { data: metadataTypes = [] } = useQuery({
    queryKey: ["metadata-types"],
    queryFn: () => MetadataService.listTypes(true),
  });

  const { data: result = null, isLoading: loading } = useQuery({
    queryKey: ["documents", { page, keyword, ...filters }],
    queryFn: async () => {
      const params: any = {
        page,
        limit: PAGE_SIZE,
      };
      if (keyword) params.q = keyword;
      if (filters.accessScope) params.accessScope = filters.accessScope;
      if (filters.academicYear) params.academicYear = filters.academicYear;
      if (filters.cohort) params.cohort = filters.cohort;

      const res = await DocumentsService.listFiles(params);
      return {
        items: (res.files || []).map((f: any) => ({ ...f, id: f.fileId })),
        pagination:
          res.total !== undefined
            ? {
                total: res.total,
                totalPages: Math.ceil(res.total / PAGE_SIZE),
                currentPage: page,
              }
            : null,
      };
    },
    staleTime: 30 * 1000,
  });

  // ── Effects ────────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const next = new URLSearchParams();
    if (keyword) next.set("keyword", keyword);
    next.set("page", String(page));
    if (filters.accessScope) next.set("accessScope", filters.accessScope);
    if (filters.academicYear) next.set("academicYear", filters.academicYear);
    if (filters.cohort) next.set("cohort", filters.cohort);
    if (selectedFileId) next.set("id", selectedFileId);
    setSearchParams(next, { replace: true });
  }, [keyword, page, filters, selectedFileId, setSearchParams]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleSearch = () => {
    const parsed = parseSearchString(searchValue);
    setKeyword(parsed.keyword);
    setFilters({
      accessScope: parsed.params.accessScope as string,
      academicYear: parsed.params.academicYear as string,
      cohort: parsed.params.cohort as string,
    });
    setPage(1);
  };

  const handleOpenDetail = useCallback(
    (item: any) => {
      const next = new URLSearchParams(searchParams);
      next.set("id", item.fileId);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleCloseDetail = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("id");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleDelete = useCallback(
    async (item: any) => {
      if (!window.confirm(`Xóa tệp "${item.displayName || item.originalFilename}"?`)) {
        return;
      }
      try {
        await DocumentsService.deleteFile(item.fileId);
        toast.success("Đã xóa tệp.");
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        handleCloseDetail();
      } catch (err: any) {
        toast.error(parseError(err));
      }
    },
    [queryClient, handleCloseDetail],
  );

  // ── Helpers ────────────────────────────────────────────────────────────────────
  const getAccessScopeDisplay = useCallback(
    (file: any) => {
      const meta = file.customMetadata || {};
      const accessScope = meta.accessScope;

      if (!accessScope) {
        return { label: "N/A", color: RoleColors.student.bg };
      }

      const accessScopeType = metadataTypes.find((t: any) => t.key === "access_scope");
      const allowedValue = accessScopeType?.allowedValues?.find(
        (v: any) => v.value === accessScope,
      );

      const color = allowedValue?.color || RoleColors.student.bg;
      const label = allowedValue?.displayName || accessScope;

      return { label, color };
    },
    [metadataTypes],
  );

  // ── Columns ────────────────────────────────────────────────────────────────────
  const columns: TableColumn<any>[] = useMemo(
    () => [
      {
        key: "displayName",
        header: "Tài liệu",
        width: "50%",
        render: (x) => (
          <div className="flex flex-col">
            <p className="text-navy-700 truncate text-sm font-bold dark:text-white">
              {x.displayName || x.originalFilename}
            </p>
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {x.originalFilename}
            </p>
          </div>
        ),
      },
      {
        key: "accessScope",
        header: "Phạm vi truy cập",
        width: "20%",
        render: (x) => {
          const { label, color } = getAccessScopeDisplay(x);
          return (
            <Tag color={color}>
              {label}
            </Tag>
          );
        },
      },
      {
        key: "createdAt",
        header: "Ngày tải lên",
        width: "15%",
        render: (x) => (
          <p className="text-navy-700 text-sm dark:text-white">
            {formatDate(x.createdAt)}
          </p>
        ),
      },
      {
        key: "isActive",
        header: "Hoạt động",
        width: "15%",
        render: (x) => {
          const isActive = x.status === "active";
          return (
            <Tag color={isActive ? "#22c55e" : "#6b7280"}>
              {isActive ? "Hiển thị" : "Ẩn"}
            </Tag>
          );
        },
      },
    ],
    [getAccessScopeDisplay],
  );

  const actions: TableAction<any>[] = useMemo(
    () => [
      {
        key: "download",
        icon: <MdFileDownload className="h-4 w-4" />,
        label: "Tải xuống",
        onClick: async (x) => {
          try {
            const blob = await DocumentsService.downloadFile(x.fileId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = x.originalFilename;
            a.click();
            URL.revokeObjectURL(url);
          } catch (err) {
            toast.error("Không thể tải xuống tệp.");
          }
        },
        className:
          "flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500 text-white transition-colors hover:bg-green-600",
      },
      {
        key: "detail",
        icon: <MdInfoOutline className="h-4 w-4" />,
        label: "Chi tiết",
        onClick: handleOpenDetail,
        className:
          "flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-500 text-white transition-colors hover:bg-pink-600",
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
    [handleOpenDetail, handleDelete],
  );

  return (
    <div className="flex flex-col gap-4">
      <TableLayout
        result={result as any}
        loading={loading}
        page={page}
        pageSize={PAGE_SIZE}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearch={handleSearch}
        searchPlaceholder="Tìm tài liệu..."
        showFilter={true}
        onFilterClick={() => {
          setDraftFilters(filters);
          setFilterOpen(true);
        }}
        columns={columns}
        actions={actions}
        onPageChange={setPage}
        onRowClick={handleOpenDetail}
      />

      <DocumentDetailDrawer
        fileId={selectedFileId}
        metadataTypes={metadataTypes}
        isOpen={selectedFileId !== null}
        isReadOnly={true}
        onClose={handleCloseDetail}
        onDeleted={() => {
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          handleCloseDetail();
        }}
      />

      <AdvancedFilterModal
        open={filterOpen}
        value={draftFilters}
        metadataTypes={metadataTypes}
        onChange={setDraftFilters}
        onApply={() => {
          setFilters(draftFilters);
          setPage(1);
          setFilterOpen(false);
        }}
        onClear={() => {
          const cleared: DocumentFilters = {};
          setDraftFilters(cleared);
          setFilters(cleared);
          setPage(1);
          setFilterOpen(false);
        }}
        onRequestClose={() => setFilterOpen(false)}
      />
    </div>
  );
};

export default DocumentListPage;
