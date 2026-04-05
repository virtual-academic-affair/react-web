import CreatePageLayout from "@/components/layouts/CreatePageLayout";
import RichTextEditor from "@/components/fields/RichTextEditor";
import Switch from "@/components/switch";
import { cancelReasonsService } from "@/services/class-registration";
import type { CreateCancelReasonDto } from "@/types/classRegistration";
import { plainTextFromHtml } from "@/utils/html";
import { message as toast } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom";

const CancelReasonCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plainTextFromHtml(content)) {
      toast.error("Vui lòng nhập nội dung ghi chú nhanh.");
      return;
    }

    setSubmitting(true);
    try {
      const dto: CreateCancelReasonDto = {
        content: content.trim(),
        isActive,
      };
      await cancelReasonsService.create(dto);
      toast.success("Đã tạo ghi chú nhanh.");
      navigate("/admin/class-registration/cancel-reasons");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Tạo ghi chú nhanh thất bại. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CreatePageLayout title="Tạo ghi chú nhanh">
      <form onSubmit={handleSubmit}>
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
        <div className="mt-6 flex items-center gap-6">
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

        {/* Submit button */}
        <div className="mt-8 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate("/admin/class-registration/cancel-reasons")}
            disabled={submitting}
            className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
          >
            {submitting ? "Đang tạo..." : "Tạo ghi chú nhanh"}
          </button>
        </div>
      </form>
    </CreatePageLayout>
  );
};

export default CancelReasonCreatePage;
