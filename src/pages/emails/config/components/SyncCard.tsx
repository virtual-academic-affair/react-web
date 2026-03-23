import Card from "@/components/card";
import Switch from "@/components/switch";
import Tooltip from "@/components/tooltip/Tooltip";
import { emailSettingsService, messagesService } from "@/services/email";
import type { DynamicDataResponse } from "@/types/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import React from "react";
import { MdAutorenew, MdInfoOutline } from "react-icons/md";

interface SyncCardProps {
  data: DynamicDataResponse | null;
  dataLoading: boolean;
  onRefresh: () => Promise<void>;
}

function formatLastPullAt(iso: string | undefined): string {
  if (!iso) {
    return "---";
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return "---";
  }
  const date = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const seconds = d.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds} ${date}/${month}/${year}`;
}

const SyncCard: React.FC<SyncCardProps> = ({
  data,
  dataLoading,
  onRefresh,
}) => {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = React.useState(false);
  const [updatingContent, setUpdatingContent] = React.useState(false);
  const [now, setNow] = React.useState(Date.now());
  const [virtualLastSyncTime, setVirtualLastSyncTime] = React.useState<number>(0);

  // Periodically update current time to drive the countdown animation
  React.useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      // Increment virtual time every 10s to simulate local sync updates
      if (virtualLastSyncTime > 0) {
        const elapsedSinceVirtual = currentTime - virtualLastSyncTime;
        if (elapsedSinceVirtual >= 10000) {
          const jumps = Math.floor(elapsedSinceVirtual / 10000);
          setVirtualLastSyncTime((prev) => prev + jumps * 10000);
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [virtualLastSyncTime]);

  // Automatically refresh metadata from server every 2 minutes
  React.useEffect(() => {
    const refreshInterval = setInterval(() => {
      onRefresh();
    }, 120000); // 2 minutes
    return () => clearInterval(refreshInterval);
  }, [onRefresh]);

  // Sync virtual time with server time when data updates
  const lastPullAt = data?.settings?.["email.lastPullAt"];
  React.useEffect(() => {
    if (lastPullAt) {
      setVirtualLastSyncTime(new Date(lastPullAt).getTime());
    }
  }, [lastPullAt]);

  // Calculate progress and countdown based on virtualLocalSync (10s cycle)
  const elapsed = now - virtualLastSyncTime;
  const cycleMs = 10000; // 10s cycle
  const diff = elapsed % cycleMs;
  const cycleProgress = diff / cycleMs;
  const progress = virtualLastSyncTime ? (1 - cycleProgress) * 100 : 0;
  const secondsLeft = Math.max(0, Math.ceil((cycleMs - diff) / 1000));

  const { data: canSaveContent = false } = useQuery({
    queryKey: ["email-can-save-content"],
    queryFn: () => emailSettingsService.getCanSaveContent(),
    staleTime: 5 * 60 * 1000,
  });

  const handleToggleContent = async (checked: boolean) => {
    setUpdatingContent(true);
    try {
      await emailSettingsService.updateCanSaveContent(checked);
      // Optimistic update — no need to refetch
      queryClient.setQueryData(["email-can-save-content"], checked);
      message.success("Cập nhật thành công.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại.";
      message.error(msg);
    } finally {
      setUpdatingContent(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await messagesService.syncEmails();
      message.success("Đồng bộ email thành công.");
      await onRefresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Đã xảy ra lỗi không mong muốn.";
      message.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card extra="p-6 flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <div className="flex rounded-xl p-3 lg:w-56 lg:items-center lg:justify-center">
          <div className="relative flex items-center justify-center p-2">
            {/* SVG Progress Ring */}
            <svg
              className="absolute h-full w-full -rotate-90 transform"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="dark:text-navy-700 text-gray-100"
              />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="289"
                strokeDashoffset={289 * (1 - progress / 100)}
                strokeLinecap="round"
                className="text-brand-500 transition-all duration-150 ease-linear"
              />
            </svg>

            <div className="text-brand-500 bg-lightPrimary dark:bg-navy-700! relative flex items-center justify-center rounded-full p-6.5 text-5xl font-bold dark:text-white">
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
                />
                <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383zm.653.757c-.757.653-1.153 1.44-1.153 2.056v.448l-.445.049C2.064 6.805 1 7.952 1 9.318 1 10.785 2.23 12 3.781 12h8.906C13.98 12 15 10.988 15 9.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 4.825 10.328 3 8 3a4.53 4.53 0 0 0-2.941 1.1z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="dark:bg-navy-800! flex h-full flex-1 flex-col rounded-xl bg-white px-6">
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <MdAutorenew className="text-brand-500 h-5 w-5 shrink-0" />
              <h3 className="text-navy-700 text-xl font-bold dark:text-white">
                Đồng bộ tự động
              </h3>
            </div>
          </div>
          <p className="mt-6 text-base text-gray-600 dark:text-gray-400">
            Tối ưu hóa luồng công việc với khả năng{" "}
            <strong>đồng bộ dữ liệu mỗi phút</strong>. Hệ thống tự động quét và
            gán nhãn email thông minh theo nghiệp vụ.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Đồng bộ lần cuối:
            </span>
            <span className="text-navy-700 text-base font-medium dark:text-white">
              {dataLoading
                ? "Đang tải..."
                : formatLastPullAt(
                    virtualLastSyncTime
                      ? new Date(virtualLastSyncTime).toISOString()
                      : undefined,
                  )}{" "}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({secondsLeft}s)
              </span>
            </span>

          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                Đồng bộ nội dung
                <Tooltip label="Cho phép hệ thống lưu nội dung chi tiết email, giúp truy cập xem nhanh trên portal mà không cần mở Gmail, đảm bảo bảo mật bằng thuật toán mã hóa AES-256-CBC.">
                  <MdInfoOutline className="h-4 w-4 cursor-help text-gray-400 transition-colors hover:text-gray-600" />
                </Tooltip>
                :
              </span>
            </div>
            <Switch
              checked={canSaveContent}
              disabled={updatingContent}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleToggleContent(e.target.checked)
              }
            />
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-brand-500 hover:bg-brand-600 mt-3 flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
          >
            {syncing ? "Đang đồng bộ..." : "Đồng bộ ngay"}
          </button>
        </div>
      </div>
    </Card>
  );
};

export default SyncCard;
