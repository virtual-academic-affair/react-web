/**
 * User Layout
 * Wraps all /user/* pages with Navbar and content area.
 */

import Navbar from "@/components/navbar";
import { useAuthStore } from "@/stores/auth.store";
import { getUserInfoFromToken } from "@/utils/auth.util";
import React from "react";
import { Route, Routes } from "react-router-dom";

const UserLayout: React.FC = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userInfo = React.useMemo(() => getUserInfoFromToken(accessToken), [accessToken]);

  return (
    <div className="flex min-h-full w-full">
      <div className="bg-lightPrimary dark:bg-navy-900! relative flex min-h-full w-full flex-col">
        <div className="mx-auto w-[calc(100vw-6%)] md:w-[calc(100vw-8%)] lg:w-[calc(100vw-6%)]">
          <Navbar
            onOpenSidenav={() => {}}
            brandText="Trang chủ"
            avatarUrl={userInfo.picture}
            userName={userInfo.name}
          />
        </div>

        <div className="relative h-full min-h-[calc(100vh-64px)] w-full">
          <Routes>
            <Route path="/" element={<div className="p-6 text-white">Trang người dùng</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default UserLayout;
