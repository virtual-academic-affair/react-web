import RichTextEditor from "@/components/fields/RichTextEditor";
import { FormRow } from "@/components/layouts/DetailFormLayout";


interface FAQFormFieldsProps {
  question: string;
  answer: string;
  onQuestionChange: (val: string) => void;
  onAnswerChange: (val: string) => void;
  errors?: {
    question?: string;
    answer?: string;
  };
  disabled?: boolean;
}

const inputCls = (hasError?: string) =>
  `w-full rounded-2xl border bg-transparent px-3 py-2 outline-none dark:text-white ${
    hasError ? "border-red-400 dark:border-red-400" : "border-gray-200 dark:border-white/10"
  }`;

export function FAQFormFields({
  question,
  answer,
  onQuestionChange,
  onAnswerChange,
  errors,
  disabled,
}: FAQFormFieldsProps) {
  return (
    <>
      <FormRow label="Câu hỏi" required={true}>
        <div className="flex flex-col gap-1">
          <textarea
            placeholder="Nhập câu hỏi..."
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            disabled={disabled}
            className={`${inputCls(errors?.question)} min-h-[100px] resize-none`}
          />
          {errors?.question && <p className="text-xs text-red-500">{errors.question}</p>}
        </div>
      </FormRow>

      <FormRow label="Câu trả lời" required={true}>
        <div className="flex flex-col gap-1">
          <RichTextEditor
            value={answer}
            onChange={onAnswerChange}
            placeholder="Nhập câu trả lời chi tiết..."
            error={errors?.answer}
            disabled={disabled}
          />
        </div>
      </FormRow>
    </>
  );
}
