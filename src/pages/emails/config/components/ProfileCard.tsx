import { grantsService } from "@/services/email";
import banner from "@/assets/img/auth/banner.png";
import Card from "@/components/card";
import type { DynamicDataResponse } from "@/types/shared";
import { useEffect, useRef, useState } from "react";
import { MdEmail } from "react-icons/md";


interface ProfileCardProps {
  data: DynamicDataResponse | null;
  loading: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ data, loading }) => {
  const profile = data?.settings?.["email.superEmail"];
  const lastPullAt = data?.settings?.["email.lastPullAt"];
  const labels = data?.settings?.["email.labels"];

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
      <div className="rounded-primary shadow-3xl shadow-shadow-500 dark:bg-navy-800! relative z-5 flex w-full flex-col items-center bg-white bg-clip-border p-6 dark:text-white dark:shadow-none">
        <p className="text-gray-500 dark:text-gray-400">
          No profile data available.
        </p>
      </div>
    );
  }

  const labelCount = Array.isArray(labels) ? labels.length : 0;

  return (
    <div>
      {/* Banner */}
      <div
        className="relative mt-1 flex h-52 w-full justify-center rounded-[40px] bg-cover bg-center"
        style={{
          backgroundImage: `url(${banner})`,
        }}
      >
        {/* Avatar with dropdown */}
        <div className="absolute -bottom-12" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="flex h-[87px] w-[87px] items-center justify-center rounded-full border-4 border-white bg-pink-400 transition-shadow hover:shadow-lg hover:ring-2 hover:ring-[#422afb] focus:outline-none dark:border-navy-700!"
          >
            {profile.picture ? (
              <img
                className="h-full w-full rounded-full object-cover"
                src={profile.picture}
                alt={profile.name}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-3xl font-bold text-white">
                {profile.name?.charAt(0) ?? "?"}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-navy-600 dark:bg-navy-800">
              <button
                onClick={handleGrant}
                disabled={granting}
                className="flex w-max items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-navy-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:hover:bg-navy-700"
              >
                {granting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500" />
                ) : (
                  <MdEmail className="text-brand-500 text-lg" />
                )}
                Grant Email Access
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Name & Role */}
      <div className="mt-16 flex flex-col items-center">
        <h4 className="text-navy-700 text-5xl font-bold dark:text-white">
          {profile.name}
        </h4>
        <p className="text-base font-normal text-gray-600 dark:text-gray-400">
          {profile.email}
        </p>
      </div>

      {/* Stats card */}
      <div className="mt-10 mb-3 flex w-full justify-center">
        <Card extra="w-full max-w-[640px] px-8 py-5">
          <div className="flex items-stretch justify-center gap-8 px-4 md:gap-12 lg:gap-16">
        <div className="flex flex-col items-center justify-center">
          <p className="text-navy-700 text-2xl font-bold dark:text-white">
            {labelCount}
          </p>
          <p className="text-sm font-normal text-gray-600 dark:text-gray-400">
            Email nhận
          </p>
        </div>
            <div className="h-10 w-px self-center bg-gray-200 dark:bg-white/20" />
        <div className="flex flex-col items-center justify-center">
          <p className="text-navy-700 text-2xl font-bold dark:text-white">
            18K
          </p>
          <p className="text-sm font-normal text-gray-600 dark:text-gray-400">
            Email xử lý tự động
          </p>
        </div>
            <div className="h-10 w-px self-center bg-gray-200 dark:bg-white/20" />
        <div className="flex flex-col items-center justify-center">
          <p className="text-navy-700 text-2xl font-bold dark:text-white">
            {lastPullAt ? "1" : "0"}
          </p>
          <p className="text-sm font-normal text-gray-600 dark:text-gray-400">
            Lần đồng bộ
          </p>
        </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfileCard;
