/**
 * Admin Dashboard Page
 * Displays the super-email profile info and allows manually triggering an email sync.
 */

import { messagesService } from "@/services/email";
import type { DynamicDataResponse } from "@/types/shared";
import { message } from "antd";
import React from "react";
import ProfileCard from "./components/ProfileCard";

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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ── Profile Card ───────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <ProfileCard data={data} loading={dataLoading} />
        </div>

        {/* ── Actions Panel ──────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="font-dm shadow-3xl shadow-shadow-500 dark:!bg-navy-800 grid h-full w-full grid-cols-1 gap-3 rounded-[20px] bg-white bg-clip-border p-3 lg:grid-cols-11 dark:shadow-none">
            {/* Left side - Icon */}
            <div className="col-span-5 h-full w-full rounded-xl p-3 lg:col-span-5 lg:pb-0">
              <div className="flex h-full w-full flex-col items-center justify-center rounded-xl py-3">
                <div className="text-brand-500 bg-lightPrimary dark:!bg-navy-700 mt-2 flex items-center justify-center rounded-full p-[26px] text-5xl font-bold dark:text-white">
                  <svg
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth="0"
                    viewBox="0 0 16 16"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.354 6.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708 0z"
                    ></path>
                    <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383zm.653.757c-.757.653-1.153 1.44-1.153 2.056v.448l-.445.049C2.064 6.805 1 7.952 1 9.318 1 10.785 2.23 12 3.781 12h8.906C13.98 12 15 10.988 15 9.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 4.825 10.328 3 8 3a4.53 4.53 0 0 0-2.941 1.1z"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Right side - Content */}
            <div className="dark:!bg-navy-800 col-span-5 flex h-full w-full flex-col justify-center overflow-hidden rounded-xl bg-white pl-3 lg:col-span-6">
              {/* Description */}
              <h5 className="text-navy-700 mb-5 text-left text-xl leading-9 font-bold dark:text-white">
                Đồng bộ tự động
              </h5>
              <div className="mb-4 list-inside list-disc text-base text-gray-600 dark:text-gray-400">
                Tối ưu hóa luồng công việc với khả năng{" "}
                <strong>đồng bộ dữ liệu mỗi phút</strong>. Hệ thống tự động quét
                và gán nhãn email thông minh, đồng thời xử lý theo nghiệp vụ
                nhanh chóng.
              </div>

              {/* Last sync info */}
              <div className="mb-4 flex items-center gap-2">
                <span className="text-base font-medium text-gray-600 dark:text-gray-400">
                  Đồng bộ lần cuối:
                </span>
                <span className="text-navy-700 text-base font-semibold dark:text-white">
                  {dataLoading
                    ? "Loading…"
                    : (() => {
                        const d = new Date(
                          data?.settings?.["email.lastPullAt"] as string,
                        );
                        if (isNaN(d.getTime())) {
                          return "---";
                        }

                        const date = d.getDate().toString().padStart(2, "0");
                        const month = (d.getMonth() + 1)
                          .toString()
                          .padStart(2, "0");
                        const year = d.getFullYear();
                        const hours = d.getHours().toString().padStart(2, "0");
                        const minutes = d
                          .getMinutes()
                          .toString()
                          .padStart(2, "0");
                        const seconds = d
                          .getSeconds()
                          .toString()
                          .padStart(2, "0");

                        return `${date}/${month}/${year} ${hours}:${minutes}:${seconds}`;
                      })()}
                </span>
              </div>

              {/* Sync button */}
              <button
                onClick={handleSync}
                disabled={syncing}
                className="linear bg-brand-500 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:active:bg-brand-200 mt-2 flex items-center justify-center rounded-xl px-2 py-2 text-base font-medium text-white transition duration-200 dark:text-white"
              >
                {syncing ? "Đang đồng bộ..." : "Đồng bộ ngay"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
