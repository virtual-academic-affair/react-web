import ConfirmModal from "@/components/modal/ConfirmModal";
import MessageStatusSelector from "@/components/selector/MessageStatusSelector";
import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout";
import Tooltip from "@/components/tooltip/Tooltip";
import { classRegistrationsService } from "@/services/class-registration";
import type {
  ClassRegistration,
  MessageStatus,
} from "@/types/classRegistration";
import type { PaginatedResponse } from "@/types/common";
import { formatDate } from "@/utils/date";
import { parseSearchString, stringifySearchQuery } from "@/utils/search";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import React from "react";
import {
  MdDeleteOutline,
  MdInfoOutline,
  MdOutlineRateReview,
  MdSend,
} from "react-icons/md";
import { useNavigate, useSearchParams } from "react-router-dom";
import AdvancedFilterModal, {
  type RegistrationFilters,
} from "./components/AdvancedFilterModal";
import PreviewReplyModal from "./components/PreviewReplyModal";
import RegistrationDetailDrawer from "./components/RegistrationDetailDrawer";

const PAGE_SIZE = 10;

const defaultFilters: RegistrationFilters = {
  studentCode: "",
  academicYear: "",
  smartOrder: false,
  messageStatuses: [],
  messageId: "",
};

const ClassRegistrationsPage: React.FC = () => {
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
  const [filters, setFilters] = React.useState<RegistrationFilters>({
    studentCode: searchParams.get("studentCode") ?? "",
    academicYear: searchParams.get("academicYear") ?? "",
    smartOrder: searchParams.get("smartOrder") === "true",
    messageStatuses: searchParams.get("messageStatuses")
      ? (searchParams
          .get("messageStatuses")!
          .split(",") as RegistrationFilters["messageStatuses"])
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
  const [deleteTarget, setDeleteTarget] =
    React.useState<ClassRegistration | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [updatingMessageStatusIds, setUpdatingMessageStatusIds] =
    React.useState<Set<number>>(new Set());
  const [sendingReplyId, setSendingReplyId] = React.useState<number | null>(
    null,
  );

  // Fetch paginated registrations
  const { data: result = null, isLoading: loading } = useQuery({
    queryKey: ["class-registrations", { page, keyword, ...filters }],
    queryFn: () =>
      classRegistrationsService.getList({
        page,
        limit: PAGE_SIZE,
        keyword: keyword || undefined,
        studentCode: filters.studentCode || undefined,
        academicYear: filters.academicYear || undefined,
        smartOrder: filters.smartOrder ? "true" : undefined,
        messageStatuses: filters.messageStatuses.length
          ? filters.messageStatuses
          : undefined,
        messageId: filters.messageId ? Number(filters.messageId) : undefined,
        orderCol: "createdAt",
        orderDir: "DESC",
      }),
    staleTime: 30 * 1000,
  });

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
    if (filters.studentCode) {
      next.set("studentCode", filters.studentCode);
    }
    if (filters.academicYear) {
      next.set("academicYear", filters.academicYear);
    }
    if (filters.smartOrder) {
      next.set("smartOrder", "true");
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

    const nextFilters: RegistrationFilters = {
      studentCode: parsed.params.studentCode ?? "",
      academicYear: parsed.params.academicYear ?? "",
      smartOrder: parsed.params.smartOrder === "true",
      messageStatuses: parsed.params.messageStatuses
        ? (parsed.params.messageStatuses.split(",") as MessageStatus[])
        : [],
      messageId: parsed.params.messageId ?? "",
    };
    setFilters(nextFilters);
    setPage(1);
  };

  const handleDelete = React.useCallback((row: ClassRegistration) => {
    setDeleteTarget(row);
  }, []);

  const executeDelete = React.useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await classRegistrationsService.remove(deleteTarget.id);
      toast.success("Xóa thành công.");
      queryClient.invalidateQueries({ queryKey: ["class-registrations"] });
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xóa thất bại.";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, queryClient]);

  const handleMessageStatusChange = React.useCallback(
    async (row: ClassRegistration, newStatus: MessageStatus | null) => {
      setUpdatingMessageStatusIds((prev) => new Set(prev).add(row.id));
      try {
        const updated = await classRegistrationsService.update(row.id, {
          messageStatus: newStatus,
        });

        queryClient.setQueryData(
          ["class-registrations", { page, keyword, ...filters }],
          (old: PaginatedResponse<ClassRegistration> | undefined) => {
            if (!old) return old;
            return {
              ...old,
              items: old.items.map((x) => (x.id === updated.id ? updated : x)),
            };
          },
        );
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
    [queryClient, page, keyword, filters],
  );

  const handleSendAndClose = React.useCallback(
    async (id: number) => {
      setSendingReplyId(id);
      try {
        await classRegistrationsService.replyWithDefaultPreview(id, true);
        toast.success("Đã gửi phản hồi và đóng.");
        queryClient.invalidateQueries({ queryKey: ["class-registrations"] });
        queryClient.invalidateQueries({ queryKey: ["class-registration", id] });
        queryClient.setQueryData(
          ["class-registrations", { page, keyword, ...filters }],
          (old: PaginatedResponse<ClassRegistration> | undefined) =>
            old
              ? {
                  ...old,
                  items: old.items.map((x) =>
                    x.id === id
                      ? { ...x, messageStatus: "closed" as const }
                      : x,
                  ),
                }
              : old,
        );
        if (searchParams.get("id") === String(id)) {
          navigate(-1);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Gửi phản hồi thất bại. Vui lòng thử lại.";
        toast.error(msg);
      } finally {
        setSendingReplyId(null);
      }
    },
    [queryClient, page, keyword, filters, searchParams, navigate],
  );

  const columns: TableColumn<ClassRegistration>[] = React.useMemo(
    () => [
      {
        key: "student",
        header: "Sinh viên",
        width: "30%",
        render: (item) => (
          <div className="flex min-w-0 flex-col">
            <Tooltip
              label={item.studentName}
              className="block min-w-0"
              placement="topLeft"
              wrap
            >
              <p className="text-navy-700 truncate text-sm font-bold dark:text-white">
                {item.studentName}
              </p>
            </Tooltip>
            <Tooltip
              label={item.studentCode}
              className="block min-w-0"
              placement="topLeft"
              wrap
            >
              <p className="mt-0.5 truncate text-xs text-gray-500">
                MSSV: {item.studentCode}
              </p>
            </Tooltip>
          </div>
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
        key: "itemsCount",
        header: "SL yêu cầu",
        render: (item) => (
          <p className="text-navy-700 text-sm dark:text-white">
            {item.itemsCount ?? item.items?.length ?? 0}
          </p>
        ),
      },
      {
        key: "messageStatus",
        header: "Trạng thái xử lý",
        render: (item) => (
          <div className="relative inline-flex">
            <MessageStatusSelector
              value={item.messageStatus ?? null}
              onChange={(newStatus) =>
                handleMessageStatusChange(item, newStatus)
              }
              disabled={updatingMessageStatusIds.has(item.id)}
            />
          </div>
        ),
      },
    ],
    [updatingMessageStatusIds, handleMessageStatusChange],
  );

  const actions: TableAction<ClassRegistration>[] = React.useMemo(
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
        key: "previewReply",
        icon: <MdOutlineRateReview className="h-4 w-4" />,
        label: "Xem trước phản hồi",
        onClick: (row) => setPreviewId(row.id),
        className:
          "flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-white transition-colors hover:bg-blue-600",
      },
      {
        key: "sendAndClose",
        icon: <MdSend className="h-4 w-4" />,
        label: "Gửi và đóng",
        onClick: (row) => handleSendAndClose(row.id),
        render: (row) => (
          <button
            type="button"
            disabled={sendingReplyId === row.id}
            onClick={(e) => {
              e.stopPropagation();
              handleSendAndClose(row.id);
            }}
            aria-label="Gửi và đóng"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white transition-colors hover:bg-teal-600 disabled:opacity-50 dark:bg-teal-500 dark:hover:bg-teal-600"
          >
            <MdSend className="h-4 w-4" />
          </button>
        ),
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
    [
      handleDelete,
      handleSendAndClose,
      searchParams,
      sendingReplyId,
      setSearchParams,
    ],
  );

  return (
    <>
      <TableLayout
        result={result}
        loading={loading}
        page={page}
        pageSize={PAGE_SIZE}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearch={handleSearch}
        searchPlaceholder="Tìm kiếm theo tên SV, MSSV..."
        showFilter={true}
        onFilterClick={() => {
          setDraftFilters(filters);
          setFilterOpen(true);
        }}
        columns={columns}
        actions={actions}
        onPageChange={setPage}
      />

      <RegistrationDetailDrawer
        registrationId={selectedId}
        onClose={() => navigate(-1)}
        onRegistrationChanged={(updated) => {
          queryClient.setQueryData(
            ["class-registrations", { page, keyword, ...filters }],
            (old: PaginatedResponse<ClassRegistration> | undefined) => {
              if (!old) return old;
              return {
                ...old,
                items: old.items.map((x) =>
                  x.id === updated.id ? updated : x,
                ),
              };
            },
          );
        }}
        onRegistrationDeleted={(id) => {
          const reg = result?.items.find((i) => i.id === id);
          if (reg) handleDelete(reg);
        }}
        onPreviewReply={(id) => setPreviewId(id)}
      />

      <PreviewReplyModal
        registrationId={previewId}
        onClose={() => setPreviewId(null)}
        onSent={(closeAfterSend) => {
          queryClient.setQueryData(
            ["class-registrations", { page, keyword, ...filters }],
            (old: PaginatedResponse<ClassRegistration> | undefined) => {
              if (!old) return old;
              return {
                ...old,
                items: old.items.map((x) =>
                  x.id === previewId
                    ? {
                        ...x,
                        messageStatus: closeAfterSend ? "closed" : "replied",
                      }
                    : x,
                ),
              };
            },
          );
        }}
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

      <ConfirmModal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title="Xóa đăng ký lớp"
        subTitle={`Bạn có chắc chắn muốn xóa đăng ký lớp của sinh viên "${deleteTarget?.studentName}" không? Hành động này không thể hoàn tác.`}
        loading={deleting}
      />
    </>
  );
};

export default ClassRegistrationsPage;
