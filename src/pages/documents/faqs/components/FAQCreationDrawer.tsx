import Drawer from "@/components/drawer/Drawer";
import DetailFormLayout, { FormRow } from "@/components/layouts/DetailFormLayout";
import { faqsService } from "@/services/documents/faqs.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import { useState } from "react";
import { FAQFormFields } from "./FAQFormFields";

interface FAQCreationDrawerProps {
  open: boolean;
  onClose: () => void;
}

const inputCls = `w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white`;

export default function FAQCreationDrawer({
  open,
  onClose,
}: FAQCreationDrawerProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    academicYear: "all",
    cohort: "all",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: create, isPending } = useMutation({
    mutationFn: () =>
      faqsService.createFAQ({
        question: formData.question,
        answer: formData.answer,
        academicYear: formData.academicYear !== "all" ? formData.academicYear : undefined,
        cohort: formData.cohort !== "all" ? formData.cohort : undefined,
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

  const handleClose = () => {
    setFormData({
      question: "",
      answer: "",
      academicYear: "all",
      cohort: "all",
    });
    setErrors({});
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

          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormRow label="Năm học">
              <input
                type="text"
                placeholder="2023-2024"
                value={formData.academicYear}
                onChange={(e) => setFormData(p => ({ ...p, academicYear: e.target.value }))}
                disabled={isPending}
                className={inputCls}
              />
            </FormRow>
            <FormRow label="Niên khóa">
              <input
                type="text"
                placeholder="K21"
                value={formData.cohort}
                onChange={(e) => setFormData(p => ({ ...p, cohort: e.target.value }))}
                disabled={isPending}
                className={inputCls}
              />
            </FormRow>
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
