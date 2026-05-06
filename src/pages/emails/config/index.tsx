import LabelsCard from "@/pages/emails/config/components/LabelsCard.tsx";
import type { DynamicDataResponse } from "@/types/shared";
import React from "react";
import AllowedDomainsCard from "./components/AllowedDomainsCard";
import ProfileCard from "./components/ProfileCard";

interface GmailConfigPageProps {
  data: DynamicDataResponse | null;
  dataLoading: boolean;
  onRefresh: () => Promise<void>;
}

const GmailConfigPage: React.FC<GmailConfigPageProps> = ({
  data,
  dataLoading,
  onRefresh,
}) => {
  const roleDomainsByRole = data?.settings?.["auth.roleDomains"] ?? null;
  const labelMapping = data?.settings?.["email.labels"] ?? null;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <ProfileCard data={data} loading={dataLoading} onRefresh={onRefresh} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AllowedDomainsCard
          domainsByRole={roleDomainsByRole}
          onRefresh={onRefresh}
        />
        <LabelsCard
          mapping={labelMapping}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  );
};

export default GmailConfigPage;
