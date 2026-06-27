import logoOnly from "@/assets/img/logo/logo-only.svg";
import Card from "@/components/card";
import { UserMenu } from "@/components/navbar/UserMenu";
import Tooltip from "@/components/tooltip/Tooltip";
import {
  assistantActionButtonClass,
  assistantActionIconClass,
  assistantActionIconStroke,
} from "@/pages/chatbot/assistantActionButton";
import type { ReactNode } from "react";
import { LuPanelLeftClose, LuPanelLeftOpen, LuX } from "react-icons/lu";

const collapsedMainCardClass =
  "flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0! bg-transparent! shadow-none! dark:bg-transparent! dark:shadow-none!";

const expandedMainCardClass =
  "flex min-h-0 flex-1 flex-col overflow-hidden !rounded-[30px] border-0!";

const collapsedFooterCardClass =
  "rounded-none border-0! bg-transparent! px-0 py-1 shadow-none! dark:bg-transparent! dark:shadow-none!";

const expandedFooterCardClass =
  "shrink-0 overflow-visible !rounded-[30px] border-0! px-2 py-2";

export type AppSidebarLayoutProps = {
  children: ReactNode;
  footer?: ReactNode;
  collapsed?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
  headerActions?: ReactNode;
};

function SidebarHeader({
  collapsed,
  onClose,
  onToggleCollapse,
  headerActions,
}: Pick<
  AppSidebarLayoutProps,
  "collapsed" | "onClose" | "onToggleCollapse" | "headerActions"
>) {
  if (collapsed) {
    return (
      <div className="flex w-full shrink-0 justify-center px-0 py-2">
        <Tooltip label="Mở rộng" placement="right">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`${assistantActionButtonClass} group relative shrink-0`}
            aria-label="Mở rộng"
          >
            <img
              src={logoOnly}
              alt=""
              className="h-5 w-5 object-contain transition-opacity group-hover:opacity-0"
            />
            <LuPanelLeftOpen
              className={`${assistantActionIconClass} absolute opacity-0 transition-opacity group-hover:opacity-100`}
              strokeWidth={assistantActionIconStroke}
              aria-hidden
            />
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2 py-2 pl-[22px] pr-3">
      <img
        src={logoOnly}
        alt=""
        className="h-5 w-5 shrink-0 object-contain"
      />
      <span className="text-navy-700 min-w-0 flex-1 truncate text-left text-sm leading-tight font-medium dark:text-white">
        Giáo vụ số
      </span>
      {headerActions}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className={`${assistantActionButtonClass} shrink-0 lg:hidden`}
          aria-label="Đóng menu"
        >
          <LuX
            className={assistantActionIconClass}
            strokeWidth={assistantActionIconStroke}
            aria-hidden
          />
        </button>
      ) : null}
      {onToggleCollapse ? (
        <Tooltip label="Thu gọn" placement="right">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`${assistantActionButtonClass} hidden shrink-0 lg:flex`}
            aria-label="Thu gọn"
          >
            <LuPanelLeftClose
              className={assistantActionIconClass}
              strokeWidth={assistantActionIconStroke}
              aria-hidden
            />
          </button>
        </Tooltip>
      ) : null}
    </div>
  );
}

/** Sidebar chuẩn: card nội dung (logo + children) + card avatar phía dưới. */
export function AppSidebarLayout({
  children,
  footer,
  collapsed = false,
  onClose,
  onToggleCollapse,
  headerActions,
}: AppSidebarLayoutProps) {
  return (
    <div
      className={`flex h-full min-h-0 w-full flex-col ${
        collapsed ? "gap-1" : "gap-2"
      }`}
    >
      <Card
        extra={`${
          collapsed ? collapsedMainCardClass : expandedMainCardClass
        } transition-[border-radius,background-color,box-shadow] duration-300 ease-in-out`}
      >
        <SidebarHeader
          collapsed={collapsed}
          onClose={onClose}
          onToggleCollapse={onToggleCollapse}
          headerActions={headerActions}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </Card>

      <Card
        extra={`${
          collapsed ? collapsedFooterCardClass : expandedFooterCardClass
        } transition-[border-radius,background-color,box-shadow] duration-300 ease-in-out`}
      >
        <div className={collapsed ? "flex w-full justify-center" : undefined}>
          {footer ?? <UserMenu variant="sidebar" collapsed={collapsed} />}
        </div>
      </Card>
    </div>
  );
}
