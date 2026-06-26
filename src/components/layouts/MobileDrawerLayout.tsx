import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import {
  CHATBOT_MOBILE_DRAWER_PANEL_CLASS,
  MOBILE_DRAWER_BACKDROP_CLASS,
  MOBILE_DRAWER_PANEL_CLASS,
} from "@/constants/mobileLayout";

type MobileDrawerBackdropProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileDrawerBackdrop({
  open,
  onClose,
}: MobileDrawerBackdropProps) {
  return (
    <div
      role="presentation"
      onClick={open ? onClose : undefined}
      className={`${MOBILE_DRAWER_BACKDROP_CLASS} ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    />
  );
}

type MobileDrawerPanelProps = {
  open: boolean;
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
  variant?: "default" | "chatbot";
};

/** Fixed left drawer panel (mobile only). */
export function MobileDrawerPanel({
  open,
  children,
  ariaLabel,
  className,
  variant = "default",
}: MobileDrawerPanelProps) {
  const surfaceClass =
    variant === "chatbot"
      ? CHATBOT_MOBILE_DRAWER_PANEL_CLASS
      : MOBILE_DRAWER_PANEL_CLASS;

  return (
    <div
      role={ariaLabel ? "navigation" : undefined}
      aria-label={ariaLabel}
      aria-hidden={!open}
      className={`fixed inset-y-0 left-0 z-[101] flex h-dvh transition-transform duration-200 ease-in-out lg:hidden ${surfaceClass} ${
        open ? "translate-x-0" : "pointer-events-none -translate-x-full"
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

type MobileDrawerOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel?: string;
  panelClassName?: string;
  variant?: "default" | "chatbot";
};

/** Backdrop + sliding panel. Stays mounted for open/close animation. */
export function MobileDrawerOverlay({
  open,
  onClose,
  children,
  ariaLabel,
  panelClassName,
  variant = "default",
}: MobileDrawerOverlayProps) {
  return (
    <>
      <MobileDrawerBackdrop open={open} onClose={onClose} />
      <MobileDrawerPanel
        open={open}
        ariaLabel={ariaLabel}
        className={panelClassName}
        variant={variant}
      >
        {children}
      </MobileDrawerPanel>
    </>
  );
}

type MobileDrawerPortalProps = MobileDrawerOverlayProps;

/** Portal overlay drawer (e.g. TopNavbar) — only mounts while open. */
export function MobileDrawerPortal({
  open,
  onClose,
  children,
  ariaLabel,
  panelClassName,
  variant = "default",
}: MobileDrawerPortalProps) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <MobileDrawerOverlay
      open={open}
      onClose={onClose}
      ariaLabel={ariaLabel}
      panelClassName={panelClassName}
      variant={variant}
    >
      {children}
    </MobileDrawerOverlay>,
    document.body,
  );
}

type ResponsiveDrawerShellProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  main: ReactNode;
  /** Extra nodes rendered beside main (e.g. source preview). */
  aside?: ReactNode;
  asideOpen?: boolean;
  /** Inline sidebar on lg (chatbot). false = mobile drawer only (dashboard). */
  sidebarDesktop?: boolean;
};

/**
 * Chatbot-style shell: mobile drawer sidebar + full-width main.
 * Desktop: sidebar inline, no overlay.
 */
export function ResponsiveDrawerShell({
  open,
  onClose,
  children,
  main,
  aside,
  asideOpen = false,
  sidebarDesktop = true,
}: ResponsiveDrawerShellProps) {
  const sidebarPanelClass = sidebarDesktop
    ? "lg:pointer-events-auto lg:relative lg:z-0 lg:h-full lg:w-auto lg:translate-x-0"
    : "lg:hidden";

  return (
    <div className="relative flex min-h-0 w-full flex-1 overflow-hidden">
      <MobileDrawerBackdrop open={open} onClose={onClose} />

      <div
        className={`fixed inset-y-0 left-0 z-[101] flex h-dvh shrink-0 transition-transform duration-200 ease-in-out ${sidebarPanelClass} ${CHATBOT_MOBILE_DRAWER_PANEL_CLASS} ${
          open ? "translate-x-0" : "pointer-events-none -translate-x-full"
        }`}
      >
        {children}
      </div>

      <div
        data-source-preview-row
        className="relative flex h-full min-h-0 min-w-0 flex-1 flex-row overflow-hidden"
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {main}
        </div>

        {asideOpen ? (
          <div className="fixed inset-0 z-[110] flex lg:relative lg:inset-auto lg:z-20 lg:flex">
            {aside}
          </div>
        ) : (
          <div className="hidden lg:flex">{aside}</div>
        )}
      </div>
    </div>
  );
}
