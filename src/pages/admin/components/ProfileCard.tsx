import Card from "@/components/card";
import type { DynamicDataResponse } from "@/types/shared";
import { MdAccessTime, MdEmail } from "react-icons/md";

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

export default ProfileCard;
