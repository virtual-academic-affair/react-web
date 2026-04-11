import Tag from "@/components/tag/Tag.tsx";
import type { TaskStatus } from "@/types/task";
import { TaskStatusLabels } from "@/types/task";
import React from "react";

interface TaskStatusSelectorProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
  className?: string;
}

const ALL_STATUSES: TaskStatus[] = ["todo", "doing", "done", "cancelled"];

const TaskStatusHexColors: Record<TaskStatus, string> = {
  todo: "#a3aed0",
  doing: "#3b82f6",
  done: "#10b981",
  cancelled: "#ef4444",
};

const TaskStatusSelector: React.FC<TaskStatusSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const options = ALL_STATUSES.map((s) => ({
    value: s,
    label: TaskStatusLabels[s],
  }));

  const optionColors = Object.fromEntries(
    ALL_STATUSES.map((s) => [s, TaskStatusHexColors[s]]),
  );

  return (
    <Tag
      variant="selection"
      color={TaskStatusHexColors[value]}
      value={value}
      options={options}
      optionColors={optionColors}
      onChange={(v) => onChange(v as TaskStatus)}
      disabled={disabled}
      className={className}
    >
      {TaskStatusLabels[value]}
    </Tag>
  );
};

export default TaskStatusSelector;
