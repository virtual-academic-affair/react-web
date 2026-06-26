import { MOBILE_MENU_BUTTON_CLASS, MOBILE_MENU_BUTTON_POSITION_CLASS } from "@/constants/mobileLayout";
import { FiMenu } from "react-icons/fi";

import { useChatbotLayout } from "../chatbotLayoutContext";

export function ChatbotMobileMenuButton() {
  const { onToggleSidebar, sidebarOpen } = useChatbotLayout();

  if (!onToggleSidebar || sidebarOpen) return null;

  return (
    <button
      type="button"
      onClick={onToggleSidebar}
      className={`${MOBILE_MENU_BUTTON_POSITION_CLASS} ${MOBILE_MENU_BUTTON_CLASS}`}
      aria-label="Mở menu"
    >
      <FiMenu className="h-5 w-5" />
    </button>
  );
}
