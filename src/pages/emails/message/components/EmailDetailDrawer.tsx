import { messagesService } from "@/services/email";
import type { Message, SystemLabel } from "@/types/email";
import type { SystemLabelEnumData } from "@/types/shared";
import { message as toast } from "antd";
import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { formatDate } from "../labelUtils";
import SystemLabelSelector from "./SystemLabelSelector";

interface EmailDetailDrawerProps {
  messageId: number | null;
  systemLabelEnum?: SystemLabelEnumData | null;
  onClose: () => void;
  onLabelChanged: () => void;
}

const EmailDetailDrawer: React.FC<EmailDetailDrawerProps> = ({
  messageId,
  systemLabelEnum,
  onClose,
  onLabelChanged,
}) => {
  const [detail, setDetail] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingLabels, setSavingLabels] = useState(false);

  useEffect(() => {
    if (messageId == null) {
      setDetail(null);
      return;
    }
    setLoading(true);
    messagesService
      .getMessageById(messageId)
      .then(setDetail)
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Không thể tải chi tiết email.";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [messageId]);

  const handleSystemLabelsChange = async (nextLabels: SystemLabel[]) => {
    if (!detail) {
      return;
    }
    setSavingLabels(true);
    try {
      await messagesService.updateMessageLabels(detail.id, {
        systemLabels: nextLabels,
      });
      toast.success("Cập nhật nhãn hệ thống thành công.");
      setDetail((prev) =>
        prev ? { ...prev, systemLabels: nextLabels } : prev,
      );
      onLabelChanged();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Cập nhật nhãn thất bại.";
      toast.error(msg);
    } finally {
      setSavingLabels(false);
    }
  };

  const isOpen = messageId != null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className="pointer-events-none fixed inset-0 z-50 flex justify-end">
        <div
          className={`dark:bg-navy-800 pointer-events-auto my-6 mr-6 flex h-[calc(100%-48px)] w-full max-w-3xl flex-col rounded-[30px] bg-white shadow-2xl transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "translate-x-[calc(100%+48px)]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/10">
            <h2 className="text-navy-700 text-xl font-bold dark:text-white">
              Chi tiết bản ghi
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <MdClose className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {loading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="dark:bg-navy-700 h-5 animate-pulse rounded bg-gray-200"
                  />
                ))}
              </div>
            ) : !detail ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Không có dữ liệu.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Subject */}
                <div className="flex items-center gap-6">
                  <div className="w-40 shrink-0">
                    <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Tiêu đề
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-navy-700 text-base dark:text-white">
                      {detail.subject || "(Không có tiêu đề)"}
                    </p>
                  </div>
                </div>

                {/* Sender */}
                <div className="flex items-center gap-6">
                  <div className="w-40 shrink-0">
                    <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Người gửi
                    </p>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-navy-700 text-base dark:text-white">
                      {detail.senderName}
                    </p>
                  </div>
                </div>

                {/* Sent at */}
                <div className="flex items-center gap-6">
                  <div className="w-40 shrink-0">
                    <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Thời gian gửi
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-navy-700 text-base dark:text-white">
                      {formatDate(detail.sentAt)}
                    </p>
                  </div>
                </div>

                {/* Gmail labels */}
                {detail.labelIds?.length > 0 && (
                  <div className="flex items-center gap-6">
                    <div className="w-40 shrink-0">
                      <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                        Nhãn Gmail
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-1.5">
                        {detail.labelIds.map((l) => (
                          <span
                            key={l}
                            className="dark:bg-navy-700 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:text-gray-300"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* System labels */}
                <div className="flex items-center gap-6">
                  <div className="w-40 shrink-0">
                    <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Nhãn hệ thống
                    </p>
                  </div>
                  <div className="flex-1">
                    <SystemLabelSelector
                      value={detail.systemLabels ?? []}
                      onChange={handleSystemLabelsChange}
                      systemLabelEnum={systemLabelEnum}
                      className="flex flex-wrap gap-2"
                    />
                    {savingLabels && (
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        Đang lưu thay đổi nhãn...
                      </p>
                    )}
                  </div>
                </div>

                {/* Technical info section */}
                <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/10">
                  <p className="text-navy-700 mb-3 text-xs font-semibold tracking-wide uppercase dark:text-white">
                    Thông số kỹ thuật
                  </p>
                  <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-6">
                      <div className="w-40 shrink-0">
                        <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                          ID
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-navy-700 text-base dark:text-white">
                          {detail.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="w-40 shrink-0">
                        <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                          Gmail ID
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-navy-700 text-base dark:text-white">
                          {detail.gmailMessageId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="w-40 shrink-0">
                        <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                          Thread ID
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-navy-700 text-base dark:text-white">
                          {detail.threadId}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EmailDetailDrawer;
