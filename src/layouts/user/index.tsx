/**
 * User Layout
 * Wraps all /user/* pages with Navbar and content area.
 * Simpler than AdminLayout — no sidebar, no heavy data fetch.
 */

import Navbar from "@/components/navbar";
import { useAuthStore } from "@/stores/auth.store";
import { getUserInfoFromToken } from "@/utils/auth.util";
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import UserDashboard from "@/pages/user";

const UserLayout: React.FC = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userInfo = React.useMemo(() => getUserInfoFromToken(accessToken), [accessToken]);

  return (
    <div className="flex min-h-full w-full">
      {/* Main content */}
      <div className="bg-lightPrimary dark:bg-navy-900! relative flex min-h-full w-full flex-col">
        {/* Navbar */}
        <div className="mx-auto w-[calc(100vw-6%)] md:w-[calc(100vw-8%)] lg:w-[calc(100vw-6%)]">
          <Navbar
            onOpenSidenav={() => {}}
            brandText="Trang chủ"
            avatarUrl={userInfo.picture}
            userName={userInfo.name}
          />
        </div>

        {/* Page content */}
        <div className="mx-auto mb-auto h-full min-h-[84vh] w-[calc(100vw-6%)] pt-5 md:w-[calc(100vw-8%)] lg:w-[calc(100vw-6%)]">
          <Routes>
            <Route path="dashboard" element={<UserDashboard />} />
            <Route
              path="/"
              element={<Navigate to="/user/dashboard" replace />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default UserLayout;
