import ConfirmModal from "@/components/modal/ConfirmModal";
import InquiryTypeEditor from "@/components/selector/InquiryTypeEditor";
import MessageStatusSelector from "@/components/selector/MessageStatusSelector";
import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout";
import Tooltip from "@/components/tooltip/Tooltip";
import { inquiriesService } from "@/services/inquiry";
import type { PaginatedResponse } from "@/types/common";
import type { Inquiry, InquiryType } from "@/types/inquiry";
import type { MessageStatus } from "@/types/messageStatus";
import { formatDate } from "@/utils/date";
import { parseSearchString, stringifySearchQuery } from "@/utils/search";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import React from "react";
import {
  MdDeleteOutline,
  MdInfoOutline,
  MdOutlineRateReview,
} from "react-icons/md";
import { useNavigate, useSearchParams } from "react-router-dom";
import AdvancedFilterModal, {
  type InquiryFilters,
} from "./components/AdvancedFilterModal";
import InquiryDetailDrawer from "./components/InquiryDetailDrawer";
import PreviewReplyModal from "./components/PreviewReplyModal";

const PAGE_SIZE = 10;

const defaultFilters: InquiryFilters = {
  types: [],
  messageStatuses: [],
  messageId: "",
};

const InquiriesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [keyword, setKeyword] = React.useState(
    searchParams.get("keyword") ?? "",
  );
  const [page, setPage] = React.useState(
    Number(searchParams.get("page") ?? "1") > 0
      ? Number(searchParams.get("page") ?? "1")
      : 1,
  );
  const [filters, setFilters] = React.useState<InquiryFilters>({
    types: searchParams.get("types")
      ? (searchParams.get("types")!.split(",") as InquiryFilters["types"])
      : [],
    messageStatuses: searchParams.get("messageStatuses")
      ? (searchParams
          .get("messageStatuses")!
          .split(",") as InquiryFilters["messageStatuses"])
      : [],
    messageId: searchParams.get("messageId") ?? "",
  });

  const [searchValue, setSearchValue] = React.useState(() =>
    stringifySearchQuery(
      searchParams.get("keyword") ?? "",
      filters as unknown as Record<string, unknown>,
    ),
  );

  const [draftFilters, setDraftFilters] = React.useState(filters);
  const [filterOpen, setFilterOpen] = React.useState(false);

  const selectedId = searchParams.get("id")
    ? Number(searchParams.get("id"))
    : null;
  const [previewId, setPreviewId] = React.useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Inquiry | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [updatingMessageStatusIds, setUpdatingMessageStatusIds] =
    React.useState<Set<number>>(new Set());

  // ── Build query params
  const inquiryQueryParams = React.useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      keyword: keyword || undefined,
      types: filters.types.length ? filters.types : undefined,
      messageStatuses: filters.messageStatuses.length
        ? filters.messageStatuses
        : undefined,
      messageId: filters.messageId ? Number(filters.messageId) : undefined,
      orderCol: "createdAt" as const,
      orderDir: "DESC" as const,
    }),
    [page, keyword, filters],
  );

  const { data: result, isFetching: loading } = useQuery({
    queryKey: ["inquiries", inquiryQueryParams],
    queryFn: () => inquiriesService.getList(inquiryQueryParams),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });

  const updateCache = (
    updater: (prev: PaginatedResponse<Inquiry>) => PaginatedResponse<Inquiry>,
  ) => {
    queryClient.setQueryData<PaginatedResponse<Inquiry>>(
      ["inquiries", inquiryQueryParams],
      (prev) => (prev ? updater(prev) : prev),
    );
  };

  const refetchInquiries = () =>
    queryClient.invalidateQueries({ queryKey: ["inquiries"] });

  React.useEffect(() => {
    setSearchValue(
      stringifySearchQuery(
        keyword,
        filters as unknown as Record<string, unknown>,
      ),
    );
  }, [keyword, filters]);

  React.useEffect(() => {
    const next = new URLSearchParams();
    if (keyword) {
      next.set("keyword", keyword);
    }
    next.set("page", String(page));
    next.set("limit", String(PAGE_SIZE));
    if (filters.types.length) {
      next.set("types", filters.types.join(","));
    }
    if (filters.messageStatuses.length) {
      next.set("messageStatuses", filters.messageStatuses.join(","));
    }
    if (filters.messageId) {
      next.set("messageId", filters.messageId);
    }
    if (selectedId != null) {
      next.set("id", String(selectedId));
    }
    setSearchParams(next, { replace: true });
  }, [filters, keyword, page, selectedId, setSearchParams]);

  const handleSearch = () => {
    const parsed = parseSearchString(searchValue);
    setKeyword(parsed.keyword);

    const nextFilters: InquiryFilters = {
      types: parsed.params.types
        ? (parsed.params.types.split(",") as InquiryType[])
        : [],
      messageStatuses: parsed.params.messageStatuses
        ? (parsed.params.messageStatuses.split(",") as MessageStatus[])
        : [],
      messageId: parsed.params.messageId ?? "",
    };
    setFilters(nextFilters);
    setPage(1);
  };

  const handleDelete = React.useCallback((row: Inquiry) => {
    setDeleteTarget(row);
  }, []);

  const executeDelete = React.useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await inquiriesService.remove(deleteTarget.id);
      toast.success("Xóa thành công.");
      updateCache((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i.id !== deleteTarget.id),
      }));
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xóa thất bại.";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteTarget, queryClient, inquiryQueryParams]);

  const handleMessageStatusChange = React.useCallback(
    async (row: Inquiry, newStatus: MessageStatus | null) => {
      setUpdatingMessageStatusIds((prev) => new Set(prev).add(row.id));
      try {
        const updated = await inquiriesService.update(row.id, {
          messageStatus: newStatus,
        });
        updateCache((prev) => ({
          ...prev,
          items: prev.items.map((x) => (x.id === updated.id ? updated : x)),
        }));
        toast.success("Cập nhật thành công.");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Cập nhật thất bại.";
        toast.error(msg);
      } finally {
        setUpdatingMessageStatusIds((prev) => {
          const next = new Set(prev);
          next.delete(row.id);
          return next;
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, inquiryQueryParams],
  );

  const handleTypesChange = React.useCallback(
    async (row: Inquiry, nextTypes: InquiryType[]) => {
      setUpdatingMessageStatusIds((prev) => new Set(prev).add(row.id));
      try {
        const updated = await inquiriesService.update(row.id, {
          types: nextTypes,
        });
        updateCache((prev) => ({
          ...prev,
          items: prev.items.map((x) => (x.id === updated.id ? updated : x)),
        }));
        toast.success("Cập nhật thành công.");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Cập nhật thất bại.";
        toast.error(msg);
      } finally {
        setUpdatingMessageStatusIds((prev) => {
          const next = new Set(prev);
          next.delete(row.id);
          return next;
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, inquiryQueryParams],
  );

  const columns: TableColumn<Inquiry>[] = React.useMemo(
    () => [
      {
        key: "question",
        header: "Câu hỏi",
        render: (item) => {
          const textQuestion = item.question
            ? item.question.replace(/<[^>]*>?/gm, "")
            : "";
          return (
            <div className="min-w-0 flex-col">
              <Tooltip label={textQuestion} className="block min-w-0">
                <p
                  className="text-navy-700 truncate text-sm font-bold dark:text-white"
                  title={textQuestion}
                >
                  {textQuestion}
                </p>
              </Tooltip>
            </div>
          );
        },
      },
      {
        key: "types",
        header: "Loại thắc mắc",
        render: (item) => (
          <InquiryTypeEditor
            value={item.types ?? []}
            onChange={(next) => handleTypesChange(item, next)}
            disabled={updatingMessageStatusIds.has(item.id)}
          />
        ),
      },
      {
        key: "createdAt",
        header: "Ngày tạo",
        render: (item) => (
          <p className="text-navy-700 text-sm dark:text-white">
            {formatDate(item.createdAt)}
          </p>
        ),
      },
      {
        key: "messageStatus",
        header: "Trạng thái xử lý",
        render: (item) => (
          <MessageStatusSelector
            value={item.messageStatus ?? null}
            onChange={(newStatus) => handleMessageStatusChange(item, newStatus)}
            disabled={updatingMessageStatusIds.has(item.id)}
          />
        ),
      },
    ],
    [updatingMessageStatusIds, handleMessageStatusChange, handleTypesChange],
  );

  const actions: TableAction<Inquiry>[] = React.useMemo(
    () => [
      {
        key: "detail",
        icon: <MdInfoOutline className="h-4 w-4" />,
        label: "Chi tiết",
        onClick: (row) => {
          const next = new URLSearchParams(searchParams);
          next.set("id", String(row.id));
          setSearchParams(next);
        },
      },
      {
        key: "delete",
        icon: <MdDeleteOutline className="h-4 w-4" />,
        label: "Xóa",
        onClick: handleDelete,
        className:
          "flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600",
      },
      {
        key: "previewReply",
        icon: <MdOutlineRateReview className="h-4 w-4" />,
        label: "Xem trước phản hồi",
        onClick: (row) => setPreviewId(row.id),
        className:
          "flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-white transition-colors hover:bg-blue-600",
      },
    ],
    [handleDelete, searchParams, setSearchParams],
  );

  return (
    <>
      <TableLayout
        result={result ?? null}
        loading={loading}
        page={page}
        pageSize={PAGE_SIZE}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearch={handleSearch}
        searchPlaceholder="Tìm kiếm thắc mắc..."
        showFilter={true}
        onFilterClick={() => {
          setDraftFilters(filters);
          setFilterOpen(true);
        }}
        columns={columns}
        actions={actions}
        onPageChange={setPage}
      />

      <InquiryDetailDrawer
        inquiryId={selectedId}
        onClose={() => navigate(-1)}
        onInquiryChanged={(updated) =>
          updateCache((prev) => ({
            ...prev,
            items: prev.items.map((x) => (x.id === updated.id ? updated : x)),
          }))
        }
        onInquiryDeleted={(id) => {
          const inquiry = result?.items.find((i) => i.id === id);
          if (inquiry) handleDelete(inquiry);
        }}
        onPreviewReply={(id) => setPreviewId(id)}
      />

      <PreviewReplyModal
        inquiryId={previewId}
        onClose={() => setPreviewId(null)}
        onSent={(isClose) =>
          updateCache((prev) => ({
            ...prev,
            items: prev.items.map((x) =>
              x.id === previewId
                ? { ...x, messageStatus: isClose ? "closed" : "replied" }
                : x,
            ),
          }))
        }
      />

      <AdvancedFilterModal
        open={filterOpen}
        value={draftFilters}
        onChange={setDraftFilters}
        onApply={() => {
          const parsed = parseSearchString(searchValue);
          setKeyword(parsed.keyword);
          setFilters(draftFilters);
          setPage(1);
          setFilterOpen(false);
          refetchInquiries();
        }}
        onClear={() => {
          const parsed = parseSearchString(searchValue);
          setKeyword(parsed.keyword);
          setDraftFilters(defaultFilters);
          setFilters(defaultFilters);
          setPage(1);
          setFilterOpen(false);
          refetchInquiries();
        }}
        onRequestClose={() => setFilterOpen(false)}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title="Xóa thắc mắc"
        subTitle={`Bạn có chắc chắn muốn xóa thắc mắc này không? Hành động này không thể hoàn tác.`}
        loading={deleting}
      />
    </>
  );
};

export default InquiriesPage;
