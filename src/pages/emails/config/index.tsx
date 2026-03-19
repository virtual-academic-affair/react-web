import AllowedDomainsCard from "./components/AllowedDomainsCard";
import ProfileCard from "./components/ProfileCard";
import SyncCard from "./components/SyncCard";
import type { DynamicDataResponse } from "@/types/shared";
import React from "react";
import LabelsCard from "@/pages/emails/config/components/LabelsCard.tsx";

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
  const systemLabelEnum = data?.enums?.["shared.systemLabel"];

  return (
    <div className="flex flex-col gap-6 pb-10">
      <ProfileCard data={data} loading={dataLoading} />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SyncCard data={data} dataLoading={dataLoading} onRefresh={onRefresh} />
        <AllowedDomainsCard />
      </div>

      <LabelsCard systemLabelEnum={systemLabelEnum} />
    </div>
  );
};

export default GmailConfigPage;
