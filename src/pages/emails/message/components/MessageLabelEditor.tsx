import Checkbox from "@/components/checkbox";
import StandardModal from "@/components/modal/StandardModal";
import Tag from "@/components/tag/Tag";
import { messagesService } from "@/services/email";
import type { Message, SystemLabel } from "@/types/email";
import type { SystemLabelEnumData } from "@/types/shared";
import { message as toast } from "antd";

import Tooltip from "@/components/tooltip/Tooltip";
import React from "react";
import { createPortal } from "react-dom";
import { MdExpandMore, MdWarningAmber } from "react-icons/md";

import { useNavigate } from "react-router-dom";
import { getLabelColor, getLabelVi } from "../labelUtils";
import SystemLabelSelector from "./SystemLabelSelector";

interface MessageLabelEditorProps {
  message: Message;
  systemLabelEnum?: SystemLabelEnumData | null;
  onLabelChanged?: (id: number, labels: SystemLabel[]) => void;
  isProcessing?: boolean;
}

const MessageLabelEditor: React.FC<MessageLabelEditorProps> = ({
  message,
  systemLabelEnum,
  onLabelChanged,
  isProcessing,
}) => {
  const navigate = useNavigate();
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [draftLabels, setDraftLabels] = React.useState<SystemLabel[]>([]);
  const [dropdownPos, setDropdownPos] = React.useState({ top: 0, left: 0 });
  const [saving, setSaving] = React.useState(false);

  // Warning Modal State
  const [warningModalOpen, setWarningModalOpen] = React.useState(false);
  const [removedClassRegOrInquiry, setRemovedClassRegOrInquiry] =
    React.useState(false);
  const [removedTask, setRemovedTask] = React.useState(false);
  const [deleteTasks, setDeleteTasks] = React.useState(false);

  const openEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    setEditingId(message.id);
    setDraftLabels([...(message.systemLabels ?? [])]);
  };

  const closeEdit = () => {
    setEditingId(null);
    setDraftLabels([]);
  };

  const attemptSave = () => {
    const originalLabels = message.systemLabels ?? [];
    const removedLabels = originalLabels.filter(
      (l) => !draftLabels.includes(l),
    );

    const removingRegOrInq =
      removedLabels.includes("classRegistration") ||
      removedLabels.includes("inquiry");
    const removingTask = removedLabels.includes("task");

    if (removingRegOrInq || removingTask) {
      setRemovedClassRegOrInquiry(removingRegOrInq);
      setRemovedTask(removingTask);
      setDeleteTasks(false); // Reset checkbox
      setWarningModalOpen(true);
    } else {
      saveLabels(editingId, false);
    }
  };

  const saveLabels = async (msgId: number | null, doDeleteTasks: boolean) => {
    if (msgId === null) return;
    setSaving(true);
    setWarningModalOpen(false);
    try {
      await messagesService.updateMessageLabels(msgId, {
        systemLabels: draftLabels,
        deleteTasks: doDeleteTasks,
      });
      toast.success("Cập nhật thành công.");
      closeEdit();
      onLabelChanged?.(msgId, draftLabels);
    } catch {
      toast.error("Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleLabelClick = (sl: SystemLabel) => {
    const params = new URLSearchParams();
    params.set("messageId", String(message.id));
    if (message.subject) {
      params.set("name", message.subject);
    }

    if (sl === "classRegistration") {
      if ((message.hasClassRegistration ?? 0) > 0) {
        navigate(
          `/admin/class-registration/registrations?${params.toString()}`,
        );
      } else {
        navigate(`/admin/class-registration/create?${params.toString()}`);
      }
    } else if (sl === "inquiry") {
      if ((message.hasInquiry ?? 0) > 0) {
        navigate(`/admin/inquiry/inquiries?${params.toString()}`);
      } else {
        navigate(`/admin/inquiry/create?${params.toString()}`);
      }
    } else if (sl === "task") {
      if ((message.tasksCount ?? 0) > 0) {
        navigate(`/admin/tasks/list?${params.toString()}`);
      } else {
        navigate(`/admin/tasks/create?${params.toString()}`);
      }
    }
  };

  return (
    <>
      <div className="message-label-column relative z-1 flex flex-wrap items-center gap-1">
        {isProcessing &&
        (!message.systemLabels || message.systemLabels.length === 0) ? (
          <Tooltip label="Đang gắn nhãn tự động...">
            <div className="mr-2 h-4 w-32 overflow-hidden rounded-full bg-purple-600">
              <div
                className="h-full w-full bg-gradient-to-br from-purple-600 via-indigo-500 to-pink-500"
                style={{
                  backgroundSize: "400% 400%",
                  animation: "mesh-shuffle 3s ease infinite",
                }}
              />
              <style>{`
@keyframes mesh-shuffle {
0%   { background-position: 0% 50%; }
25%  { background-position: 100% 10%; }
50%  { background-position: 40% 100%; }
75%  { background-position: 90% 40%; }
100% { background-position: 0% 50%; }
}
`}</style>
            </div>
          </Tooltip>
        ) : message.systemLabels?.length ? (
          message.systemLabels.map((sl) => {
            let count = 0;
            const isBusinessLabel = [
              "task",
              "inquiry",
              "classRegistration",
            ].includes(sl);

            if (sl === "task") count = message.tasksCount ?? 0;
            if (sl === "inquiry") count = message.hasInquiry ?? 0;
            if (sl === "classRegistration")
              count = message.hasClassRegistration ?? 0;

            const tooltipText =
              count > 0 ? `Xem (${count} bản ghi)` : "Chưa có - Click để tạo";

            const pill = (
              <Tag
                color={getLabelColor(sl, systemLabelEnum)}
                onClick={() => handleLabelClick(sl)}
                className={`message-system-label-tag-${sl}`}
              >
                {getLabelVi(sl, systemLabelEnum)}
              </Tag>
            );

            if (isBusinessLabel) {
              return (
                <Tooltip key={sl} label={tooltipText}>
                  {pill}
                </Tooltip>
              );
            }

            return <React.Fragment key={sl}>{pill}</React.Fragment>;
          })
        ) : (
          <span className="text-xs text-gray-400 italic">—</span>
        )}
        <button
          type="button"
          onClick={openEdit}
          title="Chỉnh sửa nhãn"
          className="dark:bg-navy-800 message-actions-trigger ml-0.5 inline-flex aspect-square h-5 items-center rounded-lg border border-gray-200 bg-white pr-1.5 pl-1 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 dark:border-white/10 dark:text-gray-300 dark:hover:border-white/20 dark:hover:text-white"
        >
          <span className="sr-only">Chỉnh sửa nhãn</span>
          <MdExpandMore className="h-3.5 w-3.5" />
        </button>
      </div>

      {editingId === message.id &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-200" onClick={closeEdit} />
            <div
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
              className="dark:bg-navy-900 fixed z-210 w-70 max-w-[calc(100vw-24px)] rounded-2xl border border-gray-100 bg-white p-3 shadow-lg dark:border-white/10"
            >
              <p className="mb-2 pl-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Nhãn hệ thống
              </p>
              <SystemLabelSelector
                value={draftLabels}
                onChange={setDraftLabels}
                systemLabelEnum={systemLabelEnum}
                className="flex max-h-44 flex-wrap gap-2 overflow-y-auto p-1"
              />
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-xl px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={attemptSave}
                  disabled={saving}
                  className="bg-brand-500 hover:bg-brand-600 message-labels-save-btn rounded-xl px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}

      <StandardModal
        open={warningModalOpen}
        onCancel={() => setWarningModalOpen(false)}
        onConfirm={() => saveLabels(message.id, deleteTasks)}
        title={<div className="flex items-center gap-2">Cảnh báo gỡ nhãn</div>}
        confirmText="Tiếp tục"
        confirmColor="bg-red-500 hover:bg-red-600"
        loading={saving}
      >
        <div className="flex flex-col gap-6">
          {removedClassRegOrInquiry && (
            <div className="flex gap-4 rounded-2xl bg-red-50 p-4 dark:bg-red-500/10">
              <div className="shrink-0 pt-0.5">
                <MdWarningAmber className="h-6 w-6 text-red-500" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-base font-bold text-red-800 dark:text-red-200">
                  Xóa dữ liệu liên quan
                </p>
                <p className="text-sm leading-relaxed text-red-700/80 dark:text-red-200/70">
                  Bạn đang gỡ nhãn <strong>Đăng ký môn học</strong> hoặc{" "}
                  <strong>Thắc mắc</strong>. Hành động này sẽ{" "}
                  <strong className="font-bold">xóa vĩnh viễn</strong> bản ghi
                  tương ứng khỏi hệ thống.
                </p>
              </div>
            </div>
          )}

          {removedTask && (
            <div className="flex flex-col gap-3">
              <label className="flex cursor-pointer items-start gap-3 px-1">
                <Checkbox
                  checked={deleteTasks}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDeleteTasks(e.target.checked)
                  }
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-navy-700 text-sm dark:text-white">
                    Xóa các công việc được tạo từ email này.
                  </span>
                </div>
              </label>
            </div>
          )}
        </div>
      </StandardModal>
    </>
  );
};

export default MessageLabelEditor;
