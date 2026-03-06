/**
 * Admin Dashboard Page
 * Displays the super-email profile info and allows manually triggering an email sync.
 */

import type { DynamicDataResponse } from "@/types/shared";
import React from "react";
import AllowedDomainsCard from "./components/AllowedDomainsCard";
import ProfileCard from "./components/ProfileCard";
import SyncCard from "./components/SyncCard";

// ─── main page ───────────────────────────────────────────────────────────────

interface AdminPageProps {
  data: DynamicDataResponse | null;
  dataLoading: boolean;
  onRefresh: () => Promise<void>;
}

const AdminPage: React.FC<AdminPageProps> = ({
  data,
  dataLoading,
  onRefresh,
}) => {
  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ── Profile Card ───────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <ProfileCard data={data} loading={dataLoading} />
        </div>

        {/* ── Right column: Sync + Allowed Domains ───────────────────────── */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          <SyncCard
            data={data}
            dataLoading={dataLoading}
            onRefresh={onRefresh}
          />
          <AllowedDomainsCard />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
