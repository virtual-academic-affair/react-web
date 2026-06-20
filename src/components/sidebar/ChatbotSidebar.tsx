import { ChatbotThreadToolbar } from "@/pages/chatbot/components/ChatbotThreadToolbar";

import SidebarShell from "./components/SidebarShell";

type ChatbotSidebarProps = {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onShowMenu: () => void;
};

export function ChatbotSidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
  onShowMenu,
}: ChatbotSidebarProps) {
  return (
    <SidebarShell
      open={open}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      contentMode="custom"
    >
      <ChatbotThreadToolbar
        onNavigate={onClose}
        onShowMenu={onShowMenu}
        collapsed={collapsed}
      />
    </SidebarShell>
  );
}
