import Drawer from "@/components/drawer/Drawer";
import DetailFormLayout, { FormRow, DetailFormSection } from "@/components/layouts/DetailFormLayout";
import YearRangeField from "@/components/fields/YearRangeField";
import type { FAQ, YearRange } from "@/types/faqs";
import { faqsService } from "@/services/documents/faqs.service";
import { formatDate } from "@/utils/date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import { useEffect, useState } from "react";
import { FAQFormFields } from "./FAQFormFields";
import { MdDeleteOutline, MdSave } from "react-icons/md";
import ConfirmModal from "@/components/modal/ConfirmModal";

interface FAQDetailDrawerProps {
  id?: string;
  open: boolean;
  onClose: () => void;
  onFAQChanged?: (updated: FAQ) => void;
  onFAQDeleted?: (id: string) => void;
}

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
    academicYear?: YearRange;
    enrollmentYear?: YearRange;
    isActive?: boolean;
  }>({});

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { data: faq, isLoading } = useQuery({
    queryKey: ["faq", id],
    queryFn: () => faqsService.getFAQ(id!),
    enabled: !!id && open,
  });

  // Reset edits when switching to a different item or closing
  useEffect(() => {
    if (!open || !id) {
      setEdits({});
      setErrors({});
    }
  }, [id, open]);

  // Derive form values: user edits override faq data
  const meta = faq?.metadataFilter;
  const question = edits.question ?? faq?.question ?? "";
  const answer = edits.answer ?? faq?.answerRichText ?? "";
  const academicYear = edits.academicYear ?? meta?.academicYear ?? { fromYear: 0, toYear: 9999 };
  const enrollmentYear = edits.enrollmentYear ?? meta?.enrollmentYear ?? { fromYear: 0, toYear: 9999 };
  const isActive = edits.isActive ?? faq?.isActive ?? true;

  const isDirty =
    faq &&
    (question !== faq.question ||
      answer !== faq.answerRichText ||
      academicYear.fromYear !== meta?.academicYear.fromYear ||
      academicYear.toYear !== meta?.academicYear.toYear ||
      enrollmentYear.fromYear !== meta?.enrollmentYear.fromYear ||
      enrollmentYear.toYear !== meta?.enrollmentYear.toYear ||
      isActive !== faq.isActive);

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: () =>
      faqsService.updateFAQ(id!, {
        question,
        answer,
        academicYear,
        enrollmentYear,
        isActive,
      }),
    onSuccess: (updated) => {
      toast.success("Cập nhật câu hỏi thành công");
      // Invalidate list and update specific item cache
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      queryClient.setQueryData(["faq", id], updated);
      
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
      <Drawer 
        isOpen={open} 
        onClose={onClose} 
        title="Chi tiết câu hỏi thường gặp"
        footerRight={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={!faq || isLoading || isUpdating || isDeleting}
              title={isDeleting ? "Đang xóa..." : "Xóa"}
              aria-label={isDeleting ? "Đang xóa..." : "Xóa"}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
            >
              <MdDeleteOutline className="h-4 w-4" />
            </button>
          </div>
        }
      >
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
                academicYear={academicYear}
                enrollmentYear={enrollmentYear}
                onQuestionChange={(val) => setEdits((p) => ({ ...p, question: val }))}
                onAnswerChange={(val) => setEdits((p) => ({ ...p, answer: val }))}
                onAcademicYearChange={(val) => setEdits((p) => ({ ...p, academicYear: val }))}
                onEnrollmentYearChange={(val) => setEdits((p) => ({ ...p, enrollmentYear: val }))}
                errors={errors}
                disabled={isUpdating || isDeleting}
              />

               {isDirty && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!faq || isLoading || isUpdating || isDeleting}
                    className="bg-brand-500 hover:bg-brand-600 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                  >
                    <MdSave className="h-4 w-4" />
                    {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              )}

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
