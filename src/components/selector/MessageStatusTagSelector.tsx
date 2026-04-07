import type { MessageStatus } from "@/types/messageStatus";
import { MessageStatusColors, MessageStatusLabels } from "@/types/messageStatus";
import React from "react";

interface MessageStatusTagSelectorProps {
  value: MessageStatus[];
  onChange: (status: MessageStatus[]) => void;
  disabled?: boolean;
  className?: string;
  multiple?: boolean;
}

const MessageStatusTagSelector: React.FC<MessageStatusTagSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className,
  multiple = true,
}) => {
  const options: MessageStatus[] = ["new", "opened", "replied", "closed"];

  const handleToggle = (status: MessageStatus) => {
    if (multiple) {
      const next = value.includes(status)
        ? value.filter((s) => s !== status)
        : [...value, status];
      onChange(next);
    } else {
      onChange([status]);
    }
  };

  return (
    <div className={className ?? "relative inline-flex flex-wrap gap-1"}>
      {options.map((status) => {
        const active = value.includes(status);
        const colors = MessageStatusColors[status];
        return (
          <button
            key={status}
            type="button"
            disabled={disabled}
            onClick={() => handleToggle(status)}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              active
                ? `${colors.bg} ${colors.text} border-transparent`
                : "border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <span>{MessageStatusLabels[status]}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MessageStatusTagSelector;
