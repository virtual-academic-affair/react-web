import RichTextEditor from "@/components/fields/RichTextEditor";
import { formInputClassWithError } from "@/components/fields/formInputClass";
import { FormRow } from "@/components/layouts/DetailFormLayout";

interface FormFormFieldsProps {
  documentType: string;
  contentLink: string;
  notes: string;
  onDocumentTypeChange: (val: string) => void;
  onContentLinkChange: (val: string) => void;
  onNotesChange: (val: string) => void;
  errors?: {
    documentType?: string;
    contentLink?: string;
    notes?: string;
  };
  disabled?: boolean;
}

export function FormFormFields({
  documentType,
  contentLink,
  notes,
  onDocumentTypeChange,
  onContentLinkChange,
  onNotesChange,
  errors,
  disabled,
}: FormFormFieldsProps) {
  return (
    <>
      <FormRow label="Nội dung" alignTop required={true}>
        <div className="flex min-w-0 flex-col gap-1">
          <input
            type="text"
            placeholder="Nhập nội dung..."
            value={documentType}
            onChange={(e) => onDocumentTypeChange(e.target.value)}
            disabled={disabled}
            className={formInputClassWithError(errors?.documentType)}
          />
          {errors?.documentType && (
            <p className="text-xs text-red-500">{errors.documentType}</p>
          )}
        </div>
      </FormRow>

      <FormRow label="Link/Email thông tin" alignTop required={true}>
        <div className="flex min-w-0 flex-col gap-1">
          <RichTextEditor
            value={contentLink}
            onChange={onContentLinkChange}
            placeholder="Nhập link/email thông tin của nội dung..."
            error={errors?.contentLink}
            disabled={disabled}
          />
        </div>
      </FormRow>

      <FormRow alignTop label="Ghi chú">
        <div className="flex min-w-0 flex-col gap-1">
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
