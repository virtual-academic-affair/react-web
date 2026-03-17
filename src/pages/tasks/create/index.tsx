import CreatePageLayout from "@/components/layouts/CreatePageLayout";
import RichTextEditor from "@/components/fields/RichTextEditor";
import { tasksService } from "@/services/tasks.service";
import { usersService } from "@/services/users/users.service";
import { TaskPriority, TaskStatus } from "@/types/task";
import type { User } from "@/types/users";
import { message as toast } from "antd";
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TaskProcessSteps from "./components/TaskProcessSteps";
import TaskStatusSelector from "../list/components/TaskStatusSelector";
import TaskPrioritySelector from "../list/components/TaskPrioritySelector";
import AssigneeManager from "../components/AssigneeManager";
import { messagesService } from "@/services/email/messages.service";
import type { Message } from "@/types/email";
import RelatedMessageView from "../../emails/message/components/RelatedMessageView";

const TaskCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [users, setUsers] = React.useState<User[]>([]);
  const [message, setMessage] = React.useState<Message | null>(null);
  const [messageLoading, setMessageLoading] = React.useState(false);
  const [form, setForm] = React.useState<{
    name: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    due: string;
    assigneeIds: number[];
    assigners: string;
    messageId?: number;
  }>({
    name: searchParams.get("name") ?? "",
    description: "",
    priority: TaskPriority.Medium,
    status: TaskStatus.Todo,
    due: "",
    assigneeIds: [],
    assigners: "",
    messageId: searchParams.get("messageId")
      ? Number(searchParams.get("messageId"))
      : undefined,
  });

  React.useEffect(() => {
    const dueParam = searchParams.get("due");
    if (dueParam) {
      setForm((prev) => ({ ...prev, due: `${dueParam}T23:59` }));
    }

    const mId = searchParams.get("messageId");
    if (mId) {
      setMessageLoading(true);
      messagesService
        .getMessageById(Number(mId))
        .then((m) => {
          setMessage(m);
          setForm((prev) => ({
            ...prev,
            messageId: m.id,
            name: prev.name || m.subject || "",
          }));
        })
        .catch(() => toast.error("Không thể tải thông tin tin nhắn."))
        .finally(() => setMessageLoading(false));
    }
  }, [searchParams]);

  React.useEffect(() => {
    usersService
      .getUsers({ roles: ["admin"], limit: 100 })
      .then((resp) => setUsers(resp.items))
      .catch(() => toast.error("Không thể tải danh sách người quản trị."));
  }, []);

  const validateStep1 = () => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên công việc.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else {
      if (currentStep === 2) {
        setCurrentStep(3);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1()) {
      return;
    }

    setLoading(true);
    try {
      await tasksService.create({
        name: form.name,
        description: form.description,
        priority: form.priority,
        status: form.status,
        due: form.due ? new Date(form.due).toISOString() : undefined,
        assigneeIds: form.assigneeIds,
        assigners: form.assigners
          ? form.assigners.split(",").map((s) => s.trim())
          : undefined,
        messageId: form.messageId,
      });
      toast.success("Tạo công việc thành công.");
      navigate("/admin/tasks/list");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Tạo công việc thất bại.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CreatePageLayout
      title="Tạo công việc mới"
      processSteps={<TaskProcessSteps currentStep={currentStep} />}
    >
      <RelatedMessageView
        message={message}
        loading={messageLoading}
        onReselect={() => navigate("/admin/emails/message")}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (currentStep === 3) {
            handleSubmit();
          } else {
            handleNext();
          }
        }}
      >
        {/* Step 1: Thông tin công việc */}
        {currentStep === 1 && (
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
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nhập tên công việc..."
                  className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
                  required
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

            {/* Người giao */}
            <div className="flex items-center gap-6">
              <div className="w-40 shrink-0">
                <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Người giao
                </p>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={form.assigners}
                  onChange={(e) =>
                    setForm({ ...form, assigners: e.target.value })
                  }
                  placeholder="Ví dụ: Khoa CNTT, Phòng Đào Tạo..."
                  className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Mô tả công việc */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-6">
              <div className="w-40 shrink-0">
                <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Mô tả công việc
                </p>
              </div>
              <div className="flex-1">
                <RichTextEditor
                  value={form.description}
                  onChange={(val) => setForm({ ...form, description: val })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Phân công */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-6 py-4">
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
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex justify-end gap-2">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              disabled={loading}
              className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
            >
              Quay lại
            </button>
          )}
          {currentStep < 3 ? (
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              Tiếp theo
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              {loading ? "Đang tạo..." : "Tạo công việc mới"}
            </button>
          )}
        </div>
      </form>
    </CreatePageLayout>
  );
};

export default TaskCreatePage;
