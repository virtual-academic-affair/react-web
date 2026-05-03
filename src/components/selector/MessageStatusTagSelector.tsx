import type { MessageStatus } from "@/types/messageStatus";
import {
  MESSAGE_STATUSES,
  MessageStatusColors,
  MessageStatusLabels,
} from "@/types/messageStatus";
import React from "react";

interface MessageStatusTagSelectorProps {
  value: MessageStatus[];
  onChange: (status: MessageStatus[]) => void;
}

const MessageStatusTagSelector: React.FC<MessageStatusTagSelectorProps> = ({
  value,
  onChange,
}) => {
  const handleToggle = (status: MessageStatus) => {
    const next = value.includes(status)
      ? value.filter((s) => s !== status)
      : [...value, status];
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {MESSAGE_STATUSES.map((status) => {
        const active = value.includes(status);
        const colors = MessageStatusColors[status];
        return (
          <button
            key={status}
            type="button"
            onClick={() => handleToggle(status)}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? `${colors.bg} ${colors.text} border-transparent`
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/10"
            }`}
          >
            <span>{MessageStatusLabels[status]}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MessageStatusTagSelector;
