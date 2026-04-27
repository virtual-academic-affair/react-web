import { useState } from "react";
import { message as toast } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Drawer from "@/components/drawer/Drawer";
import DetailFormLayout from "@/components/layouts/DetailFormLayout";
import { formsService } from "@/services/documents/forms.service";
import { FormFormFields } from "./FormFormFields";

interface CreationDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CreationDrawer({ open, onClose }: CreationDrawerProps) {
  const queryClient = useQueryClient();
  const [documentType, setDocumentType] = useState("");
  const [contentLink, setContentLink] = useState("");
  const [linkDisplayName, setLinkDisplayName] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{
    documentType?: string;
    contentLink?: string;
    linkDisplayName?: string;
    notes?: string;
  }>({});

  const { mutate: create, isPending } = useMutation({
    mutationFn: formsService.createForm.bind(formsService),
    onSuccess: () => {
      toast.success("Thêm biểu mẫu thành công");
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Xảy ra lỗi khi tạo");
    },
  });

  const handleClose = () => {
    setDocumentType("");
    setContentLink("");
    setLinkDisplayName("");
    setNotes("");
    setErrors({});
    onClose();
  };

  const handleSave = () => {
    const newErrors: typeof errors = {};
    if (!documentType.trim()) newErrors.documentType = "Loại văn bản không được để trống";
    if (!contentLink.trim()) newErrors.contentLink = "Đường link không được để trống";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    create({
      documentType: documentType.trim(),
      contentLink: contentLink.trim(),
      linkDisplayName: linkDisplayName.trim() || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <Drawer isOpen={open} onClose={handleClose} title="Thêm biểu mẫu mới">
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex flex-col gap-4">
        <DetailFormLayout>
          <FormFormFields
            documentType={documentType}
            contentLink={contentLink}
            linkDisplayName={linkDisplayName}
            notes={notes}
            onDocumentTypeChange={(v) => {
              setDocumentType(v);
              if (errors.documentType) setErrors({ ...errors, documentType: undefined });
            }}
            onContentLinkChange={(v) => {
              setContentLink(v);
              if (errors.contentLink) setErrors({ ...errors, contentLink: undefined });
            }}
            onLinkDisplayNameChange={(v) => {
              setLinkDisplayName(v);
              if (errors.linkDisplayName) setErrors({ ...errors, linkDisplayName: undefined });
            }}
            onNotesChange={(v) => {
              setNotes(v);
              if (errors.notes) setErrors({ ...errors, notes: undefined });
            }}
            errors={errors}
            disabled={isPending}
          />
        </DetailFormLayout>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
            disabled={isPending}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="bg-brand-500 hover:bg-brand-600 rounded-xl px-5 py-2 text-sm font-medium text-white disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Đang lưu...</>
            ) : (
              "Lưu"
            )}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
