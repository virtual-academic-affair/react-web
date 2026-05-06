import Drawer from "@/components/drawer/Drawer";
import DetailFormLayout from "@/components/layouts/DetailFormLayout";
import { faqsService } from "@/services/documents/faqs.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import { useState, useEffect } from "react";
import YearRangeField from "@/components/fields/YearRangeField";
import { FAQFormFields } from "./FAQFormFields";

interface FAQCreationDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function FAQCreationDrawer({
  open,
  onClose,
}: FAQCreationDrawerProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    academicYear: { fromYear: 0, toYear: 9999 },
    enrollmentYear: { fromYear: 0, toYear: 9999 },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: create, isPending } = useMutation({
    mutationFn: () =>
      faqsService.createFAQ({
        question: formData.question,
        answer: formData.answer,
        academicYear: formData.academicYear,
        enrollmentYear: formData.enrollmentYear,
      }),
    onSuccess: () => {
      toast.success("Thêm câu hỏi thành công");
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Lỗi khi thêm câu hỏi");
    },
  });

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setFormData({
        question: "",
        answer: "",
        academicYear: { fromYear: 0, toYear: 9999 },
        enrollmentYear: { fromYear: 0, toYear: 9999 },
      });
      setErrors({});
    }
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.question.trim()) newErrors.question = "Vui lòng nhập câu hỏi";
    if (!formData.answer.trim() || formData.answer === "<p></p>")
      newErrors.answer = "Vui lòng nhập câu trả lời";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    create();
  };

  return (
    <Drawer isOpen={open} onClose={handleClose} title="Thêm câu hỏi thường gặp">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <DetailFormLayout>
          <FAQFormFields
            question={formData.question}
            answer={formData.answer}
            onQuestionChange={(val) => setFormData((p) => ({ ...p, question: val }))}
            onAnswerChange={(val) => setFormData((p) => ({ ...p, answer: val }))}
            errors={errors}
            disabled={isPending}
          />

          <div className="flex flex-col gap-4 mt-4">
            <YearRangeField
              label="Năm học áp dụng"
              value={formData.academicYear}
              onChange={(val) => setFormData((p) => ({ ...p, academicYear: val }))}
              disabled={isPending}
            />
            <YearRangeField
              label="Niên khóa áp dụng (Khóa tuyển sinh)"
              value={formData.enrollmentYear}
              onChange={(val) => setFormData((p) => ({ ...p, enrollmentYear: val }))}
              disabled={isPending}
            />
          </div>
        </DetailFormLayout>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="bg-brand-500 hover:bg-brand-600 rounded-xl px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isPending ? "Đang thêm..." : "Thêm"}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
