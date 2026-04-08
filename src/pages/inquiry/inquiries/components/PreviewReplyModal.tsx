import Card from "@/components/card";
import { DocumentsService } from "@/services/documents";
import { inquiriesService } from "@/services/inquiry";
import type { InquiryReplyDto } from "@/types/inquiry";
import { useQuery } from "@tanstack/react-query";
import { message as toast } from "antd";
import React from "react";
import { MdClose, MdDescription, MdEdit, MdSend } from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import FilePreviewModal from "@/pages/documents/components/FilePreviewModal";
import InquiryReplyRichTextEditor from "./InquiryReplyRichTextEditor";

interface PreviewReplyModalProps {
  inquiryId: number | null;
  onClose: () => void;
  onSent: (isClose: boolean) => void;
}

const PreviewReplyModal: React.FC<PreviewReplyModalProps> = ({
  inquiryId,
  onClose,
  onSent,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sending, setSending] = React.useState(false);
  const [customContent, setCustomContent] = React.useState("");
  const [showEditor, setShowEditor] = React.useState(false);
  const [previewDoc, setPreviewDoc] = React.useState<{
    fileId: string;
    heading?: string;
  } | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const { data: previewDocFileName } = useQuery({
    queryKey: ["inquiry-reply-preview-doc-file", previewDoc?.fileId],
    queryFn: async () => {
      if (!previewDoc?.fileId) return "";
      const detail = await DocumentsService.getFileDetail(previewDoc.fileId);
      return detail?.displayName || detail?.originalName || "Tài liệu";
    },
    enabled: Boolean(previewDoc?.fileId),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch the AI-generated preview — staleTime: 0 so it always refetches per inquiry
  const { data: previewData, isLoading: loading } = useQuery({
    queryKey: ["inquiry-preview", inquiryId],
    queryFn: () => inquiriesService.previewReply(inquiryId!),
    enabled: inquiryId != null,
    staleTime: 0,
  });
  const content = previewData?.content ?? "";

  // Reset custom content when modal closes
  React.useEffect(() => {
    if (inquiryId == null) {
      setCustomContent("");
      setShowEditor(false);
    }
  }, [inquiryId]);

  // Handle click references (inserted by @mention) to open inline Markdown preview instead of navigating.
  React.useEffect(() => {
    if (!contentRef.current) {
      return;
    }

    const handleContentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (!link) return;

      const href = link.getAttribute("href") || "";
      const isLocalReference = href.startsWith("/admin/documents/list?id=");
      if (!isLocalReference) return;

      e.preventDefault();
      e.stopPropagation();

      const hashIndex = href.indexOf("#");
      const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
      const heading =
        hashIndex >= 0 ? decodeURIComponent(href.slice(hashIndex + 1)) : "";

      try {
        const url = new URL(withoutHash, window.location.origin);
        const fileId = url.searchParams.get("id");
        if (fileId) {
          setPreviewDoc({
            fileId,
            heading: heading || undefined,
          });
        }
      } catch {
        // ignore malformed URL
      }
    };

    const contentDiv = contentRef.current;
    contentDiv.addEventListener("click", handleContentClick);
    return () => {
      contentDiv.removeEventListener("click", handleContentClick);
    };
  }, [content, customContent, showEditor]);

  const handleUpdateNote = () => {
    if (!inquiryId) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set("id", String(inquiryId));
    next.set("focus", "answer"); // Inquiries use 'answer' instead of 'note'
    setSearchParams(next, { replace: true });
    onClose();
  };

  const handleOpenEditor = () => {
    setShowEditor(true);
    setCustomContent("");
  };

  const handleSend = async (isClose: boolean) => {
    if (!inquiryId) {
      return;
    }

    // Use custom content if editor is shown and has content, otherwise use preview content
    const finalContent = showEditor && customContent ? customContent : content;
    if (!finalContent) {
      return;
    }

    setSending(true);
    try {
      const dto: InquiryReplyDto = {
        content: finalContent,
        isClose,
      };
      await inquiriesService.reply(inquiryId, dto);
      toast.success("Gửi phản hồi thành công.");
      onSent(isClose);
      if (isClose) {
        onClose();
      } else {
        // Reset editor if not closing
        setShowEditor(false);
        setCustomContent("");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gửi phản hồi thất bại. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  if (inquiryId == null) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />
      <div className="fixed top-14 left-1/2 z-60 w-[min(920px,96vw)] -translate-x-1/2">
        <Card extra="shadow-none flex max-h-[90vh] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 pt-5 pb-4 dark:border-white/10">
            <h3 className="text-navy-700 text-xl font-bold dark:text-white">
              Xem trước phản hồi
            </h3>
            <button
              type="button"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
              onClick={onClose}
            >
              <MdClose className="h-5 v-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pt-4">
            {showEditor ? (
              <div className="mx-auto max-w-3xl">
                <InquiryReplyRichTextEditor
                  value={customContent}
                  onChange={setCustomContent}
                  placeholder="Gõ @ để chèn tham chiếu tài liệu"
                />
              </div>
            ) : loading ? (
              <div className="dark:bg-navy-700 h-40 animate-pulse rounded-2xl bg-gray-200" />
            ) : content ? (
              <div
                ref={contentRef}
                className="dark:bg-navy-800 mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                Không có nội dung để hiển thị
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="mt-6 flex items-center justify-between gap-2 border-t border-gray-200 px-5 pt-4 pb-5 dark:border-white/10">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUpdateNote}
                className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
              >
                <MdEdit className="mr-1 inline h-4 w-4" />
                Chỉnh sửa
              </button>
              <button
                type="button"
                onClick={handleOpenEditor}
                className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
              >
                Soạn nội dung riêng
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSend(false)}
                disabled={
                  sending ||
                  (!showEditor && !content) ||
                  (showEditor && !customContent)
                }
                className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
              >
                {sending ? "Đang gửi..." : "Gửi"}
              </button>
              <button
                type="button"
                onClick={() => handleSend(true)}
                disabled={
                  sending ||
                  (!showEditor && !content) ||
                  (showEditor && !customContent)
                }
                className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                <MdSend className="h-4 w-4" />
                {sending ? "Đang gửi..." : "Gửi và đóng"}
              </button>
            </div>
          </div>
        </Card>
      </div>

      <FilePreviewModal
        fileId={previewDoc?.fileId ?? null}
        fileName={previewDocFileName || "Tài liệu"}
        isOpen={Boolean(previewDoc?.fileId)}
        onClose={() => setPreviewDoc(null)}
      />
    </>
  );
};

export default PreviewReplyModal;
