import Card from "@/components/card";
import Switch from "@/components/switch";
import { cancelReasonsService } from "@/services/class-registration";
import type { CreateCancelReasonDto } from "@/types/classRegistration";
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
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung lý do hủy.");
      return;
    }

    setSubmitting(true);
    try {
      const dto: CreateCancelReasonDto = {
        content: content.trim(),
        isActive,
      };
      await cancelReasonsService.create(dto);
      toast.success("Tạo lý do hủy thành công.");
      navigate("/admin/class-registration/cancel-reasons");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Tạo lý do hủy thất bại. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-[84vh] w-full items-start justify-center pt-[25vh] pb-10">
      {/* Background gradient */}
      <div
        className="absolute top-0 h-[45vh] w-full rounded-[20px]"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, var(--color-brand-400), var(--color-brand-600))",
        }}
      />

      {/* Card */}
      <Card extra="relative z-10 w-[850px] max-w-[calc(100vw-48px)] p-8">
        <h2 className="text-navy-700 mb-6 text-2xl font-bold dark:text-white">
          Tạo lý do hủy
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Nội dung */}
          <div className="flex items-start gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Nội dung
              </p>
            </div>
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Nhập nội dung lý do hủy..."
                className="w-full rounded-2xl border border-gray-200 bg-transparent p-3 outline-none dark:border-white/10 dark:text-white"
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
              {submitting ? "Đang tạo..." : "Tạo lý do hủy"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CancelReasonCreatePage;
