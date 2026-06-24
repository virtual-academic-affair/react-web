import logoOnly from "@/assets/img/logo/logo-only.svg";
import Card from "@/components/card";
import { UserMenu } from "@/components/navbar/UserMenu";
import Tooltip from "@/components/tooltip/Tooltip";
import {
  assistantActionButtonClass,
  assistantActionIconClass,
  assistantActionIconStroke,
} from "@/pages/chatbot/assistantActionButton";
import React from "react";
import { LuPanelLeftClose, LuPanelLeftOpen } from "react-icons/lu";

interface ChatbotSidebarShellProps {
  open: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  children: React.ReactNode;
}

const collapsedCardClass =
  "flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0! bg-transparent! shadow-none! dark:bg-transparent! dark:shadow-none!";

const ChatbotSidebarShell: React.FC<ChatbotSidebarShellProps> = ({
  open,
  collapsed = false,
  onToggleCollapse,
  children,
}) => {
  return (
    <div
      data-open={open}
      className={`bg-lightPrimary dark:bg-navy-900 relative z-50! flex h-full min-h-0 shrink-0 flex-col overflow-hidden transition-[width,max-width] duration-300 ease-in-out lg:z-0! lg:overflow-visible lg:bg-transparent lg:dark:bg-transparent ${
        collapsed
          ? "w-[52px] max-w-[52px] p-0 lg:w-[52px] lg:max-w-[52px] lg:p-0"
          : "w-[80vw] max-w-[320px] p-4 lg:w-[300px] lg:max-w-[300px] lg:p-0"
      }`}
    >
      <div
        className={`flex h-full min-h-0 flex-col pb-3 lg:pb-4 ${
          collapsed ? "gap-1" : "gap-2"
        }`}
      >
        <Card
          extra={`${
            collapsed
              ? collapsedCardClass
              : "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px]"
          } transition-[border-radius,background-color,box-shadow] duration-300 ease-in-out`}
        >
          <div
            className={`flex shrink-0 items-center py-2 ${
              collapsed ? "px-0" : "gap-2 px-3"
            }`}
          >
            {collapsed ? (
              <div className="flex w-9 shrink-0 justify-center">
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
                    className="h-[22px] w-[22px] object-contain transition-opacity group-hover:opacity-0"
                  />
                  <LuPanelLeftOpen
                    className={`${assistantActionIconClass} absolute opacity-0 transition-opacity group-hover:opacity-100`}
                    strokeWidth={assistantActionIconStroke}
                    aria-hidden
                  />
                  </button>
                </Tooltip>
              </div>
            ) : (
              <>
                <img
                  src={logoOnly}
                  alt=""
                  className="h-6 w-6 shrink-0 object-contain"
                />
                <span className="text-navy-700 min-w-0 flex-1 truncate text-left text-base leading-tight font-medium dark:text-white">
                  Giáo vụ số
                </span>
                <Tooltip label="Thu gọn" placement="right">
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    className={`${assistantActionButtonClass} shrink-0`}
                    aria-label="Thu gọn"
                  >
                    <LuPanelLeftClose
                      className={assistantActionIconClass}
                      strokeWidth={assistantActionIconStroke}
                      aria-hidden
                    />
                  </button>
                </Tooltip>
              </>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </Card>

        <Card
          extra={`shrink-0 overflow-visible transition-[border-radius,background-color,box-shadow] duration-300 ease-in-out ${
            collapsed
              ? "rounded-none border-0! bg-transparent! px-0 py-1 shadow-none! dark:bg-transparent! dark:shadow-none!"
              : "rounded-[30px] px-2 py-2"
          }`}
        >
          <UserMenu variant="sidebar" collapsed={collapsed} />
        </Card>
      </div>
    </div>
  );
};

export default ChatbotSidebarShell;
