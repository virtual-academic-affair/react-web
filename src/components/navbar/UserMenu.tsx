import { useTheme } from "@/hooks/useTheme";
import { USER_PROFILE_QUERY_KEY, useUserProfile } from "@/hooks/useUserProfile";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/stores/auth.store";
import Tooltip from "@/components/tooltip/Tooltip";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdPerson, MdSettings } from "react-icons/md";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";

import {
  chatbotSidebarCollapsedNeutralIconClass,
  chatbotSidebarSettingsIconClass,
} from "@/pages/chatbot/assistantActionButton";

type UserMenuProps = {
  embedded?: boolean;
  variant?: "navbar" | "sidebar";
  collapsed?: boolean;
  trigger?: "avatar" | "label";
  label?: string;
  triggerClassName?: string;
  menuAlign?: "left" | "right";
};

const dropdownPanelClass =
  "dark:bg-navy-800 min-w-52 rounded-2xl border border-gray-100 bg-white p-2 shadow-lg dark:border-white/10";

export const dropdownMenuPanelClass = dropdownPanelClass;

const menuItemClass =
  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10";

export const dropdownMenuItemClass = menuItemClass;

export const dropdownMenuItemDangerClass =
  `${menuItemClass} text-red-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10`;

const HOVER_CLOSE_DELAY_MS = 120;

const getFirstName = (name?: string) => {
  const first = name?.trim().split(/\s+/)[0];
  return first || "—";
};

function UserAvatar({
  isLoadingUser,
  avatarUrl,
  userName,
  avatarInitial,
  className,
}: {
  isLoadingUser: boolean;
  avatarUrl?: string;
  userName?: string;
  avatarInitial: string;
  className: string;
}) {
  if (isLoadingUser) {
    return (
      <div className={`${className} animate-pulse bg-gray-200 dark:bg-white/10`} />
    );
  }
  if (avatarUrl) {
    return (
      <img
        className={`${className} object-cover`}
        src={avatarUrl}
        alt={userName ?? "profile"}
        referrerPolicy="no-referrer"
        loading="eager"
        decoding="async"
      />
    );
  }
  return (
    <div
      className={`bg-brand-500 flex items-center justify-center text-sm font-bold text-white ${className}`}
    >
      {avatarInitial}
    </div>
  );
}

export function UserMenu({
  embedded = false,
  variant = "navbar",
  collapsed = false,
  trigger = "avatar",
  label = "Tài khoản",
  triggerClassName,
  menuAlign = "right",
}: UserMenuProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { userInfo, isLoadingUser } = useUserProfile();
  const { darkmode, toggleDarkMode } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLButtonElement>(null);
  const portalMenuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sidebarMenuPos, setSidebarMenuPos] = useState<{
    bottom: number;
    left: number;
    minWidth: number;
  } | null>(null);

  const isSidebar = variant === "sidebar";
  const { name: userName, picture: avatarUrl, email: userEmail } = userInfo;
  const avatarInitial = getFirstName(userName).charAt(0)?.toUpperCase() ?? "?";

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleOpen = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const handleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, HOVER_CLOSE_DELAY_MS);
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (portalMenuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateSidebarMenuPos = () => {
    if (!settingsRef.current) return;
    const rect = settingsRef.current.getBoundingClientRect();
    setSidebarMenuPos({
      bottom: window.innerHeight - rect.top + 8,
      left: rect.left,
      minWidth: Math.max(rect.width, 208),
    });
  };

  useLayoutEffect(() => {
    if (!isSidebar || !open) {
      setSidebarMenuPos(null);
      return;
    }

    updateSidebarMenuPos();
    window.addEventListener("resize", updateSidebarMenuPos);
    window.addEventListener("scroll", updateSidebarMenuPos, true);
    return () => {
      window.removeEventListener("resize", updateSidebarMenuPos);
      window.removeEventListener("scroll", updateSidebarMenuPos, true);
    };
  }, [isSidebar, open, collapsed]);

  const handleLogout = async () => {
    setOpen(false);
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      queryClient.removeQueries({ queryKey: USER_PROFILE_QUERY_KEY });
      clearAuth();
      navigate("/auth/login", { replace: true });
    }
  };

  const avatarSizeClass = embedded
    ? "h-full w-full shrink-0 rounded-full"
    : isSidebar
      ? "h-9 w-9 shrink-0 rounded-full"
      : "h-9 w-9 shrink-0 rounded-full";

  const dropdownPositionClass = isSidebar
    ? "absolute bottom-full left-0 right-0 z-60 pb-2"
    : menuAlign === "left"
      ? "absolute top-full left-0 z-60 min-w-52 pt-3"
      : "absolute top-full right-0 z-60 min-w-52 pt-3";

  const avatarTriggerClass = embedded
    ? "flex h-full w-full shrink-0 items-center justify-center rounded-full"
    : "flex items-center rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-white/10";

  const labelTriggerClass =
    triggerClassName ??
    "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-navy-700 transition-colors hover:text-brand-500 dark:text-gray-200 dark:hover:text-white";

  const menuWrapperClass =
    trigger === "label"
      ? "relative shrink-0"
      : `relative shrink-0 ${embedded ? "h-full w-full" : ""}`;

  const dropdownContent = (
    <div className={dropdownPanelClass} role="menu">
      <div className="px-3 py-2">
        <p className="text-navy-700 text-sm font-medium dark:text-white">
          {userName ?? "—"}
        </p>
        {userEmail ? (
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
            {userEmail}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          toggleDarkMode();
        }}
        className={`${menuItemClass} justify-between`}
      >
        <span>Giao diện</span>
        {darkmode ? (
          <RiSunFill className="h-4 w-4 shrink-0" />
        ) : (
          <RiMoonFill className="h-4 w-4 shrink-0" />
        )}
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={handleLogout}
        className={`${menuItemClass} text-red-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10`}
      >
        Đăng xuất
      </button>
    </div>
  );

  if (isSidebar) {
    return (
      <div ref={menuRef} className="relative w-full">
        {collapsed ? (
          <div className="flex w-9 flex-col items-center gap-1.5 py-1">
            <Tooltip label="Cài đặt" placement="right">
              <button
                ref={settingsRef}
                type="button"
                onClick={() => setOpen((current) => !current)}
                className={chatbotSidebarCollapsedNeutralIconClass}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label="Cài đặt"
              >
                <MdSettings className="h-4 w-4" />
              </button>
            </Tooltip>
            <UserAvatar
              isLoadingUser={isLoadingUser}
              avatarUrl={avatarUrl}
              userName={userName}
              avatarInitial={avatarInitial}
              className={avatarSizeClass}
            />
          </div>
        ) : (
          <div className="flex w-full items-center gap-3 px-1 py-1">
            <UserAvatar
              isLoadingUser={isLoadingUser}
              avatarUrl={avatarUrl}
              userName={userName}
              avatarInitial={avatarInitial}
              className={avatarSizeClass}
            />
            <span className="text-navy-700 min-w-0 flex-1 truncate text-left text-sm font-medium dark:text-white">
              {isLoadingUser ? "—" : (userName ?? "—")}
            </span>
            <Tooltip label="Cài đặt" placement="top">
              <button
                ref={settingsRef}
                type="button"
                onClick={() => setOpen((current) => !current)}
                className={chatbotSidebarSettingsIconClass}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label="Cài đặt"
              >
                <MdSettings className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
        )}

        {open && sidebarMenuPos
          ? createPortal(
              <div
                ref={portalMenuRef}
                className="fixed z-99999"
                style={{
                  bottom: sidebarMenuPos.bottom,
                  left: sidebarMenuPos.left,
                  minWidth: sidebarMenuPos.minWidth,
                }}
              >
                {dropdownContent}
              </div>,
              document.body,
            )
          : null}
      </div>
    );
  }

  const triggerClass = trigger === "label" ? labelTriggerClass : avatarTriggerClass;

  return (
    <div
      ref={menuRef}
      className={menuWrapperClass}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <button
        type="button"
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={trigger === "label" ? label : (userName ?? "Tài khoản")}
        onClick={() => {
          if (window.matchMedia("(hover: none)").matches) {
            setOpen((current) => !current);
          }
        }}
      >
        {trigger === "label" ? (
          <>
            <span className="inline-flex shrink-0 [&>svg]:h-4 [&>svg]:w-4">
              <MdPerson className="h-4 w-4" aria-hidden />
            </span>
            <span>{label}</span>
          </>
        ) : (
          <UserAvatar
            isLoadingUser={isLoadingUser}
            avatarUrl={avatarUrl}
            userName={userName}
            avatarInitial={avatarInitial}
            className={avatarSizeClass}
          />
        )}
      </button>

      <div
        className={`${dropdownPositionClass} transition-opacity duration-150 ${
          open
            ? "pointer-events-auto visible opacity-100"
            : "pointer-events-none invisible opacity-0"
        }`}
      >
        {dropdownContent}
      </div>
    </div>
  );
}
