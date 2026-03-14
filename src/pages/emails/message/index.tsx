import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout";
import { messagesService } from "@/services/email";
import type { PaginatedResponse } from "@/types/common";
import type { Message, SystemLabel } from "@/types/email";
import type { DynamicDataResponse, SystemLabelEnumData } from "@/types/shared";
import React from "react";
import { MdInfoOutline } from "react-icons/md";
import { SiGmail } from "react-icons/si";
import { useSearchParams } from "react-router-dom";
import AdvancedFilterModal from "./components/AdvancedFilterModal";
import EmailDetailDrawer from "./components/EmailDetailDrawer";
import MessageLabelEditor from "./components/MessageLabelEditor";
import Tooltip from "../../../components/tooltip/Tooltip.tsx";
import { formatDate } from "./labelUtils";

const PAGE_SIZE = 10;

interface MessagesPageProps {
  data: DynamicDataResponse | null;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ data }) => {
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

  const [result, setResult] = React.useState<PaginatedResponse<Message> | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [keyword, setKeyword] = React.useState(initialKeyword);
  const [page, setPage] = React.useState(initialPage);
  const [systemLabelsFilter, setSystemLabelsFilter] =
    React.useState<SystemLabel[]>(initialSystemLabels);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [draftSystemLabels, setDraftSystemLabels] = React.useState<
    SystemLabel[]
  >([]);

  const systemLabelEnum: SystemLabelEnumData | null | undefined =
    data?.enums?.["shared.systemLabel"];
  const superEmail = data?.settings?.["email.superEmail"];

  // Use "id" as the URL param for the selected message instead of "messageId"
  const idParam = searchParams.get("id");
  const selectedId = idParam ? Number(idParam) : null;

  const fetchEmails = React.useCallback(
    async (p: number, kw: string, labels: SystemLabel[]) => {
      setLoading(true);
      try {
        const resp = await messagesService.getMessages({
          page: p,
          limit: PAGE_SIZE,
          keyword: kw || undefined,
          systemLabels: labels.length ? labels : undefined,
          orderCol: "sentAt",
          orderDir: "DESC",
        });
        setResult(resp);
      } catch {
        // keep previous data on error
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    fetchEmails(page, keyword, systemLabelsFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, systemLabelsFilter]);

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
    setSearchParams(next, { replace: true });
  }, [keyword, page, systemLabelsFilter, idParam, setSearchParams]);

  const handleSearch = () => {
    setPage(1);
    fetchEmails(1, keyword, systemLabelsFilter);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
  };

  const handleLabelChanged = React.useCallback(
    (id: number, labels: SystemLabel[]) => {
      // Optimistic local update for systemLabels on a message
      setResult((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((m) =>
                m.id === id ? { ...m, systemLabels: labels } : m,
              ),
            }
          : prev,
      );
    },
    [],
  );

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
  };

  const handleOpenFilter = () => {
    setDraftSystemLabels(systemLabelsFilter);
    setFilterOpen(true);
  };

  const handleApplyFilter = () => {
    setSystemLabelsFilter(draftSystemLabels);
    setPage(1);
    setFilterOpen(false);
    fetchEmails(1, keyword, draftSystemLabels);
  };

  const handleCloseFilter = () => {
    setFilterOpen(false);
  };

  const handleClearFilter = () => {
    setDraftSystemLabels([]);
    setSystemLabelsFilter([]);
    setPage(1);
    fetchEmails(1, keyword, []);
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
            <p className="text-navy-700 w-full max-w-[400px] truncate text-base font-medium dark:text-white">
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
            <p className="text-navy-700 w-full max-w-[250px] truncate text-sm dark:text-white">
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
    ],
    [handleOpenDetail, superEmail?.email],
  );

  return (
    <>
      <TableLayout
        result={result}
        loading={loading}
        page={page}
        pageSize={PAGE_SIZE}
        searchValue={keyword}
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
