import Tag from "@/components/tag/Tag.tsx";
import type { TaskPriority } from "@/types/task";
import { TaskPriorityLabels } from "@/types/task";
import React from "react";

interface TaskPrioritySelectorProps {
  value: TaskPriority;
  onChange?: (priority: TaskPriority) => void;
  disabled?: boolean;
  readonly?: boolean;
  className?: string;
}

const ALL_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

const TaskPriorityHexColors: Record<TaskPriority, string> = {
  low: "#a3aed0",
  medium: "#3b82f6",
  high: "#f97316",
  urgent: "#ef4444",
};

const TaskPrioritySelector: React.FC<TaskPrioritySelectorProps> = ({
  value,
  onChange,
  disabled = false,
  readonly = false,
  className,
}) => {
  const options = ALL_PRIORITIES.map((p) => ({
    value: p,
    label: TaskPriorityLabels[p],
  }));

  const optionColors = Object.fromEntries(
    ALL_PRIORITIES.map((p) => [p, TaskPriorityHexColors[p]]),
  );

  if (readonly || !onChange) {
    return (
      <Tag color={TaskPriorityHexColors[value]} className={className}>
        {TaskPriorityLabels[value]}
      </Tag>
    );
  }

  return (
    <Tag
      variant="selection"
      color={TaskPriorityHexColors[value]}
      value={value}
      options={options}
      optionColors={optionColors}
      onChange={(v) => onChange(v as TaskPriority)}
      disabled={disabled}
      className={className}
    >
      {TaskPriorityLabels[value]}
    </Tag>
  );
};

export default TaskPrioritySelector;
