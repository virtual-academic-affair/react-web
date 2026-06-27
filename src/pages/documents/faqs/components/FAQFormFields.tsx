import RichTextEditor from "@/components/fields/RichTextEditor";
import { formInputClassWithError } from "@/components/fields/formInputClass";
import YearRangeField from "@/components/fields/YearRangeField";
import { FormRow } from "@/components/layouts/DetailFormLayout";
import type { YearRange } from "@/types/faqs";

interface FAQFormFieldsProps {
  question: string;
  answer: string;
  academicYear: YearRange;
  enrollmentYear: YearRange;
  onQuestionChange: (val: string) => void;
  onAnswerChange: (val: string) => void;
  onAcademicYearChange: (val: YearRange) => void;
  onEnrollmentYearChange: (val: YearRange) => void;
  errors?: {
    question?: string;
    answer?: string;
  };
  disabled?: boolean;
}

export function FAQFormFields({
  question,
  answer,
  academicYear,
  enrollmentYear,
  onQuestionChange,
  onAnswerChange,
  onAcademicYearChange,
  onEnrollmentYearChange,
  errors,
  disabled,
}: FAQFormFieldsProps) {
  return (
    <>
      <FormRow alignTop label="Câu hỏi" required={true}>
        <div className="flex min-w-0 flex-col gap-1">
          <textarea
            placeholder="Nhập câu hỏi (ít nhất 5 kí tự)..."
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            disabled={disabled}
            className={`${formInputClassWithError(errors?.question)} min-h-[100px] resize-none`}
          />
          {errors?.question && (
            <p className="text-xs text-red-500">{errors.question}</p>
          )}
        </div>
      </FormRow>

      <FormRow alignTop label="Câu trả lời" required={true}>
        <div className="flex min-w-0 flex-col gap-1">
          <RichTextEditor
            value={answer}
            onChange={onAnswerChange}
            placeholder="Nhập câu trả lời chi tiết..."
            error={errors?.answer}
            disabled={disabled}
          />
        </div>
      </FormRow>

      <FormRow label="Năm học áp dụng">
        <YearRangeField
          value={academicYear}
          onChange={onAcademicYearChange}
          disabled={disabled}
        />
      </FormRow>

      <FormRow label="Niên khóa áp dụng">
        <YearRangeField
          value={enrollmentYear}
          onChange={onEnrollmentYearChange}
          disabled={disabled}
        />
      </FormRow>
    </>
  );
}
