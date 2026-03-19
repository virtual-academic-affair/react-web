import type { TaskPriority } from "@/types/task";
import {
  TaskPriorityColors,
  TaskPriorityLabels,
} from "@/types/task";
import React from "react";
import { MdExpandMore } from "react-icons/md";

interface TaskPrioritySelectorProps {
  value: TaskPriority;
  onChange?: (priority: TaskPriority) => void;
  disabled?: boolean;
  readonly?: boolean;
  className?: string;
}

const TaskPrioritySelector: React.FC<TaskPrioritySelectorProps> = ({
  value,
  onChange,
  disabled = false,
  readonly = false,
  className,
}) => {
  const priorities: TaskPriority[] = ["low", "medium", "high", "urgent"];
  const colors = TaskPriorityColors[value];

  return (
    <div className={className ?? "relative inline-flex"}>
      {/* Visible tag style with expand icon */}
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
          colors.bg
        } ${colors.text} ${
          disabled ? "cursor-not-allowed opacity-50" : "border-transparent"
        }`}
      >
        <span>{TaskPriorityLabels[value]}</span>
        {!readonly && <MdExpandMore className="h-4 w-4 text-inherit" />}
      </span>

      {/* Invisible native select for interaction */}
      {!disabled && !readonly && onChange && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as TaskPriority)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          style={{ zIndex: 10 }}
        >
          {priorities.map((p) => (
            <option key={p} value={p}>
              {TaskPriorityLabels[p]}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default TaskPrioritySelector;
