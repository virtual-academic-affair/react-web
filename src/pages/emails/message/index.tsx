import Card from "@/components/card";
import { messagesService } from "@/services/email";
import type { PaginatedResponse } from "@/types/common";
import type { Message, SystemLabel } from "@/types/email";
import type { DynamicDataResponse, SystemLabelEnumData } from "@/types/shared";
import React from "react";
import { MdFilterList, MdSearch } from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import AdvancedFilterModal from "./components/AdvancedFilterModal";
import EmailDetailDrawer from "./components/EmailDetailDrawer";
import EmailsTable from "./components/EmailsTable";

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

  const handleLabelChanged = () => {
    fetchEmails(page, keyword, systemLabelsFilter);
  };

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

  const handleOpenDetail = (msg: Message) => {
    const next = new URLSearchParams(searchParams);
    next.set("id", String(msg.id));
    setSearchParams(next, { replace: true });
  };

  const handleCloseDetail = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("id");
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="flex flex-col gap-4 pb-10">
      {/* Search + filter bar (outside card) */}
      <div className="flex items-center gap-3">
        <div className="dark:bg-navy-800 flex flex-1 items-center gap-2 rounded-2xl bg-white px-3 py-2">
          <MdSearch className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
          <input
            name="keyword"
            type="text"
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Tìm kiếm theo tiêu đề, người gửi..."
            className="w-full bg-transparent py-1 text-sm text-gray-700 outline-none placeholder:text-gray-500 dark:bg-transparent dark:text-white dark:placeholder:text-gray-400"
          />
        </div>
        <button
          type="button"
          onClick={handleOpenFilter}
          className="bg-brand-500 hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-400 flex h-10 w-10 items-center justify-center rounded-2xl text-white transition-colors dark:text-white"
        >
          <MdFilterList className="h-5 w-5" />
        </button>
      </div>

      <Card extra="p-6">
        <EmailsTable
          result={result}
          loading={loading}
          page={page}
          systemLabelEnum={data?.enums?.["shared.systemLabel"]}
          gmailAccount={superEmail?.email}
          onPageChange={handlePageChange}
          onOpenDetail={handleOpenDetail}
          onLabelChanged={handleLabelChanged}
        />
      </Card>

      <AdvancedFilterModal
        open={filterOpen}
        value={draftSystemLabels}
        onChange={setDraftSystemLabels}
        systemLabelEnum={systemLabelEnum}
        onClear={handleClearFilter}
        onApply={handleApplyFilter}
        onRequestClose={handleCloseFilter}
      />

      <EmailDetailDrawer
        messageId={selectedId}
        systemLabelEnum={data?.enums?.["shared.systemLabel"]}
        onClose={handleCloseDetail}
        onLabelChanged={handleLabelChanged}
      />
    </div>
  );
};

export default MessagesPage;
