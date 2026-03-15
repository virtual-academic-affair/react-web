import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout";
import { tasksService } from "@/services/tasks.service";
import { usersService } from "@/services/users";
import {
  type Task,
  TaskPriority,
  TaskStatus,
  TaskPriorityLabels,
} from "@/types/task";
import type { User } from "@/types/users";
import type { PaginatedResponse } from "@/types/common";
import { formatDate } from "@/utils/date";
import { message as toast } from "antd";
import React from "react";
import { MdDeleteOutline, MdInfoOutline } from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import TaskAdvancedFilterModal, {
  type TaskFilters,
} from "./components/TaskAdvancedFilterModal";
import TaskDetailDrawer from "./components/TaskDetailDrawer";
import TaskStatusSelector from "./components/TaskStatusSelector";
import TaskPrioritySelector from "./components/TaskPrioritySelector";
import AssigneeManager from "../components/AssigneeManager";

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
    async (p: number, kw: string, f: TaskFilters) => {
      setLoading(true);
      try {
        const resp = await tasksService.getList({
          page: p,
          limit: PAGE_SIZE,
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
    fetchList(page, keyword, filters);
  }, [page, filters, fetchList, keyword]);

  React.useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  React.useEffect(() => {
    const next = new URLSearchParams();
    if (keyword) {
      next.set("keyword", keyword);
    }
    next.set("page", String(page));

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
  }, [keyword, page, filters, setSearchParams]);

  const handleSearch = () => {
    setPage(1);
    fetchList(1, keyword, filters);
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
      const msg = err instanceof Error ? err.message : "Xóa thất bại.";
      toast.error(msg);
    }
  }, []);

  const handleUpdateTaskStatus = async (task: Task, status: TaskStatus) => {
    try {
      const updated = await tasksService.update(task.id, { status });
      setResult((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((t) => (t.id === updated.id ? updated : t)),
            }
          : prev,
      );
      toast.success("Cập nhật trạng thái thành công.");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Cập nhật trạng thái thất bại.");
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
              items: prev.items.map((t) => (t.id === updated.id ? updated : t)),
            }
          : prev,
      );
      toast.success(
        `Cập nhật mức ưu tiên "${TaskPriorityLabels[priority]}" thành công.`,
      );
    } catch (err: unknown) {
      console.error(err);
      toast.error("Cập nhật mức ưu tiên thất bại.");
    }
  };

  const handleAddAssignee = async (task: Task, userId: number) => {
    const currentIds = task.assignees.map((a) => a.assigneeId);
    if (currentIds.includes(userId)) {
      return;
    }
    try {
      const updated = await tasksService.update(task.id, {
        assigneeIds: [...currentIds, userId],
      });
      setResult((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((t) => (t.id === updated.id ? updated : t)),
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
              items: prev.items.map((t) => (t.id === updated.id ? updated : t)),
            }
          : prev,
      );
      toast.success("Đã gỡ người thực hiện.");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Gỡ người thực hiện thất bại.");
    }
  };

  const columns: TableColumn<Task>[] = React.useMemo(
    () => [
      {
        key: "name",
        header: "Tên công việc",
        render: (item) => (
          <div className="flex flex-col">
            <p className="text-navy-700 text-sm font-bold dark:text-white">
              {item.name}
            </p>
            {item.assigners && item.assigners.length > 0 && (
              <p className="text-xs text-gray-500">
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
            onChange={(p) => handleUpdateTaskPriority(item, p)}
          />
        ),
      },
      {
        key: "status",
        header: "Trạng thái",
        render: (item) => (
          <TaskStatusSelector
            value={item.status}
            onChange={(s) => handleUpdateTaskStatus(item, s)}
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
            onAdd={(userId) => handleAddAssignee(item, userId)}
            onRemove={(userId) => handleRemoveAssignee(item, userId)}
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
    [admins],
  );

  const actions: TableAction<Task>[] = React.useMemo(
    () => [
      {
        key: "detail",
        icon: <MdInfoOutline className="h-4 w-4" />,
        label: "Chi tiết",
        onClick: (row) => {
          const next = new URLSearchParams(searchParams);
          next.set("id", String(row.id));
          setSearchParams(next, { replace: true });
        },
      },
      {
        key: "delete",
        icon: <MdDeleteOutline className="h-4 w-4" />,
        label: "Xóa",
        onClick: handleDelete,
        className:
          "flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600",
      },
    ],
    [searchParams, setSearchParams, handleDelete],
  );

  return (
    <>
      <TableLayout
        result={result}
        loading={loading}
        page={page}
        pageSize={PAGE_SIZE}
        searchValue={keyword}
        onSearchChange={setKeyword}
        onSearch={handleSearch}
        searchPlaceholder="Tìm kiếm công việc..."
        showFilter={true}
        onFilterClick={() => {
          setDraftFilters(filters);
          setFilterOpen(true);
        }}
        columns={columns}
        actions={actions}
        onPageChange={setPage}
      />

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
        onApply={() => {
          setFilters(draftFilters);
          setPage(1);
          setFilterOpen(false);
          fetchList(1, keyword, draftFilters);
        }}
        onClear={() => {
          setDraftFilters(defaultFilters);
          setFilters(defaultFilters);
          setPage(1);
          setFilterOpen(false);
          fetchList(1, keyword, defaultFilters);
        }}
        onRequestClose={() => setFilterOpen(false)}
      />
    </>
  );
};

export default TasksPage;
