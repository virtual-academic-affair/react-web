import type { MessageStatus } from "@/types/messageStatus";
import {
  MessageStatusColors,
  MessageStatusLabels,
} from "@/types/messageStatus";
import React from "react";
import { MdExpandMore } from "react-icons/md";

interface MessageStatusSelectorProps {
  value: MessageStatus | null;
  onChange: (status: MessageStatus | null) => void;
  disabled?: boolean;
  className?: string;
}

const MessageStatusSelector: React.FC<MessageStatusSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const statuses: (MessageStatus | null)[] = [
    null,
    "opened",
    "replied",
    "closed",
  ];
  const isFullWidth = className?.includes("w-full");

  const currentColors = value
    ? MessageStatusColors[value]
    : { bg: "bg-gray-100", text: "text-gray-600" };

  return (
    <div className={className ?? "relative inline-flex"}>
      {/* Visible tag */}
      <span
        className={`${
          isFullWidth ? "flex" : "inline-flex"
        } items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
          currentColors.bg
        } ${currentColors.text} ${
          disabled ? "cursor-not-allowed opacity-50" : "border-transparent"
        } ${isFullWidth ? "w-full justify-between" : ""}`}
      >
        <span>{value ? MessageStatusLabels[value] : "—"}</span>
        <MdExpandMore className="h-3.5 w-3.5 text-inherit" />
      </span>

      {/* Native browser select overlaid on top (fully transparent) */}
      <select
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? (e.target.value as MessageStatus) : null)
        }
        disabled={disabled}
        className="absolute left-0 top-0 h-full w-full cursor-pointer opacity-0"
        style={{ zIndex: 10 }}
      >
        {statuses
          .filter((s): s is MessageStatus => s !== null)
          .map((status) => (
            <option key={status} value={status}>
              {MessageStatusLabels[status]}
            </option>
          ))}
      </select>
    </div>
  );
};

export default MessageStatusSelector;
