import Drawer from "@/components/drawer/Drawer";
import { messagesService } from "@/services/email";
import type { Message, SystemLabel } from "@/types/email";
import type { SystemLabelEnumData } from "@/types/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "../labelUtils";
import MessageLabelEditor from "./MessageLabelEditor";

interface EmailDetailDrawerProps {
  messageId: number | null;
  systemLabelEnum?: SystemLabelEnumData | null;
  onClose: () => void;
  onLabelChanged: (id: number, labels: SystemLabel[]) => void;
}

const EmailDetailDrawer: React.FC<EmailDetailDrawerProps> = ({
  messageId,
  systemLabelEnum,
  onClose,
  onLabelChanged,
}) => {
  const queryClient = useQueryClient();

  const { data: detail = null, isLoading: loading } = useQuery({
    queryKey: ["message", messageId],
    queryFn: () => messagesService.getMessageById(messageId!),
    enabled: messageId != null,
    staleTime: 5 * 60 * 1000,
  });

  const isOpen = messageId != null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Chi tiết tin nhắn">
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
              <MessageLabelEditor
                message={detail}
                systemLabelEnum={systemLabelEnum}
                onLabelChanged={(id, labels) => {
                  // Optimistic update
                  queryClient.setQueryData(
                    ["message", messageId],
                    (old: Message | undefined) =>
                      old ? { ...old, systemLabels: labels } : old
                  );
                  onLabelChanged(id, labels);
                }}
              />
            </div>
          </div>

          {/* Message content */}
          {detail.content && (
            <div className="flex flex-col gap-2">
              <div className="w-100 shrink-0 border-b border-gray-100 pb-1 dark:border-white/10 text-gray-400">
                <p className="text-xs font-semibold tracking-wide uppercase dark:text-gray-500">
                  Nội dung tin nhắn
                </p>
              </div>
              <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-white/10 dark:bg-navy-800 overflow-x-auto select-auto">
                <div
                  dangerouslySetInnerHTML={{ __html: detail.content }}
                  className="prose dark:prose-invert max-w-none text-sm"
                />
              </div>
            </div>
          )}

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
              <div className="flex items-center gap-6">
                <div className="w-40 shrink-0">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Ngày tạo
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-navy-700 text-base dark:text-white">
                    {formatDate(detail.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-40 shrink-0">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Cập nhật lần cuối
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-navy-700 text-base dark:text-white">
                    {formatDate(detail.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default EmailDetailDrawer;
