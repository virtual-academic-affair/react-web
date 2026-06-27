import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import {
  MobileDrawerOverlay,
  ResponsiveDrawerShell,
} from "@/components/layouts/MobileDrawerLayout";

export type AppMobileLayoutShellProps = {
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  sidebar: ReactNode;
  children: ReactNode;
  preview?: ReactNode;
  previewOpen?: boolean;
  /** Inline sidebar on lg (chatbot). false = mobile drawer only (dashboard). */
  sidebarDesktop?: boolean;
};

/** Shared mobile drawer shell — slide animation + backdrop like chatbot. */
export function AppMobileLayoutShell({
  sidebarOpen,
  onCloseSidebar,
  sidebar,
  children,
  preview,
  previewOpen = false,
  sidebarDesktop = true,
}: AppMobileLayoutShellProps) {
  return (
    <ResponsiveDrawerShell
      open={sidebarOpen}
      onClose={onCloseSidebar}
      aside={preview}
      asideOpen={previewOpen}
      main={children}
      sidebarDesktop={sidebarDesktop}
    >
      {sidebar}
    </ResponsiveDrawerShell>
  );
}

type DashboardMobileLayoutProps = {
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  sidebar: ReactNode;
  children: ReactNode;
};

/**
 * Dashboard mobile nav — drawer portaled to body (above fixed navbar)
 * with slide animation. Desktop keeps top nav only.
 */
export function DashboardMobileLayout({
  sidebarOpen,
  onCloseSidebar,
  sidebar,
  children,
}: DashboardMobileLayoutProps) {
  const drawer =
    typeof document !== "undefined"
      ? createPortal(
          <MobileDrawerOverlay
            open={sidebarOpen}
            onClose={onCloseSidebar}
            ariaLabel="Menu điều hướng"
            variant="chatbot"
          >
            {sidebar}
          </MobileDrawerOverlay>,
          document.body,
        )
      : null;

  return (
    <>
      {drawer}
      <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </>
  );
}
