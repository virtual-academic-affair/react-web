import RichTextEditor from "@/components/fields/RichTextEditor";
import { FormRow } from "@/components/layouts/DetailFormLayout";
import React from "react";

interface FormFormFieldsProps {
  documentType: string;
  contentLink: string;
  linkDisplayName: string;
  notes: string;
  onDocumentTypeChange: (val: string) => void;
  onContentLinkChange: (val: string) => void;
  onLinkDisplayNameChange: (val: string) => void;
  onNotesChange: (val: string) => void;
  errors?: {
    documentType?: string;
    contentLink?: string;
    linkDisplayName?: string;
    notes?: string;
  };
  disabled?: boolean;
}

const inputCls = (hasError?: string) =>
  `w-full rounded-2xl border bg-transparent px-3 py-2 outline-none dark:text-white ${
    hasError ? "border-red-400 dark:border-red-400" : "border-gray-200 dark:border-white/10"
  }`;

export function FormFormFields({
  documentType,
  contentLink,
  linkDisplayName,
  notes,
  onDocumentTypeChange,
  onContentLinkChange,
  onLinkDisplayNameChange,
  onNotesChange,
  errors,
  disabled,
}: FormFormFieldsProps) {
  return (
    <>
      <FormRow label="Loại văn bản" required={true}>
        <div className="flex flex-col gap-1">
          <input
            type="text"
            placeholder="Nhập loại văn bản..."
            value={documentType}
            onChange={(e) => onDocumentTypeChange(e.target.value)}
            disabled={disabled}
            className={inputCls(errors?.documentType)}
          />
          {errors?.documentType && <p className="text-xs text-red-500">{errors.documentType}</p>}
        </div>
      </FormRow>

      <FormRow label="Đường link (URL thực)" required={true}>
        <div className="flex flex-col gap-1">
          <input
            type="url"
            placeholder="https://example.com/..."
            value={contentLink}
            onChange={(e) => onContentLinkChange(e.target.value)}
            disabled={disabled}
            className={inputCls(errors?.contentLink)}
          />
          {errors?.contentLink && <p className="text-xs text-red-500">{errors.contentLink}</p>}
        </div>
      </FormRow>

      <FormRow label="Nội dung hiển thị">
        <div className="flex flex-col gap-1">
          <input
            type="text"
            placeholder="Ví dụ: Chương trình đào tạo 2020..."
            value={linkDisplayName}
            onChange={(e) => onLinkDisplayNameChange(e.target.value)}
            disabled={disabled}
            className={inputCls(errors?.linkDisplayName)}
          />
          {contentLink && !linkDisplayName && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Nếu để trống, cột sẽ hiển thị URL thực.
            </p>
          )}
          {errors?.linkDisplayName && <p className="text-xs text-red-500">{errors.linkDisplayName}</p>}
        </div>
      </FormRow>

      <FormRow label="Ghi chú">
        <div className="flex flex-col gap-1">
          <RichTextEditor
            value={notes}
            onChange={onNotesChange}
            placeholder="Nhập ghi chú, phạm vi áp dụng, mô tả tài liệu..."
            error={errors?.notes}
            disabled={disabled}
          />
        </div>
      </FormRow>
    </>
  );
}
