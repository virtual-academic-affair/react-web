import Drawer from "@/components/drawer/Drawer";
import DetailFormLayout, { FormRow, DetailFormSection } from "@/components/layouts/DetailFormLayout";
import YearRangeField from "@/components/fields/YearRangeField";
import type { FAQCandidate, YearRange } from "@/types/faqs";
import { faqsService } from "@/services/documents/faqs.service";
import { formatDate } from "@/utils/date";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import { useEffect, useState } from "react";
import { FAQFormFields } from "./FAQFormFields";

interface CandidateDetailDrawerProps {
  candidate?: FAQCandidate;
  open: boolean;
  onClose: () => void;
}

export default function CandidateDetailDrawer({
  candidate,
  open,
  onClose,
}: CandidateDetailDrawerProps) {
  const queryClient = useQueryClient();

  // Track only user's edits — NOT a copy of candidate data
  const [edits, setEdits] = useState<{
    question?: string;
    answer?: string;
    academicYear?: YearRange;
    enrollmentYear?: YearRange;
  }>({});

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset edits when candidate changes
  useEffect(() => {
    setEdits({});
    setErrors({});
  }, [candidate?.candidateId || candidate?.id]);

  // Derive form values: user edits override candidate data
  const meta = candidate?.metadataFilterSuggestion;
  const question = edits.question ?? candidate?.question ?? "";
  const answer = edits.answer ?? candidate?.answerDraftRichText ?? "";
  const academicYear = edits.academicYear ?? meta?.academicYear ?? { fromYear: 0, toYear: 9999 };
  const enrollmentYear = edits.enrollmentYear ?? meta?.enrollmentYear ?? { fromYear: 0, toYear: 9999 };

  const { mutate: review, isPending } = useMutation({
    mutationFn: (action: "approve" | "reject") =>
      faqsService.reviewCandidate(candidate!.id, action, {
        question,
        answer,
        metadataFilter: {
          academicYear,
          enrollmentYear,
        },
      }),
    onSuccess: (_, action) => {
      toast.success(action === "approve" ? "Đã duyệt và thêm vào FAQ" : "Đã từ chối đề xuất");
      
      // Simple invalidation instead of manual cache update
      queryClient.invalidateQueries({ queryKey: ["faq-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Lỗi khi xử lý đề xuất");
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

    review("approve");
  };

  if (!candidate) return null;

  return (
    <Drawer 
        isOpen={open} 
        onClose={onClose} 
        title="Chi tiết câu hỏi đề xuất"
        footerLeft={
          <button
            type="button"
            onClick={() => review("reject")}
            disabled={isPending || candidate.status !== "pending"}
            className="rounded-xl px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-500/10"
          >
            Từ chối đề xuất
          </button>
        }
        footerRight={
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
              form="candidate-review-form"
              disabled={isPending || candidate.status !== "pending"}
              className="bg-brand-500 hover:bg-brand-600 rounded-xl px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isPending ? "Đang xử lý..." : "Duyệt & Lưu"}
            </button>
          </div>
        }
      >
        <form 
          id="candidate-review-form"
          onSubmit={handleSubmit} 
          className="flex flex-col gap-4"
        >
        <DetailFormLayout>
          <FAQFormFields
            key={candidate?.candidateId || candidate?.id}
            question={question}
            answer={answer}
            onQuestionChange={(val) => setEdits((p) => ({ ...p, question: val }))}
            onAnswerChange={(val) => setEdits((p) => ({ ...p, answer: val }))}
            errors={errors}
            disabled={isPending || candidate.status !== "pending"}
          />

          <div className="flex flex-col gap-4 mt-4">
            <YearRangeField
              label="Năm học áp dụng (Gợi ý)"
              value={academicYear}
              onChange={(val) => setEdits((p) => ({ ...p, academicYear: val }))}
              disabled={isPending || candidate.status !== "pending"}
            />
            <YearRangeField
              label="Niên khóa áp dụng (Gợi ý)"
              value={enrollmentYear}
              onChange={(val) => setEdits((p) => ({ ...p, enrollmentYear: val }))}
              disabled={isPending || candidate.status !== "pending"}
            />
          </div>

          <DetailFormSection title="Thông số kỹ thuật">
            <div className="flex flex-col gap-2">
              <FormRow label="ID">
                <p className="text-sm font-medium text-navy-700 dark:text-white">{candidate.candidateId || candidate.id}</p>
              </FormRow>
              <FormRow label="Ngày tạo">
                <p className="text-sm font-medium text-navy-700 dark:text-white">
                  {formatDate(candidate.createdAt)}
                </p>
              </FormRow>
              <FormRow label="Nguồn tổng hợp">
                <p className="text-sm font-medium text-navy-700 dark:text-white capitalize">
                  {candidate.sourceType === "inquiry_email" ? "Email hỏi đáp" : candidate.sourceType}
                </p>
              </FormRow>
              <FormRow label="Số lượng tương đồng">
                <p className="text-sm font-medium text-navy-700 dark:text-white">
                  {candidate.similarCount} hội thoại
                </p>
              </FormRow>
            </div>
          </DetailFormSection>
        </DetailFormLayout>

      </form>
    </Drawer>
  );
}
