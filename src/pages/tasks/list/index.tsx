import { tasksService } from "@/services/tasks.service";
import { usersService } from "@/services/users";
import type { PaginatedResponse } from "@/types/common";
import { type Task, TaskPriority, TaskStatus } from "@/types/task";
import type { User } from "@/types/users";
import { message as toast } from "antd";
import React from "react";
import {
  MdFilterList,
  MdOutlineCalendarMonth,
  MdOutlineDashboard,
  MdOutlineTableChart,
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
import { parseSearchString, stringifySearchQuery } from "@/utils/search";


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
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = React.useState<PaginatedResponse<Task> | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [admins, setAdmins] = React.useState<User[]>([]);

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

  const selectedId = searchParams.get("id")
    ? Number(searchParams.get("id"))
    : null;

  const fetchAdmins = React.useCallback(async () => {
    try {
      const resp = await usersService.getUsers({
        roles: ["admin"],
        limit: 100,
      });
      setAdmins(resp.items);
    } catch {
      // Silent fail
    }
  }, []);

  const fetchList = React.useCallback(
    async (p: number, kw: string, f: TaskFilters, v: ViewMode) => {
      setLoading(true);
      try {
        const resp = await tasksService.getList({
          page: v === "table" ? p : undefined,
          limit: v === "table" ? PAGE_SIZE : 100, // Load more for board/calendar
          keyword: kw || undefined,
          statuses: f.statuses.length ? f.statuses : undefined,
          priorities: f.priorities.length ? f.priorities : undefined,
          dueDateFrom: f.dueDateFrom || undefined,
          dueDateTo: f.dueDateTo || undefined,
          assigneeIds: f.assigneeIds.length ? f.assigneeIds : undefined,
          messageId: f.messageId ? Number(f.messageId) : undefined,
          messageStatuses: f.messageStatuses.length
            ? f.messageStatuses
            : undefined,
          orderCol: "createdAt",
          orderDir: "DESC",
        });
        setResult(resp);
      } catch (err: unknown) {
        console.error(err);
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách công việc.";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    fetchList(page, keyword, filters, view);
  }, [page, filters, fetchList, keyword, view]);

  React.useEffect(() => {
    setSearchValue(
      stringifySearchQuery(keyword, filters as unknown as Record<string, unknown>, [
        "page",
        "limit",
        "view",
      ]),
    );
  }, [keyword, filters, view]);


  React.useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

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


  const handleDelete = React.useCallback(async (row: Task) => {
    if (!window.confirm(`Xóa công việc "${row.name}"?`)) {
      return;
    }
    try {
      await tasksService.remove(row.id);
      toast.success("Xóa thành công.");
      setResult((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((i) => i.id !== row.id),
              pagination: {
                ...prev.pagination,
                total: prev.pagination.total - 1,
              },
            }
          : prev,
      );
    } catch (err: unknown) {
      console.error(err);
      toast.error("Xóa thất bại.");
    }
  }, []);

  const handleUpdateTaskStatus = async (task: Task, status: TaskStatus) => {
    try {
      const updated = await tasksService.update(task.id, { status });
      setResult((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((t) =>
                t.id === updated.id ? { ...t, ...updated } : t,
              ),
            }
          : prev,
      );
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
      setResult((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((t) =>
                t.id === updated.id ? { ...t, ...updated } : t,
              ),
            }
          : prev,
      );
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
      setResult((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((t) =>
                t.id === updated.id ? { ...t, ...updated } : t,
              ),
            }
          : prev,
      );
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
      setResult((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((t) =>
                t.id === updated.id ? { ...t, ...updated } : t,
              ),
            }
          : prev,
      );
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

        {/* Native dropdown selector disguised as an icon button */}
        <div className="relative h-10 w-10 shrink-0">
          <div className="bg-brand-500 hover:bg-brand-600 flex h-10 w-10 items-center justify-center rounded-2xl text-white transition-colors">
            {view === "table" && <MdOutlineTableChart className="h-5 w-5" />}
            {view === "calendar" && (
              <MdOutlineCalendarMonth className="h-5 w-5" />
            )}
            {view === "board" && <MdOutlineDashboard className="h-5 w-5" />}
          </div>
          <select
            value={view}
            onChange={(e) => setView(e.target.value as ViewMode)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            title="Chọn kiểu hiển thị"
          >
            <option value="table">Dạng bảng</option>
            <option value="calendar">Dạng lịch</option>
            <option value="board">Dạng board</option>
          </select>
        </div>
      </div>

      {view === "table" && (
        <TaskTableView
          result={result}
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
          setResult((prev) =>
            prev
              ? {
                  ...prev,
                  items: prev.items.map((x) =>
                    x.id === updated.id ? updated : x,
                  ),
                }
              : prev,
          )
        }
        onTaskDeleted={(id) => {
          setResult((prev) =>
            prev
              ? {
                  ...prev,
                  items: prev.items.filter((x) => x.id !== id),
                  pagination: {
                    ...prev.pagination,
                    total: prev.pagination.total - 1,
                  },
                }
              : prev,
          );
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
          fetchList(1, keyword, draftFilters, view);
        }}
        onClear={() => {
          setDraftFilters(defaultFilters);
          setFilters(defaultFilters);
          setPage(1);
          setFilterOpen(false);
          fetchList(1, keyword, defaultFilters, view);
        }}
        onRequestClose={() => setFilterOpen(false)}
      />
    </div>
  );
};

export default TasksPage;
