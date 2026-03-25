import React, { useState, useMemo, useCallback } from "react";
import { message as toast } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  MdCloudUpload,
  MdDeleteOutline,
  MdFileDownload,
  MdInfoOutline,
} from "react-icons/md";

import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout";
import { DocumentsService, MetadataService } from "@/services/documents.service";
import { formatDate } from "@/utils/date";
import { parseError } from "@/utils/parseError";
import { parseSearchString, stringifySearchQuery } from "@/utils/search";
import { RoleColors } from "@/types/users";

import DocumentDetailDrawer from "../components/DocumentDetailDrawer";
import AdvancedFilterModal, {
  type DocumentFilters,
} from "../components/AdvancedFilterModal";
import UploadDrawer from "../components/UploadDrawer";

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
  const [uploadOpen, setUploadOpen] = useState(false);

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

  const handleUploadSuccess = () => {
    setUploadOpen(false);
    queryClient.invalidateQueries({ queryKey: ["documents"] });
  };

  // ── Helpers ────────────────────────────────────────────────────────────────────
  const getMetadataDisplay = useCallback(
    (file: any) => {
      const meta = file.customMetadata || {};
      const displayTags: { key: string; value: string; color: string; label: string }[] = [];

      metadataTypes.forEach((type: any) => {
        const rawKey = type.key;
        const rawValue = meta[rawKey];
        if (rawValue) {
          const allowedValue = type.allowedValues?.find(
            (v: any) => v.value === rawValue,
          );
          displayTags.push({
            key: rawKey,
            value: rawValue,
            color: allowedValue?.color || RoleColors.student.bg,
            label:
              allowedValue?.displayName ||
              rawValue,
          });
        }
      });

      return displayTags;
    },
    [metadataTypes],
  );

  // ── Columns ────────────────────────────────────────────────────────────────────
  const columns: TableColumn<any>[] = useMemo(
    () => [
      {
        key: "displayName",
        header: "Tài liệu",
        width: "40%",
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
        key: "metadata",
        header: "Nhãn",
        width: "35%",
        render: (x) => {
          const tags = getMetadataDisplay(x);
          if (tags.length === 0) {
            return <span className="text-xs text-gray-400">Chưa có nhãn</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag.key}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.label}
                </span>
              ))}
            </div>
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
        width: "10%",
        render: (x) => {
          const isActive = x.status === "active";
          return (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                isActive
                  ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400"
              }`}
            >
              {isActive ? "Hiển thị" : "Ẩn"}
            </span>
          );
        },
      },
    ],
    [getMetadataDisplay],
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

  const rightSlot = (
    <button
      type="button"
      onClick={() => setUploadOpen(true)}
      className="bg-brand-500 hover:bg-brand-600 flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-white transition-colors"
    >
      <MdCloudUpload className="h-5 w-5" />
      Tải lên
    </button>
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
        rightSlot={rightSlot}
        columns={columns}
        actions={actions}
        onPageChange={setPage}
        onRowClick={handleOpenDetail}
      />

      <DocumentDetailDrawer
        fileId={selectedFileId}
        metadataTypes={metadataTypes}
        isOpen={selectedFileId !== null}
        onClose={handleCloseDetail}
        onDeleted={() => {
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          handleCloseDetail();
        }}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["documents"] });
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

      <UploadDrawer
        open={uploadOpen}
        metadataTypes={metadataTypes}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default DocumentListPage;
