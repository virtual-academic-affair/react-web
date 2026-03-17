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
import { MdPerson } from "react-icons/md";
import AssigneeManager from "../../components/AssigneeManager";

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
  currentUserId?: number | null;
}

const STATUS_OPTIONS: TaskStatus[] = ["todo", "doing", "done", "cancelled"];
const PRIORITY_OPTIONS: TaskPriority[] = ["low", "medium", "high", "urgent"];

const TaskAdvancedFilterModal: React.FC<TaskAdvancedFilterModalProps> = ({
  open,
  value,
  onChange,
  onApply,
  onClear,
  onRequestClose,
  currentUserId,
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


  const isOnlyMe =
    currentUserId != null &&
    value.assigneeIds.length === 1 &&
    value.assigneeIds[0] === currentUserId;

  const handleToggleOnlyMe = () => {
    if (isOnlyMe) {
      onChange({ ...value, assigneeIds: [] });
    } else if (currentUserId != null) {
      onChange({ ...value, assigneeIds: [currentUserId] });
    }
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
        {/* "Hiển thị chỉ tôi" row toggle */}
        {currentUserId != null && (
          <button
            type="button"
            onClick={handleToggleOnlyMe}
            className="mb-3 flex w-full items-center justify-between rounded-2xl border border-gray-100 px-3 py-2.5 transition-colors hover:bg-gray-50 dark:border-white/10 dark:hover:bg-navy-700"
          >
            <span className="text-navy-700 flex items-center gap-2 text-sm font-medium dark:text-white">
              <MdPerson className="h-4 w-4 text-gray-400" />
              Hiển thị chỉ tôi
            </span>
            {/* Switch */}
            <span
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                isOnlyMe ? "bg-brand-500" : "bg-gray-200 dark:bg-navy-600"
              }`}
            >
              <span
                className={`absolute h-4 w-4 rounded-full bg-white shadow transition-all ${
                  isOnlyMe ? "left-4.5" : "left-0.5"
                }`}
              />
            </span>
          </button>
        )}

        <div className={`transition-opacity ${isOnlyMe ? "pointer-events-none opacity-40" : ""}`}>
          <AssigneeManager
            selectedIds={value.assigneeIds}
            allUsers={admins}
            disabled={isOnlyMe}
            onChange={(nextIds) => onChange({ ...value, assigneeIds: nextIds })}
          />
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


    </AdvancedFilterModalBase>
  );
};

export default TaskAdvancedFilterModal;
