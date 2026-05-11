import Drawer from "@/components/drawer/Drawer";
import DetailFormLayout, {
  DetailFormSection,
  FormRow,
} from "@/components/layouts/DetailFormLayout";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { formsService } from "@/services/documents/forms.service";
import type { Form } from "@/types/forms";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import { useEffect, useState } from "react";
import { MdDeleteOutline, MdSave } from "react-icons/md";
import { FormFormFields } from "./FormFormFields";

import { fixRichTextLinks } from "@/components/fields/RichTextEditor";

interface FormDetailDrawerProps {
  id?: string;
  open: boolean;
  isReadOnly?: boolean;
  onClose: () => void;
  onFormChanged: (updated: Form) => void;
  onFormDeleted: (id: string) => void;
}

export default function FormDetailDrawer({
  id,
  open,
  isReadOnly = false,
  onClose,
  onFormChanged,
  onFormDeleted,
}: FormDetailDrawerProps) {
  const queryClient = useQueryClient();
  // Track only user edits — NOT a copy of detail data
  const [edits, setEdits] = useState<{
    documentType?: string;
    contentLink?: string;
    notes?: string;
  }>({});
  const [errors, setErrors] = useState<{
    documentType?: string;
    contentLink?: string;
    notes?: string;
  }>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const {
    data: detail,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["form", id],
    queryFn: () => formsService.getFormById(id!),
    enabled: !!id && open,
  });

  // Reset edits when switching to different item
  useEffect(() => {
    setEdits({});
    setErrors({});
  }, [id]);

  // Derive form values: user edits override detail data
  const documentType = edits.documentType ?? detail?.documentType ?? "";
  const contentLink = edits.contentLink ?? detail?.contentLink ?? "";
  const notes = edits.notes ?? detail?.notes ?? "";

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: () =>
      formsService.updateForm(id!, {
        documentType: documentType.trim(),
        contentLink: contentLink,
        notes: notes || undefined,
      }),
    onSuccess: (updated) => {
      toast.success("Cập nhật biểu mẫu thành công");
      // Invalidate list and specific item cache to ensure detail shows fresh data
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      queryClient.setQueryData(["form", id], updated);

      onFormChanged(updated);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Lỗi cập nhật");
    },
  });

  const { mutate: del, isPending: isDeleting } = useMutation({
    mutationFn: () => formsService.removeForm(id!),
    onSuccess: () => {
      toast.success("Xóa biểu mẫu thành công");
      onFormDeleted(id!);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Lỗi xóa");
    },
  });

  const isDirty = detail
    ? detail.documentType !== documentType ||
      detail.contentLink !== contentLink ||
      (detail.notes ?? "") !== notes
    : false;

  const handleSave = () => {
    const newErrors: typeof errors = {};
    if (!documentType.trim())
      newErrors.documentType = "Nội dung không được để trống";
    if (!contentLink.trim())
      newErrors.contentLink = "Đường link không được để trống";

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
        title="Chi tiết biểu mẫu"
        footerRight={
          !isReadOnly ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={!detail || isLoading || isUpdating || isDeleting}
                title={isDeleting ? "Đang xóa..." : "Xóa"}
                aria-label={isDeleting ? "Đang xóa..." : "Xóa"}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
              >
                <MdDeleteOutline className="h-4 w-4" />
              </button>
            </div>
          ) : undefined
        }
      >
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="dark:bg-navy-700 h-5 animate-pulse rounded bg-gray-200"
              />
            ))}
          </div>
        ) : isError || !detail ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Không có dữ liệu.
          </p>
        ) : isReadOnly ? (
          /* Read-only view: render all fields as static text/HTML */
          <DetailFormLayout>
            <FormRow label="Nội dung">
              <p className="text-navy-700 text-sm dark:text-white">
                {detail.documentType || "—"}
              </p>
            </FormRow>
            <FormRow alignTop label="Đường link">
              <div
                className="tiptap-prose text-navy-700 [&_a]:text-brand-500 dark:[&_a]:text-brand-400 text-sm dark:text-white [&_a:hover]:underline [&_ol]:list-decimal [&_ol]:pl-4 [&_ul]:list-disc [&_ul]:pl-4"
                dangerouslySetInnerHTML={{
                  __html: fixRichTextLinks(detail.contentLink || ""),
                }}
              />
            </FormRow>
            {detail.notes && (
              <FormRow alignTop label="Ghi chú">
                <div
                  className="tiptap-prose text-navy-700 [&_a]:text-brand-500 dark:[&_a]:text-brand-400 text-sm dark:text-white [&_a:hover]:underline [&_ol]:list-decimal [&_ol]:pl-4 [&_ul]:list-disc [&_ul]:pl-4"
                  dangerouslySetInnerHTML={{
                    __html: fixRichTextLinks(detail.notes || ""),
                  }}
                />
              </FormRow>
            )}
          </DetailFormLayout>
        ) : (
          <DetailFormLayout>
            <FormFormFields
              key={id}
              documentType={documentType}
              contentLink={contentLink}
              notes={notes}
              onDocumentTypeChange={(v) => {
                setEdits((p) => ({ ...p, documentType: v }));
                if (errors.documentType)
                  setErrors({ ...errors, documentType: undefined });
              }}
              onContentLinkChange={(v) => {
                setEdits((p) => ({ ...p, contentLink: v }));
                if (errors.contentLink)
                  setErrors({ ...errors, contentLink: undefined });
              }}
              onNotesChange={(v) => {
                setEdits((p) => ({ ...p, notes: v }));
                if (errors.notes) setErrors({ ...errors, notes: undefined });
              }}
              errors={errors}
              disabled={isUpdating || isDeleting}
            />

            {isDirty && (
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!detail || isLoading || isUpdating || isDeleting}
                  className="bg-brand-500 hover:bg-brand-600 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                >
                  <MdSave className="h-4 w-4" />
                  {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            )}

            <DetailFormSection title="Thông số kỹ thuật">
              <div className="flex flex-col gap-2">
                <FormRow label="ID">
                  <p className="text-navy-700 text-sm dark:text-white">
                    {detail.id}
                  </p>
                </FormRow>
                <FormRow label="Ngày tạo">
                  <p className="text-navy-700 text-sm dark:text-white">
                    {new Date(detail.createdAt).toLocaleString("vi-VN")}
                  </p>
                </FormRow>
                <FormRow label="Cập nhật lần cuối">
                  <p className="text-navy-700 text-sm dark:text-white">
                    {new Date(detail.updatedAt).toLocaleString("vi-VN")}
                  </p>
                </FormRow>
              </div>
            </DetailFormSection>
          </DetailFormLayout>
        )}
      </Drawer>

      <ConfirmModal
        open={confirmDeleteOpen}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={async () => {
          setConfirmDeleteOpen(false);
          await del();
        }}
        title="Xóa biểu mẫu"
        subTitle={`Bạn có chắc chắn muốn xóa biểu mẫu "${detail?.documentType}" không? Hành động này không thể hoàn tác.`}
        confirmText="Xóa hệ thống"
        danger={true}
      />
    </>
  );
}
