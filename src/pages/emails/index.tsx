import Card from "@/components/card";
import AllowedDomainsCard from "@/pages/admin/components/AllowedDomainsCard";
import SyncCard from "@/pages/admin/components/SyncCard";
import { messagesService } from "@/services/email";
import type { PaginatedResponse } from "@/types/common";
import type { Message } from "@/types/email";
import type { DynamicDataResponse } from "@/types/shared";
import React from "react";
import EmailDetailDrawer from "./components/EmailDetailDrawer";
import EmailsTable from "./components/EmailsTable";
import LabelsCard from "./components/LabelsCard";

const PAGE_SIZE = 10;

interface EmailsPageProps {
  data: DynamicDataResponse | null;
  dataLoading: boolean;
  onRefresh: () => Promise<void>;
}

const EmailsPage: React.FC<EmailsPageProps> = ({
  data,
  dataLoading,
  onRefresh,
}) => {
  const [result, setResult] = React.useState<PaginatedResponse<Message> | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [keyword, setKeyword] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  const fetchEmails = React.useCallback(async (p: number, kw: string) => {
    setLoading(true);
    try {
      const data = await messagesService.getMessages({
        page: p,
        limit: PAGE_SIZE,
        keyword: kw || undefined,
        orderCol: "sentAt",
        orderDir: "DESC",
      });
      setResult(data);
    } catch {
      // keep previous data on error
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchEmails(page, keyword);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setPage(1);
    fetchEmails(1, keyword);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
  };

  const handleLabelChanged = () => {
    fetchEmails(page, keyword);
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Settings row: Sync + Allowed Domains */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SyncCard data={data} dataLoading={dataLoading} onRefresh={onRefresh} />
        <AllowedDomainsCard />
      </div>

      {/* Email list */}
      <Card extra="p-6">
        <h2 className="text-navy-700 mb-5 text-lg font-bold dark:text-white">
          Danh sách Email
        </h2>
        <EmailsTable
          result={result}
          loading={loading}
          keyword={keyword}
          page={page}
          systemLabelEnum={data?.enums?.["shared.systemLabel"]}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          onPageChange={handlePageChange}
          onRowClick={(msg) => setSelectedId(msg.id)}
          onLabelChanged={handleLabelChanged}
        />
      </Card>

      {/* Label management */}
      <LabelsCard />

      {/* Email detail drawer */}
      <EmailDetailDrawer
        messageId={selectedId}
        systemLabelEnum={data?.enums?.["shared.systemLabel"]}
        onClose={() => setSelectedId(null)}
        onLabelChanged={handleLabelChanged}
      />
    </div>
  );
};

export default EmailsPage;
