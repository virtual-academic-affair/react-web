import React from "react";
import TableLayout, { type TableAction, type TableColumn } from "@/components/table/TableLayout";
import { type Task, TaskPriority, TaskStatus } from "@/types/task";
import type { User } from "@/types/users";
import type { PaginatedResponse } from "@/types/common";
import { formatDate } from "@/utils/date";
import { MdDeleteOutline, MdInfoOutline } from "react-icons/md";
import TaskStatusSelector from "./TaskStatusSelector";
import TaskPrioritySelector from "./TaskPrioritySelector";
import AssigneeManager from "../../components/AssigneeManager";

interface TaskTableViewProps {
  result: PaginatedResponse<Task> | null;
  loading: boolean;
  page: number;
  pageSize: number;
  searchValue: string;
  onKeywordChange: (val: string) => void;
  onSearch: () => void;
  onPageChange: (p: number) => void;
  onUpdateStatus: (task: Task, s: TaskStatus) => void;
  onUpdatePriority: (task: Task, p: TaskPriority) => void;
  onAddAssignee: (task: Task, userId: number) => void;
  onRemoveAssignee: (task: Task, userId: number) => void;
  onDetailClick: (task: Task) => void;
  onDeleteClick: (task: Task) => void;
  admins: User[];
}

const TaskTableView: React.FC<TaskTableViewProps> = ({
  result,
  loading,
  page,
  pageSize,
  searchValue,
  onKeywordChange,
  onSearch,
  onPageChange,
  onUpdateStatus,
  onUpdatePriority,
  onAddAssignee,
  onRemoveAssignee,
  onDetailClick,
  onDeleteClick,
  admins,
}) => {

  const columns: TableColumn<Task>[] = React.useMemo(
    () => [
      {
        key: "name",
        header: "Tên công việc",
        render: (item) => (
          <div className="flex flex-col min-w-0">
            <p className="text-navy-700 truncate text-sm font-bold dark:text-white">
              {item.name}
            </p>
            {item.assigners && item.assigners.length > 0 && (
              <p className="text-xs text-gray-500 truncate"> 
                Từ: {item.assigners.join(", ")}
              </p>
            )}
          </div>
        ),
      },
      {
        key: "priority",
        header: "Độ ưu tiên",
        render: (item) => (
          <TaskPrioritySelector
            value={item.priority}
            onChange={(p) => onUpdatePriority(item, p)}
          />
        ),
      },
      {
        key: "status",
        header: "Trạng thái",
        render: (item) => (
          <TaskStatusSelector
            value={item.status}
            onChange={(s) => onUpdateStatus(item, s)}
          />
        ),
      },
      {
        key: "assignees",
        header: "Người thực hiện",
        render: (item) => (
          <AssigneeManager
            selectedIds={item.assignees.map((a) => a.assigneeId)}
            allUsers={admins}
            onAdd={(userId: number) => onAddAssignee(item, userId)}
            onRemove={(userId: number) => onRemoveAssignee(item, userId)}
          />
        ),
      },
      {
        key: "due",
        header: "Hạn chót",
        render: (item) => (
          <p className="text-navy-700 text-sm dark:text-white">
            {item.due ? formatDate(item.due) : "-"}
          </p>
        ),
      },
    ],
    [admins, onUpdatePriority, onUpdateStatus, onAddAssignee, onRemoveAssignee],
  );

  const actions: TableAction<Task>[] = React.useMemo(
    () => [
      {
        key: "detail",
        icon: <MdInfoOutline className="h-4 w-4" />,
        label: "Chi tiết",
        onClick: onDetailClick,
      },
      {
        key: "delete",
        icon: <MdDeleteOutline className="h-4 w-4" />,
        label: "Xóa",
        onClick: onDeleteClick,
        className:
          "flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600",
      },
    ],
    [onDetailClick, onDeleteClick],
  );

  return (
    <TableLayout
      result={result}
      loading={loading}
      page={page}
      pageSize={pageSize}
      searchValue={searchValue}
      onSearchChange={onKeywordChange}
      onSearch={onSearch}
      searchPlaceholder="Tìm kiếm công việc..."
      hideSearchBar={true}
      columns={columns}
      actions={actions}
      onPageChange={onPageChange}
    />
  );
};

export default TaskTableView;

