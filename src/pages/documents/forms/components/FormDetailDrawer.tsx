import { useEffect, useState } from "react";
import { message as toast } from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import Drawer from "@/components/drawer/Drawer";
import DetailFormLayout, { DetailFormSection, FormRow } from "@/components/layouts/DetailFormLayout";
import { FormFormFields } from "./FormFormFields";
import { formsService } from "@/services/documents/forms.service";
import ConfirmModal from "@/components/modal/ConfirmModal";
import type { Form } from "@/types/forms";
import { MdDeleteOutline } from "react-icons/md";

interface FormDetailDrawerProps {
  id?: number;
  open: boolean;
  onClose: () => void;
  onFormChanged: (updated: Form) => void;
  onFormDeleted: (id: number) => void;
}

export default function FormDetailDrawer({
  id,
  open,
  onClose,
  onFormChanged,
  onFormDeleted,
}: FormDetailDrawerProps) {
  // Track only user edits — NOT a copy of detail data
  const [edits, setEdits] = useState<{
    documentType?: string;
    contentLink?: string;
    linkDisplayName?: string;
    notes?: string;
  }>({});
  const [errors, setErrors] = useState<{
    documentType?: string;
    contentLink?: string;
    linkDisplayName?: string;
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
  const linkDisplayName = edits.linkDisplayName ?? detail?.linkDisplayName ?? "";
  const notes = edits.notes ?? detail?.notes ?? "";

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: () =>
      formsService.updateForm(id!, {
        documentType: documentType.trim(),
        contentLink: contentLink.trim(),
        linkDisplayName: linkDisplayName.trim() || undefined,
        notes: notes || undefined,
      }),
    onSuccess: (updated) => {
      toast.success("Cập nhật biểu mẫu thành công");
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
      (detail.linkDisplayName ?? "") !== linkDisplayName ||
      (detail.notes ?? "") !== notes
    : false;

  const handleSave = () => {
    const newErrors: typeof errors = {};
    if (!documentType.trim()) newErrors.documentType = "Loại văn bản không được để trống";
    if (!contentLink.trim()) newErrors.contentLink = "Đường link không được để trống";

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
          <p className="text-sm text-gray-600 dark:text-gray-400">Không có dữ liệu.</p>
        ) : (
          <DetailFormLayout>
            <FormFormFields
              key={id}
              documentType={documentType}
              contentLink={contentLink}
              linkDisplayName={linkDisplayName}
              notes={notes}
              onDocumentTypeChange={(v) => {
                setEdits(p => ({ ...p, documentType: v }));
                if (errors.documentType) setErrors({ ...errors, documentType: undefined });
              }}
              onContentLinkChange={(v) => {
                setEdits(p => ({ ...p, contentLink: v }));
                if (errors.contentLink) setErrors({ ...errors, contentLink: undefined });
              }}
              onLinkDisplayNameChange={(v) => {
                setEdits(p => ({ ...p, linkDisplayName: v }));
                if (errors.linkDisplayName) setErrors({ ...errors, linkDisplayName: undefined });
              }}
              onNotesChange={(v) => {
                setEdits(p => ({ ...p, notes: v }));
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
                  <p className="text-navy-700 text-sm dark:text-white">{detail.id}</p>
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
