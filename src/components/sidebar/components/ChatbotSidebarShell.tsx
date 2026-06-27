import React from "react";

import { AppSidebarLayout } from "./AppSidebarLayout";

interface ChatbotSidebarShellProps {
  open: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  children: React.ReactNode;
}

const ChatbotSidebarShell: React.FC<ChatbotSidebarShellProps> = ({
  open,
  collapsed = false,
  onToggleCollapse,
  onClose,
  children,
}) => {
  return (
    <div
      data-open={open}
      className={`relative z-50! flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden bg-transparent transition-[width,max-width] duration-300 ease-in-out lg:z-0! lg:overflow-visible ${
        collapsed
          ? "w-[52px] max-w-[52px] p-0 lg:w-[52px] lg:max-w-[52px] lg:p-0"
          : "h-full w-full p-0 lg:w-[300px] lg:max-w-[300px] lg:p-0"
      }`}
    >
      <AppSidebarLayout
        collapsed={collapsed}
        onClose={onClose}
        onToggleCollapse={onToggleCollapse}
      >
        {children}
      </AppSidebarLayout>
    </div>
  );
};

export default ChatbotSidebarShell;
