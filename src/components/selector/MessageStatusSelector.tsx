import Tag from "@/components/tag/Tag";
import type { MessageStatus } from "@/types/messageStatus";
import {
  MESSAGE_STATUSES,
  MessageStatusColors,
  MessageStatusLabels,
} from "@/types/messageStatus";
import React from "react";

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
  const options = MESSAGE_STATUSES.map((s) => ({
    value: s,
    label: MessageStatusLabels[s],
  }));

  const optionColors = Object.fromEntries(
    MESSAGE_STATUSES.map((s) => [s, MessageStatusColors[s].hex]),
  );

  return (
    <Tag
      variant="selection"
      color={value ? MessageStatusColors[value].hex : undefined}
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
