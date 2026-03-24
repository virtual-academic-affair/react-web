import Drawer from "@/components/drawer/Drawer";
import { messagesService } from "@/services/email";
import type { Message, SystemLabel } from "@/types/email";
import type { SystemLabelEnumData } from "@/types/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "../labelUtils";
import MessageLabelEditor from "./MessageLabelEditor";

import Tooltip from "@/components/tooltip/Tooltip.tsx";
import { MdDeleteOutline, MdPostAdd } from "react-icons/md";
import { SiGmail } from "react-icons/si";

interface EmailDetailDrawerProps {
  messageId: number | null;
  systemLabelEnum?: SystemLabelEnumData | null;
  onClose: () => void;
  onLabelChanged: (id: number, labels: SystemLabel[]) => void;
  processingIds?: number[];
  onOpenGmail?: (msg: Message) => void;
  onCreateTask?: (msg: Message) => void;
  onDelete?: (msg: Message) => void;
}

const EmailDetailDrawer: React.FC<EmailDetailDrawerProps> = ({
  messageId,
  systemLabelEnum,
  onClose,
  onLabelChanged,
  processingIds = [],
  onOpenGmail,
  onCreateTask,
  onDelete,
}) => {
  const queryClient = useQueryClient();

  const { data: detail = null, isLoading: loading } = useQuery({
    queryKey: ["message", messageId],
    queryFn: () => messagesService.getMessageById(messageId!),
    enabled: messageId != null,
    staleTime: 5 * 60 * 1000,
  });

  const isOpen = messageId != null;

  const footerLeft = detail && (
    <>
      <Tooltip label="Gmail">
        <button
          onClick={() => onOpenGmail?.(detail)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-500 text-white transition-colors hover:bg-pink-600 dark:bg-pink-500 dark:hover:bg-pink-600"
        >
          <SiGmail className="h-4 w-4" />
        </button>
      </Tooltip>

      <Tooltip label="Tạo công việc">
        <button
          onClick={() => onCreateTask?.(detail)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500 text-white transition-colors hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600"
        >
          <MdPostAdd className="h-5 w-5" />
        </button>
      </Tooltip>

      <Tooltip label="Xóa">
        <button
          onClick={() => {
            onClose();
            onDelete?.(detail);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600"
        >
          <MdDeleteOutline className="h-4 w-4" />
        </button>
      </Tooltip>
    </>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết tin nhắn"
      footerLeft={footerLeft}
    >
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
                      old ? { ...old, systemLabels: labels } : old,
                  );
                  onLabelChanged(id, labels);
                }}
                isProcessing={processingIds.includes(detail.id)}
              />
            </div>
          </div>

          {/* Message content */}
          {detail.content && (
            <div className="flex flex-col gap-2">
              <div className="w-100 shrink-0 pb-1 text-gray-400 dark:border-white/10">
                <p className="text-xs font-semibold tracking-wide uppercase dark:text-gray-500">
                  Nội dung tin nhắn
                </p>
              </div>
              <div className="dark:bg-navy-800 mt-2 overflow-x-auto rounded-4xl bg-gray-50/50 p-4 select-auto dark:border-white/10">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none leading-relaxed wrap-break-word whitespace-pre-wrap text-gray-700 select-text dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: detail.content }}
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
