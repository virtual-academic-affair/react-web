import Drawer from "@/components/drawer/Drawer";
import RichTextEditor from "@/components/fields/RichTextEditor";
import Tooltip from "@/components/tooltip/Tooltip";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { tasksService } from "@/services/tasks";
import type { Task } from "@/types/task";
import { TaskPriority, TaskStatus } from "@/types/task";
import { formatDate } from "@/utils/date";
import { useQuery } from "@tanstack/react-query";
import { message as toast } from "antd";
import React from "react";
import { MdDeleteOutline, MdSave } from "react-icons/md";
import AssigneeManager from "../../components/AssigneeManager";
import TaskPrioritySelector from "./TaskPrioritySelector";
import TaskStatusSelector from "./TaskStatusSelector";

interface TaskDetailDrawerProps {
  taskId: number | null;
  onClose: () => void;
  onTaskChanged: (next: Task) => void;
  onTaskDeleted?: (id: number) => void;
}

const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  taskId,
  onClose,
  onTaskChanged,
  onTaskDeleted,
}) => {
  const [saving, setSaving] = React.useState(false);
  const [detail, setDetail] = React.useState<Task | null>(null);
  const { admins: users } = useAdminUsers();
  const [form, setForm] = React.useState<{
    name: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    due: string;
    assigneeIds: number[];
    assigners: string;
  } | null>(null);

  const { isLoading: loading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => tasksService.getById(taskId!),
    enabled: taskId != null,
    staleTime: 30 * 1000, // 30 seconds
    throwOnError: false,
  });

  // When taskId changes, reset or load from cache
  React.useEffect(() => {
    if (taskId == null) {
      setForm(null);
      setDetail(null);
      return;
    }

    const fetchData = async () => {
      try {
        const task = await tasksService.getById(taskId);
        setDetail(task);
        setForm({
          name: task.name,
          description: task.description || "",
          priority: task.priority,
          status: task.status,
          due: task.due ? task.due.slice(0, 16) : "",
          assigneeIds: task.assignees.map((a) => a.assigneeId),
          assigners: task.assigners ? task.assigners.join(", ") : "",
        });
      } catch (err: unknown) {
        console.error(err);
        toast.error("Không thể tải thông tin công việc.");
        onClose();
      }
    };
    fetchData();
  }, [taskId, onClose]);

  const handleSave = async () => {
    if (!taskId || !form || !detail || !form.name.trim()) {
      return;
    }

    setSaving(true);
    try {
      const updated = await tasksService.update(taskId, {
        name: form.name,
        description: form.description,
        priority: form.priority,
        status: form.status,
        due: form.due ? new Date(form.due).toISOString() : undefined,
        assigneeIds: form.assigneeIds,
        assigners: form.assigners
          ? form.assigners.split(",").map((s) => s.trim())
          : undefined,
      });

      const reconstructedAssignees = form.assigneeIds.map((id) => {
        const existing = detail.assignees?.find?.((a) => a.assigneeId === id);
        if (existing) return existing;
        const userToAdd = users.find((u) => u.id === id);
        return {
          taskId: taskId,
          assigneeId: id,
          assignerId: 0,
          assignedAt: new Date().toISOString(),
          assignee: userToAdd,
        } as any;
      });

      setForm({
        name: updated.name,
        description: updated.description || "",
        priority: updated.priority,
        status: updated.status,
        due: updated.due ? updated.due.slice(0, 16) : "",
        assigneeIds: form.assigneeIds,
        assigners: updated.assigners ? updated.assigners.join(", ") : "",
      });
      const fullUpdated = {
        ...detail,
        ...updated,
        assignees: reconstructedAssignees,
      };
      setDetail(fullUpdated as Task);
      onTaskChanged(fullUpdated as Task);

      toast.success("Cập nhật thành công.");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const isDirty = React.useMemo(() => {
    if (!detail || !form) {
      return false;
    }
    const originalDue = detail.due ? detail.due.slice(0, 16) : "";
    const originalAssigneeIds = (detail.assignees ?? [])
      .map((a) => a.assigneeId)
      .sort()
      .join(",");
    const currentAssigneeIds = [...form.assigneeIds].sort().join(",");
    const originalAssigners = detail.assigners
      ? detail.assigners.join(", ")
      : "";

    return (
      form.name !== detail.name ||
      form.description !== (detail.description || "") ||
      form.priority !== detail.priority ||
      form.status !== detail.status ||
      form.due !== originalDue ||
      currentAssigneeIds !== originalAssigneeIds ||
      form.assigners !== originalAssigners
    );
  }, [detail, form]);

  const isOpen = taskId != null;

  const handleResetForm = () => {
    if (detail) {
      setForm({
        name: detail.name,
        description: detail.description || "",
        priority: detail.priority,
        status: detail.status,
        due: detail.due ? detail.due.slice(0, 16) : "",
        assigneeIds: detail.assignees.map((a) => a.assigneeId),
        assigners: detail.assigners ? detail.assigners.join(", ") : "",
      });
    }
  };

  const footerLeft = detail && (
    <>
      <Tooltip label="Xóa">
        <button
          onClick={() => {
            if (taskId) {
              onClose();
              onTaskDeleted?.(taskId);
            }
          }}
          disabled={saving}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
        >
          <MdDeleteOutline className="h-4 w-4" />
        </button>
      </Tooltip>
    </>
  );

  const footerRight = detail && isDirty && (
    <>
      <button
        type="button"
        disabled={saving}
        onClick={handleResetForm}
        className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
      >
        Hủy
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="bg-brand-500 hover:bg-brand-600 flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        <MdSave className="h-4 w-4" />
        {saving ? "Đang lưu..." : "Lưu"}
      </button>
    </>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết công việc"
      footerLeft={footerLeft}
      footerRight={footerRight}
    >
      {loading || !form || !detail ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="dark:bg-navy-700 h-5 animate-pulse rounded bg-gray-200"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {/* Tên công việc */}
            <div className="flex items-center gap-6">
              <div className="w-40 shrink-0">
                <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Tên công việc
                </p>
              </div>
              <div className="flex-1">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
                />
              </div>
            </div>

            {/* Hạn chót */}
            <div className="flex items-center gap-6">
              <div className="w-40 shrink-0">
                <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Hạn chót
                </p>
              </div>
              <div className="flex-1">
                <input
                  type="datetime-local"
                  value={form.due}
                  onChange={(e) => setForm({ ...form, due: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
                />
              </div>
            </div>

            {/* Trạng thái */}
            <div className="flex items-center gap-6">
              <div className="w-40 shrink-0">
                <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Trạng thái
                </p>
              </div>
              <div className="flex-1">
                <TaskStatusSelector
                  value={form.status}
                  onChange={(s) => setForm({ ...form, status: s })}
                />
              </div>
            </div>

            {/* Độ ưu tiên */}
            <div className="flex items-center gap-6">
              <div className="w-40 shrink-0">
                <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Độ ưu tiên
                </p>
              </div>
              <div className="flex-1">
                <TaskPrioritySelector
                  value={form.priority}
                  onChange={(p) => setForm({ ...form, priority: p })}
                />
              </div>
            </div>

            {/* Người giao */}
            <div className="flex items-center gap-6">
              <div className="w-40 shrink-0">
                <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Người giao
                </p>
              </div>
              <div className="flex-1">
                <input
                  value={form.assigners}
                  onChange={(e) =>
                    setForm({ ...form, assigners: e.target.value })
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
                />
              </div>
            </div>

            {/* Người thực hiện (Assignees) */}
            <div className="flex items-center gap-6">
              <div className="w-40 shrink-0">
                <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Người thực hiện
                </p>
              </div>
              <div className="flex-1">
                <AssigneeManager
                  selectedIds={form.assigneeIds}
                  allUsers={users}
                  onChange={(ids) => setForm({ ...form, assigneeIds: ids })}
                />
              </div>
            </div>

            {/* Mô tả công việc */}
            <div className="flex items-start gap-6">
              <div className="w-40 shrink-0">
                <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Mô tả công việc
                </p>
              </div>
              <div className="text-editor-container flex-1">
                <RichTextEditor
                  value={form.description}
                  onChange={(val) => setForm({ ...form, description: val })}
                />
              </div>
            </div>
          </div>

          {/* Metadata / Technical Info Section */}
          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/10">
            <p className="text-navy-700 mb-3 text-xs font-semibold tracking-wide uppercase dark:text-white">
              Thông số kỹ thuật
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-6">
                <div className="w-40 shrink-0">
                  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    ID
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-navy-700 text-base dark:text-white">
                    {detail.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-40 shrink-0">
                  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Message ID
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-navy-700 text-base dark:text-white">
                    {detail.messageId ?? "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-40 shrink-0">
                  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Ngày tạo
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-navy-700 text-base dark:text-white">
                    {formatDate(detail.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-40 shrink-0">
                  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Cập nhật lần cuối
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-navy-700 text-base dark:text-white">
                    {formatDate(detail.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default TaskDetailDrawer;
