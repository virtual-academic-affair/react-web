import Drawer from "@/components/drawer/Drawer";
import RichTextEditor from "@/components/fields/RichTextEditor";
import Switch from "@/components/switch";
import { cancelReasonsService } from "@/services/class-registration";
import type {
  CancelReason,
  CreateCancelReasonDto,
} from "@/types/classRegistration";
import { formatDate } from "@/utils/date";
import { plainTextFromHtml } from "@/utils/html";
import { message as toast } from "antd";
import React from "react";
import { MdSave } from "react-icons/md";

interface CancelReasonDrawerProps {
  reasonId: number | null;
  initialReason: CancelReason | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (reason: CancelReason, mode: "create" | "edit") => void;
}

const CancelReasonDrawer: React.FC<CancelReasonDrawerProps> = ({
  reasonId,
  initialReason,
  isOpen,
  onClose,
  onSaved,
}) => {
  const isEdit = Boolean(reasonId);
  const [content, setContent] = React.useState(initialReason?.content ?? "");
  const [isActive, setIsActive] = React.useState<boolean>(
    initialReason?.isActive ?? true,
  );
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setContent(initialReason?.content ?? "");
    setIsActive(initialReason?.isActive ?? true);
  }, [initialReason]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plainTextFromHtml(content)) {
      toast.error("Vui lòng nhập nội dung ghi chú nhanh.");
      return;
    }

    const payload = content.trim();

    setSaving(true);
    try {
      if (isEdit && reasonId != null) {
        const updated = await cancelReasonsService.update(reasonId, {
          content: payload,
          isActive,
        });
        onSaved(updated, "edit");
      } else {
        const dto: CreateCancelReasonDto = {
          content: payload,
          isActive,
        };
        const created = await cancelReasonsService.create(dto);
        onSaved(created, "create");
      }
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Lưu thất bại. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const isDirty = React.useMemo(() => {
    if (!isEdit) {
      return plainTextFromHtml(content) !== "" || isActive !== true;
    }
    return (
      content !== (initialReason?.content ?? "") ||
      isActive !== (initialReason?.isActive ?? true)
    );
  }, [isEdit, content, isActive, initialReason]);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Chỉnh sửa ghi chú nhanh" : "Thêm ghi chú nhanh"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Nội dung */}
        <div className="flex items-start gap-6">
          <div className="w-40 shrink-0">
            <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              Nội dung
            </p>
          </div>
          <div className="flex-1">
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Soạn nội dung ghi chú nhanh…"
            />
          </div>
        </div>

        {/* Trạng thái hiển thị */}
        <div className="flex items-center gap-6">
          <div className="w-40 shrink-0">
            <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              Trạng thái hiển thị
            </p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Switch
                checked={isActive}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setIsActive(e.target.checked)
                }
              />
            </div>
          </div>
        </div>

        {isDirty && (
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (isEdit && initialReason) {
                  setContent(initialReason.content);
                  setIsActive(initialReason.isActive);
                } else {
                  setContent("");
                  setIsActive(true);
                }
              }}
              className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              <MdSave className="h-4 w-4" />
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        )}

        {/* Thông số kỹ thuật (chỉ edit) */}
        {initialReason && (
          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/10">
            <p className="text-navy-700 mb-3 text-xs font-semibold tracking-wide uppercase dark:text-white">
              Thông số kỹ thuật
            </p>
            <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-6">
                <div className="w-40 shrink-0">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    ID
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-navy-700 text-base dark:text-white">
                    {initialReason.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-40 shrink-0">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Chỉnh sửa lần cuối
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-navy-700 text-base dark:text-white">
                    {formatDate(initialReason.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </Drawer>
  );
};

export default CancelReasonDrawer;
