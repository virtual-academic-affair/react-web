import Card from "@/components/card";
import { classRegistrationsService } from "@/services/class-registration";
import { message as toast } from "antd";
import React from "react";
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
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [html, setHtml] = React.useState("<p></p>");
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (registrationId == null) {
      return;
    }
    setLoading(true);
    classRegistrationsService
      .previewReply(registrationId)
      .then((resp) => {
        setHtml(resp.html || "<p></p>");
        setNote(resp.note || "");
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Không thể tải preview.";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [registrationId]);

  if (registrationId == null) {
    return null;
  }

  const handleSubmit = async (closeAfterSend: boolean) => {
    setSubmitting(true);
    try {
      await classRegistrationsService.reply(registrationId, {
        html,
        note: note || undefined,
        closeAfterSend,
      });
      toast.success(closeAfterSend ? "Đã gửi và đóng." : "Đã gửi phản hồi.");
      onSent(closeAfterSend);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gửi phản hồi thất bại.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />
      <div className="fixed top-14 left-1/2 z-60 w-[min(920px,96vw)] -translate-x-1/2">
        <Card extra="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-navy-700 text-xl font-bold dark:text-white">
              Preview Reply
            </h3>
            <button
              type="button"
              className="rounded-lg px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {loading ? (
              <div className="dark:bg-navy-700 h-40 animate-pulse rounded-2xl bg-gray-200" />
            ) : (
              <RichTextEditor value={html} onChange={setHtml} />
            )}

            <div>
              <label className="mb-2 ml-1 block text-sm font-bold text-navy-700 dark:text-white">
                Ghi chú
              </label>
              <RichTextEditor value={note} onChange={setNote} />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={submitting || loading}
              onClick={() => handleSubmit(false)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
            >
              Gửi
            </button>
            <button
              type="button"
              disabled={submitting || loading}
              onClick={() => handleSubmit(true)}
              className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              Gửi & đóng
            </button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default PreviewReplyModal;
