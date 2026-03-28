import ConfirmModal from "@/components/modal/ConfirmModal";
import Tooltip from "@/components/tooltip/Tooltip";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { tasksService } from "@/services/tasks";
import type { PaginatedResponse } from "@/types/common";
import { type Task, TaskPriority, TaskStatus } from "@/types/task";
import { parseSearchString, stringifySearchQuery } from "@/utils/search";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import React from "react";
import {
  MdCalendarToday,
  MdFilterList,
  MdFormatListBulleted,
  MdGridView,
  MdSearch,
} from "react-icons/md";

import { useSearchParams } from "react-router-dom";
import TaskAdvancedFilterModal, {
  type TaskFilters,
} from "./components/TaskAdvancedFilterModal";
import TaskBoard from "./components/TaskBoard";
import TaskCalendarView from "./components/TaskCalendarView";
import TaskDetailDrawer from "./components/TaskDetailDrawer";
import TaskTableView from "./components/TaskTableView";

type ViewMode = "table" | "calendar" | "board";

/** Decode JWT payload (no signature verification — client-side only) */
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

const JWT_PAYLOAD = decodeJwtPayload(import.meta.env.VITE_TEMP_TOKEN ?? "");
const CURRENT_USER_ID: number | null =
  typeof JWT_PAYLOAD.sub === "number" ? JWT_PAYLOAD.sub : null;

const PAGE_SIZE = 10;

const defaultFilters: TaskFilters = {
  statuses: [],
  priorities: [],
  dueDateFrom: "",
  dueDateTo: "",
  assigneeIds: [],
  messageId: "",
  messageStatuses: [],
};

const TasksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const { admins } = useAdminUsers();

  const [keyword, setKeyword] = React.useState(
    searchParams.get("keyword") ?? "",
  );
  const [page, setPage] = React.useState(
    Number(searchParams.get("page") ?? "1") > 0
      ? Number(searchParams.get("page") ?? "1")
      : 1,
  );

  const [view, setView] = React.useState<ViewMode>(
    (searchParams.get("view") as ViewMode) || "table",
  );

  const [filters, setFilters] = React.useState<TaskFilters>({
    statuses:
      (searchParams
        .get("statuses")
        ?.split(",")
        .filter(Boolean) as TaskStatus[]) ?? [],
    priorities:
      (searchParams
        .get("priorities")
        ?.split(",")
        .filter(Boolean) as TaskPriority[]) ?? [],
    dueDateFrom: searchParams.get("dueDateFrom") ?? "",
    dueDateTo: searchParams.get("dueDateTo") ?? "",
    assigneeIds:
      searchParams
        .get("assigneeIds")
        ?.split(",")
        .map(Number)
        .filter((n) => !isNaN(n)) ?? [],
    messageId: searchParams.get("messageId") ?? "",
    messageStatuses:
      searchParams.get("messageStatuses")?.split(",").filter(Boolean) ?? [],
  });

  const [searchValue, setSearchValue] = React.useState(() =>
    stringifySearchQuery(
      searchParams.get("keyword") ?? "",
      filters as unknown as Record<string, unknown>,
      ["page", "limit", "view"],
    ),
  );

  const [filterOpen, setFilterOpen] = React.useState(false);
  const [draftFilters, setDraftFilters] = React.useState(filters);
  const [taskToDelete, setTaskToDelete] = React.useState<Task | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const selectedId = searchParams.get("id")
    ? Number(searchParams.get("id"))
    : null;

  // ── Build query params for the tasks list
  const tasksQueryParams = React.useMemo(
    () => ({
      page: view === "table" ? page : undefined,
      limit: view === "table" ? PAGE_SIZE : 100,
      keyword: keyword || undefined,
      statuses: filters.statuses.length ? filters.statuses : undefined,
      priorities: filters.priorities.length ? filters.priorities : undefined,
      dueDateFrom: filters.dueDateFrom || undefined,
      dueDateTo: filters.dueDateTo || undefined,
      assigneeIds: filters.assigneeIds.length ? filters.assigneeIds : undefined,
      messageId: filters.messageId ? Number(filters.messageId) : undefined,
      messageStatuses: filters.messageStatuses.length
        ? filters.messageStatuses
        : undefined,
      orderCol: "createdAt" as const,
      orderDir: "DESC" as const,
    }),
    [page, view, keyword, filters],
  );

  const { data: result, isFetching } = useQuery({
    queryKey: ["tasks", tasksQueryParams],
    queryFn: () => tasksService.getList(tasksQueryParams),
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: (prev) => prev, // keep previous data while loading (like keepPreviousData)
  });

  // Sync loading state for child components
  React.useEffect(() => {
    setLoading(isFetching);
  }, [isFetching]);

  // Force refetch when filters are applied imperatively (onApply / onClear)
  const refetchTasks = () =>
    queryClient.invalidateQueries({ queryKey: ["tasks"] });

  React.useEffect(() => {
    setSearchValue(
      stringifySearchQuery(
        keyword,
        filters as unknown as Record<string, unknown>,
        ["page", "limit", "view"],
      ),
    );
  }, [keyword, filters, view]);

  React.useEffect(() => {
    const next = new URLSearchParams();
    if (keyword) {
      next.set("keyword", keyword);
    }
    next.set("page", String(page));
    next.set("view", view);

    if (filters.statuses.length) {
      next.set("statuses", filters.statuses.join(","));
    }
    if (filters.priorities.length) {
      next.set("priorities", filters.priorities.join(","));
    }
    if (filters.dueDateFrom) {
      next.set("dueDateFrom", filters.dueDateFrom);
    }
    if (filters.dueDateTo) {
      next.set("dueDateTo", filters.dueDateTo);
    }
    if (filters.assigneeIds.length) {
      next.set("assigneeIds", filters.assigneeIds.join(","));
    }
    if (filters.messageId) {
      next.set("messageId", filters.messageId);
    }
    if (filters.messageStatuses.length) {
      next.set("messageStatuses", filters.messageStatuses.join(","));
    }
    if (searchParams.get("id")) {
      next.set("id", searchParams.get("id")!);
    }

    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, page, filters, view, setSearchParams]);

  const handleSearch = () => {
    const parsed = parseSearchString(searchValue);
    setKeyword(parsed.keyword);

    const nextFilters: TaskFilters = {
      statuses: parsed.params.statuses
        ? (parsed.params.statuses.split(",") as TaskStatus[])
        : [],
      priorities: parsed.params.priorities
        ? (parsed.params.priorities.split(",") as TaskPriority[])
        : [],
      dueDateFrom: parsed.params.dueDateFrom ?? "",
      dueDateTo: parsed.params.dueDateTo ?? "",
      assigneeIds: parsed.params.assigneeIds
        ? parsed.params.assigneeIds.split(",").map(Number)
        : [],
      messageId: parsed.params.messageId ?? "",
      messageStatuses: parsed.params.messageStatuses
        ? parsed.params.messageStatuses.split(",")
        : [],
    };
    setFilters(nextFilters);
    setPage(1);
  };

  const updateCache = (
    updater: (prev: PaginatedResponse<Task>) => PaginatedResponse<Task>,
  ) => {
    queryClient.setQueryData<PaginatedResponse<Task>>(
      ["tasks", tasksQueryParams],
      (prev) => (prev ? updater(prev) : prev),
    );
  };

  const handleDelete = React.useCallback((row: Task) => {
    setTaskToDelete(row);
  }, []);

  const executeDelete = React.useCallback(async () => {
    if (!taskToDelete) return;
    setDeleting(true);
    try {
      await tasksService.remove(taskToDelete.id);
      toast.success("Xóa thành công.");
      updateCache((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i.id !== taskToDelete.id),
        pagination: { ...prev.pagination, total: prev.pagination.total - 1 },
      }));
      setTaskToDelete(null);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Xóa thất bại.");
    } finally {
      setDeleting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskToDelete, queryClient, tasksQueryParams]);

  const handleUpdateTaskStatus = async (task: Task, status: TaskStatus) => {
    try {
      const updated = await tasksService.update(task.id, { status });
      updateCache((prev) => ({
        ...prev,
        items: prev.items.map((t) =>
          t.id === updated.id ? { ...t, ...updated } : t,
        ),
      }));
      toast.success("Cập nhật thành công.");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Cập nhật thất bại.");
      throw err;
    }
  };

  const handleUpdateTaskPriority = async (
    task: Task,
    priority: TaskPriority,
  ) => {
    try {
      const updated = await tasksService.update(task.id, { priority });
      updateCache((prev) => ({
        ...prev,
        items: prev.items.map((t) =>
          t.id === updated.id ? { ...t, ...updated } : t,
        ),
      }));
      toast.success(`Cập nhật thành công.`);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Cập nhật thất bại.");
    }
  };

  const handleAddAssignee = async (task: Task, userId: number) => {
    const currentIds = task.assignees.map((a) => a.assigneeId);
    if (currentIds.includes(userId)) return;
    try {
      const updated = await tasksService.update(task.id, {
        assigneeIds: [...currentIds, userId],
      });

      const userToAdd = admins.find((a) => a.id === userId);
      const newAssignee = userToAdd
        ? ({
            taskId: task.id,
            assigneeId: userId,
            assignerId: CURRENT_USER_ID || 0,
            assignedAt: new Date().toISOString(),
            assignee: userToAdd,
          } as any)
        : null; // using any to bypass type issues temporarily if needed, though TaskAssignee is exported

      const finalTask = {
        ...task,
        ...updated,
        assignees: newAssignee
          ? [...task.assignees, newAssignee]
          : task.assignees,
      };

      updateCache((prev) => ({
        ...prev,
        items: prev.items.map((t) => (t.id === updated.id ? finalTask : t)),
      }));
      toast.success("Đã phân công thêm người.");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Phân công thất bại.");
    }
  };

  const handleRemoveAssignee = async (task: Task, userId: number) => {
    const nextIds = task.assignees
      .map((a) => a.assigneeId)
      .filter((id) => id !== userId);
    try {
      const updated = await tasksService.update(task.id, {
        assigneeIds: nextIds,
      });

      const finalTask = {
        ...task,
        ...updated,
        assignees: task.assignees.filter((a) => a.assigneeId !== userId),
      };

      updateCache((prev) => ({
        ...prev,
        items: prev.items.map((t) => (t.id === updated.id ? finalTask : t)),
      }));
      toast.success("Đã gỡ người thực hiện.");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Gỡ người thực hiện thất bại.");
    }
  };

  const handleTaskClick = (task: Task) => {
    const next = new URLSearchParams(searchParams);
    next.set("id", String(task.id));
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="flex h-full w-full flex-col gap-4">
      {/* Search + Filter bar — shared across all views */}
      <div className="flex items-center gap-3">
        <div className="dark:bg-navy-800 flex flex-1 items-center gap-2 rounded-2xl bg-white px-3 py-2">
          <MdSearch className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Tìm kiếm công việc..."
            className="w-full bg-transparent py-1 text-sm text-gray-700 outline-none placeholder:text-gray-500 dark:bg-transparent dark:text-white dark:placeholder:text-gray-400"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setDraftFilters(filters);
            setFilterOpen(true);
          }}
          className="bg-brand-500 hover:bg-brand-600 flex h-10 w-10 items-center justify-center rounded-2xl text-white transition-colors"
          title="Lọc nâng cao"
        >
          <MdFilterList className="h-5 w-5" />
        </button>

        <div className="dark:bg-navy-900 relative flex shrink-0 items-center rounded-full border border-gray-200 bg-white p-1 dark:border-[#ffffff33]">
          {/* Sliding highlight */}
          <div
            className="bg-brand-50 dark:bg-brand-500/20 absolute h-[calc(100%-8px)] rounded-full transition-all duration-300 ease-in-out"
            style={{
              width: "calc((100% - 8px) / 3)",
              left: "4px",
              transform: `translateX(${
                (view === "table" ? 0 : view === "board" ? 1 : 2) * 100
              }%)`,
            }}
          />

          {(
            [
              { id: "table", icon: MdFormatListBulleted, label: "Dạng bảng" },
              { id: "board", icon: MdGridView, label: "Dạng bảng Kanban" },
              { id: "calendar", icon: MdCalendarToday, label: "Dạng lịch" },
            ] as const
          ).map((item) => (
            <Tooltip key={item.id} label={item.label} className="flex-1">
              <button
                type="button"
                onClick={() => setView(item.id)}
                className={`relative z-10 flex w-full items-center justify-center px-4 py-2 transition-colors duration-300 ${
                  view === item.id
                    ? "text-brand-500"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5" />
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      {view === "table" && (
        <TaskTableView
          result={result ?? null}
          loading={loading}
          page={page}
          pageSize={PAGE_SIZE}
          searchValue={searchValue}
          onKeywordChange={setSearchValue}
          onSearch={handleSearch}
          onPageChange={setPage}
          onUpdateStatus={handleUpdateTaskStatus}
          onUpdatePriority={handleUpdateTaskPriority}
          onAddAssignee={handleAddAssignee}
          onRemoveAssignee={handleRemoveAssignee}
          onDetailClick={handleTaskClick}
          onDeleteClick={handleDelete}
          admins={admins}
        />
      )}

      {view === "calendar" && (
        <TaskCalendarView onTaskClick={handleTaskClick} />
      )}

      {view === "board" && (
        <TaskBoard
          tasks={result?.items || []}
          loading={loading}
          onTaskClick={handleTaskClick}
          onStatusChange={handleUpdateTaskStatus}
          onPriorityChange={handleUpdateTaskPriority}
        />
      )}

      <TaskDetailDrawer
        taskId={selectedId}
        onClose={() => {
          const next = new URLSearchParams(searchParams);
          next.delete("id");
          setSearchParams(next, { replace: true });
        }}
        onTaskChanged={(updated) =>
          updateCache((prev) => ({
            ...prev,
            items: prev.items.map((x) => (x.id === updated.id ? updated : x)),
          }))
        }
        onTaskDeleted={(id) => {
          updateCache((prev) => ({
            ...prev,
            items: prev.items.filter((x) => x.id !== id),
            pagination: {
              ...prev.pagination,
              total: prev.pagination.total - 1,
            },
          }));
        }}
      />

      <TaskAdvancedFilterModal
        open={filterOpen}
        value={draftFilters}
        onChange={setDraftFilters}
        currentUserId={CURRENT_USER_ID}
        onApply={() => {
          setFilters(draftFilters);
          setPage(1);
          setFilterOpen(false);
          refetchTasks();
        }}
        onClear={() => {
          setDraftFilters(defaultFilters);
          setFilters(defaultFilters);
          setPage(1);
          setFilterOpen(false);
          refetchTasks();
        }}
        onRequestClose={() => setFilterOpen(false)}
      />

      <ConfirmModal
        open={!!taskToDelete}
        onCancel={() => setTaskToDelete(null)}
        onConfirm={executeDelete}
        title="Xóa công việc"
        subTitle={`Bạn có chắc chắn muốn xóa công việc "${taskToDelete?.name}" không? Hành động này không thể hoàn tác.`}
        loading={deleting}
      />
    </div>
  );
};

export default TasksPage;
