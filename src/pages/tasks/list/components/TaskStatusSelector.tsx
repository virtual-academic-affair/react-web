import type { TaskStatus } from "@/types/task";
import {
  TaskStatusColors,
  TaskStatusLabels,
} from "@/types/task";
import React from "react";
import { MdExpandMore } from "react-icons/md";

interface TaskStatusSelectorProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
  className?: string;
}

const TaskStatusSelector: React.FC<TaskStatusSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const statuses: TaskStatus[] = ["todo", "doing", "done", "cancelled"];
  const colors = TaskStatusColors[value];

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
        <span>{TaskStatusLabels[value]}</span>
        <MdExpandMore className="h-4 w-4 text-inherit" />
      </span>

      {/* Invisible native select for interaction */}
      {!disabled && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as TaskStatus)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          style={{ zIndex: 10 }}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {TaskStatusLabels[s]}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default TaskStatusSelector;
