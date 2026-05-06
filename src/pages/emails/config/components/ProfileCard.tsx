import banner from "@/assets/img/auth/banner.png";
import { API_CONFIG, API_ENDPOINTS } from "@/config/api.config";
import { settingsService } from "@/services/shared";
import type { DynamicDataResponse } from "@/types/shared";
import { message as toast } from "antd";
import { useEffect, useRef, useState } from "react";

interface ProfileCardProps {
  data: DynamicDataResponse | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  data,
  loading,
  onRefresh,
}) => {
  const profile = data?.settings?.["email.superEmail"];

  const [showDropdown, setShowDropdown] = useState(false);
  const [granting, setGranting] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const handleGrant = async () => {
    setGranting(true);
    try {
      const url = new URL(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.auth.googleGmailGrant}`,
      );
      url.searchParams.set("state", API_CONFIG.appURL);
      window.location.href = url.toString();
    } catch {
      setGranting(false);
    }
  };

  const handleRevoke = async () => {
    if (
      !window.confirm(
        "Thu hồi sẽ ngắt kết nối Gmail và xóa cấu hình nhãn. Tiếp tục?",
      )
    ) {
      return;
    }
    setRevoking(true);
    try {
      await settingsService.remove("email.superEmail");
      await settingsService.remove("email.labels");
      await settingsService.remove("email.gmailHistoryId");
      await onRefresh();
      setShowDropdown(false);
      toast.success("Đã thu hồi tài khoản Gmail");
    } catch {
      toast.error("Không thể thu hồi tài khoản");
    } finally {
      setRevoking(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-primary shadow-3xl shadow-shadow-500 dark:bg-navy-800! relative z-5 flex w-full flex-col items-center bg-white bg-clip-border p-4 dark:text-white dark:shadow-none">
        <div className="dark:bg-navy-700! relative mt-1 flex h-32 w-full animate-pulse justify-center rounded-xl bg-gray-200" />
        <div className="dark:border-navy-700! absolute -bottom-12 flex h-[87px] w-[87px] animate-pulse items-center justify-center rounded-full border-4 border-white bg-gray-300" />
        <div className="mt-16 flex flex-col items-center gap-2">
          <div className="dark:bg-navy-700! h-6 w-40 animate-pulse rounded bg-gray-200" />
          <div className="dark:bg-navy-700! h-4 w-32 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="mt-6 mb-3 flex gap-4 md:gap-14!">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center gap-1"
            >
              <div className="dark:bg-navy-700! h-8 w-8 animate-pulse rounded bg-gray-200" />
              <div className="dark:bg-navy-700! h-3 w-12 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        {/* Banner */}
        <div
          className="relative mt-1 mb-20 flex h-82 w-full justify-center rounded-[40px] bg-cover bg-center"
          style={{
            backgroundImage: `url(${banner})`,
          }}
        >
          {/* Avatar with dropdown */}
          <div className="absolute -bottom-20" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="border-lightPrimary! dark:border-navy-900! flex h-40 w-40 cursor-pointer items-center justify-center rounded-full border-8 bg-gray-400 transition-all hover:bg-gray-500"
            >
              <span className="text-5xl font-bold text-white">?</span>
            </button>

            {showDropdown && (
              <button
                onClick={handleGrant}
                disabled={granting}
                className="text-navy-700 dark:hover:bg-navy-700 dark:border-navy-600 dark:bg-navy-800 absolute top-full left-1/2 z-50 mt-2 flex w-max -translate-x-1/2 cursor-pointer items-center gap-2 rounded-4xl bg-white px-4 py-2.5 text-sm font-medium shadow-xl transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white"
              >
                Kết nối tài khoản Gmail
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Banner */}
      <div
        className="relative mt-1 flex h-82 w-full justify-center rounded-[40px] bg-cover bg-center"
        style={{
          backgroundImage: `url(${banner})`,
        }}
      >
        {/* Avatar with dropdown */}
        <div className="absolute -bottom-20" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="border-lightPrimary! dark:border-navy-900! flex h-40 w-40 cursor-pointer items-center justify-center rounded-full border-8 bg-pink-400 transition-all"
          >
            {profile.picture ? (
              <img
                className="h-full w-full rounded-full object-cover"
                src={profile.picture}
                alt={profile.name}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-5xl font-bold text-white">
                {profile.name?.charAt(0) ?? "?"}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="dark:bg-navy-800 absolute top-full left-1/2 z-50 mt-2 flex w-max min-w-[200px] -translate-x-1/2 flex-col overflow-hidden rounded-3xl bg-white p-1 shadow-xl">
              <button
                type="button"
                onClick={handleGrant}
                disabled={granting || revoking}
                className="text-navy-700 dark:hover:bg-navy-700 rounded-full px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white"
              >
                Đổi tài khoản
              </button>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={granting || revoking}
                className="dark:hover:bg-navy-700 rounded-full px-4 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400"
              >
                {revoking ? "Đang thu hồi…" : "Thu hồi tài khoản"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Name & Role */}
      <div className="mt-24 flex flex-col items-center">
        <h4 className="text-navy-700 text-5xl font-bold dark:text-white">
          {profile.name}
        </h4>
        <p className="text-base font-normal text-gray-600 dark:text-gray-400">
          {profile.email}
        </p>
      </div>
    </div>
  );
};

export default ProfileCard;
