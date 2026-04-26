import { FormRow } from "@/components/layouts/DetailFormLayout";
import React from "react";

export interface StudentFormValue {
  studentCode: string;
  studentName: string;
}

interface StudentFormFieldsProps {
  value: StudentFormValue;
  onChange: (next: StudentFormValue) => void;
  disabled?: boolean;
  labelWidthClassName?: string;
  errors?: Partial<Record<keyof StudentFormValue, string>>;
}

const StudentFormFields: React.FC<StudentFormFieldsProps> = ({
  value,
  onChange,
  disabled = false,
  labelWidthClassName = "w-40",
  errors,
}) => {
  return (
    <>
      <FormRow
        label="MSSV"
        labelWidthClassName={labelWidthClassName}
        required={true}
      >
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={value.studentCode}
              onChange={(e) =>
                onChange({
                  ...value,
                  studentCode: e.target.value,
                })
              }
              disabled={disabled}
              className={`w-full rounded-2xl border bg-transparent px-3 py-2 outline-none dark:text-white ${
                errors?.studentCode
                  ? "border-red-400 dark:border-red-400"
                  : "border-gray-200 dark:border-white/10"
              }`}
            />
            {errors?.studentCode && (
              <p className="text-xs text-red-500">{errors.studentCode}</p>
            )}
          </div>
      </FormRow>

      <FormRow
        label="Họ tên"
        labelWidthClassName={labelWidthClassName}
        required={true}
      >
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={value.studentName}
              onChange={(e) =>
                onChange({
                  ...value,
                  studentName: e.target.value,
                })
              }
              disabled={disabled}
              className={`w-full rounded-2xl border bg-transparent px-3 py-2 outline-none dark:text-white ${
                errors?.studentName
                  ? "border-red-400 dark:border-red-400"
                  : "border-gray-200 dark:border-white/10"
              }`}
            />
            {errors?.studentName && (
              <p className="text-xs text-red-500">{errors.studentName}</p>
            )}
          </div>
      </FormRow>
    </>
  );
};

export default StudentFormFields;
