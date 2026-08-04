import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  MdCheck,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdDescription,
  MdErrorOutline,
  MdPictureAsPdf,
  MdSave,
} from "react-icons/md";

import Drawer from "@/components/drawer/Drawer";
import RichTextEditor from "@/components/fields/RichTextEditor";
import ConfirmModal from "@/components/modal/ConfirmModal";
import { DocumentsService } from "@/services/documents";
import { parseError } from "@/utils/parseError";

import "./FilePreviewModal.css";
import { MAX_FILE_SIZE } from "./UploadDrawer";

const PdfPreview = lazy(() => import("./file-preview/PdfPreview"));
const DocxPreview = lazy(() => import("./file-preview/DocxPreview"));
const PlainTextPreview = lazy(() => import("./file-preview/PlainTextPreview"));

interface OcrReviewDrawerProps {
  fileId: string | null;
  fileName?: string;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
  /** Parent owns the progress WebSocket for indexing after approve. */
  onProgressClientReady?: (
    clientId: string,
    fileId: string,
  ) => void | (() => void) | Promise<void | (() => void)>;
}

type PendingAction = "save" | "approve" | "reject" | null;
type DraftState = {
  fileId: string;
  markdown: string;
  savedMarkdown: string;
};
type OriginalCategory = "pdf" | "docx" | "image" | "text" | "unsupported";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg"];
const TEXT_EXTENSIONS = [
  "txt",
  "csv",
  "json",
  "md",
  "xml",
  "yml",
  "yaml",
  "html",
  "htm",
];

function getExtension(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() ?? "") : "";
}

function resolveOriginalCategory(
  fileName: string,
  mimeType?: string | null,
): OriginalCategory {
  const mime = String(mimeType || "").toLowerCase();
  if (mime === "application/pdf") return "pdf";
  if (
    mime.includes("wordprocessingml") ||
    mime.includes("msword") ||
    mime === "application/doc"
  ) {
    return "docx";
  }
  if (mime.startsWith("image/")) return "image";
  if (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    mime === "application/xml"
  ) {
    return "text";
  }

  const ext = getExtension(fileName);
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "docx";
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (TEXT_EXTENSIONS.includes(ext)) return "text";
  return "unsupported";
}

interface OriginalFilePanelProps {
  url?: string | null;
  fileName: string;
  mimeType?: string | null;
  isLoading: boolean;
  error?: unknown;
}

const OriginalFilePanel = ({
  url,
  fileName,
  mimeType,
  isLoading,
  error,
}: OriginalFilePanelProps) => {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(0.85);
  const pdfScrollRef = useRef<((page: number) => void) | undefined>(undefined);
  const category = resolveOriginalCategory(fileName, mimeType);

  const changePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > numPages) return;
    pdfScrollRef.current?.(nextPage);
    setCurrentPage(nextPage);
  };

  return (
    <section className="dark:bg-navy-900 flex h-full min-h-0 flex-col overflow-hidden bg-gray-50">
      <header className="flex min-h-12 shrink-0 flex-col items-stretch gap-2 border-b border-gray-200 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-2 sm:flex-1">
          <MdPictureAsPdf className="h-5 w-5 shrink-0 text-red-500" />
          <div className="min-w-0">
            <p className="text-navy-700 text-sm font-semibold dark:text-white">
              Văn bản gốc
            </p>
          </div>
        </div>

        {category === "pdf" && numPages > 0 ? (
          <div className="flex w-full shrink-0 items-center justify-between gap-1 rounded-xl border border-gray-200 bg-white px-1.5 py-1 sm:w-auto sm:justify-start dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              title="Trang trước"
              disabled={currentPage <= 1}
              onClick={() => changePage(currentPage - 1)}
              className="rounded-lg p-1 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30 dark:text-gray-300 dark:hover:bg-white/10"
            >
              <MdChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-12 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
              {currentPage}/{numPages}
            </span>
            <button
              type="button"
              title="Trang sau"
              disabled={currentPage >= numPages}
              onClick={() => changePage(currentPage + 1)}
              className="rounded-lg p-1 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30 dark:text-gray-300 dark:hover:bg-white/10"
            >
              <MdChevronRight className="h-4 w-4" />
            </button>
            <span className="mx-1 h-4 w-px bg-gray-200 dark:bg-white/10" />
            <button
              type="button"
              title="Thu nhỏ"
              onClick={() => setScale((value) => Math.max(0.5, value - 0.15))}
              className="rounded-lg px-1.5 py-0.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
            >
              −
            </button>
            <span className="min-w-9 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              title="Phóng to"
              onClick={() => setScale((value) => Math.min(2.5, value + 0.15))}
              className="rounded-lg px-1.5 py-0.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
            >
              +
            </button>
          </div>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
            <div className="fpv-spinner" />
            <p className="text-sm">Đang tải văn bản gốc...</p>
          </div>
        ) : error || !url ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-gray-500 dark:text-gray-400">
            <MdErrorOutline className="h-10 w-10 opacity-50" />
            <p className="text-sm font-semibold">
              Không thể hiển thị văn bản gốc.
            </p>
            <p className="text-xs">
              Bạn vẫn có thể kiểm tra văn bản đã chuyển đổi.
            </p>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <div className="fpv-spinner" />
              </div>
            }
          >
            {category === "pdf" ? (
              <PdfPreview
                url={url}
                scale={scale}
                currentPage={currentPage}
                numPages={numPages}
                setNumPages={setNumPages}
                setCurrentPage={setCurrentPage}
                pdfScrollRef={pdfScrollRef}
                flush
              />
            ) : null}
            {category === "docx" ? <DocxPreview url={url} flush /> : null}
            {category === "text" ? <PlainTextPreview url={url} flush /> : null}
            {category === "image" ? (
              <div className="flex h-full items-center justify-center overflow-auto">
                <img
                  src={url}
                  alt={fileName}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : null}
            {category === "unsupported" ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-gray-500 dark:text-gray-400">
                <MdDescription className="h-10 w-10 opacity-50" />
                <p className="text-sm font-semibold">
                  Định dạng này chưa hỗ trợ xem trước.
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-500 text-xs font-semibold underline underline-offset-2"
                >
                  Mở văn bản gốc
                </a>
              </div>
            ) : null}
          </Suspense>
        )}
      </div>
    </section>
  );
};

const OcrReviewDrawer = ({
  fileId,
  fileName,
  isOpen,
  onClose,
  onChanged,
  onProgressClientReady,
}: OcrReviewDrawerProps) => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDraft(null);
      setRejectOpen(false);
      setDiscardOpen(false);
      setPendingAction(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setDraft(null);
  }, [fileId]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["ocr-review", fileId],
    queryFn: () => DocumentsService.getOcrReview(fileId!),
    enabled: isOpen && Boolean(fileId),
    retry: false,
    refetchOnMount: "always",
  });

  const {
    data: fileDetail,
    isLoading: isFileDetailLoading,
    error: fileDetailError,
  } = useQuery({
    queryKey: ["file-detail-preview", fileId],
    queryFn: () => DocumentsService.getFileDetail(fileId!),
    enabled: isOpen && Boolean(fileId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
    ? "Văn bản không được để trống."
    : isTooLarge
      ? `Văn bản vượt quá giới hạn ${MAX_FILE_SIZE / 1024 / 1024} MB.`
      : undefined;

  const refreshDocuments = async () => {
    await queryClient.invalidateQueries({ queryKey: ["documents"] });
    onChanged();
  };

  const saveDraft = async (showSuccess = true) => {
    if (!fileId || isEmpty || isTooLarge) return false;
    await DocumentsService.saveOcrReview(fileId, markdown);
    setDraft({ fileId, markdown, savedMarkdown: markdown });
    if (showSuccess) toast.success("Đã lưu bản nháp.");
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
    let stopProgressTracking: (() => void) | undefined;
    try {
      if (isDirty) await saveDraft(false);
      const clientId = globalThis.crypto.randomUUID();
      const progressCleanup = await onProgressClientReady?.(clientId, fileId);
      if (typeof progressCleanup === "function") {
        stopProgressTracking = progressCleanup;
      }
      await DocumentsService.approveOcrReview(fileId, clientId);
      await refreshDocuments();
      closeDrawer();
    } catch (err) {
      stopProgressTracking?.();
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
      toast.success("Đã từ chối. Tài liệu chuyển sang thất bại.");
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

  const convertedPanel = (
    <section className="dark:bg-navy-900 flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <header className="flex min-h-12 shrink-0 items-center justify-center border-b border-gray-200 px-3 py-2 dark:border-white/10">
        <p className="text-navy-700 text-center text-sm font-semibold dark:text-white">
          Văn bản đã chuyển đổi
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">
        {data?.lastProcessingError ? (
          <div className="border-b border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <p className="mb-1 font-semibold">Lỗi xử lý lần trước</p>
            <p className="whitespace-pre-line">{data.lastProcessingError}</p>
          </div>
        ) : null}
        <div className="h-full min-h-0">
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
            fillHeight
            flush
            headingButtons={[1, 2]}
            placeholder="Nội dung văn bản đã chuyển đổi..."
            error={validationError}
            className="dark:bg-navy-900 h-full bg-white"
          />
        </div>
      </div>
    </section>
  );

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={requestClose}
        title={`Kiểm tra văn bản${fileName ? ` · ${fileName}` : ""}`}
        width="max-w-[calc(100vw-48px)] xl:max-w-[1440px]"
        centered
        bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0 text-sm leading-relaxed"
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
            {isDirty || pendingAction === "save" ? (
              <button
                type="button"
                disabled={
                  isPending || isLoading || isError || isEmpty || isTooLarge
                }
                onClick={handleSave}
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
              >
                <MdSave className="h-4 w-4" />
                {pendingAction === "save" ? "Đang lưu..." : "Lưu nháp"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={
                isPending || isLoading || isError || isEmpty || isTooLarge
              }
              onClick={handleApprove}
              className="inline-flex h-10 items-center gap-2 rounded-2xl bg-green-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MdCheck className="h-4 w-4" />
              {pendingAction === "approve"
                ? "Đang xác nhận..."
                : "Đồng ý & Tiếp tục"}
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
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="font-semibold text-red-500">
              Không thể tải văn bản đã chuyển đổi.
            </p>
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
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            <div className="h-[42%] min-h-0 min-w-0 flex-1 overflow-hidden border-b border-gray-200 lg:h-auto lg:border-b-0 dark:border-white/10">
              <OriginalFilePanel
                key={fileId ?? "original-file"}
                url={fileDetail?.fileUrl}
                fileName={
                  fileDetail?.originalFilename || fileName || "Tài liệu gốc"
                }
                mimeType={
                  (fileDetail?.mimeType as string | undefined) ||
                  (fileDetail?.contentType as string | undefined)
                }
                isLoading={isFileDetailLoading}
                error={fileDetailError}
              />
            </div>

            <div
              role="separator"
              aria-hidden
              className="hidden shrink-0 bg-gray-200 lg:block lg:w-px dark:bg-white/10"
            />

            <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
              {convertedPanel}
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmModal
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onConfirm={handleReject}
        title="Từ chối văn bản đã chuyển đổi?"
        subTitle="Tài liệu sẽ chuyển sang thất bại và bản văn bản đã chuyển đổi sẽ bị xóa. Không thể hoàn tác."
        confirmText="Từ chối"
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
        subTitle="Nội dung bạn vừa chỉnh chưa được lưu."
        confirmText="Bỏ thay đổi"
        loading={false}
      />
    </>
  );
};

export default OcrReviewDrawer;
