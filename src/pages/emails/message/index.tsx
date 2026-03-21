import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout";
import { messagesService } from "@/services/email";
import type { PaginatedResponse } from "@/types/common";
import type { Message, SystemLabel } from "@/types/email";
import type { DynamicDataResponse, SystemLabelEnumData } from "@/types/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import React from "react";
import { MdInfoOutline, MdPostAdd, MdDeleteOutline } from "react-icons/md";
import { SiGmail } from "react-icons/si";
import { useNavigate, useSearchParams } from "react-router-dom";
import Tooltip from "../../../components/tooltip/Tooltip.tsx";
import AdvancedFilterModal from "./components/AdvancedFilterModal";
import EmailDetailDrawer from "./components/EmailDetailDrawer";
import MessageLabelEditor from "./components/MessageLabelEditor";
import MessageDeleteModal from "./components/MessageDeleteModal";
import { formatDate } from "./labelUtils";
import { parseSearchString, stringifySearchQuery } from "@/utils/search";


const PAGE_SIZE = 10;

interface MessagesPageProps {
  data: DynamicDataResponse | null;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ data }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialKeyword = searchParams.get("keyword") ?? "";
  const initialPage =
    Number(searchParams.get("page") ?? "1") > 0
      ? Number(searchParams.get("page") ?? "1")
      : 1;
  const labelsParam = searchParams.get("systemLabels");
  const initialSystemLabels = labelsParam
    ? (labelsParam.split(",").filter(Boolean) as SystemLabel[])
    : [];

  const [keyword, setKeyword] = React.useState(initialKeyword);
  const [page, setPage] = React.useState(initialPage);
  const [systemLabelsFilter, setSystemLabelsFilter] =
    React.useState<SystemLabel[]>(initialSystemLabels);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [draftSystemLabels, setDraftSystemLabels] = React.useState<
    SystemLabel[]
  >([]);

  const [searchValue, setSearchValue] = React.useState(() =>
    stringifySearchQuery(initialKeyword, { systemLabels: initialSystemLabels }),
  );

  // Fetch paginated messages
  const { data: result = null, isLoading: loading } = useQuery({
    queryKey: ["messages", { page, keyword, systemLabels: systemLabelsFilter }],
    queryFn: () =>
      messagesService.getMessages({
        page,
        limit: PAGE_SIZE,
        keyword: keyword || undefined,
        systemLabels: systemLabelsFilter.length ? systemLabelsFilter : undefined,
        orderCol: "sentAt",
        orderDir: "DESC",
      }),
    staleTime: 30 * 1000,
  });


  // Delete state
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [deletingMessage, setDeletingMessage] = React.useState<Message | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const systemLabelEnum: SystemLabelEnumData | null | undefined =
    data?.enums?.["shared.systemLabel"];
  const superEmail = data?.settings?.["email.superEmail"];

  // Use "id" as the URL param for the selected message instead of "messageId"
  const idParam = searchParams.get("id");
  const selectedId = idParam ? Number(idParam) : null;

  const handleConfirmDelete = async (deleteTasks: boolean) => {
    if (!deletingMessage) return;
    setDeleteLoading(true);
    try {
      await messagesService.deleteMessage(deletingMessage.id, deleteTasks);
      toast.success("Xóa email thành công");
      setDeleteModalOpen(false);
      setDeletingMessage(null);
      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    } catch {
      toast.error("Không thể xóa email");
    } finally {
      setDeleteLoading(false);
    }
  };

  React.useEffect(() => {
    setSearchValue(
      stringifySearchQuery(keyword, {
        systemLabels: systemLabelsFilter,
      } as unknown as Record<string, unknown>),
    );
  }, [keyword, systemLabelsFilter]);


  React.useEffect(() => {
    const tourType = searchParams.get("startTour") as "inquiry" | "class-registration" | null;
    
    if (tourType && result?.items.length) {
      // Start tour immediately once data is ready
      setTimeout(() => {
        import("@/utils/tours").then(({ startMessageSelectionTour }) => {
          startMessageSelectionTour(tourType);
          
          // Clean up the param so it doesn't re-trigger
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete("startTour");
            return next;
          }, { replace: true });
        });
      }, 0);
    }
  }, [searchParams, result, setSearchParams]);

  // Keep URL params in sync with current query state
  React.useEffect(() => {
    const next = new URLSearchParams();
    if (keyword) {
      next.set("keyword", keyword);
    }
    next.set("page", String(page));
    next.set("limit", String(PAGE_SIZE));
    if (systemLabelsFilter.length) {
      next.set("systemLabels", systemLabelsFilter.join(","));
    }
    if (idParam) {
      next.set("id", idParam);
    }
    const tourParam = searchParams.get("startTour");
    if (tourParam) {
      next.set("startTour", tourParam);
    }
    setSearchParams(next, { replace: true });
  }, [keyword, page, systemLabelsFilter, idParam, searchParams, setSearchParams]);

  const handleSearch = () => {
    const parsed = parseSearchString(searchValue);
    setKeyword(parsed.keyword);

    const nextLabels = parsed.params.systemLabels
      ? (parsed.params.systemLabels.split(",") as SystemLabel[])
      : [];
    setSystemLabelsFilter(nextLabels);
    setPage(1);
  };


  const handlePageChange = (p: number) => {
    setPage(p);
  };

  const handleLabelChanged = React.useCallback(
    (id: number, labels: SystemLabel[]) => {
      // Optimistic local update for systemLabels on a message
      queryClient.setQueryData(
        ["messages", { page, keyword, systemLabels: systemLabelsFilter }],
        (old: PaginatedResponse<Message> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((m) =>
              m.id === id ? { ...m, systemLabels: labels } : m,
            ),
          };
        }
      );
    },
    [queryClient, page, keyword, systemLabelsFilter],
  );

  const handleKeywordChange = (value: string) => {
    setSearchValue(value);
  };


  const handleOpenFilter = () => {
    setDraftSystemLabels(systemLabelsFilter);
    setFilterOpen(true);
  };

  const handleApplyFilter = () => {
    setSystemLabelsFilter(draftSystemLabels);
    setPage(1);
    setFilterOpen(false);
  };

  const handleCloseFilter = () => {
    setFilterOpen(false);
  };

  const handleClearFilter = () => {
    setDraftSystemLabels([]);
    setSystemLabelsFilter([]);
    setPage(1);
    setFilterOpen(false);
  };

  const handleOpenDetail = React.useCallback(
    (msg: Message) => {
      const next = new URLSearchParams(searchParams);
      next.set("id", String(msg.id));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleCloseDetail = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("id");
    setSearchParams(next, { replace: true });
  };

  const handleCreateBusiness = React.useCallback(
    (msg: Message, type: "task" | "inquiry" | "registration") => {
      const params = new URLSearchParams();
      params.set("messageId", String(msg.id));
      if (msg.subject) {
        params.set("name", msg.subject);
      }

      if (type === "task") {
        navigate(`/admin/tasks/create?${params.toString()}`);
      } else if (type === "inquiry") {
        navigate(`/admin/inquiry/create?${params.toString()}`);
      } else if (type === "registration") {
        navigate(`/admin/class-registration/create?${params.toString()}`);
      }
    },
    [navigate],
  );

  // Define table columns
  const columns: TableColumn<Message>[] = React.useMemo(
    () => [
      {
        key: "subject",
        header: "Tiêu đề",
        width: "400px",
        maxWidth: "450px",
        render: (msg) => (
          <Tooltip label={msg.subject || "(Không có tiêu đề)"}>
            <p className="text-navy-700 w-full max-w-100 truncate text-base font-medium dark:text-white">
              {msg.subject || "(Không có tiêu đề)"}
            </p>
          </Tooltip>
        ),
      },
      {
        key: "sender",
        header: "Người gửi",
        width: "400px",
        maxWidth: "250px",
        render: (msg) => (
          <Tooltip label={msg.senderName}>
            <p className="text-navy-700 w-full max-w-62.5 truncate text-sm dark:text-white">
              {msg.senderName}
            </p>
          </Tooltip>
        ),
      },
      {
        key: "systemLabels",
        header: "Nhãn hệ thống",
        render: (msg) => (
          <MessageLabelEditor
            message={msg}
            systemLabelEnum={systemLabelEnum}
            onLabelChanged={handleLabelChanged}
          />
        ),
      },
      {
        key: "sentAt",
        header: "Thời gian gửi",
        render: (msg) => (
          <p className="text-navy-700 text-sm dark:text-white">
            {formatDate(msg.sentAt)}
          </p>
        ),
      },
    ],
    [systemLabelEnum, handleLabelChanged],
  );

  // Define table actions
  const actions: TableAction<Message>[] = React.useMemo(
    () => [
      {
        key: "detail",
        icon: <MdInfoOutline className="h-4 w-4" />,
        label: "Chi tiết",
        onClick: handleOpenDetail,
      },
      {
        key: "gmail",
        icon: <SiGmail className="h-4 w-4" />,
        label: "Gmail",
        onClick: (msg) => {
          const url = superEmail?.email
            ? `https://mail.google.com/mail/u/${superEmail.email}/#inbox/${msg.threadId}`
            : `https://mail.google.com/mail/u/0/#inbox/${msg.threadId}`;
          window.open(url, "_blank", "noopener,noreferrer");
        },
        className:
          "flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-500 text-white transition-colors hover:bg-pink-600 dark:bg-pink-500 dark:text-white dark:hover:bg-pink-400",
      },
      {
        key: "create-task",
        icon: (
          <div className="flex h-10 w-10 items-center justify-center">
            <MdPostAdd className="h-5 w-5" />
          </div>
        ),
        label: "Tạo công việc",
        onClick: (msg) => {
          handleCreateBusiness(msg, "task");
        },
        className:
          "flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500 text-white transition-colors hover:bg-green-600 dark:bg-green-500 dark:text-white dark:hover:bg-green-400",
      },
      {
        key: "delete",
        icon: <MdDeleteOutline className="h-4 w-4" />,
        label: "Xóa",
        onClick: (msg) => {
          setDeletingMessage(msg);
          setDeleteModalOpen(true);
        },
        className:
          "flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600 dark:bg-red-500 dark:text-white dark:hover:bg-red-400",
      },
    ],
    [handleOpenDetail, superEmail?.email, handleCreateBusiness],
  );

  return (
    <>
      <TableLayout
        result={result}
        loading={loading}
        page={page}
        pageSize={PAGE_SIZE}
        searchValue={searchValue}
        onSearchChange={handleKeywordChange}
        onSearch={handleSearch}

        searchPlaceholder="Tìm kiếm theo tiêu đề, người gửi..."
        showFilter={true}
        onFilterClick={handleOpenFilter}
        columns={columns}
        actions={actions}
        onPageChange={handlePageChange}
        detailDrawer={
          <EmailDetailDrawer
            messageId={selectedId}
            systemLabelEnum={data?.enums?.["shared.systemLabel"]}
            onClose={handleCloseDetail}
            onLabelChanged={handleLabelChanged}
          />
        }
      />

      <MessageDeleteModal
        open={deleteModalOpen}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeletingMessage(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />

      <AdvancedFilterModal
        open={filterOpen}
        value={draftSystemLabels}
        onChange={setDraftSystemLabels}
        systemLabelEnum={systemLabelEnum}
        onClear={handleClearFilter}
        onApply={handleApplyFilter}
        onRequestClose={handleCloseFilter}
      />
    </>
  );
};

export default MessagesPage;
