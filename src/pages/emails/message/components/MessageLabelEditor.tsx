import { messagesService } from "@/services/email";
import type { Message, SystemLabel } from "@/types/email";
import type { SystemLabelEnumData } from "@/types/shared";
import { message as toast } from "antd";
import React from "react";
import { createPortal } from "react-dom";
import { MdExpandMore } from "react-icons/md";
import { getLabelColor, getLabelVi, labelPillStyle } from "../labelUtils";
import SystemLabelSelector from "./SystemLabelSelector";

interface MessageLabelEditorProps {
  message: Message;
  systemLabelEnum?: SystemLabelEnumData | null;
  onLabelChanged?: (id: number, labels: SystemLabel[]) => void;
}

const MessageLabelEditor: React.FC<MessageLabelEditorProps> = ({
  message,
  systemLabelEnum,
  onLabelChanged,
}) => {
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [draftLabels, setDraftLabels] = React.useState<SystemLabel[]>([]);
  const [dropdownPos, setDropdownPos] = React.useState({ top: 0, left: 0 });
  const [saving, setSaving] = React.useState(false);

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

  const saveLabels = async (msgId: number) => {
    setSaving(true);
    try {
      await messagesService.updateMessageLabels(msgId, {
        systemLabels: draftLabels,
      });
      toast.success("Cập nhật nhãn thành công.");
      closeEdit();
      onLabelChanged?.(msgId, draftLabels);
    } catch {
      toast.error("Không thể cập nhật nhãn.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="relative z-1 flex flex-wrap items-center gap-1">
        {message.systemLabels?.length ? (
          message.systemLabels.map((sl) => (
            <span
              key={sl}
              style={labelPillStyle(getLabelColor(sl, systemLabelEnum))}
              className="rounded-full px-2 py-0.5 text-xs font-medium"
            >
              {getLabelVi(sl, systemLabelEnum)}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400 italic">—</span>
        )}
        <button
          type="button"
          onClick={openEdit}
          title="Chỉnh sửa nhãn"
          className="dark:bg-navy-800 ml-0.5 inline-flex aspect-square h-5 items-center rounded-lg border border-gray-200 bg-white pr-1.5 pl-1 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 dark:border-white/10 dark:text-gray-300 dark:hover:border-white/20 dark:hover:text-white"
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
              className="dark:bg-navy-900 fixed z-210 w-[280px] max-w-[calc(100vw-24px)] rounded-2xl border border-gray-100 bg-white p-3 shadow-lg dark:border-white/10"
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
                  onClick={() => saveLabels(editingId)}
                  disabled={saving}
                  className="bg-brand-500 hover:bg-brand-600 rounded-xl px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
};

export default MessageLabelEditor;
