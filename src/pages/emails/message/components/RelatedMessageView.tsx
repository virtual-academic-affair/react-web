import Tooltip from "@/components/tooltip/Tooltip";
import type { Message } from "@/types/email";
import React from "react";
import { MdArrowBack } from "react-icons/md";
import { SiGmail } from "react-icons/si";

interface RelatedMessageViewProps {
  message: Message | null;
  loading: boolean;
  onReselect: () => void;
  stackedInSideColumn?: boolean;
}

const RelatedMessageView: React.FC<RelatedMessageViewProps> = ({
  message,
  loading,
  onReselect,
  stackedInSideColumn = false,
}) => {
  const blockMb = stackedInSideColumn ? "mb-0" : "mb-6";

  if (loading) {
    return (
      <div
        className={`dark:bg-navy-800 ${blockMb} flex animate-pulse items-center gap-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 dark:border-white/10`}
      >
        <div className="dark:bg-navy-700 h-4 w-40 shrink-0 rounded bg-gray-200" />
        <div className="dark:bg-navy-700 h-4 flex-1 rounded bg-gray-200" />
      </div>
    );
  }

  if (!message) return null;

  const handleOpenGmail = () => {
    const url = `https://mail.google.com/mail/u/0/#inbox/${message.threadId}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={`bg-brand-50/30 dark:border-brand-500/20 dark:bg-brand-500/5 ${blockMb} flex items-center gap-4 rounded-3xl p-4 pl-6`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-brand-500 mb-2 text-xs font-bold tracking-wider uppercase">
          Từ tin nhắn
        </p>
        <p className="text-navy-700 truncate text-lg font-bold dark:text-white">
          {message.subject || "(Không có tiêu đề)"}
        </p>
        <p className="truncate text-sm text-gray-400 dark:text-gray-500">
          {message.senderName}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip label="Quay lại danh sách email">
          <button
            type="button"
            onClick={onReselect}
            className="dark:bg-navy-800 flex h-10 w-10 items-center justify-center rounded-2xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MdArrowBack className="h-5 w-5" />
          </button>
        </Tooltip>
        <Tooltip label="Xem trong Gmail">
          <button
            type="button"
            onClick={handleOpenGmail}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-500 text-white transition-colors hover:bg-pink-600 dark:bg-pink-500 dark:text-white dark:hover:bg-pink-400"
          >
            <SiGmail className="h-5 w-5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default RelatedMessageView;
