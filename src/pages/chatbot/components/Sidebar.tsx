import React from "react";
import { MdAdd, MdClose, MdOutlineChatBubbleOutline } from "react-icons/md";
import type { ChatConversationItem } from "../types";

interface SidebarProps {
  open: boolean;
  activeTitle: string;
  conversations: ChatConversationItem[];
  onNewChat: () => void;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  open,
  activeTitle,
  conversations,
  onNewChat,
  onClose,
}) => {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-[280px] transform border-r border-gray-200/80 bg-white/95 p-4 backdrop-blur transition-transform duration-300 dark:border-white/10 dark:bg-navy-900/95 lg:static lg:w-[300px] lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <p className="text-sm font-semibold text-navy-700 dark:text-white">Đoạn chat</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
        >
          <MdClose className="h-5 w-5" />
        </button>
      </div>

      <button
        type="button"
        onClick={onNewChat}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
      >
        <MdAdd className="h-5 w-5" />
        Cuộc trò chuyện mới
      </button>

      <div className="space-y-2 overflow-y-auto pb-4">
        {conversations.map((conversation) => {
          const isActive = conversation.title === activeTitle;
          return (
            <button
              key={conversation.id}
              type="button"
              className={`group w-full rounded-xl border px-3 py-2 text-left transition ${
                isActive
                  ? "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-400/30 dark:bg-brand-500/15 dark:text-brand-200"
                  : "border-transparent bg-gray-50 text-gray-700 hover:border-gray-200 hover:bg-white dark:bg-white/5 dark:text-gray-200 dark:hover:border-white/10"
              }`}
            >
              <div className="flex items-center gap-2">
                <MdOutlineChatBubbleOutline className="h-4 w-4 shrink-0 opacity-80" />
                <p className="truncate text-sm font-medium">{conversation.title}</p>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Hoạt động gần đây</p>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;

