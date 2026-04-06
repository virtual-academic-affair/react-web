import banner from "@/assets/img/auth/banner.png";
import Card from "@/components/card";
import { grantsService } from "@/services/email";
import {
  dashboardService,
  type InquiryTodayStatsDto,
  type ResourceTodayStatsDto,
  type TaskTodayStatsDto,
} from "@/services/shared";
import { InquiryTypeColors } from "@/types/inquiry";
import type { DynamicDataResponse } from "@/types/shared";
import { setAuthCallbackFlow } from "@/utils/auth.util";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ProfileCardProps {
  data: DynamicDataResponse | null;
  loading: boolean;
}

function localTodayIsoBounds(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const to = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
  return { from: from.toISOString(), to: to.toISOString() };
}

const ProfileCard: React.FC<ProfileCardProps> = ({ data, loading }) => {
  const navigate = useNavigate();
  const profile = data?.settings?.["email.superEmail"];
  const hasProfile = Boolean(profile);

  const todayKey = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${n.getMonth() + 1}-${n.getDate()}`;
  })();

  const dashboardQuery = useQuery({
    queryKey: ["dashboard-today-summary", todayKey],
    queryFn: () => {
      const { from, to } = localTodayIsoBounds();
      return dashboardService.getTodaySummary({ from, to });
    },
    enabled: !loading && hasProfile,
    staleTime: 60 * 1000,
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const [granting, setGranting] = useState(false);
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
      setAuthCallbackFlow("gmail_grant");
      const url = await grantsService.getGmailAuthUrl();
      window.location.href = url;
    } catch {
      setGranting(false);
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

  const statTileShellClass =
    "focus-visible:ring-brand-500/60 flex min-h-[8.5rem] min-w-0 flex-1 flex-col items-stretch rounded-xl py-1.5 transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2";

  const statFooterSlotClass =
    "mt-2 flex min-h-[2.5rem] w-full max-w-30 shrink-0 flex-col justify-end self-center px-0.5";

  const openTotalTile = (
    block: ResourceTodayStatsDto | undefined,
    title: string,
    path: string,
  ) => {
    const a = String(block?.open ?? 0);
    const b = String(block?.totalToday ?? 0);
    return (
      <button
        type="button"
        onClick={() => navigate(path)}
        className={statTileShellClass}
      >
        <p className="shrink-0 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </p>
        <div className="mt-2 flex shrink-0 flex-col items-center">
          <div className="text-navy-700 flex flex-wrap items-baseline justify-center gap-x-1 tabular-nums dark:text-white">
            <span className="text-2xl font-bold">{a}</span>
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
              /
            </span>
            <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
              {b}
            </span>
          </div>
          <p className="text-center text-[11px] font-normal text-gray-500 dark:text-gray-400">
            Đang mở · Tổng hôm nay
          </p>
        </div>
        <div className={statFooterSlotClass} aria-hidden />
      </button>
    );
  };

  const taskTile = (
    block: TaskTodayStatsDto | undefined,
    title: string,
    path: string,
  ) => {
    const a = String(block?.todo ?? 0);
    const b = String(block?.totalToday ?? 0);
    return (
      <button
        type="button"
        onClick={() => navigate(path)}
        className={statTileShellClass}
      >
        <p className="shrink-0 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </p>
        <div className="mt-2 flex shrink-0 flex-col items-center">
          <div className="text-navy-700 flex flex-wrap items-baseline justify-center gap-x-1 tabular-nums dark:text-white">
            <span className="text-2xl font-bold">{a}</span>
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
              /
            </span>
            <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
              {b}
            </span>
          </div>
          <p className="text-center text-[11px] font-normal text-gray-500 dark:text-gray-400">
            Cần làm · Tổng hôm nay
          </p>
        </div>
        <div className={statFooterSlotClass} aria-hidden />
      </button>
    );
  };

  const inquiryTile = (
    block: InquiryTodayStatsDto | undefined,
    title: string,
    path: string,
  ) => {
    const totalStr = String(block?.totalToday ?? 0);
    const train = block?.trainingToday ?? 0;
    const grad = block?.graduationToday ?? 0;
    const typeSum = train + grad;
    const trainPct = typeSum > 0 ? (train / typeSum) * 100 : 0;
    const gradPct = typeSum > 0 ? (grad / typeSum) * 100 : 0;

    return (
      <button
        type="button"
        onClick={() => navigate(path)}
        className={statTileShellClass}
      >
        <p className="shrink-0 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </p>
        <div className="mt-2 flex shrink-0 flex-col items-center">
          <p className="text-navy-700 text-2xl font-bold tabular-nums dark:text-white">
            {totalStr}
          </p>
          <p className="text-center text-[11px] font-normal text-gray-500 dark:text-gray-400">
            Tổng hôm nay
          </p>
        </div>
        <div className={statFooterSlotClass}>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/15">
            {typeSum > 0 ? (
              <>
                <div
                  className="h-full min-w-0 transition-[width]"
                  style={{
                    width: `${trainPct}%`,
                    backgroundColor: InquiryTypeColors.training.hex,
                  }}
                  title={`Đào tạo: ${train}`}
                />
                <div
                  className="h-full min-w-0 transition-[width]"
                  style={{
                    width: `${gradPct}%`,
                    backgroundColor: InquiryTypeColors.graduation.hex,
                  }}
                  title={`Tốt nghiệp: ${grad}`}
                />
              </>
            ) : null}
          </div>
          <p className="mt-1 text-center text-[10px] leading-tight text-gray-500 dark:text-gray-400">
            <span style={{ color: InquiryTypeColors.training.hex }}>
              Đào tạo
            </span>
            {" · "}
            <span style={{ color: InquiryTypeColors.graduation.hex }}>
              Tốt nghiệp
            </span>
          </p>
        </div>
      </button>
    );
  };

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
            <button
              onClick={handleGrant}
              disabled={granting}
              className="text-navy-700 dark:hover:bg-navy-700 dark:border-navy-600 dark:bg-navy-800 absolute top-full left-1/2 z-50 mt-2 flex w-max -translate-x-1/2 cursor-pointer items-center gap-2 rounded-4xl bg-white px-4 py-2.5 text-sm font-medium shadow-xl transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white"
            >
              Đổi tài khoản
            </button>
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

      {/* Stats card */}
      <div className="mt-10 mb-3 flex w-full justify-center">
        <Card extra="w-full max-w-[700px] px-8 py-5">
          <div className="flex items-stretch justify-center gap-4 px-2 sm:gap-8 md:gap-12">
            {openTotalTile(
              dashboardQuery.data?.classRegistrations,
              "Đăng ký lớp",
              "/admin/class-registration/statistics",
            )}
            <div className="w-px shrink-0 self-stretch bg-gray-200 dark:bg-white/20" />
            {taskTile(
              dashboardQuery.data?.tasks,
              "Công tác",
              "/admin/tasks/statistics",
            )}
            <div className="w-px shrink-0 self-stretch bg-gray-200 dark:bg-white/20" />
            {inquiryTile(
              dashboardQuery.data?.inquiries,
              "Thắc mắc",
              "/admin/inquiry/statistics",
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfileCard;
