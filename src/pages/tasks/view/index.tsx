import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { message as toast } from "antd";
import { useQuery } from "@tanstack/react-query";
import { tasksService } from "@/services/tasks.service";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { TaskPriority, TaskStatus } from "@/types/task";
import Card from "@/components/card";
import { MdArrowBack, MdSave, MdDeleteOutline } from "react-icons/md";
import RichTextEditor from "@/components/fields/RichTextEditor";

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [saving, setSaving] = React.useState(false);
  const { admins: users } = useAdminUsers();
  const [form, setForm] = React.useState<{
    name: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    due: string;
    assigneeIds: number[];
    assigners: string;
    messageId: string;
  }>({
    name: "",
    description: "",
    priority: TaskPriority.Medium,
    status: TaskStatus.Todo,
    due: "",
    assigneeIds: [],
    assigners: "",
    messageId: "",
  });

  const { isLoading: loading, data: task } = useQuery({
    queryKey: ["task", Number(id)],
    queryFn: () => tasksService.getById(Number(id)),
    enabled: !!id,
    staleTime: 30 * 1000,
  });

  // Populate form when task loads
  React.useEffect(() => {
    if (!task) return;
    setForm({
      name: task.name,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      due: task.due ? task.due.slice(0, 16) : "",
      assigneeIds: task.assignees.map((a) => a.assigneeId),
      assigners: task.assigners ? task.assigners.join(", ") : "",
      messageId: task.messageId ? String(task.messageId) : "",
    });
  }, [task]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !form.name.trim()) {
      return;
    }

    setSaving(true);
    try {
      await tasksService.update(Number(id), {
        name: form.name,
        description: form.description,
        priority: form.priority,
        status: form.status,
        due: form.due ? new Date(form.due).toISOString() : undefined,
        assigneeIds: form.assigneeIds,
        assigners: form.assigners
          ? form.assigners.split(",").map((s) => s.trim())
          : undefined,
        messageId: form.messageId ? Number(form.messageId) : undefined,
      });
      toast.success("Cập nhật thành công.");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm("Bạn có chắc chắn muốn xóa công việc này?")) {
      return;
    }

    try {
      await tasksService.remove(Number(id));
      toast.success("Xóa công việc thành công.");
      navigate("/admin/tasks/list");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Xóa công việc thất bại.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="border-brand-500 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/tasks/list")}
            className="dark:bg-navy-800 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 active:scale-95 dark:text-white"
          >
            <MdArrowBack className="h-6 w-6" />
          </button>
          <h3 className="text-navy-700 text-2xl font-bold dark:text-white">
            Chi tiết công việc
          </h3>
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-500 transition-all hover:bg-red-100 active:scale-95 dark:bg-red-500/10 dark:hover:bg-red-500/20"
        >
          <MdDeleteOutline className="h-5 w-5" />
          Xóa công việc
        </button>
      </div>

      <Card extra="p-6">
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-navy-700 ml-3 text-sm font-bold dark:text-white">
                Tên công việc
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:border-white/10 dark:text-white"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-navy-700 ml-3 text-sm font-bold dark:text-white">
                Hạn chót
              </label>
              <input
                type="datetime-local"
                value={form.due}
                onChange={(e) => setForm({ ...form, due: e.target.value })}
                className="mt-1 flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-navy-700 ml-3 text-sm font-bold dark:text-white">
                Độ ưu tiên
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as TaskPriority })
                }
                className="mt-1 flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:border-white/10 dark:text-white"
              >
                <option value={TaskPriority.Low}>Thấp</option>
                <option value={TaskPriority.Medium}>Trung bình</option>
                <option value={TaskPriority.High}>Cao</option>
                <option value={TaskPriority.Urgent}>Khẩn cấp</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-navy-700 ml-3 text-sm font-bold dark:text-white">
                Trạng thái
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as TaskStatus })
                }
                className="mt-1 flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:border-white/10 dark:text-white"
              >
                <option value={TaskStatus.Todo}>Cần làm</option>
                <option value={TaskStatus.Doing}>Đang làm</option>
                <option value={TaskStatus.Done}>Hoàn thành</option>
                <option value={TaskStatus.Cancelled}>Đã hủy</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-navy-700 ml-3 text-sm font-bold dark:text-white">
                Người giao (tổ chức, phòng ban...)
              </label>
              <input
                type="text"
                value={form.assigners}
                onChange={(e) =>
                  setForm({ ...form, assigners: e.target.value })
                }
                placeholder="Ví dụ: Khoa CNTT, Phòng Đào Tạo (cách nhau bởi dấu phẩy)"
                className="mt-1 flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-navy-700 ml-3 text-sm font-bold dark:text-white">
                Mã tin nhắn (nếu có)
              </label>
              <input
                type="number"
                value={form.messageId}
                onChange={(e) =>
                  setForm({ ...form, messageId: e.target.value })
                }
                placeholder="Nhập mã tin nhắn..."
                className="mt-1 flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-navy-700 ml-3 text-sm font-bold dark:text-white">
              Phân công cho
            </label>
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {users.map((user) => (
                <label
                  key={user.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all ${
                    form.assigneeIds.includes(user.id)
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-gray-100 dark:border-white/5"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={form.assigneeIds.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({
                          ...form,
                          assigneeIds: [...form.assigneeIds, user.id],
                        });
                      } else {
                        setForm({
                          ...form,
                          assigneeIds: form.assigneeIds.filter(
                            (id) => id !== user.id,
                          ),
                        });
                      }
                    }}
                  />
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="bg-brand-500 flex h-full w-full items-center justify-center text-xs font-bold text-white">
                        {(user.name || user.email)[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-navy-700 truncate text-sm font-bold dark:text-white">
                      {user.name || user.email}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {user.email}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <RichTextEditor
              label="Mô tả công việc"
              value={form.description}
              onChange={(val) => setForm({ ...form, description: val })}
            />
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/tasks/list")}
              className="rounded-xl px-6 py-3 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-500 hover:bg-brand-600 flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white transition-all disabled:opacity-50"
            >
              <MdSave className="h-5 w-5" />
              {saving ? "Đang lưu..." : "Cập nhật thành công"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TaskDetailPage;
