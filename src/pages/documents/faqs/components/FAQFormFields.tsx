import { formInputClassWithError } from "@/components/fields/formInputClass";
import RichTextEditor from "@/components/fields/RichTextEditor";
import YearRangeField from "@/components/fields/YearRangeField";
import { FormRow } from "@/components/layouts/DetailFormLayout";
import Switch from "@/components/switch";
import type { YearRange } from "@/types/faqs";
import type { ChangeEvent } from "react";

interface FAQFormFieldsProps {
  question: string;
  answer: string;
  lecturerOnly?: boolean;
  academicYear: YearRange;
  enrollmentYear: YearRange;
  onQuestionChange: (val: string) => void;
  onAnswerChange: (val: string) => void;
  onLecturerOnlyChange?: (val: boolean) => void;
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
  lecturerOnly,
  academicYear,
  enrollmentYear,
  onQuestionChange,
  onAnswerChange,
  onLecturerOnlyChange,
  onAcademicYearChange,
  onEnrollmentYearChange,
  errors,
  disabled,
}: FAQFormFieldsProps) {
  const showLecturerOnly = typeof onLecturerOnlyChange === "function";
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

      {showLecturerOnly && (
        <FormRow label="Chỉ giảng viên">
          <Switch
            checked={Boolean(lecturerOnly)}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onLecturerOnlyChange?.(e.target.checked)
            }
            disabled={disabled}
            color="red"
          />
        </FormRow>
      )}

      <FormRow label="Năm học" className="pb-5">
        <YearRangeField
          value={academicYear}
          onChange={onAcademicYearChange}
          disabled={disabled}
        />
      </FormRow>

      <FormRow label="Khóa tuyển sinh" className="pb-5">
        <YearRangeField
          value={enrollmentYear}
          onChange={onEnrollmentYearChange}
          disabled={disabled}
        />
      </FormRow>
    </>
  );
}
