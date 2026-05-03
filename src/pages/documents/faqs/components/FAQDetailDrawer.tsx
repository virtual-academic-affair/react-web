import Drawer from "@/components/drawer/Drawer";
import DetailFormLayout, { FormRow, DetailFormSection } from "@/components/layouts/DetailFormLayout";
import { faqsService } from "@/services/documents/faqs.service";
import type { FAQ } from "@/types/faqs";
import { formatDate } from "@/utils/date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import { useEffect, useState } from "react";
import { FAQFormFields } from "./FAQFormFields";
import ConfirmModal from "@/components/modal/ConfirmModal";

interface FAQDetailDrawerProps {
  id?: string;
  open: boolean;
  onClose: () => void;
  onFAQChanged?: (updated: FAQ) => void;
  onFAQDeleted?: (id: string) => void;
}

const inputCls = `w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white`;

export default function FAQDetailDrawer({
  id,
  open,
  onClose,
  onFAQChanged,
  onFAQDeleted,
}: FAQDetailDrawerProps) {
  const queryClient = useQueryClient();

  // Track only user's edits — NOT a copy of faq data
  const [edits, setEdits] = useState<{
    question?: string;
    answer?: string;
    academicYear?: string;
    cohort?: string;
    isActive?: boolean;
  }>({});

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { data: faq, isLoading } = useQuery({
    queryKey: ["faq", id],
    queryFn: () => faqsService.getFAQ(id!),
    enabled: !!id && open,
  });

  // Reset edits when switching to a different item
  useEffect(() => {
    setEdits({});
    setErrors({});
  }, [id]);

  // Derive form values: user edits override faq data
  const meta = faq?.metadataFilter;
  const question = edits.question ?? faq?.question ?? "";
  const answer = edits.answer ?? faq?.answerRichText ?? "";
  const academicYear = edits.academicYear ?? meta?.academicYear?.[0] ?? "all";
  const cohort = edits.cohort ?? meta?.cohort?.[0] ?? "all";
  const isActive = edits.isActive ?? faq?.isActive ?? true;

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: () =>
      faqsService.updateFAQ(id!, {
        question,
        answer,
        academicYear: academicYear !== "all" ? academicYear : undefined,
        cohort: cohort !== "all" ? cohort : undefined,
        isActive,
      }),
    onSuccess: (updated) => {
      toast.success("Cập nhật câu hỏi thành công");
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      onFAQChanged?.(updated);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Lỗi khi cập nhật câu hỏi");
    },
  });

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: () => faqsService.removeFAQ(id!),
    onSuccess: () => {
      toast.success("Xóa câu hỏi thành công");
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      onFAQDeleted?.(id!);
      setConfirmDeleteOpen(false);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Lỗi khi xóa câu hỏi");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!question.trim()) newErrors.question = "Vui lòng nhập câu hỏi";
    if (!answer.trim() || answer === "<p></p>")
      newErrors.answer = "Vui lòng nhập câu trả lời";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    update();
  };

  return (
    <>
      <Drawer isOpen={open} onClose={onClose} title="Chi tiết câu hỏi thường gặp">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DetailFormLayout>
              <FAQFormFields
                key={id}
                question={question}
                answer={answer}
                onQuestionChange={(val) => setEdits((p) => ({ ...p, question: val }))}
                onAnswerChange={(val) => setEdits((p) => ({ ...p, answer: val }))}
                errors={errors}
                disabled={isUpdating || isDeleting}
              />

              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormRow label="Năm học">
                  <input
                    type="text"
                    placeholder="2023-2024"
                    value={academicYear}
                    onChange={(e) => setEdits(p => ({ ...p, academicYear: e.target.value }))}
                    disabled={isUpdating || isDeleting}
                    className={inputCls}
                  />
                </FormRow>
                <FormRow label="Niên khóa">
                  <input
                    type="text"
                    placeholder="K21"
                    value={cohort}
                    onChange={(e) => setEdits(p => ({ ...p, cohort: e.target.value }))}
                    disabled={isUpdating || isDeleting}
                    className={inputCls}
                  />
                </FormRow>
              </div>

              {faq && (
                <DetailFormSection title="Thông số kỹ thuật">
                  <div className="flex flex-col gap-2">
                    <FormRow label="ID">
                      <p className="text-sm font-medium text-navy-700 dark:text-white">{faq.faqId || faq.id}</p>
                    </FormRow>
                    <FormRow label="Ngày tạo">
                      <p className="text-sm font-medium text-navy-700 dark:text-white">
                        {formatDate(faq.createdAt)}
                      </p>
                    </FormRow>
                    <FormRow label="Cập nhật lần cuối">
                      <p className="text-sm font-medium text-navy-700 dark:text-white">
                        {formatDate(faq.updatedAt)}
                      </p>
                    </FormRow>
                  </div>
                </DetailFormSection>
              )}
            </DetailFormLayout>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-6 dark:border-white/10">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={isUpdating || isDeleting}
                className="rounded-xl px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-500/10"
              >
                Xóa câu hỏi
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || isDeleting}
                  className="bg-brand-500 hover:bg-brand-600 rounded-xl px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {isUpdating ? "Đang cập nhật..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </form>
        )}
      </Drawer>

      <ConfirmModal
        open={confirmDeleteOpen}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => remove()}
        title="Xác nhận xóa"
        subTitle="Bạn có chắc chắn muốn xóa câu hỏi này không? Sau khi xóa sẽ không thể phục hồi lại được dữ liệu."
        confirmText={isDeleting ? "Đang xóa..." : "Xóa hoàn toàn"}
        danger={true}
      />
    </>
  );
}
