import Card from "@/components/card";
import { classRegistrationsService } from "@/services/class-registration";
import { message as toast } from "antd";
import React from "react";

interface PreviewReplyModalProps {
  registrationId: number | null;
  onClose: () => void;
  onSent: (closeAfterSend: boolean) => void;
}

const PreviewReplyModal: React.FC<PreviewReplyModalProps> = ({
  registrationId,
  onClose,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [html, setHtml] = React.useState("");
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (registrationId == null) {
      return;
    }
    setLoading(true);
    classRegistrationsService
      .previewReply(registrationId)
      .then((resp) => {
        setHtml(resp.html || "");
        setNote(resp.note || "");
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Không thể tải preview.";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [registrationId]);

  if (registrationId == null) {
    return null;
  }

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
              <>
                {html && (
                  <div>
                    <label className="text-navy-700 mb-2 ml-1 block text-sm font-bold dark:text-white">
                      Nội dung email
                    </label>
                    <div
                      className="dark:bg-navy-800 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  </div>
                )}

                {note && (
                  <div>
                    <label className="text-navy-700 mb-2 ml-1 block text-sm font-bold dark:text-white">
                      Ghi chú
                    </label>
                    <div
                      className="dark:bg-navy-800 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10"
                      dangerouslySetInnerHTML={{ __html: note }}
                    />
                  </div>
                )}

                {!html && !note && !loading && (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Không có nội dung để hiển thị
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </>
  );
};

export default PreviewReplyModal;
