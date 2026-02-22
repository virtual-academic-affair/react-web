/**
 * Admin Dashboard Page
 * Displays the super-email profile info and allows manually triggering an email sync.
 */

import Card from "@/components/card";
import { messagesService } from "@/services/email";
import type { DynamicDataResponse } from "@/types/shared";
import { message } from "antd";
import React from "react";
import { MdAccessTime, MdSync } from "react-icons/md";
import ProfileCard, { formatDate } from "./components/ProfileCard";

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
  const [syncing, setSyncing] = React.useState(false);

  // ── sync handler ─────────────────────────────────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true);
    try {
      await messagesService.syncEmails();
      message.success("Email sync completed successfully.");
      await onRefresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      message.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Page header */}
      <div>
        <h1 className="text-navy-700 text-2xl font-bold dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Quản lý tài khoản Gmail được kết nối và cài đặt hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Profile Card ───────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <h2 className="mb-3 text-base font-semibold text-gray-600 dark:text-gray-300">
            Tài khoản Gmail
          </h2>
          <ProfileCard data={data} loading={dataLoading} />
        </div>

        {/* ── Actions Panel ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-base font-semibold text-gray-600 dark:text-gray-300">
            Hành động
          </h2>

          <Card extra="p-6 flex flex-col gap-5">
            {/* Sync section */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-navy-700 font-semibold dark:text-white">
                  Đồng bộ Gmail
                </h3>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  Kích hoạt đồng bộ để cập nhật email mới nhất.
                </p>
              </div>

              <button
                onClick={handleSync}
                disabled={syncing}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                  syncing
                    ? "bg-brand-400"
                    : "bg-brand-500 hover:bg-brand-600 active:scale-95"
                }`}
              >
                <MdSync
                  className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                />
                {syncing ? "Đang đồng bộ..." : "Đồng bộ ngay"}
              </button>
            </div>

            {/* Divider */}
            <div className="dark:bg-navy-700 h-px bg-gray-100" />

            {/* Last pull info row */}
            <div className="flex items-center gap-3">
              <MdAccessTime className="text-brand-500 h-5 w-5 shrink-0" />
              <div>
                <p className="text-xs font-medium tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Lần đồng bộ cuối cùng
                </p>
                <p className="text-navy-700 text-sm font-semibold dark:text-white">
                  {dataLoading
                    ? "Loading…"
                    : formatDate(data?.settings?.["email.lastPullAt"])}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
