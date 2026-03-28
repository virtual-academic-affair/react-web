import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
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

import AccessScopeBadge from "../components/AccessScopeBadge";
import AdvancedFilterModal, {
  type DocumentFilters,
} from "../components/AdvancedFilterModal";
import DocumentDetailDrawer from "../components/DocumentDetailDrawer";

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
        const hasStudent = values.includes("student");
        const hasLecture = values.includes("lecture");
        const hasPrivate = values.includes("private");

        const derivedValues: string[] = [];

        if (hasStudent && hasLecture) {
          derivedValues.push("both", "student", "lecture");
        } else if (hasStudent) {
          derivedValues.push("student", "both");
        } else if (hasLecture) {
          derivedValues.push("lecture", "both");
        }

        if (hasPrivate) {
          derivedValues.push("private");
        }

        if (derivedValues.length > 0) {
          result[key] = derivedValues;
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
  });

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
    setSearchParams(next, { replace: true });
  }, [keyword, page, filters, selectedFileId, setSearchParams]);

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
          const meta = x.customMetadata || {};
          return <AccessScopeBadge value={meta.accessScope} />;
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
        header: "Trạng thái xử lý",
        width: "15%",
        render: (x) => {
          return (
            <Tag color={x?.status === "active" ? "#22c55e" : "#b2161e"}>
              {x?.status === "active" ? "Đang hoạt động" : "Thất bại"}
            </Tag>
          );
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

export default DocumentListPage;
