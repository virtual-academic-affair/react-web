import Card from "@/components/card";
import { classRegistrationsService } from "@/services/class-registration";
import type { ReplyDto } from "@/types/classRegistration";
import { message as toast } from "antd";
import React from "react";
import { MdClose, MdEdit, MdSend } from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import RichTextEditor from "./RichTextEditor";

interface PreviewReplyModalProps {
  registrationId: number | null;
  onClose: () => void;
  onSent: (closeAfterSend: boolean) => void;
}

const PreviewReplyModal: React.FC<PreviewReplyModalProps> = ({
  registrationId,
  onClose,
  onSent,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [content, setContent] = React.useState("");
  const [customContent, setCustomContent] = React.useState("");
  const [showEditor, setShowEditor] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (registrationId == null) {
      // Reset state when modal is closed
      setContent("");
      setCustomContent("");
      setShowEditor(false);
      return;
    }
    setLoading(true);
    classRegistrationsService
      .previewReply(registrationId)
      .then((resp) => {
        setContent(resp.content || "");
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Không thể tải preview.";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [registrationId]);

  // Handle all clicks in content to open in new tab
  React.useEffect(() => {
    if (!content || !contentRef.current) {
      return;
    }

    const handleContentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link) {
        e.preventDefault();
        e.stopPropagation();
        const href = link.getAttribute("href");
        if (href) {
          window.open(href, "_blank", "noopener,noreferrer");
        }
      }
    };

    const contentDiv = contentRef.current;
    contentDiv.addEventListener("click", handleContentClick);
    return () => {
      contentDiv.removeEventListener("click", handleContentClick);
    };
  }, [content]);

  const handleUpdateNote = () => {
    if (!registrationId) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set("id", String(registrationId));
    next.set("focus", "note");
    setSearchParams(next, { replace: true });
    onClose();
  };

  const handleOpenEditor = () => {
    setShowEditor(true);
    setCustomContent("");
  };

  const handleSend = async (closeAfterSend: boolean) => {
    if (!registrationId) {
      return;
    }

    // Use custom content if editor is shown and has content, otherwise use preview content
    const finalContent = showEditor && customContent ? customContent : content;
    if (!finalContent) {
      return;
    }

    setSending(true);
    try {
      const dto: ReplyDto = {
        content: finalContent,
        closeAfterSend,
      };
      await classRegistrationsService.reply(registrationId, dto);
      toast.success("Gửi phản hồi thành công.");
      onSent(closeAfterSend);
      if (closeAfterSend) {
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

  if (registrationId == null) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />
      <div className="fixed top-14 left-1/2 z-60 w-[min(920px,96vw)] -translate-x-1/2">
        <Card extra="shadow-none flex max-h-[90vh] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 pt-5 pb-4 dark:border-white/10">
            <h3 className="text-navy-700 text-xl font-bold dark:text-white">
              Preview Reply
            </h3>
            <button
              type="button"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
              onClick={onClose}
            >
              <MdClose className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pt-4">
            {showEditor ? (
              <div className="mx-auto max-w-3xl">
                <RichTextEditor
                  value={customContent}
                  onChange={setCustomContent}
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
    </>
  );
};

export default PreviewReplyModal;
