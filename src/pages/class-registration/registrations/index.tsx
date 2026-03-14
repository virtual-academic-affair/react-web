import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout";
import { classRegistrationsService } from "@/services/class-registration";
import type { ClassRegistration } from "@/types/classRegistration";
import {
  MessageStatusColors,
  MessageStatusLabels,
} from "@/types/classRegistration";
import type { PaginatedResponse } from "@/types/common";
import { message as toast } from "antd";
import React from "react";
import {
  MdDeleteOutline,
  MdInfoOutline,
  MdOutlineRateReview,
} from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import AdvancedFilterModal, {
  type RegistrationFilters,
} from "./components/AdvancedFilterModal";
import PreviewReplyModal from "./components/PreviewReplyModal";
import RegistrationDetailDrawer from "./components/RegistrationDetailDrawer";

const PAGE_SIZE = 10;

const defaultFilters: RegistrationFilters = {
  studentCode: "",
  academicYear: "",
  smartOrder: "",
  messageId: "",
  messageStatuses: [],
};

const ClassRegistrationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] =
    React.useState<PaginatedResponse<ClassRegistration> | null>(null);
  const [loading, setLoading] = React.useState(true);

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
    smartOrder: searchParams.get("smartOrder") ?? "",
    messageId: searchParams.get("messageId") ?? "",
    messageStatuses: searchParams.get("messageStatuses")
      ? (searchParams
          .get("messageStatuses")!
          .split(",") as RegistrationFilters["messageStatuses"])
      : [],
  });
  const [draftFilters, setDraftFilters] = React.useState(filters);
  const [filterOpen, setFilterOpen] = React.useState(false);

  const selectedId = searchParams.get("id")
    ? Number(searchParams.get("id"))
    : null;
  const [previewId, setPreviewId] = React.useState<number | null>(null);

  const fetchList = React.useCallback(
    async (p: number, kw: string, f: RegistrationFilters) => {
      setLoading(true);
      try {
        const resp = await classRegistrationsService.getList({
          page: p,
          limit: PAGE_SIZE,
          keyword: kw || undefined,
          studentCode: f.studentCode || undefined,
          academicYear: f.academicYear || undefined,
          smartOrder: f.smartOrder || undefined,
          messageId: f.messageId || undefined,
          messageStatuses: f.messageStatuses.length
            ? f.messageStatuses
            : undefined,
          orderCol: "createdAt",
          orderDir: "DESC",
        });
        setResult(resp);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách đăng kí lớp.";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    fetchList(page, keyword, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

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
      next.set("smartOrder", filters.smartOrder);
    }
    if (filters.messageId) {
      next.set("messageId", filters.messageId);
    }
    if (filters.messageStatuses.length) {
      next.set("messageStatuses", filters.messageStatuses.join(","));
    }
    if (selectedId != null) {
      next.set("id", String(selectedId));
    }
    setSearchParams(next, { replace: true });
  }, [filters, keyword, page, selectedId, setSearchParams]);

  const handleSearch = () => {
    setPage(1);
    fetchList(1, keyword, filters);
  };

  const handleDelete = async (row: ClassRegistration) => {
    if (!window.confirm(`Xóa đăng ký lớp #${row.id}?`)) {
      return;
    }
    try {
      await classRegistrationsService.remove(row.id);
      toast.success("Xóa thành công.");
      setResult((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((i) => i.id !== row.id),
            }
          : prev,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xóa thất bại.";
      toast.error(msg);
    }
  };

  const columns: TableColumn<ClassRegistration>[] = React.useMemo(
    () => [
      {
        key: "messageStatus",
        header: "Trạng thái email",
        render: (item) =>
          item.messageStatus ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                MessageStatusColors[item.messageStatus].bg
              } ${MessageStatusColors[item.messageStatus].text}`}
            >
              {MessageStatusLabels[item.messageStatus]}
            </span>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
          ),
      },
      {
        key: "studentCode",
        header: "MSSV",
        render: (item) => (
          <p className="text-navy-700 text-sm font-medium dark:text-white">
            {item.studentCode}
          </p>
        ),
      },
      {
        key: "studentName",
        header: "Họ tên",
        render: (item) => (
          <p className="text-navy-700 text-sm dark:text-white">
            {item.studentName}
          </p>
        ),
      },
      {
        key: "createdAt",
        header: "Ngày tạo",
        render: (item) => (
          <p className="text-navy-700 text-sm dark:text-white">
            {new Intl.DateTimeFormat("vi-VN", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(item.createdAt))}
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
    ],
    [],
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
          setSearchParams(next, { replace: true });
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
        label: "Preview reply",
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
        result={result}
        loading={loading}
        page={page}
        pageSize={PAGE_SIZE}
        searchValue={keyword}
        onSearchChange={setKeyword}
        onSearch={handleSearch}
        searchPlaceholder="Tìm kiếm student code / student name..."
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
        onClose={() => {
          const next = new URLSearchParams(searchParams);
          next.delete("id");
          setSearchParams(next, { replace: true });
        }}
        onRegistrationChanged={(updated) =>
          setResult((prev) =>
            prev
              ? {
                  ...prev,
                  items: prev.items.map((x) =>
                    x.id === updated.id ? updated : x,
                  ),
                }
              : prev,
          )
        }
      />

      <PreviewReplyModal
        registrationId={previewId}
        onClose={() => setPreviewId(null)}
        onSent={(closeAfterSend) =>
          setResult((prev) =>
            prev
              ? {
                  ...prev,
                  items: prev.items.map((x) =>
                    x.id === previewId
                      ? {
                          ...x,
                          messageStatus: closeAfterSend ? "closed" : "replied",
                        }
                      : x,
                  ),
                }
              : prev,
          )
        }
      />

      <AdvancedFilterModal
        open={filterOpen}
        value={draftFilters}
        onChange={setDraftFilters}
        onApply={() => {
          setFilters(draftFilters);
          setPage(1);
          setFilterOpen(false);
          fetchList(1, keyword, draftFilters);
        }}
        onClear={() => {
          setDraftFilters(defaultFilters);
          setFilters(defaultFilters);
          setPage(1);
          setFilterOpen(false);
          fetchList(1, keyword, defaultFilters);
        }}
        onRequestClose={() => setFilterOpen(false)}
      />
    </>
  );
};

export default ClassRegistrationsPage;
