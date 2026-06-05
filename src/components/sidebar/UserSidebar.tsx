/**
 * UserSidebar – Simplified sidebar for non-admin users.
 * Shows a list of flat navigation links, dark mode toggle, and user profile
 * with logout. Re-uses the same Card component and visual rhythm as the admin
 * Sidebar so the two experiences feel unified.
 */

import Card from "@/components/card";
import Dropdown from "@/components/dropdown";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/stores/auth.store";
import type { UserInfo } from "@/utils/auth.util";
import React, { useEffect, useState } from "react";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiMoonFill,
  RiSunFill,
} from "react-icons/ri";
import { Link, useLocation, useNavigate } from "react-router-dom";
import userRoutes from "@/userRoutes";

// ── Props ─────────────────────────────────────────────────────────────────────

interface UserSidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onShowChatbotPanel?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const UserSidebar: React.FC<UserSidebarProps> = ({
  open,
  collapsed,
  onToggleCollapse,
  onShowChatbotPanel,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [userInfo, setUserInfo] = useState<UserInfo>({});

  useEffect(() => {
    authService
      .getMe()
      .then(setUserInfo)
      .catch(() => {});
  }, []);

  const { name: userName, picture: avatarUrl, email: userEmail } = userInfo;

  const [darkmode, setDarkmode] = useState(
    document.body.classList.contains("dark"),
  );

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      clearAuth();
      navigate("/auth/login", { replace: true });
    }
  };

  const routeHref = (route: RoutesType) =>
    `${route.layout}/${route.path}`.replace(/\/+/g, "/");

  const isActive = (route: RoutesType) => {
    const href = routeHref(route);
    return (
      location.pathname === href || location.pathname.startsWith(`${href}/`)
    );
  };

  return (
    <div
      className={`sm:none fixed top-5 bottom-5 left-5 z-50! flex flex-col gap-4 transition-all duration-300 lg:z-0! ${
        open ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
      } ${collapsed ? "w-[70px]" : "w-78.25"}`}
    >
      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        title={collapsed ? "Mở rộng" : "Thu gọn"}
        className="hover:text-brand-500 dark:border-navy-600 dark:bg-navy-800 dark:hover:bg-navy-700 absolute top-8 -right-3.5 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-md hover:bg-gray-50 dark:text-gray-300"
      >
        {collapsed ? (
          <RiArrowRightSLine className="h-4 w-4" />
        ) : (
          <RiArrowLeftSLine className="h-4 w-4" />
        )}
      </button>

      {/* Navigation links */}
      <Card extra="flex-1 overflow-hidden rounded-[30px] pb-4">
        <div className="h-full overflow-y-auto pt-6">
          <ul className={`mt-5 ${collapsed ? "px-2" : "px-4"}`}>
            {userRoutes.map((route, index) => {
              const active = isActive(route);
              const isChatbotRoute = route.path === "chatbot";
              return (
                <Link
                  key={index}
                  to={routeHref(route)}
                  onClick={(event) => {
                    if (!active || !isChatbotRoute || !onShowChatbotPanel) {
                      return;
                    }
                    event.preventDefault();
                    onShowChatbotPanel();
                  }}
                >
                  <div className="mb-4 flex hover:cursor-pointer">
                    <li
                      className={`my-0.75 flex cursor-pointer items-center py-0.5 ${
                        collapsed ? "w-full justify-center px-0" : "px-4"
                      }`}
                    >
                      <span
                        className={`inline-flex shrink-0 [&>svg]:h-5 [&>svg]:w-5 ${
                          active
                            ? "text-brand-500 dark:text-white"
                            : "font-medium text-gray-600"
                        }`}
                      >
                        {route.icon}
                      </span>
                      {!collapsed && (
                        <p
                          className={`ml-4 flex text-base leading-1 font-medium ${
                            active
                              ? "text-navy-700 dark:text-white"
                              : "text-gray-600"
                          }`}
                        >
                          {route.name}
                        </p>
                      )}
                    </li>
                  </div>
                </Link>
              );
            })}
          </ul>
        </div>
      </Card>

      {/* Bottom nav block – profile + dark mode */}
      <Card extra="rounded-[30px] px-3 py-3">
        <div
          className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}
        >
          {/* Avatar + name */}
          <Dropdown
            button={
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                    src={avatarUrl}
                    alt={userName ?? "profile"}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="bg-brand-500 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                    {userName?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                )}
                {!collapsed && (
                  <span className="text-navy-700 text-sm font-medium dark:text-white">
                    {userName ?? "Tài khoản"}
                  </span>
                )}
              </div>
            }
            children={
              <div className="shadow-shadow-500 dark:bg-navy-700! rounded-primary flex h-fit w-56 flex-col justify-start bg-white bg-cover bg-no-repeat pb-4 shadow-xl dark:text-white dark:shadow-none">
                <div className="mt-3 ml-4">
                  <p className="text-navy-700 font-bold dark:text-white">
                    {userName ?? "—"}
                  </p>
                  <p className="mt-1 text-sm font-normal text-gray-600 dark:text-gray-400">
                    {userEmail}
                  </p>
                </div>
                <div className="mt-3 h-px w-full bg-gray-200 dark:bg-white/20" />
                <div className="mt-3 ml-4 flex flex-col">
                  <button
                    onClick={handleLogout}
                    className="mt-3 cursor-pointer text-left text-sm font-medium text-red-500 hover:text-red-500"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            }
            classNames={"py-2 bottom-full mb-2 -left-[10px] w-max"}
            animation="origin-bottom-left transition-all duration-300 ease-in-out"
          />

          {/* Dark mode toggle */}
          {!collapsed && (
            <div className="flex items-center gap-3">
              <button
                className="dark:bg-navy-700 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:text-white"
                onClick={() => {
                  if (darkmode) {
                    document.body.classList.remove("dark");
                    localStorage.setItem("theme", "light");
                    setDarkmode(false);
                  } else {
                    document.body.classList.add("dark");
                    localStorage.setItem("theme", "dark");
                    setDarkmode(true);
                  }
                }}
              >
                {darkmode ? (
                  <RiSunFill className="h-4 w-4" />
                ) : (
                  <RiMoonFill className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UserSidebar;
