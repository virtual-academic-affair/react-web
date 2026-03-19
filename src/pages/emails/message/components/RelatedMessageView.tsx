import React from "react";
import { SiGmail } from "react-icons/si";
import { MdArrowBack } from "react-icons/md";
import type { Message } from "@/types/email";
import Tooltip from "@/components/tooltip/Tooltip";

interface RelatedMessageViewProps {
  message: Message | null;
  loading: boolean;
  onReselect: () => void;
}

const RelatedMessageView: React.FC<RelatedMessageViewProps> = ({
  message,
  loading,
  onReselect,
}) => {
  if (loading) {
    return (
      <div className="mb-6 flex animate-pulse items-center gap-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-navy-800">
        <div className="h-4 w-40 shrink-0 rounded bg-gray-200 dark:bg-navy-700" />
        <div className="h-4 flex-1 rounded bg-gray-200 dark:bg-navy-700" />
      </div>
    );
  }

  if (!message) return null;

  const handleOpenGmail = () => {
    const url = `https://mail.google.com/mail/u/0/#inbox/${message.threadId}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mb-6 flex items-center gap-4 rounded-2xl border border-brand-100 bg-brand-50/30 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
        <SiGmail className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-brand-500">
          Tin nhắn liên quan
        </p>
        <p className="truncate text-sm font-bold text-navy-700 dark:text-white">
          {message.subject || "(Không có tiêu đề)"}
        </p>
        <p className="truncate text-xs text-gray-400 dark:text-gray-500">
          {message.senderName} ({message.senderEmail})
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip label="Xem trong Gmail">
          <button
            type="button"
            onClick={handleOpenGmail}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-100 bg-white shadow-sm transition-all hover:scale-105 active:scale-95 dark:border-brand-500/20 dark:bg-navy-800 text-brand-500"
          >
            <SiGmail className="h-5 w-5" />
          </button>
        </Tooltip>
        <Tooltip label="Quay lại danh sách email">
          <button
            type="button"
            onClick={onReselect}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-500 shadow-sm transition-all hover:scale-105 active:scale-95 dark:border-white/10 dark:bg-navy-800"
          >
            <MdArrowBack className="h-5 w-5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default RelatedMessageView;
