/**
 * Admin Dashboard Page
 * Displays the super-email profile info and allows manually triggering an email sync.
 */

import Card from "@/components/card";
import { messagesService } from "@/services/email";
import type { DynamicDataResponse } from "@/types/shared";
import React from "react";
import {
  MdAccessTime,
  MdCheckCircle,
  MdEmail,
  MdError,
  MdSync,
} from "react-icons/md";

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface ProfileCardProps {
  data: DynamicDataResponse | null;
  loading: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ data, loading }) => {
  const profile = data?.settings?.["email.superEmail"];
  const lastPullAt = data?.settings?.["email.lastPullAt"];

  if (loading) {
    return (
      <Card extra="p-6 flex flex-col items-center gap-4 animate-pulse">
        <div className="dark:bg-navy-700 h-24 w-24 rounded-full bg-gray-200" />
        <div className="dark:bg-navy-700 h-5 w-40 rounded bg-gray-200" />
        <div className="dark:bg-navy-700 h-4 w-56 rounded bg-gray-200" />
        <div className="dark:bg-navy-700 h-4 w-48 rounded bg-gray-200" />
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card extra="p-6 flex flex-col items-center gap-2">
        <p className="text-gray-500 dark:text-gray-400">
          No profile data available.
        </p>
      </Card>
    );
  }

  return (
    <Card extra="p-6 flex flex-col items-center gap-4">
      {/* Avatar */}
      {profile.picture ? (
        <img
          src={profile.picture}
          alt={profile.name}
          className="ring-brand-500/30 h-24 w-24 rounded-full object-cover shadow-lg ring-4"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="bg-brand-500 flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white shadow-lg">
          {profile.name?.charAt(0) ?? "?"}
        </div>
      )}

      {/* Name */}
      <div className="text-center">
        <h2 className="text-navy-700 text-xl font-bold dark:text-white">
          {profile.name}
        </h2>

        {/* Email */}
        <div className="mt-1 flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <MdEmail className="h-4 w-4 shrink-0" />
          <span>{profile.email}</span>
        </div>
      </div>

      {/* Last Pull At */}
      <div className="dark:bg-navy-700 flex w-full items-center gap-2 rounded-xl bg-gray-50 px-4 py-3">
        <MdAccessTime className="text-brand-500 h-5 w-5 shrink-0" />
        <div>
          <p className="text-xs font-medium tracking-wide text-gray-400 uppercase dark:text-gray-500">
            Lần đồng bộ cuối cùng
          </p>
          <p className="text-navy-700 mt-0.5 text-sm font-semibold dark:text-white">
            {formatDate(lastPullAt)}
          </p>
        </div>
      </div>
    </Card>
  );
};

// ─── main page ───────────────────────────────────────────────────────────────

type SyncStatus = "idle" | "loading" | "success" | "error";

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
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus>("idle");
  const [syncMessage, setSyncMessage] = React.useState<string>("");

  // ── sync handler ────────────────────────────────────────────────────────────
  const handleSync = async () => {
    setSyncStatus("loading");
    setSyncMessage("");
    try {
      await messagesService.syncEmails();
      setSyncStatus("success");
      setSyncMessage("Email sync completed successfully.");
      // Refresh the profile card so lastPullAt updates
      await onRefresh();
    } catch (err: unknown) {
      setSyncStatus("error");
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setSyncMessage(msg);
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
                disabled={syncStatus === "loading"}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                  syncStatus === "loading"
                    ? "bg-brand-400"
                    : "bg-brand-500 hover:bg-brand-600 active:scale-95"
                } `}
              >
                <MdSync
                  className={`h-4 w-4 ${
                    syncStatus === "loading" ? "animate-spin" : ""
                  }`}
                />
                {syncStatus === "loading" ? "Đang đồng bộ..." : "Đồng bộ ngay"}
              </button>
            </div>

            {/* Status feedback */}
            {syncStatus !== "idle" && syncStatus !== "loading" && (
              <div
                className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
                  syncStatus === "success"
                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {syncStatus === "success" ? (
                  <MdCheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <MdError className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{syncMessage}</span>
              </div>
            )}

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
