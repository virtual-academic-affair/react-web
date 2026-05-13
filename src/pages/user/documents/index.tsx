import { useQuery } from "@tanstack/react-query";
import { message as toast } from "antd";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MdDescription,
  MdGridView,
  MdSearch,
  MdTableRows,
} from "react-icons/md";
import { useSearchParams } from "react-router-dom";

import DocumentDetailDrawer from "@/pages/documents/components/DocumentDetailDrawer";
import FilePreviewModal from "@/pages/documents/components/FilePreviewModal";
import { DOCUMENT_TYPES } from "@/pages/documents/components/UploadDrawer";
import { DocumentsService, MetadataService } from "@/services/documents";

import { FileCard, FileRow } from "./components/FileItems";
import FilterGroup from "./components/FilterGroup";
import { GridSkeleton, ListSkeleton } from "./components/Skeletons";
import YearRangeFilter, { type YearRange } from "./components/YearRangeFilter";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 18;

/** Metadata type key that receives special access-scope derivation in the API call */
const ACCESS_SCOPE_KEY = "access_scope";

/** Hardcoded document type filter key — maps to customMetadata.type */
const TYPE_FILTER_KEY = "type";

/** Document type filter options for the FilterGroup pill */
const DOC_TYPE_FILTER_OPTIONS = DOCUMENT_TYPES.map((t) => ({
  value: t.value,
  displayName: t.label,
  color: t.color,
}));

/** Extra type definition so ActiveFilterChips can resolve type labels */
const DOC_TYPE_EXTRA_TYPE = {
  key: TYPE_FILTER_KEY,
  displayName: "Loại tài liệu",
  allowedValues: DOC_TYPE_FILTER_OPTIONS,
};

const EMPTY_YEAR_RANGE: YearRange = { fromYear: "", toYear: "" };

// ── Filters type: keys are raw metadata type keys (e.g. "access_scope") ───────
type UserDocFilters = Record<string, string[]>;

/**
 * URL params that are NOT metadata filters.
 * The user page supports dynamic metadata filters (keys come from the API),
 * so we iterate all URL params and skip these reserved ones.
 */
const RESERVED_URL_PARAMS = new Set([
  "keyword",
  "page",
  "id",
  "preview",
  "enrollFrom",
  "enrollTo",
  "acadFrom",
  "acadTo",
]);

// ── Main Page ─────────────────────────────────────────────────────────────────

const UserDocumentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // View mode
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Search
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [inputValue, setInputValue] = useState(keyword);

  // Filters — keyed by raw metadata type key (initialized from URL)
  const [filters, setFilters] = useState<UserDocFilters>(() => {
    const result: UserDocFilters = {};
    searchParams.forEach((value, key) => {
      if (RESERVED_URL_PARAMS.has(key)) return;
      const values = value.split(",").filter(Boolean);
      if (values.length > 0) result[key] = values;
    });
    return result;
  });

  // Year range filters (initialized from URL)
  const [enrollmentYear, setEnrollmentYear] = useState<YearRange>(() => ({
    fromYear: searchParams.get("enrollFrom") ?? "",
    toYear: searchParams.get("enrollTo") ?? "",
  }));
  const [academicYear, setAcademicYear] = useState<YearRange>(() => ({
    fromYear: searchParams.get("acadFrom") ?? "",
    toYear: searchParams.get("acadTo") ?? "",
  }));

  // Pagination
  const [page, setPage] = useState(
    Math.max(1, Number(searchParams.get("page") || "1")),
  );

  // URL-driven detail / preview
  const isPreview = searchParams.get("preview") === "true";
  const previewTarget = searchParams.get("previewTarget") || "";
  const isMarkdownPreview = previewTarget === "markdown";
  const previewFileId = isPreview ? searchParams.get("id") || null : null;
  const selectedFileId = searchParams.get("id") || null;
  const wasDrawerOpen = useRef(false);

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: metadataTypes = [] } = useQuery({
    queryKey: ["metadata-types-all"],
    queryFn: () => MetadataService.listTypes(),
  });

  // Filterable: active type + at least one active value
  const filterableTypes = useMemo(
    () =>
      metadataTypes.filter((t: any) => {
        if (!t.isActive) return false;
        return (t.allowedValues || []).some((v: any) => v.isActive);
      }),
    [metadataTypes],
  );

  /**
   * Build the metadataFilter argument for the API.
   * – "access_scope" gets special "both" derivation (same as admin list page)
   * – everything else is passed as-is
   */
  const metadataFilterArg = useMemo(() => {
    const result: Record<string, unknown> = {};

    Object.entries(filters).forEach(([key, values]) => {
      if (!Array.isArray(values) || values.length === 0) return;

      if (key === ACCESS_SCOPE_KEY) {
        const hasStudent = values.includes("student");
        const hasLecture = values.includes("lecture");
        const hasPrivate = values.includes("private");
        const derived: string[] = [];
        if (hasStudent && hasLecture)
          derived.push("both", "student", "lecture");
        else if (hasStudent) derived.push("student", "both");
        else if (hasLecture) derived.push("lecture", "both");
        if (hasPrivate) derived.push("private");
        if (derived.length > 0) result[key] = derived;
        return;
      }

      result[key] = values;
    });

    // "type" filter → metadataFilter.type
    const typeValues = filters[TYPE_FILTER_KEY];
    if (Array.isArray(typeValues) && typeValues.length > 0) {
      result[TYPE_FILTER_KEY] = typeValues;
    }

    // Enrollment year range
    if (enrollmentYear.fromYear || enrollmentYear.toYear) {
      const yearObj: Record<string, number> = {};
      if (enrollmentYear.fromYear)
        yearObj.fromYear = Number(enrollmentYear.fromYear);
      if (enrollmentYear.toYear) yearObj.toYear = Number(enrollmentYear.toYear);
      result.enrollmentYear = yearObj;
    }

    // Academic year range
    if (academicYear.fromYear || academicYear.toYear) {
      const yearObj: Record<string, number> = {};
      if (academicYear.fromYear)
        yearObj.fromYear = Number(academicYear.fromYear);
      if (academicYear.toYear) yearObj.toYear = Number(academicYear.toYear);
      result.academicYear = yearObj;
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }, [filters, enrollmentYear, academicYear]);

  const { data: result, isLoading } = useQuery({
    queryKey: [
      "documents-user",
      { page, keyword, metadataFilter: metadataFilterArg },
    ],
    queryFn: async () => {
      const res = await DocumentsService.listFiles({
        page,
        limit: PAGE_SIZE,
        keywords: keyword || undefined,
        metadataFilter: metadataFilterArg,
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
    staleTime: 30_000,
  });

  const files = result?.items || [];
  const pagination = result?.pagination;

  const previewFile = useMemo(() => {
    if (!previewFileId || !files.length) return null;
    return files.find((x: any) => x.fileId === previewFileId) || null;
  }, [previewFileId, files]);

  const previewFileName = useMemo(() => {
    if (!previewFile) return "";
    if (isMarkdownPreview) {
      const markdownUrl = String(previewFile.markdownFileUrl || "");
      const fromUrl = markdownUrl.split("?")[0].split("/").pop() || "";
      if (fromUrl) return fromUrl;
      const baseName =
        previewFile.displayName || previewFile.originalFilename || "";
      return baseName ? `${baseName}.md` : "markdown.md";
    }
    return previewFile.originalFilename || previewFile.displayName || "";
  }, [previewFile, isMarkdownPreview]);

  const previewDownloadFormat = isMarkdownPreview
    ? ("markdown" as const)
    : ("original" as const);

  // ── Sync URL ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const next = new URLSearchParams();
    if (keyword) next.set("keyword", keyword);
    next.set("page", String(page));
    // Tag-based filters → clean per-key comma-separated params
    Object.entries(filters).forEach(([k, v]) => {
      if (Array.isArray(v) && v.length > 0) next.set(k, v.join(","));
    });
    // Year range params
    if (enrollmentYear.fromYear)
      next.set("enrollFrom", enrollmentYear.fromYear);
    if (enrollmentYear.toYear) next.set("enrollTo", enrollmentYear.toYear);
    if (academicYear.fromYear) next.set("acadFrom", academicYear.fromYear);
    if (academicYear.toYear) next.set("acadTo", academicYear.toYear);
    if (selectedFileId) next.set("id", selectedFileId);
    if (isPreview) next.set("preview", "true");
    setSearchParams(next, { replace: true });
  }, [
    keyword,
    page,
    filters,
    enrollmentYear,
    academicYear,
    selectedFileId,
    isPreview,
    setSearchParams,
  ]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setKeyword(inputValue);
    setPage(1);
  };

  const handleOpenDetail = useCallback(
    (file: any) => {
      const next = new URLSearchParams(searchParams);
      next.set("id", file.fileId);
      next.delete("preview");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleCloseDetail = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("id");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleOpenPreview = useCallback(
    (file: any) => {
      wasDrawerOpen.current = !!selectedFileId && !isPreview;
      const next = new URLSearchParams(searchParams);
      next.set("id", file.fileId);
      next.set("preview", "true");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, selectedFileId, isPreview],
  );

  const handleClosePreview = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("preview");
    next.delete("previewTarget");
    if (!wasDrawerOpen.current) next.delete("id");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleDownload = useCallback(async (file: any) => {
    try {
      const blob = await DocumentsService.downloadFile(file.fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.originalFilename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Không thể tải xuống tệp.");
    }
  }, []);

  const handleFilterChange = useCallback((typeKey: string, next: string[]) => {
    setFilters((prev) => ({ ...prev, [typeKey]: next }));
    setPage(1);
  }, []);

  const handleRemoveChip = useCallback((typeKey: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [typeKey]: (prev[typeKey] || []).filter((v) => v !== value),
    }));
    setPage(1);
  }, []);

  const handleClearAll = useCallback(() => {
    setFilters({});
    setEnrollmentYear(EMPTY_YEAR_RANGE);
    setAcademicYear(EMPTY_YEAR_RANGE);
    setPage(1);
  }, []);

  const handleEnrollmentYearChange = useCallback((next: YearRange) => {
    setEnrollmentYear(next);
    setPage(1);
  }, []);

  const handleAcademicYearChange = useCallback((next: YearRange) => {
    setAcademicYear(next);
    setPage(1);
  }, []);

  const totalPages = pagination?.totalPages || 1;
  const hasTagFilters = Object.values(filters).some(
    (v) => Array.isArray(v) && v.length > 0,
  );
  const hasYearFilters =
    Boolean(enrollmentYear.fromYear || enrollmentYear.toYear) ||
    Boolean(academicYear.fromYear || academicYear.toYear);
  const hasFilters = hasTagFilters || hasYearFilters;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen">
      {/* ── Hero header + search ────────────────────────────────────────── */}
      <div className="mx-auto mb-8 max-w-3xl text-center">
        <h1 className="text-navy-700 mb-2 text-2xl font-bold dark:text-white">
          Tài liệu giáo vụ
        </h1>
        <p className="mb-6 text-sm text-gray-400">
          Tổng hợp tài liệu giáo vụ liên quan đến các vấn đề học tập, quy chế
        </p>

        <form onSubmit={handleSearch} className="relative">
          <MdSearch className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            id="user-documents-search"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Tìm tài liệu, công văn, quyết định..."
            className="dark:bg-navy-800 focus:border-brand-400 focus:ring-brand-400/20 dark:focus:border-brand-500 w-full rounded-2xl border border-gray-200 bg-white py-3 pr-24 pl-11 text-sm text-gray-700 shadow-sm transition-all outline-none focus:ring-2 dark:border-white/10 dark:text-white dark:placeholder-gray-500"
          />
          <button
            type="submit"
            className="bg-brand-500 hover:bg-brand-600 absolute top-1/2 right-2 -translate-y-1/2 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* ── Filter bar + view toggle ────────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 text-xs font-medium text-gray-400">
          Lọc theo:
        </span>

        <div className="flex items-center gap-2">
          {/* Hardcoded document type filter */}
          <FilterGroup
            label="Loại tài liệu"
            typeKey={TYPE_FILTER_KEY}
            options={DOC_TYPE_FILTER_OPTIONS}
            selected={filters[TYPE_FILTER_KEY] || []}
            onChange={(next) => handleFilterChange(TYPE_FILTER_KEY, next)}
          />
          {/* Year range filters */}
          <YearRangeFilter
            label="Khóa tuyển sinh"
            value={enrollmentYear}
            onChange={handleEnrollmentYearChange}
          />
          <YearRangeFilter
            label="Năm học"
            value={academicYear}
            onChange={handleAcademicYearChange}
          />

          {/* Dynamic metadata-based filters */}
          {filterableTypes.map((type: any) => {
            const opts = (type.allowedValues || [])
              .filter((v: any) => v.isActive)
              .map((v: any) => ({
                value: v.value,
                displayName: v.displayName || v.value,
                color: v.color,
              }));
            if (opts.length === 0) return null;
            return (
              <FilterGroup
                key={type.key}
                label={type.displayName || type.key}
                typeKey={type.key}
                options={opts}
                selected={filters[type.key] || []}
                onChange={(next) => handleFilterChange(type.key, next)}
              />
            );
          })}

          {hasFilters && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-brand-500 underline underline-offset-2 hover:text-brand-600 dark:hover:text-brand-400 font-medium"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="dark:bg-navy-800 ml-auto flex shrink-0 items-center gap-0.5 rounded-xl border border-gray-200 bg-white p-0.5 dark:border-white/10">
          <button
            type="button"
            id="view-toggle-grid"
            onClick={() => setViewMode("grid")}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
              viewMode === "grid"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <MdGridView className="h-4 w-4" />
          </button>
          <button
            type="button"
            id="view-toggle-list"
            onClick={() => setViewMode("list")}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
              viewMode === "list"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <MdTableRows className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Results count ──────────────────────────────────────────────── */}
      {!isLoading && (
        <p className="mb-4 text-xs text-gray-400">
          {pagination?.total !== undefined
            ? `${pagination.total} tài liệu`
            : `${files.length} tài liệu`}
          {keyword && ` cho "${keyword}"`}
        </p>
      )}

      {/* ── Files ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        viewMode === "grid" ? (
          <GridSkeleton />
        ) : (
          <ListSkeleton />
        )
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-100 dark:bg-white/8">
            <MdDescription className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <p className="text-navy-700 font-semibold dark:text-white">
              Không tìm thấy tài liệu
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Thử thay đổi từ khóa hoặc bộ lọc
            </p>
          </div>
          {(keyword || hasFilters) && (
            <button
              type="button"
              onClick={() => {
                setInputValue("");
                setKeyword("");
                setFilters({});
                setEnrollmentYear(EMPTY_YEAR_RANGE);
                setAcademicYear(EMPTY_YEAR_RANGE);
                setPage(1);
              }}
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-white/8 dark:text-gray-300 dark:hover:bg-white/12"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {files.map((file: any) => (
            <FileCard
              key={file.fileId}
              file={file}
              metadataTypes={metadataTypes}
              onDetail={() => handleOpenDetail(file)}
              onPreview={() => handleOpenPreview(file)}
              onDownload={() => handleDownload(file)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {files.map((file: any) => (
            <FileRow
              key={file.fileId}
              file={file}
              metadataTypes={metadataTypes}
              onDetail={() => handleOpenDetail(file)}
              onPreview={() => handleOpenPreview(file)}
              onDownload={() => handleDownload(file)}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {totalPages > 1 && !isLoading && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="dark:bg-navy-800 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-gray-400"
          >
            ‹
          </button>

          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                  p === page
                    ? "bg-brand-500 text-white shadow-sm"
                    : "dark:bg-navy-800 border border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-white/10 dark:text-gray-300"
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="dark:bg-navy-800 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-gray-400"
          >
            ›
          </button>
        </div>
      )}

      {/* ── Detail Drawer (read-only, no delete) ───────────────────────── */}
      <DocumentDetailDrawer
        fileId={selectedFileId}
        metadataTypes={metadataTypes}
        isOpen={selectedFileId !== null && !isPreview}
        isReadOnly={true}
        onClose={handleCloseDetail}
        onDeleted={() => {}}
        onPreview={() => {
          if (!selectedFileId) return;
          wasDrawerOpen.current = true;
          const next = new URLSearchParams(searchParams);
          next.set("preview", "true");
          next.delete("previewTarget");
          setSearchParams(next, { replace: true });
        }}
        onPreviewMarkdown={() => {
          if (!selectedFileId) return;
          wasDrawerOpen.current = true;
          const next = new URLSearchParams(searchParams);
          next.set("preview", "true");
          next.set("previewTarget", "markdown");
          setSearchParams(next, { replace: true });
        }}
      />

      {/* ── File Preview Modal ──────────────────────────────────────────── */}
      <FilePreviewModal
        fileId={previewFileId}
        fileName={previewFileName}
        downloadFormat={previewDownloadFormat}
        isOpen={previewFileId !== null}
        onClose={handleClosePreview}
      />
    </div>
  );
};

export default UserDocumentsPage;
