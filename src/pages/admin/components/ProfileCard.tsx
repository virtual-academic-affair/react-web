import type { DynamicDataResponse } from "@/types/shared";

export function formatDate(iso: string | undefined): string {
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

interface ProfileCardProps {
  data: DynamicDataResponse | null;
  loading: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ data, loading }) => {
  const profile = data?.settings?.["email.superEmail"];
  const lastPullAt = data?.settings?.["email.lastPullAt"];
  const labels = data?.settings?.["email.labels"];

  if (loading) {
    return (
      <div className="z-5 relative flex w-full flex-col items-center rounded-[20px] bg-white bg-clip-border p-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none">
        <div className="relative mt-1 flex h-32 w-full justify-center rounded-xl bg-gray-200 dark:!bg-navy-700 animate-pulse" />
        <div className="absolute -bottom-12 flex h-[87px] w-[87px] items-center justify-center rounded-full border-4 border-white bg-gray-300 dark:!border-navy-700 animate-pulse" />
        <div className="mt-16 flex flex-col items-center gap-2">
          <div className="h-6 w-40 rounded bg-gray-200 dark:!bg-navy-700 animate-pulse" />
          <div className="h-4 w-32 rounded bg-gray-200 dark:!bg-navy-700 animate-pulse" />
        </div>
        <div className="mt-6 mb-3 flex gap-4 md:!gap-14">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center justify-center gap-1">
              <div className="h-8 w-8 rounded bg-gray-200 dark:!bg-navy-700 animate-pulse" />
              <div className="h-3 w-12 rounded bg-gray-200 dark:!bg-navy-700 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="z-5 relative flex w-full flex-col items-center rounded-[20px] bg-white bg-clip-border p-6 shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none">
        <p className="text-gray-500 dark:text-gray-400">
          No profile data available.
        </p>
      </div>
    );
  }

  const labelCount = Array.isArray(labels) ? labels.length : 0;

  return (
    <div className="z-5 relative flex w-full flex-col items-center rounded-[20px] bg-white bg-clip-border p-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none">
      {/* Banner */}
      <div
        className="relative mt-1 flex h-32 w-full justify-center rounded-xl bg-cover"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80')",
        }}
      >
        {/* Avatar */}
        <div className="absolute -bottom-12 flex h-[87px] w-[87px] items-center justify-center rounded-full border-4 border-white bg-pink-400 dark:!border-navy-700">
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
        </div>
      </div>

      {/* Name & Role */}
      <div className="mt-16 flex flex-col items-center">
        <h4 className="text-xl font-bold text-navy-700 dark:text-white">
          {profile.name}
        </h4>
        <p className="text-base font-normal text-gray-600 dark:text-gray-400">
          {profile.email}
        </p>
      </div>

      {/* Stats */}
      <div className="mt-6 mb-3 flex gap-4 md:!gap-14">
        <div className="flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-navy-700 dark:text-white">
            {labelCount}
          </p>
          <p className="text-sm font-normal text-gray-600 dark:text-gray-400">
            Email nhận
          </p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-navy-700 dark:text-white">18K</p>
          <p className="text-sm font-normal text-gray-600 dark:text-gray-400">
            Email xử lý tự động
          </p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-navy-700 dark:text-white">
            {lastPullAt ? "1" : "0"}
          </p>
          <p className="text-sm font-normal text-gray-600 dark:text-gray-400">
            Lần đồng bộ
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
