import AdvancedFilterModalBase from "@/components/filter/AdvancedFilterModal";
import {
  TaskPriority,
  TaskPriorityLabels,
  TaskPriorityColors,
  TaskStatus,
  TaskStatusLabels,
  TaskStatusColors,
} from "@/types/task";
import React from "react";
import { usersService } from "@/services/users/users.service";
import type { User } from "@/types/users";

export interface TaskFilters {
  statuses: TaskStatus[];
  priorities: TaskPriority[];
  dueDateFrom: string;
  dueDateTo: string;
  assigneeIds: number[];
  messageId: string;
  messageStatuses: string[];
}

interface TaskAdvancedFilterModalProps {
  open: boolean;
  value: TaskFilters;
  onChange: (next: TaskFilters) => void;
  onApply: () => void;
  onClear: () => void;
  onRequestClose: () => void;
}

const STATUS_OPTIONS: TaskStatus[] = ["todo", "doing", "done", "cancelled"];
const PRIORITY_OPTIONS: TaskPriority[] = ["low", "medium", "high", "urgent"];
const MESSAGE_STATUS_OPTIONS = ["opened", "replied", "closed", "resolved"];

const TaskAdvancedFilterModal: React.FC<TaskAdvancedFilterModalProps> = ({
  open,
  value,
  onChange,
  onApply,
  onClear,
  onRequestClose,
}) => {
  const [admins, setAdmins] = React.useState<User[]>([]);

  React.useEffect(() => {
    if (open) {
      usersService.getUsers({ roles: ["admin"], limit: 100 }).then((resp) => {
        setAdmins(resp.items);
      });
    }
  }, [open]);

  const toggleStatus = (status: TaskStatus) => {
    const next = value.statuses.includes(status)
      ? value.statuses.filter((s) => s !== status)
      : [...value.statuses, status];
    onChange({ ...value, statuses: next });
  };

  const togglePriority = (priority: TaskPriority) => {
    const next = value.priorities.includes(priority)
      ? value.priorities.filter((p) => p !== priority)
      : [...value.priorities, priority];
    onChange({ ...value, priorities: next });
  };

  const toggleAssignee = (id: number) => {
    const next = value.assigneeIds.includes(id)
      ? value.assigneeIds.filter((x) => x !== id)
      : [...value.assigneeIds, id];
    onChange({ ...value, assigneeIds: next });
  };

  const toggleMessageStatus = (status: string) => {
    const next = value.messageStatuses.includes(status)
      ? value.messageStatuses.filter((s) => s !== status)
      : [...value.messageStatuses, status];
    onChange({ ...value, messageStatuses: next });
  };

  return (
    <AdvancedFilterModalBase
      open={open}
      onClear={onClear}
      onApply={onApply}
      onRequestClose={onRequestClose}
    >
      <div>
        <p className="text-navy-700 font-medium dark:text-white">Trạng thái</p>
      </div>
      <div className="col-span-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((status) => {
            const active = value.statuses.includes(status);
            const colors = TaskStatusColors[status];
            return (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatus(status)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  active
                    ? `${colors.bg} ${colors.text} border-transparent`
                    : "border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                }`}
              >
                {TaskStatusLabels[status]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-navy-700 font-medium dark:text-white">Độ ưu tiên</p>
      </div>
      <div className="col-span-3">
        <div className="flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((p) => {
            const active = value.priorities.includes(p);
            const colors = TaskPriorityColors[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePriority(p)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  active
                    ? `${colors.bg} ${colors.text} border-transparent`
                    : "border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                }`}
              >
                {TaskPriorityLabels[p]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-navy-700 font-medium dark:text-white">Hạn chót</p>
      </div>
      <div className="col-span-3 grid grid-cols-2 gap-2">
        <input
          type="date"
          value={value.dueDateFrom}
          onChange={(e) => onChange({ ...value, dueDateFrom: e.target.value })}
          className="h-11 w-full rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
          placeholder="Từ ngày"
        />
        <input
          type="date"
          value={value.dueDateTo}
          onChange={(e) => onChange({ ...value, dueDateTo: e.target.value })}
          className="h-11 w-full rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
          placeholder="Đến ngày"
        />
      </div>

      <div>
        <p className="text-navy-700 font-medium dark:text-white">Người thực hiện</p>
      </div>
      <div className="col-span-3">
        <div className="max-h-32 flex flex-wrap gap-2 overflow-y-auto pr-2">
          {admins.map((u) => {
            const active = value.assigneeIds.includes(u.id);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleAssignee(u.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  active
                    ? "bg-brand-500 text-white border-transparent"
                    : "border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                }`}
              >
                {u.name || u.email}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-navy-700 font-medium dark:text-white">Mã tin nhắn</p>
      </div>
      <div className="col-span-3">
        <input
          type="number"
          value={value.messageId}
          onChange={(e) => onChange({ ...value, messageId: e.target.value })}
          className="h-11 w-full rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
          placeholder="Nhập mã tin nhắn..."
        />
      </div>

      <div>
        <p className="text-navy-700 font-medium dark:text-white">Trạng thái tin nhắn</p>
      </div>
      <div className="col-span-3">
        <div className="flex flex-wrap gap-2">
          {MESSAGE_STATUS_OPTIONS.map((s) => {
            const active = value.messageStatuses.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleMessageStatus(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  active
                    ? "bg-indigo-500 text-white border-transparent"
                    : "border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </AdvancedFilterModalBase>
  );
};

export default TaskAdvancedFilterModal;
