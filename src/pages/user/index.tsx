/**
 * User Dashboard Page
 * Landing page for non-admin users (students, lectures).
 */

import Card from "@/components/card";
import { useAuthStore } from "@/stores/auth.store";
import { getUserInfoFromToken } from "@/utils/auth.util";
import React from "react";
import { RoleLabels } from "@/types/users";
import type { Role } from "@/types/users";
import { MdSchool, MdPerson } from "react-icons/md";

const UserDashboard: React.FC = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userRole = useAuthStore((s) => s.userRole);
  const userInfo = React.useMemo(() => getUserInfoFromToken(accessToken), [accessToken]);

  return (
    <div className="flex flex-col gap-5">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-navy-700 text-2xl font-bold dark:text-white">
          Xin chào, {userInfo?.name ?? "bạn"} 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Chào mừng bạn đến với hệ thống quản lý học vụ
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {/* Profile Card */}
        <Card extra="w-full p-6">
          <div className="flex items-center gap-4">
            {userInfo?.picture ? (
              <img
                className="h-16 w-16 rounded-full object-cover"
                src={userInfo.picture}
                alt={userInfo.name ?? "avatar"}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="bg-brand-500 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white">
                <MdPerson className="h-8 w-8" />
              </div>
            )}
            <div>
              <h3 className="text-navy-700 text-lg font-bold dark:text-white">
                {userInfo?.name ?? "—"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {userInfo?.email ?? "—"}
              </p>
              {userRole && (
                <span className="mt-1 inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-800">
                  {RoleLabels[userRole as Role]}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Quick Info Card */}
        <Card extra="w-full p-6">
          <div className="flex items-center gap-4">
            <div className="bg-brand-100 dark:bg-navy-700 flex h-16 w-16 items-center justify-center rounded-full">
              <MdSchool className="text-brand-500 h-8 w-8" />
            </div>
            <div>
              <h3 className="text-navy-700 text-lg font-bold dark:text-white">
                Hệ thống học vụ
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tra cứu thông tin và đăng ký lớp học
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Placeholder content */}
      <Card extra="w-full p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MdSchool className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
          <h2 className="text-navy-700 mb-2 text-xl font-bold dark:text-white">
            Chào mừng đến trang người dùng
          </h2>
          <p className="max-w-md text-gray-500 dark:text-gray-400">
            Trang này đang được phát triển. Các tính năng tra cứu thông tin,
            đăng ký lớp học và quản lý hồ sơ cá nhân sẽ sớm được cập nhật.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default UserDashboard;
