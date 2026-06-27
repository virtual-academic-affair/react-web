import { ChatbotThreadToolbar } from "@/pages/chatbot/components/ChatbotThreadToolbar";

import ChatbotSidebarShell from "./components/ChatbotSidebarShell";

type ChatbotSidebarProps = {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function ChatbotSidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: ChatbotSidebarProps) {
  return (
    <ChatbotSidebarShell
      open={open}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      onClose={onClose}
    >
      <ChatbotThreadToolbar onNavigate={onClose} collapsed={collapsed} />
    </ChatbotSidebarShell>
  );
}
