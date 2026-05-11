/**
 * User Layout
 * Wraps all /user/* pages with UserSidebar, Navbar, and content area.
 * Mirrors the admin layout structure with collapsible sidebar support.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Navbar from "@/components/navbar";
import UserSidebar from "@/components/sidebar/UserSidebar";
import ChatbotPage from "@/pages/chatbot";
import FormsPage from "@/pages/documents/forms";
import UserDocumentsPage from "@/pages/user/documents";
import { useAuthStore } from "@/stores/auth.store";
import { getUserInfoFromToken } from "@/utils/auth.util";
import userRoutes from "@/userRoutes";

const UserLayout: React.FC = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userInfo = useMemo(
    () => getUserInfoFromToken(accessToken),
    [accessToken],
  );

  const [open, setOpen] = useState(() => window.innerWidth >= 1024);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setOpen(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const location = useLocation();

  const getActiveRoute = (): string => {
    for (const route of userRoutes) {
      const href = `${route.layout}/${route.path}`.replace(/\/+/g, "/");
      if (
        location.pathname === href ||
        location.pathname.startsWith(`${href}/`)
      ) {
        return route.name;
      }
    }
    return "Trang chủ";
  };

  return (
    <div className="bg-lightPrimary dark:bg-navy-900! flex min-h-screen w-full">
      <UserSidebar
        open={open}
        onClose={() => setOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      {/* Main content */}
      <div
        className={`relative flex min-h-screen w-full flex-col transition-all duration-300 ${
          collapsed ? "lg:ml-[100px]" : "lg:ml-[343px]"
        }`}
      >
        {/* Navbar */}
        <div
          className={`mx-auto w-[calc(100vw-6%)] transition-all duration-300 md:w-[calc(100vw-8%)] ${
            collapsed
              ? "lg:w-[calc(100vw-162px)]"
              : "lg:w-[calc(100vw-405px)]"
          }`}
        >
          <Navbar
            onOpenSidenav={() => setOpen(true)}
            brandText={getActiveRoute()}
            avatarUrl={userInfo.picture}
            userName={userInfo.name}
          />
        </div>

        {/* Page content */}
        <div
          className={`mx-auto mb-auto h-full min-h-[84vh] w-[calc(100vw-6%)] pt-5 transition-all duration-300 md:w-[calc(100vw-8%)] ${
            collapsed
              ? "lg:w-[calc(100vw-162px)]"
              : "lg:w-[calc(100vw-405px)]"
          }`}
        >
          <Routes>
            <Route path="/documents" element={<UserDocumentsPage />} />
            <Route path="/forms" element={<FormsPage isReadOnly />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route
              path="/"
              element={<Navigate to="/user/documents" replace />}
            />
            <Route
              path="*"
              element={<Navigate to="/user/documents" replace />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default UserLayout;
