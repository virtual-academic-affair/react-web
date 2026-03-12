/**
 * Admin Dashboard Page
 * Displays the super-email profile info and allows manually triggering an email sync.
 */

import type { DynamicDataResponse } from "@/types/shared";
import React from "react";
import ProfileCard from "./components/ProfileCard";

// ─── main page ───────────────────────────────────────────────────────────────

interface AdminPageProps {
  data: DynamicDataResponse | null;
  dataLoading: boolean;
  onRefresh: () => Promise<void>;
}

const AdminPage: React.FC<AdminPageProps> = ({ data, dataLoading }) => {
  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 pb-10">
      <ProfileCard data={data} loading={dataLoading} />
    </div>
  );
};

export default AdminPage;
