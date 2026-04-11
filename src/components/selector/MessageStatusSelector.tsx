import Tag from "@/components/tag/Tag";
import type { MessageStatus } from "@/types/messageStatus";
import { MessageStatusLabels } from "@/types/messageStatus";
import React from "react";

interface MessageStatusSelectorProps {
  value: MessageStatus | null;
  onChange: (status: MessageStatus | null) => void;
  disabled?: boolean;
  className?: string;
}

const ALL_STATUSES: MessageStatus[] = ["new", "opened", "replied", "closed"];

const MessageStatusHexColors: Record<MessageStatus, string> = {
  new: "#f59e0b",
  opened: "#a3aed0",
  replied: "#3b82f6",
  closed: "#10b981",
};

const MessageStatusSelector: React.FC<MessageStatusSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const options = ALL_STATUSES.map((s) => ({
    value: s,
    label: MessageStatusLabels[s],
  }));

  const optionColors = Object.fromEntries(
    ALL_STATUSES.map((s) => [s, MessageStatusHexColors[s]]),
  );

  return (
    <Tag
      variant="selection"
      color={value ? MessageStatusHexColors[value] : undefined}
      value={value ?? ""}
      options={options}
      optionColors={optionColors}
      onChange={(v) => onChange(v ? (v as MessageStatus) : null)}
      disabled={disabled}
      className={className}
    >
      {value ? MessageStatusLabels[value] : "—"}
    </Tag>
  );
};

export default MessageStatusSelector;
