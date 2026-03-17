import type { ResourceQueryDto } from "./common";
import type { User } from "./users";

export const TaskPriority = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  Urgent: 'urgent',
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskStatus = {
  Todo: 'todo',
  Doing: 'doing',
  Done: 'done',
  Cancelled: 'cancelled',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.Low]: "Thấp",
  [TaskPriority.Medium]: "Trung bình",
  [TaskPriority.High]: "Cao",
  [TaskPriority.Urgent]: "Khẩn cấp",
};

export const TaskPriorityColors: Record<TaskPriority, { bg: string; text: string; hex: string }> = {
  [TaskPriority.Low]: { bg: "bg-gray-100", text: "text-gray-800", hex: "#a3aed0" },
  [TaskPriority.Medium]: { bg: "bg-blue-100", text: "text-blue-800", hex: "#3b82f6" },
  [TaskPriority.High]: { bg: "bg-orange-100", text: "text-orange-800", hex: "#f97316" },
  [TaskPriority.Urgent]: { bg: "bg-red-100", text: "text-red-800", hex: "#ef4444" },
};

export const TaskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: "Cần làm",
  [TaskStatus.Doing]: "Đang làm",
  [TaskStatus.Done]: "Hoàn thành",
  [TaskStatus.Cancelled]: "Đã hủy",
};

export const TaskStatusColors: Record<TaskStatus, { bg: string; text: string; hex: string }> = {
  [TaskStatus.Todo]: { bg: "bg-gray-100", text: "text-gray-800", hex: "#a3aed0" },
  [TaskStatus.Doing]: { bg: "bg-blue-100", text: "text-blue-800", hex: "#3b82f6" },
  [TaskStatus.Done]: { bg: "bg-green-100", text: "text-green-800", hex: "#10b981" },
  [TaskStatus.Cancelled]: { bg: "bg-red-100", text: "text-red-800", hex: "#ef4444" },
};

export interface TaskAssignee {
  taskId: number;
  assigneeId: number;
  assignerId: number;
  assignedAt: string;
  assignee: User;
}

export interface Task {
  id: number;
  messageId?: number;
  messageStatus?: string;
  createdAt: string;
  updatedAt: string;
  assigners?: string[];
  name: string;
  description?: string;
  due?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignees: TaskAssignee[];
}

export interface CreateTaskDto {
  messageId?: number;
  assigners?: string[];
  name: string;
  description?: string;
  due?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeIds?: number[];
}

export type UpdateTaskDto = Partial<CreateTaskDto>;

export interface GetTasksParams extends ResourceQueryDto {
  keyword?: string;
  statuses?: TaskStatus[];
  priorities?: TaskPriority[];
  dueDateFrom?: string;
  dueDateTo?: string;
  assigneeIds?: number[];
  messageId?: number;
  messageStatuses?: string[];
}

export interface TaskStatsItem {
  date: string;
  total: number;
  detail?: {
    [priority: string]: {
      total: number;
      todo: number;
      doing: number;
      done: number;
      cancelled: number;
    };
  };
}

export type TaskStats = Record<string, TaskStatsItem | number>;

export interface GetTaskStatsParams {
  from: string;
  to: string;
}
