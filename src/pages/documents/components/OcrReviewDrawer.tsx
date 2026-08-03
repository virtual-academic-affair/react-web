import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import { useMemo, useState } from "react";
import { MdCheck, MdClose, MdSave } from "react-icons/md";

import Drawer from "@/components/drawer/Drawer";
import RichTextEditor from "@/components/fields/RichTextEditor";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { DocumentsService } from "@/services/documents";
import { parseError } from "@/utils/parseError";

import { MAX_FILE_SIZE } from "./UploadDrawer";

interface OcrReviewDrawerProps {
  fileId: string | null;
  fileName?: string;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
}

type PendingAction = "save" | "approve" | "reject" | null;
type DraftState = {
  fileId: string;
  markdown: string;
  savedMarkdown: string;
};

const OcrReviewDrawer = ({
  fileId,
  fileName,
  isOpen,
  onClose,
  onChanged,
}: OcrReviewDrawerProps) => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["ocr-review", fileId],
    queryFn: () => DocumentsService.getOcrReview(fileId!),
    enabled: isOpen && Boolean(fileId),
    retry: false,
    refetchOnMount: "always",
  });

  const activeDraft = draft?.fileId === fileId ? draft : null;
  const markdown = activeDraft?.markdown ?? data?.markdown ?? "";
  const savedMarkdown = activeDraft?.savedMarkdown ?? data?.markdown ?? "";

  const byteSize = useMemo(
    () => new TextEncoder().encode(markdown).byteLength,
    [markdown],
  );
  const isDirty = markdown !== savedMarkdown;
  const isEmpty = markdown.trim().length === 0;
  const isTooLarge = byteSize > MAX_FILE_SIZE;
  const isPending = pendingAction !== null;
  const validationError = isEmpty
    ? "Markdown không được để trống."
    : isTooLarge
      ? `Markdown vượt quá giới hạn ${MAX_FILE_SIZE / 1024 / 1024} MB.`
      : undefined;

  const refreshDocuments = async () => {
    await queryClient.invalidateQueries({ queryKey: ["documents"] });
    onChanged();
  };

  const saveDraft = async (showSuccess = true) => {
    if (!fileId || isEmpty || isTooLarge) return false;
    await DocumentsService.saveOcrReview(fileId, markdown);
    setDraft({ fileId, markdown, savedMarkdown: markdown });
    if (showSuccess) toast.success("Đã lưu bản Markdown OCR.");
    return true;
  };

  const handleSave = async () => {
    setPendingAction("save");
    try {
      await saveDraft();
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setPendingAction(null);
    }
  };

  const handleApprove = async () => {
    if (!fileId || isEmpty || isTooLarge) return;
    setPendingAction("approve");
    try {
      if (isDirty) await saveDraft(false);
      await DocumentsService.approveOcrReview(fileId);
      toast.success("Đã duyệt OCR. Hệ thống đang tạo mục lục và lập chỉ mục.");
      await refreshDocuments();
      closeDrawer();
    } catch (err) {
      toast.error(parseError(err));
      void refetch();
    } finally {
      setPendingAction(null);
    }
  };

  const handleReject = async () => {
    if (!fileId) return;
    setPendingAction("reject");
    try {
      await DocumentsService.rejectOcrReview(fileId);
      toast.success("Đã từ chối bản OCR. Tài liệu được chuyển sang thất bại.");
      setRejectOpen(false);
      await refreshDocuments();
      closeDrawer();
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setPendingAction(null);
    }
  };

  const closeDrawer = () => {
    setDraft(null);
    setRejectOpen(false);
    setDiscardOpen(false);
    onClose();
  };

  const requestClose = () => {
    if (isDirty && !isPending) {
      setDiscardOpen(true);
      return;
    }
    closeDrawer();
  };

  const editor = (
    <RichTextEditor
      value={markdown}
      onChange={(nextMarkdown) =>
        fileId &&
        setDraft({
          fileId,
          markdown: nextMarkdown,
          savedMarkdown,
        })
      }
      disabled={isPending}
      contentFormat="markdown"
      stickyToolbar
      minHeight="55vh"
      placeholder="Nhập nội dung tài liệu..."
      error={validationError}
      className="dark:bg-navy-900 rounded-2xl bg-gray-50"
    />
  );

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={requestClose}
        title={`Duyệt OCR${fileName ? ` · ${fileName}` : ""}`}
        width="max-w-5xl"
        footerLeft={
          <button
            type="button"
            disabled={isPending || isLoading || isError}
            onClick={() => setRejectOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-red-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MdClose className="h-4 w-4" />
            Từ chối
          </button>
        }
        footerRight={
          <>
            <button
              type="button"
              disabled={isPending || !isDirty || isEmpty || isTooLarge}
              onClick={handleSave}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
            >
              <MdSave className="h-4 w-4" />
              {pendingAction === "save" ? "Đang lưu..." : "Lưu bản nháp"}
            </button>
            <button
              type="button"
              disabled={
                isPending || isLoading || isError || isEmpty || isTooLarge
              }
              onClick={handleApprove}
              className="bg-brand-500 hover:bg-brand-600 inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MdCheck className="h-4 w-4" />
              {pendingAction === "approve"
                ? "Đang duyệt..."
                : "Duyệt & lập chỉ mục"}
            </button>
          </>
        }
      >
        {isLoading ? (
          <div className="flex min-h-[55vh] flex-col gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="dark:bg-navy-700 h-5 animate-pulse rounded bg-gray-200"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <p className="font-semibold text-red-500">Không thể tải bản OCR.</p>
            <p className="max-w-lg text-sm text-gray-500">
              {parseError(error)}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="bg-brand-500 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data?.lastProcessingError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <p className="mb-1 font-semibold">Lỗi xử lý lần trước</p>
                <p className="whitespace-pre-line">
                  {data.lastProcessingError}
                </p>
              </div>
            ) : null}

            {editor}
          </div>
        )}
      </Drawer>

      <ConfirmModal
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onConfirm={handleReject}
        title="Từ chối bản OCR"
        subTitle="Tài liệu sẽ chuyển sang trạng thái thất bại và bản Markdown trên kho lưu trữ sẽ bị xóa. Hành động này không thể hoàn tác."
        confirmText="Từ chối OCR"
        loading={pendingAction === "reject"}
      />

      <ConfirmModal
        open={discardOpen}
        onCancel={() => setDiscardOpen(false)}
        onConfirm={() => {
          setDiscardOpen(false);
          closeDrawer();
        }}
        title="Bỏ thay đổi chưa lưu?"
        subTitle="Nội dung Markdown bạn vừa chỉnh sửa chưa được lưu."
        confirmText="Bỏ thay đổi"
        loading={false}
      />
    </>
  );
};

export default OcrReviewDrawer;
