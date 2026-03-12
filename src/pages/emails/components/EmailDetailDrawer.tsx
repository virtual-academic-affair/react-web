import { messagesService } from "@/services/email";
import type { Message, SystemLabel } from "@/types/email";
import type { SystemLabelEnumData } from "@/types/shared";
import { message as toast } from "antd";
import { useEffect, useState } from "react";
import { MdClose, MdEmail, MdLabel, MdLabelOff } from "react-icons/md";
import {
  formatDate,
  getLabelColor,
  getLabelVi,
  labelPillStyle,
} from "./EmailsTable";

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
  const [updatingLabel, setUpdatingLabel] = useState<string | null>(null);

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

  const toggleLabel = async (sl: SystemLabel) => {
    if (!detail) return;
    const hasLabel = detail.systemLabels?.includes(sl);
    const newLabels = hasLabel
      ? (detail.systemLabels ?? []).filter((l) => l !== sl)
      : [...(detail.systemLabels ?? []), sl];
    setUpdatingLabel(sl);
    try {
      await messagesService.updateMessageLabels(detail.id, {
        systemLabels: newLabels,
      });
      toast.success(hasLabel ? "Đã gỡ nhãn." : "Đã gán nhãn.");
      // optimistic update
      setDetail((prev) => (prev ? { ...prev, systemLabels: newLabels } : prev));
      onLabelChanged();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Cập nhật nhãn thất bại.";
      toast.error(msg);
    } finally {
      setUpdatingLabel(null);
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
      <div
        className={`dark:bg-navy-800 fixed top-0 right-0 z-50 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <MdEmail className="text-brand-500 h-5 w-5" />
            <h2 className="text-navy-700 font-semibold dark:text-white">
              Chi tiết email
            </h2>
          </div>
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
            <p className="text-sm text-gray-400">Không có dữ liệu.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Subject */}
              <div>
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Tiêu đề
                </p>
                <p className="text-navy-700 font-semibold dark:text-white">
                  {detail.subject || "(Không có tiêu đề)"}
                </p>
              </div>

              {/* Sender */}
              <div>
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Người gửi
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {detail.senderName}
                </p>
                <p className="text-xs text-gray-400">{detail.senderEmail}</p>
              </div>

              {/* Sent at */}
              <div>
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Thời gian gửi
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {formatDate(detail.sentAt)}
                </p>
              </div>

              {/* Gmail labels */}
              {detail.labelIds?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Nhãn Gmail
                  </p>
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
              )}

              {/* System labels */}
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Nhãn hệ thống
                </p>
                <div className="flex flex-col gap-2">
                  {(Object.keys(systemLabelEnum ?? {}) as SystemLabel[]).map(
                    (sl) => {
                      const active = detail.systemLabels?.includes(sl);
                      const busy = updatingLabel === sl;
                      const color = getLabelColor(sl, systemLabelEnum);
                      return (
                        <button
                          key={sl}
                          onClick={() => toggleLabel(sl)}
                          disabled={busy}
                          style={active ? labelPillStyle(color) : undefined}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                            active
                              ? "border-transparent"
                              : "hover:border-brand-300 border-gray-200 text-gray-500 dark:border-white/10 dark:text-gray-400"
                          } disabled:opacity-60`}
                        >
                          {active ? (
                            <MdLabel className="h-4 w-4 shrink-0" />
                          ) : (
                            <MdLabelOff className="h-4 w-4 shrink-0" />
                          )}
                          {getLabelVi(sl, systemLabelEnum)}
                          {active && (
                            <span className="ml-auto text-xs opacity-70">
                              Đang gán
                            </span>
                          )}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              {/* IDs (collapsed info) */}
              <details className="group">
                <summary className="cursor-pointer text-xs text-gray-400 select-none group-open:mb-2">
                  Thông tin kỹ thuật
                </summary>
                <div className="dark:bg-navy-700 rounded-xl bg-gray-50 p-3 text-xs text-gray-500 dark:text-gray-400">
                  <p>
                    <span className="font-medium">ID:</span> {detail.id}
                  </p>
                  <p className="mt-1 break-all">
                    <span className="font-medium">Gmail ID:</span>{" "}
                    {detail.gmailMessageId}
                  </p>
                  <p className="mt-1 break-all">
                    <span className="font-medium">Thread ID:</span>{" "}
                    {detail.threadId}
                  </p>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EmailDetailDrawer;
