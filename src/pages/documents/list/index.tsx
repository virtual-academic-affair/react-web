import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdDeleteOutline, MdFileDownload, MdInfoOutline } from "react-icons/md";
import { useSearchParams } from "react-router-dom";

import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout";
import Tag from "@/components/tag/Tag";
import { DocumentsService, MetadataService } from "@/services/documents";
import { formatDate } from "@/utils/date";
import { parseError } from "@/utils/parseError";
import { parseSearchString, stringifySearchQuery } from "@/utils/search";

import Tooltip from "@/components/tooltip/Tooltip";
import AccessScopeBadge from "../components/AccessScopeBadge";
import AdvancedFilterModal, {
  type DocumentFilters,
} from "../components/AdvancedFilterModal";
import DocumentDetailDrawer from "../components/DocumentDetailDrawer";
import FilePreviewModal from "../components/FilePreviewModal";

const PAGE_SIZE = 10;

const defaultFilters: DocumentFilters = {};

const DocumentListPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── State ────────────────────────────────────────────────────────────────────
  const initialPage =
    Number(searchParams.get("page") ?? "1") > 0
      ? Number(searchParams.get("page") ?? "1")
      : 1;
  const initialKeyword = searchParams.get("keyword") ?? "";

  const [page, setPage] = useState(initialPage);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [filters, setFilters] = useState<DocumentFilters>(() => {
    // Parse filters from URL params
    const accessScope =
      searchParams.get("accessScope")?.split(",").filter(Boolean) || [];
    const academicYear =
      searchParams.get("academicYear")?.split(",").filter(Boolean) || [];
    const cohort = searchParams.get("cohort")?.split(",").filter(Boolean) || [];

    // Parse other filters from metadataFilter param
    const metadataFilter = searchParams.get("metadataFilter");
    const otherFilters: DocumentFilters = {};
    if (metadataFilter) {
      try {
        const parsed = JSON.parse(metadataFilter);
        Object.entries(parsed).forEach(([key, values]) => {
          if (!["accessScope", "academicYear", "cohort"].includes(key)) {
            otherFilters[key] = values as string[];
          }
        });
      } catch (e) {
        // ignore parse error
      }
    }

    return {
      ...otherFilters,
      accessScope,
      academicYear,
      cohort,
    };
  });

  const [searchValue, setSearchValue] = useState(() => {
    const params = { ...filters };
    return stringifySearchQuery(
      initialKeyword,
      params as unknown as Record<string, unknown>,
      ["page", "limit", "metadataFilter"],
    );
  });

  const [draftFilters, setDraftFilters] =
    useState<DocumentFilters>(defaultFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  // File preview (URL-driven: ?id=fileId&preview=true[&previewPage=n])
  const isPreview = searchParams.get("preview") === "true";
  const previewFileId = isPreview ? searchParams.get("id") || null : null;
  const previewPageParam = Number(searchParams.get("previewPage") ?? "1");
  const previewPage =
    Number.isFinite(previewPageParam) && previewPageParam > 0
      ? Math.floor(previewPageParam)
      : 1;
  const wasDrawerOpenBeforePreview = useRef(false);

  // Detail drawer
  const idParam = searchParams.get("id");
  const selectedFileId = idParam || null;

  // ── Queries ───────────────────────────────────────────────────────────────────
  const { data: metadataTypes = [] } = useQuery({
    queryKey: ["metadata-types-all"],
    queryFn: () => MetadataService.listTypes(),
  });

  // Build metadataFilter for API call
  const metadataFilter = useMemo(() => {
    const result: Record<string, string[]> = {};

    Object.entries(filters).forEach(([key, values]) => {
      if (!Array.isArray(values) || values.length === 0) return;

      // Special handling for accessScope
      if (key === "accessScope") {
        // Backend now only accepts: student, lecture
        const normalized = values.filter((v) =>
          ["student", "lecture"].includes(v),
        );
        if (normalized.length > 0) {
          result[key] = normalized;
        }
        return;
      }

      result[key] = values;
    });

    return Object.keys(result).length > 0 ? result : undefined;
  }, [filters]);

  const { data: result = null, isLoading: loading } = useQuery({
    queryKey: ["documents", { page, keyword, metadataFilter }],
    queryFn: async () => {
      const res = await DocumentsService.listFiles({
        page,
        limit: PAGE_SIZE,
        keywords: keyword || undefined,
        metadataFilter,
      });
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
    refetchInterval: (query) => {
      const items = (query.state.data as any)?.items || [];
      const hasPending = items.some((item: any) => item?.status === "pending");
      return hasPending ? 3000 : false;
    },
  });

  const previewFileName = useMemo(() => {
    if (!previewFileId || !result?.items) return "";
    const file = result.items.find((f: any) => f.fileId === previewFileId);
    return file?.originalFilename || file?.displayName || "";
  }, [previewFileId, result]);

  // ── Effects ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const next = new URLSearchParams();
    if (keyword) next.set("keyword", keyword);
    next.set("page", String(page));
    if (filters.accessScope?.length)
      next.set("accessScope", filters.accessScope.join(","));
    if (filters.academicYear?.length)
      next.set("academicYear", filters.academicYear.join(","));
    if (filters.cohort?.length) next.set("cohort", filters.cohort.join(","));
    // Add other filters to metadataFilter
    const otherFilters: Record<string, string[]> = {};
    Object.entries(filters).forEach(([key, values]) => {
      if (
        !["accessScope", "academicYear", "cohort"].includes(key) &&
        Array.isArray(values) &&
        values.length > 0
      ) {
        otherFilters[key] = values;
      }
    });
    if (Object.keys(otherFilters).length > 0) {
      next.set("metadataFilter", JSON.stringify(otherFilters));
    }
    if (selectedFileId) next.set("id", selectedFileId);
    if (isPreview) next.set("preview", "true");
    setSearchParams(next, { replace: true });
  }, [keyword, page, filters, selectedFileId, isPreview, setSearchParams]);

  // Sync searchValue when keyword or filters change (from filter modal or URL)
  useEffect(() => {
    const params = { ...filters };
    setSearchValue(
      stringifySearchQuery(
        keyword,
        params as unknown as Record<string, unknown>,
        ["page", "limit", "metadataFilter"],
      ),
    );
  }, [keyword, filters]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleSearch = () => {
    const parsed = parseSearchString(searchValue);
    setKeyword(parsed.keyword);

    // Parse standard filters
    const newFilters: DocumentFilters = {
      accessScope:
        (parsed.params.accessScope as string)?.split(",").filter(Boolean) || [],
      academicYear:
        (parsed.params.academicYear as string)?.split(",").filter(Boolean) ||
        [],
      cohort:
        (parsed.params.cohort as string)?.split(",").filter(Boolean) || [],
    };

    // Parse other filters from metadataFilter param
    const metadataFilterStr = parsed.params.metadataFilter as string;
    if (metadataFilterStr) {
      try {
        const parsedMeta = JSON.parse(metadataFilterStr);
        Object.entries(parsedMeta).forEach(([key, values]) => {
          if (!["accessScope", "academicYear", "cohort"].includes(key)) {
            newFilters[key] = values as string[];
          }
        });
      } catch (e) {
        // ignore parse error
      }
    }

    setFilters(newFilters);
    setPage(1);
  };

  const handleKeywordChange = (value: string) => {
    setSearchValue(value);
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
      if (
        !window.confirm(
          `Xóa tệp "${item.displayName || item.originalFilename}"?`,
        )
      ) {
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

  // ── Columns ────────────────────────────────────────────────────────────────────
  const columns: TableColumn<any>[] = useMemo(
    () => [
      {
        key: "displayName",
        header: "Tài liệu",
        render: (x) => (
          <button
            type="button"
            className="group flex w-full min-w-0 flex-col text-left"
            onClick={(e) => {
              e.stopPropagation();
              wasDrawerOpenBeforePreview.current = false;
              const next = new URLSearchParams(searchParams);
              next.set("id", x.fileId);
              next.set("preview", "true");
              setSearchParams(next, { replace: true });
            }}
          >
            <Tooltip
              label={x.displayName || x.originalFilename}
              className="block w-full"
              placement="topLeft"
            >
              <p className="text-navy-700 group-hover:text-brand-500 dark:group-hover:text-brand-400 truncate text-sm font-bold transition-colors group-hover:underline dark:text-white">
                {x.displayName || x.originalFilename}
              </p>
            </Tooltip>
            <Tooltip label={x.originalFilename} placement="topLeft" wrap>
              <p className="mt-0.5 truncate text-xs text-gray-500">
                {x.originalFilename}
              </p>
            </Tooltip>
          </button>
        ),
      },
      {
        key: "accessScope",
        header: "Phạm vi truy cập",
        render: (x) => {
          const meta = x.customMetadata || {};
          return (
            <AccessScopeBadge value={meta.access_scope ?? meta.accessScope} />
          );
        },
      },
      {
        key: "createdAt",
        header: "Ngày tải lên",
        render: (x) => (
          <p className="text-navy-700 text-sm dark:text-white">
            {formatDate(x.createdAt)}
          </p>
        ),
      },
      {
        key: "isActive",
        header: "Trạng thái xử lý",
        render: (x) => {
          const status = String(x?.status || "").toLowerCase();

          if (status === "active") {
            return <Tag color="#22c55e">Thành công</Tag>;
          }

          if (["pending", "processing", "uploading"].includes(status)) {
            return <Tag color="#f59e0b">Đang xử lý</Tag>;
          }

          if (status === "failed") {
            return <Tag color="#b2161e">Thất bại</Tag>;
          }

          return <Tag color="#94a3b8">Đang xử lý</Tag>;
        },
      },
    ],
    [],
  );

  const actions: TableAction<any>[] = useMemo(
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
        onSearchChange={handleKeywordChange}
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
      />

      <DocumentDetailDrawer
        fileId={selectedFileId}
        metadataTypes={metadataTypes}
        isOpen={selectedFileId !== null && !isPreview}
        isReadOnly={true}
        onClose={handleCloseDetail}
        onDeleted={() => {
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          handleCloseDetail();
        }}
        onPreview={() => {
          if (!selectedFileId) return;
          wasDrawerOpenBeforePreview.current = true;
          const next = new URLSearchParams(searchParams);
          next.set("preview", "true");
          setSearchParams(next, { replace: true });
        }}
      />

      <AdvancedFilterModal
        open={filterOpen}
        value={draftFilters}
        metadataTypes={metadataTypes}
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

      <FilePreviewModal
        fileId={previewFileId}
        fileName={previewFileName}
        isOpen={previewFileId !== null}
        initialPage={previewPage}
        onClose={() => {
          const next = new URLSearchParams(searchParams);
          next.delete("preview");
          next.delete("previewPage");
          if (!wasDrawerOpenBeforePreview.current) {
            next.delete("id");
          }
          setSearchParams(next, { replace: true });
        }}
      />
    </div>
  );
};

export default DocumentListPage;
