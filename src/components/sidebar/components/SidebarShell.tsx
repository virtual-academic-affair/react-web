import Card from "@/components/card";
import Dropdown from "@/components/dropdown";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/stores/auth.store";
import type { UserInfo } from "@/utils/auth.util";
import React from "react";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiMoonFill,
  RiSunFill,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";

interface SidebarShellProps {
  open: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  contentMode?: "list" | "custom";
  children: React.ReactNode;
}

const SidebarShell: React.FC<SidebarShellProps> = ({
  open,
  collapsed = false,
  onToggleCollapse,
  contentMode = "list",
  children,
}) => {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [userInfo, setUserInfo] = React.useState<UserInfo>({});
  const [isLoadingUser, setIsLoadingUser] = React.useState(true);
  const [darkmode, setDarkmode] = React.useState(
    document.body.classList.contains("dark"),
  );

  React.useEffect(() => {
    authService
      .getMe()
      .then(setUserInfo)
      .catch(() => {})
      .finally(() => setIsLoadingUser(false));
  }, []);

  const { name: userName, picture: avatarUrl, email: userEmail } = userInfo;

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      clearAuth();
      // Hard redirect to clear in-memory states and stop background requests
      window.location.href = "/auth/login";
    }
  };

  const toggleDarkMode = () => {
    if (darkmode) {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkmode(false);
      return;
    }

    document.body.classList.add("dark");
    localStorage.setItem("theme", "dark");
    setDarkmode(true);
  };

  return (
    <div
      data-open={open}
      className={`bg-lightPrimary dark:bg-navy-900 relative z-50! flex h-dvh w-[80vw] shrink-0 flex-col gap-4 p-4 lg:fixed lg:inset-auto lg:top-5 lg:bottom-5 lg:left-5 lg:z-0! lg:h-auto lg:bg-transparent lg:p-0 lg:transition-[width] lg:duration-200 lg:ease-in-out lg:will-change-[width] lg:dark:bg-transparent ${
        collapsed ? "lg:w-[70px]" : "lg:w-78.25"
      }`}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        title={collapsed ? "Mở rộng" : "Thu gọn"}
        className="hover:text-brand-500 dark:border-navy-600 dark:bg-navy-800 dark:hover:bg-navy-700 absolute top-8 -right-3.5 z-10 hidden h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-md hover:bg-gray-50 lg:flex dark:text-gray-300"
      >
        {collapsed ? (
          <RiArrowRightSLine className="h-4 w-4" />
        ) : (
          <RiArrowLeftSLine className="h-4 w-4" />
        )}
      </button>

      <Card extra="flex-1 overflow-hidden rounded-[30px] pb-4">
        {contentMode === "list" ? (
          <div className="h-full overflow-x-hidden overflow-y-auto pt-6">
            <ul
              className={`mt-5 transition-[padding] duration-200 ease-in-out ${
                collapsed ? "px-2" : "px-4"
              }`}
            >
              {children}
            </ul>
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col overflow-hidden pt-6">
            {children}
          </div>
        )}
      </Card>

      <Card extra="rounded-[30px] px-3 py-3">
        <div
          className={`flex items-center transition-all duration-200 ease-in-out ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <Dropdown
            button={
              <div className="flex items-center gap-3">
                {isLoadingUser ? (
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                ) : avatarUrl ? (
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
                {!collapsed &&
                  (isLoadingUser ? (
                    <div className="h-3.5 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                  ) : (
                    <span className="text-navy-700 text-sm font-medium dark:text-white">
                      {userName ?? "—"}
                    </span>
                  ))}
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
                    type="button"
                    onClick={handleLogout}
                    className="mt-3 cursor-pointer text-left text-sm font-medium text-red-500 hover:text-red-500"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            }
            classNames="py-2 bottom-full mb-2 -left-[10px] w-max"
            animation="origin-bottom-left transition-all duration-200 ease-in-out"
          />

          {!collapsed && (
            <button
              type="button"
              aria-label={darkmode ? "Bật giao diện sáng" : "Bật giao diện tối"}
              className="dark:bg-navy-700 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:text-white"
              onClick={toggleDarkMode}
            >
              {darkmode ? (
                <RiSunFill className="h-4 w-4" />
              ) : (
                <RiMoonFill className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SidebarShell;
