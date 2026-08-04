import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MdDeleteOutline,
  MdFileDownload,
  MdInfoOutline,
  MdRateReview,
} from "react-icons/md";

import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout";
import Tag from "@/components/tag/Tag";
import { useIsolatedSearchParams } from "@/hooks/useIsolatedSearchParams";
import { DocumentsService } from "@/services/documents";
import type { FileStatus, UploadProgressEvent } from "@/services/documents";
import { parseError } from "@/utils/parseError";

import { PageTitle } from "@/components/layouts/PageTitle";
import ConfirmModal from "@/components/modal/ConfirmModal";
import Tooltip from "@/components/tooltip/Tooltip";
import FilterGroup from "@/pages/user/documents/components/FilterGroup";
import LecturerOnlyFilter from "@/pages/user/documents/components/LecturerOnlyFilter";
import YearRangeFilter, {
  type YearRange,
} from "@/pages/user/documents/components/YearRangeFilter";
import {
  clearViewDocumentParams,
  parseViewDocumentFromSearchParams,
  setViewDocumentParams,
  VIEW_DOCUMENT_FORMAT_MARKDOWN,
} from "@/utils/documentViewUrl";
import { EMPTY_YEAR_RANGE_STRINGS, formatYearRange } from "@/utils/yearRange";
import { LuFileText } from "react-icons/lu";
import DocumentDetailDrawer from "../components/DocumentDetailDrawer";
import DocumentStatusText from "../components/DocumentStatusText";
import {
  DOCUMENT_STATUS_FILTER_OPTIONS,
  getDocumentStatusConfig,
  getUploadProgressStepLabel,
  normalizeDocumentStatus,
  shouldAnimateDocumentStatusText,
  TERMINAL_UPLOAD_PROGRESS_STEPS,
} from "../components/documentStatus";
import OcrReviewDrawer from "../components/OcrReviewDrawer";
import UploadDrawer, {
  DOCUMENT_TYPE_COLOR_MAP,
  DOCUMENT_TYPE_MAP,
  DOCUMENT_TYPES,
} from "../components/UploadDrawer";

const FilePreviewModal = lazy(() => import("../components/FilePreviewModal"));

// ── Constants ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const DOWNLOAD_FORMAT_ORIGINAL = "original" as const;
const DOWNLOAD_FORMAT_MARKDOWN = "markdown" as const;

const EMPTY_YEAR_RANGE: YearRange = EMPTY_YEAR_RANGE_STRINGS;

/** Filter options for the document type FilterGroup */
const DOC_TYPE_FILTER_OPTIONS = DOCUMENT_TYPES.map((t) => ({
  value: t.value,
  displayName: t.label,
  color: t.color,
}));

type LiveFileProgress = {
  step: string;
  message?: string;
};

// ── Component ──────────────────────────────────────────────────────────────────

const DocumentListPage = ({ embedded = false }: { embedded?: boolean }) => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useIsolatedSearchParams(embedded);

  // ── State ────────────────────────────────────────────────────────────────────
  const initialPage =
    Number(searchParams.get("page") ?? "1") > 0
      ? Number(searchParams.get("page") ?? "1")
      : 1;
  const initialKeyword = searchParams.get("keyword") ?? "";

  const [page, setPage] = useState(initialPage);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [searchValue, setSearchValue] = useState(initialKeyword);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [fileStatus, setFileStatus] = useState<FileStatus | undefined>(() => {
    const value = searchParams.get("fileStatus");
    return DOCUMENT_STATUS_FILTER_OPTIONS.some(
      (option) => option.value === value,
    )
      ? (value as FileStatus)
      : undefined;
  });

  // ── Filters (initialized from URL) ──────────────────────────────────────────
  const [typeFilter, setTypeFilter] = useState<string[]>(() => {
    const raw = searchParams.get("type");
    return raw ? raw.split(",").filter(Boolean) : [];
  });
  const [lecturerOnlyFilter, setLecturerOnlyFilter] = useState(
    () => searchParams.get("lecturerOnly") === "true",
  );
  const [enrollmentYear, setEnrollmentYear] = useState<YearRange>(() => ({
    fromYear: searchParams.get("enrollFrom") ?? "",
    toYear: searchParams.get("enrollTo") ?? "",
  }));
  const [academicYear, setAcademicYear] = useState<YearRange>(() => ({
    fromYear: searchParams.get("acadFrom") ?? "",
    toYear: searchParams.get("acadTo") ?? "",
  }));
  const [liveProgressByFileId, setLiveProgressByFileId] = useState<
    Record<string, LiveFileProgress>
  >({});
  const progressSocketsRef = useRef<Map<string, WebSocket>>(new Map());
  const progressClientToFileRef = useRef<Map<string, string>>(new Map());

  /** Bật lọc → lecturerOnly=true; tắt → không gửi query param */
  const lecturerOnlyArg = lecturerOnlyFilter ? true : undefined;

  const metadataFilterArg = useMemo(() => {
    const result: Record<string, unknown> = {};
    if (typeFilter.length > 0) result.type = typeFilter;
    if (enrollmentYear.fromYear || enrollmentYear.toYear) {
      const obj: Record<string, number> = {};
      if (enrollmentYear.fromYear)
        obj.fromYear = Number(enrollmentYear.fromYear);
      if (enrollmentYear.toYear) obj.toYear = Number(enrollmentYear.toYear);
      result.enrollmentYear = obj;
    }
    if (academicYear.fromYear || academicYear.toYear) {
      const obj: Record<string, number> = {};
      if (academicYear.fromYear) obj.fromYear = Number(academicYear.fromYear);
      if (academicYear.toYear) obj.toYear = Number(academicYear.toYear);
      result.academicYear = obj;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }, [typeFilter, enrollmentYear, academicYear]);

  const hasFilters =
    Boolean(fileStatus) ||
    typeFilter.length > 0 ||
    lecturerOnlyFilter ||
    Boolean(enrollmentYear.fromYear || enrollmentYear.toYear) ||
    Boolean(academicYear.fromYear || academicYear.toYear);

  const handleClearAllFilters = useCallback(() => {
    setFileStatus(undefined);
    setTypeFilter([]);
    setLecturerOnlyFilter(false);
    setEnrollmentYear(EMPTY_YEAR_RANGE);
    setAcademicYear(EMPTY_YEAR_RANGE);
    setPage(1);
  }, []);

  // Sync filter state → URL
  useEffect(() => {
    if (embedded) return;

    const next = new URLSearchParams(searchParams);
    if (fileStatus) next.set("fileStatus", fileStatus);
    else next.delete("fileStatus");
    // type
    if (typeFilter.length > 0) next.set("type", typeFilter.join(","));
    else next.delete("type");
    // lecturerOnly
    if (lecturerOnlyArg !== undefined)
      next.set("lecturerOnly", String(lecturerOnlyArg));
    else next.delete("lecturerOnly");
    // enrollment year
    if (enrollmentYear.fromYear)
      next.set("enrollFrom", enrollmentYear.fromYear);
    else next.delete("enrollFrom");
    if (enrollmentYear.toYear) next.set("enrollTo", enrollmentYear.toYear);
    else next.delete("enrollTo");
    // academic year
    if (academicYear.fromYear) next.set("acadFrom", academicYear.fromYear);
    else next.delete("acadFrom");
    if (academicYear.toYear) next.set("acadTo", academicYear.toYear);
    else next.delete("acadTo");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    embedded,
    fileStatus,
    typeFilter,
    lecturerOnlyArg,
    enrollmentYear,
    academicYear,
  ]);

  // File preview (URL-driven: ?viewDocumentId=fileId)
  const { viewDocumentId, isMarkdownView } =
    parseViewDocumentFromSearchParams(searchParams);
  const wasDrawerOpenBeforePreview = useRef(false);

  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail drawer
  const idParam = searchParams.get("id");
  const selectedFileId = idParam || null;
  const reviewFileId = searchParams.get("ocrReviewId");

  // ── Query ─────────────────────────────────────────────────────────────────────
  const { data: result = null, isLoading: loading } = useQuery({
    queryKey: [
      "documents",
      {
        page,
        keyword,
        fileStatus,
        lecturerOnly: lecturerOnlyArg,
        metadataFilter: metadataFilterArg,
      },
    ],
    queryFn: async () => {
      const res = await DocumentsService.listFiles({
        page,
        limit: PAGE_SIZE,
        keywords: keyword || undefined,
        fileStatus,
        lecturerOnly: lecturerOnlyArg,
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
    staleTime: 30 * 1000,
    refetchInterval: (query) => {
      const items = (query.state.data as any)?.items || [];
      const hasPending = items.some((item: any) =>
        ["processing", "uploading"].includes(
          String(item?.status || "").toLowerCase(),
        ),
      );
      return hasPending ? 3000 : false;
    },
  });

  const previewFile = useMemo(() => {
    if (!viewDocumentId || !result?.items) return null;
    return result.items.find((f: any) => f.fileId === viewDocumentId) || null;
  }, [viewDocumentId, result]);

  const reviewFile = useMemo(() => {
    if (!reviewFileId || !result?.items) return null;
    return result.items.find((f: any) => f.fileId === reviewFileId) || null;
  }, [reviewFileId, result]);

  const previewFileName = useMemo(() => {
    if (!previewFile) return "";
    if (isMarkdownView) {
      const markdownUrl = String(previewFile.markdownFileUrl || "");
      const fromUrl = markdownUrl.split("?")[0].split("/").pop() || "";
      if (fromUrl) return fromUrl;
      const baseName =
        previewFile.displayName || previewFile.originalFilename || "";
      return baseName ? `${baseName}.md` : "markdown.md";
    }
    return previewFile.originalFilename || previewFile.displayName || "";
  }, [previewFile, isMarkdownView]);

  const previewDownloadFormat = isMarkdownView
    ? DOWNLOAD_FORMAT_MARKDOWN
    : DOWNLOAD_FORMAT_ORIGINAL;

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleSearch = () => {
    setKeyword(searchValue);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    next.set("keyword", searchValue);
    next.set("page", "1");
    setSearchParams(next, { replace: true });
  };

  const handleKeywordChange = (value: string) => setSearchValue(value);

  const handleOpenDetail = useCallback(
    (item: any) => {
      const next = new URLSearchParams(searchParams);
      next.set("id", item.fileId);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleOpenReview = useCallback(
    (item: any) => {
      const next = new URLSearchParams(searchParams);
      next.delete("id");
      clearViewDocumentParams(next);
      next.set("ocrReviewId", item.fileId);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleCloseReview = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("ocrReviewId");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const clearLiveProgress = useCallback((fileId: string) => {
    setLiveProgressByFileId((prev) => {
      if (!(fileId in prev)) return prev;
      const next = { ...prev };
      delete next[fileId];
      return next;
    });
  }, []);

  const closeProgressSocket = useCallback((clientId: string) => {
    const socket = progressSocketsRef.current.get(clientId);
    if (socket) {
      socket.close();
      progressSocketsRef.current.delete(clientId);
    }
  }, []);

  const handleProgressMessage = useCallback(
    (clientId: string, event: UploadProgressEvent) => {
      const step = String(event.step || event.type || "").toLowerCase();
      if (!step || step === "auth_ok") return;

      const fileIdFromEvent =
        typeof event.file_id === "string" && event.file_id
          ? event.file_id
          : undefined;
      if (fileIdFromEvent) {
        progressClientToFileRef.current.set(clientId, fileIdFromEvent);
      }
      const fileId =
        fileIdFromEvent || progressClientToFileRef.current.get(clientId);
      if (!fileId) return;

      setLiveProgressByFileId((prev) => ({
        ...prev,
        [fileId]: { step, message: event.message },
      }));

      void queryClient.invalidateQueries({ queryKey: ["documents"] });

      if (step === "review_required") {
        toast.info(
          event.message || "Cần kiểm tra văn bản đã chuyển đổi.",
          6,
        );
      } else if (step === "failed") {
        toast.error(event.message || "Xử lý thất bại.", 6);
      } else if (step === "completed") {
        toast.success(
          event.message || "Bổ sung vào kho tri thức thành công.",
          6,
        );
      }

      if (TERMINAL_UPLOAD_PROGRESS_STEPS.has(step)) {
        closeProgressSocket(clientId);
        progressClientToFileRef.current.delete(clientId);
        // Keep live label briefly until list refetch settles on API status.
        window.setTimeout(() => clearLiveProgress(fileId), 1500);
      }
    },
    [clearLiveProgress, closeProgressSocket, queryClient],
  );

  const startProgressTracking = useCallback(
    (clientId: string, fileId?: string) => {
      if (fileId) {
        progressClientToFileRef.current.set(clientId, fileId);
        setLiveProgressByFileId((prev) => ({
          ...prev,
          [fileId]: prev[fileId] ?? { step: "indexing" },
        }));
      }

      closeProgressSocket(clientId);

      const stopTracking = () => {
        const trackedFileId = progressClientToFileRef.current.get(clientId);
        closeProgressSocket(clientId);
        progressClientToFileRef.current.delete(clientId);
        if (trackedFileId) clearLiveProgress(trackedFileId);
      };

      return new Promise<() => void>((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          resolve(stopTracking);
        };
        const timeoutId = window.setTimeout(finish, 4000);

        const socket = DocumentsService.createUploadProgressSocket(clientId, {
          onAuthOk: () => {
            window.clearTimeout(timeoutId);
            finish();
          },
          onMessage: (event) => handleProgressMessage(clientId, event),
          onError: () => {
            window.clearTimeout(timeoutId);
            finish();
          },
          onClose: () => {
            window.clearTimeout(timeoutId);
            finish();
            if (progressSocketsRef.current.get(clientId) === socket) {
              progressSocketsRef.current.delete(clientId);
            }
          },
        });
        progressSocketsRef.current.set(clientId, socket);
      });
    },
    [clearLiveProgress, closeProgressSocket, handleProgressMessage],
  );

  useEffect(() => {
    const sockets = progressSocketsRef.current;
    const clientToFile = progressClientToFileRef.current;
    return () => {
      for (const socket of sockets.values()) {
        socket.close();
      }
      sockets.clear();
      clientToFile.clear();
    };
  }, []);

  const handleCloseDetail = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("id");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleDelete = useCallback((item: any) => {
    setDeletingItem(item);
  }, []);

  const confirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await DocumentsService.deleteFile(deletingItem.fileId);
      toast.success("Đã xóa tệp.");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      handleCloseDetail();
      setDeletingItem(null);
    } catch (err: any) {
      toast.error(parseError(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateType = useCallback(
    async (fileId: string, oldMetadata: any, newType: string) => {
      try {
        await DocumentsService.updateFileMetadata(fileId, {
          customMetadata: {
            ...oldMetadata,
            type: newType,
          },
        });
        toast.success("Đã cập nhật loại tài liệu");
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      } catch (err) {
        toast.error(parseError(err));
      }
    },
    [queryClient],
  );

  // ── Columns ────────────────────────────────────────────────────────────────────
  const columns: TableColumn<any>[] = useMemo(
    () => [
      {
        key: "displayName",
        header: "Tài liệu",
        render: (x) => {
          const status = normalizeDocumentStatus(x.status);
          const liveProgress = liveProgressByFileId[x.fileId];
          const liveLabel = liveProgress
            ? getUploadProgressStepLabel(
                liveProgress.step,
                liveProgress.message,
              )
            : undefined;
          const showStatus =
            (status != null && status !== "ready") || Boolean(liveLabel);
          const statusConfig = showStatus
            ? getDocumentStatusConfig(status ?? "processing")
            : null;
          const statusLabel = liveLabel || statusConfig?.label || "";
          const animateStatus =
            Boolean(liveProgress) ||
            shouldAnimateDocumentStatusText(status) ||
            (status != null && status !== "ready" && status !== "failed");
          const showMeta = Boolean(x.lecturerOnly) || showStatus;

          return (
            <button
              type="button"
              className="group flex w-full min-w-0 flex-col text-left"
              onClick={(e) => {
                e.stopPropagation();
                if (status === "awaiting_review") {
                  handleOpenReview(x);
                  return;
                }
                if (status !== "ready") {
                  handleOpenDetail(x);
                  return;
                }
                wasDrawerOpenBeforePreview.current = false;
                const next = new URLSearchParams(searchParams);
                setViewDocumentParams(next, x.fileId);
                setSearchParams(next, { replace: true });
              }}
            >
              <Tooltip
                label={x.displayName || x.originalFilename}
                className="block w-full"
                placement="topLeft"
              >
                <p className="text-navy-700 group-hover:text-brand-500 dark:group-hover:text-brand-400 truncate text-sm font-medium transition-colors group-hover:underline dark:text-white">
                  {x.displayName || x.originalFilename}
                </p>
              </Tooltip>
              {showMeta ? (
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {x.lecturerOnly ? (
                    <Tag
                      color="#ef4444"
                      className="text-[10px]"
                      interactive={false}
                    >
                      Chỉ giảng viên
                    </Tag>
                  ) : null}
                  {showStatus && statusLabel ? (
                    <DocumentStatusText
                      label={statusLabel}
                      animate={animateStatus}
                    />
                  ) : null}
                </div>
              ) : null}
            </button>
          );
        },
      },
      {
        key: "type",
        header: "Loại tài liệu",
        width: "182px",
        render: (x) => {
          const typeKey = x.customMetadata?.type as string | undefined;
          if (!typeKey) return <span className="text-sm text-gray-400">—</span>;
          const label = DOCUMENT_TYPE_MAP[typeKey] ?? typeKey;
          return (
            <Tag
              variant="selection"
              value={typeKey}
              onChange={(newType) => {
                if (newType !== typeKey) {
                  handleUpdateType(x.fileId, x.customMetadata, newType);
                }
              }}
              options={DOCUMENT_TYPES}
              color={DOCUMENT_TYPE_COLOR_MAP[typeKey] ?? "#94a3b8"}
              optionColors={DOCUMENT_TYPE_COLOR_MAP}
            >
              {label}
            </Tag>
          );
        },
      },
      {
        key: "applicableYears",
        header: "Phạm vi áp dụng",
        render: (x) => (
          <div className="flex flex-col gap-1 text-sm">
            <div className="text-navy-700 dark:text-white">
              <span className="font-normal text-gray-400">
                Khóa tuyển sinh:{" "}
              </span>
              <span className="font-medium">
                {formatYearRange(x.customMetadata?.enrollmentYear, "Tất cả")}
              </span>
            </div>
            <div className="text-navy-700 dark:text-white">
              <span className="font-normal text-gray-400">Năm học: </span>
              <span className="font-medium">
                {formatYearRange(x.customMetadata?.academicYear, "Tất cả")}
              </span>
            </div>
          </div>
        ),
      },
    ],
    [
      handleOpenDetail,
      handleOpenReview,
      handleUpdateType,
      liveProgressByFileId,
      searchParams,
      setSearchParams,
    ],
  );

  const actions: TableAction<any>[] = useMemo(
    () => [
      {
        key: "review",
        icon: <MdRateReview className="h-4 w-4" />,
        label: "Kiểm tra & Duyệt ngay",
        onClick: handleOpenReview,
        visible: (x) => normalizeDocumentStatus(x.status) === "awaiting_review",
        className:
          "flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500 text-white transition-colors hover:bg-purple-600",
      },
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
          if (!x.fileUrl) {
            toast.error("Không thể tải xuống tệp.");
            return;
          }
          try {
            const res = await fetch(x.fileUrl);
            if (!res.ok) throw new Error("Network error");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = x.originalFilename;
            a.click();
            URL.revokeObjectURL(url);
          } catch {
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
    [handleOpenDetail, handleOpenReview, handleDelete],
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col gap-4 ${embedded ? "min-h-0" : ""}`}>
      <PageTitle
        title={embedded ? "Tài liệu" : "Danh sách tài liệu"}
        tabTitle={embedded ? "Tài liệu" : "DS tài liệu"}
        icon={LuFileText}
        className={embedded ? "mt-10" : undefined}
      />
      <TableLayout
        result={result as any}
        loading={loading}
        page={page}
        pageSize={PAGE_SIZE}
        searchValue={searchValue}
        onSearchChange={handleKeywordChange}
        onSearch={handleSearch}
        searchPlaceholder="Tìm tài liệu, công văn, quyết định..."
        columns={columns}
        actions={actions}
        onPageChange={(p) => {
          setPage(p);
          const next = new URLSearchParams(searchParams);
          next.set("page", String(p));
          setSearchParams(next, { replace: true });
        }}
        middleSlot={
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              <FilterGroup
                label="Trạng thái"
                typeKey="fileStatus"
                options={DOCUMENT_STATUS_FILTER_OPTIONS}
                selected={fileStatus ? [fileStatus] : []}
                multiple={false}
                onChange={(next) => {
                  setFileStatus(next[0] as FileStatus | undefined);
                  setPage(1);
                }}
              />
              <FilterGroup
                label="Loại tài liệu"
                typeKey="type"
                options={DOC_TYPE_FILTER_OPTIONS}
                selected={typeFilter}
                onChange={(next) => {
                  setTypeFilter(next);
                  setPage(1);
                }}
              />
              <LecturerOnlyFilter
                checked={lecturerOnlyFilter}
                onChange={(next) => {
                  setLecturerOnlyFilter(next);
                  setPage(1);
                }}
              />
              <YearRangeFilter
                label="Khóa tuyển sinh"
                value={enrollmentYear}
                onChange={(next) => {
                  setEnrollmentYear(next);
                  setPage(1);
                }}
              />
              <YearRangeFilter
                label="Năm học"
                value={academicYear}
                onChange={(next) => {
                  setAcademicYear(next);
                  setPage(1);
                }}
              />

              {hasFilters && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="text-action-link ml-2 text-xs"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            <button
              type="button"
              id="btn-upload-document"
              onClick={() => setUploadOpen(true)}
              className="bg-brand-500 hover:bg-brand-600 flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
            >
              Thêm
            </button>
          </div>
        }
      />

      <UploadDrawer
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onProgressClientReady={startProgressTracking}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["documents"] });
        }}
      />

      <DocumentDetailDrawer
        fileId={selectedFileId}
        metadataTypes={[]}
        isOpen={selectedFileId !== null && !viewDocumentId}
        isReadOnly={false}
        onClose={handleCloseDetail}
        onDeleted={() => {
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          handleCloseDetail();
        }}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["documents"] });
        }}
        onPreview={() => {
          if (!selectedFileId) return;
          wasDrawerOpenBeforePreview.current = true;
          const next = new URLSearchParams(searchParams);
          setViewDocumentParams(next, selectedFileId);
          setSearchParams(next, { replace: true });
        }}
        onPreviewMarkdown={() => {
          if (!selectedFileId) return;
          wasDrawerOpenBeforePreview.current = true;
          const next = new URLSearchParams(searchParams);
          setViewDocumentParams(next, selectedFileId, {
            format: VIEW_DOCUMENT_FORMAT_MARKDOWN,
          });
          setSearchParams(next, { replace: true });
        }}
      />

      <OcrReviewDrawer
        fileId={reviewFileId}
        fileName={String(
          reviewFile?.displayName || reviewFile?.originalFilename || "",
        )}
        isOpen={reviewFileId !== null}
        onClose={handleCloseReview}
        onProgressClientReady={startProgressTracking}
        onChanged={() => {
          queryClient.invalidateQueries({ queryKey: ["documents"] });
        }}
      />

      {viewDocumentId !== null ? (
        <Suspense fallback={null}>
          <FilePreviewModal
            fileId={viewDocumentId}
            fileName={previewFileName}
            downloadFormat={previewDownloadFormat}
            isOpen
            onClose={() => {
              const next = new URLSearchParams(searchParams);
              clearViewDocumentParams(next);
              if (!wasDrawerOpenBeforePreview.current) {
                next.delete("id");
              }
              setSearchParams(next, { replace: true });
            }}
          />
        </Suspense>
      ) : null}

      <ConfirmModal
        open={Boolean(deletingItem)}
        onCancel={() => setDeletingItem(null)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa tệp"
        subTitle={`Bạn có chắc chắn muốn xóa tệp "${deletingItem?.displayName || deletingItem?.originalFilename}" không?`}
        confirmText="Xóa hoàn toàn"
        loading={isDeleting}
      />
    </div>
  );
};

export default DocumentListPage;
