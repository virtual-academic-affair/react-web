import {
  DetailLinkedEmailDrawer,
  DetailLinkedMessageSwitch,
} from "@/components/detail/DetailLinkedEmailDrawer";
import Drawer from "@/components/drawer/Drawer";
import RichTextEditor, {
  type RichTextEditorHandle,
} from "@/components/fields/RichTextEditor";
import InquiryTypeEditor from "@/components/selector/InquiryTypeEditor";
import MessageStatusSelector from "@/components/selector/MessageStatusSelector";
import Tooltip from "@/components/tooltip/Tooltip";
import { resolveLinkedMessageId } from "@/hooks/useDetailLinkedMessagePanel";
import { inquiriesService } from "@/services/inquiry";
import type { Inquiry, InquiryType, UpdateInquiryDto } from "@/types/inquiry";
import type { MessageStatus } from "@/types/messageStatus";
import { formatDate } from "@/utils/date";
import { normalizeInquiryContent } from "@/utils/inquiryContent";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import React from "react";
import { MdDeleteOutline, MdOutlineRateReview, MdSave } from "react-icons/md";
import { Link, useSearchParams } from "react-router-dom";

interface InquiryDetailDrawerProps {
  inquiryId: number | null;
  onClose: () => void;
  onInquiryChanged: (next: Inquiry) => void;
  onInquiryDeleted?: (id: number) => void;
  onPreviewReply?: (id: number) => void;
}

const InquiryDetailDrawer: React.FC<InquiryDetailDrawerProps> = ({
  inquiryId,
  onClose,
  onInquiryChanged,
  onInquiryDeleted,
  onPreviewReply,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const answerEditorRef = React.useRef<RichTextEditorHandle>(null);
  const questionEditorRef = React.useRef<RichTextEditorHandle>(null);
  const [savingInfo, setSavingInfo] = React.useState(false);
  const [form, setForm] = React.useState<{
    types: InquiryType[];
    question: string;
    answer: string;
    messageStatus: MessageStatus | null;
  } | null>(null);

  // Fetch inquiry detail — result is cached globally under ['inquiry', inquiryId]
  const { data: detail, isLoading: loading } = useQuery({
    queryKey: ["inquiry", inquiryId],
    queryFn: () => inquiriesService.getById(inquiryId!),
    enabled: inquiryId != null,
    staleTime: 30 * 1000,
  });
  const sources = detail?.sources ?? [];
  const normalizedAnswerContent = React.useMemo(
    () => normalizeInquiryContent(detail?.answer),
    [detail?.answer],
  );

  // Sync form from query data
  React.useEffect(() => {
    if (inquiryId == null) {
      setForm(null);
      return;
    }
    if (!detail) {
      setForm(null);
      return;
    }
    setForm({
      types: detail.types ?? [],
      question: detail.question ?? "",
      answer: normalizedAnswerContent,
      messageStatus: detail.messageStatus ?? null,
    });
  }, [detail, inquiryId, normalizedAnswerContent]);

  React.useEffect(() => {
    if (inquiryId == null || !detail) {
      return;
    }
  }, [detail, inquiryId]);

  // Focus on editor when focus param is present
  React.useEffect(() => {
    const focusParam = searchParams.get("focus");
    if (focusParam === "answer" && answerEditorRef.current && form) {
      const next = new URLSearchParams(searchParams);
      next.delete("focus");
      setSearchParams(next, { replace: true });

      setTimeout(() => {
        answerEditorRef.current?.focus();
      }, 100);
    } else if (focusParam === "question" && questionEditorRef.current && form) {
      const next = new URLSearchParams(searchParams);
      next.delete("focus");
      setSearchParams(next, { replace: true });

      setTimeout(() => {
        questionEditorRef.current?.focus();
      }, 100);
    }
  }, [searchParams, form, setSearchParams]);

  const handleFieldChange = (field: "question" | "answer", value: string) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleTypesChange = (types: InquiryType[]) => {
    setForm((prev) => (prev ? { ...prev, types } : prev));
  };

  const handleMessageStatusChange = (status: MessageStatus | null) => {
    setForm((prev) => (prev ? { ...prev, messageStatus: status } : prev));
  };

  const handleResetForm = () => {
    if (!detail) {
      return;
    }
    setForm({
      types: detail.types ?? [],
      question: detail.question ?? "",
      answer: normalizedAnswerContent,
      messageStatus: detail.messageStatus ?? null,
    });
  };

  const handleSaveInfo = async () => {
    if (!detail || !form) {
      return;
    }

    const dto: UpdateInquiryDto = {
      types: form.types,
      question: form.question.trim(),
      answer: form.answer.trim(),
      messageStatus: form.messageStatus,
    };

    setSavingInfo(true);
    try {
      const updated = await inquiriesService.update(detail.id, dto);
      // Update the cached data so re-opening the drawer shows fresh data
      queryClient.setQueryData(["inquiry", inquiryId], updated);
      onInquiryChanged(updated);
      toast.success("Cập nhật thành công.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại.";
      toast.error(msg);
    } finally {
      setSavingInfo(false);
    }
  };

  const isDirty = React.useMemo(() => {
    if (!detail || !form) {
      return false;
    }
    return (
      JSON.stringify([...form.types].sort()) !==
        JSON.stringify([...(detail.types ?? [])].sort()) ||
      form.question !== (detail.question ?? "") ||
      form.answer !== normalizedAnswerContent ||
      form.messageStatus !== (detail.messageStatus ?? null)
    );
  }, [detail, form, normalizedAnswerContent]);

  const isOpen = inquiryId != null;

  const footerLeft = detail && (
    <>
      <Tooltip label="Xem trước phản hồi">
        <button
          onClick={() => {
            if (detail) onPreviewReply?.(detail.id);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <MdOutlineRateReview className="h-4 w-4" />
        </button>
      </Tooltip>

      <Tooltip label="Xóa">
        <button
          onClick={() => {
            if (detail) {
              onClose();
              onInquiryDeleted?.(detail.id);
            }
          }}
          disabled={savingInfo}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
        >
          <MdDeleteOutline className="h-4 w-4" />
        </button>
      </Tooltip>
    </>
  );

  const footerRight = detail && isDirty && (
    <>
      <button
        type="button"
        disabled={savingInfo}
        onClick={handleResetForm}
        className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
      >
        Hủy
      </button>
      <button
        type="button"
        disabled={savingInfo}
        onClick={handleSaveInfo}
        className="bg-brand-500 hover:bg-brand-600 flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        <MdSave className="h-4 w-4" />
        {savingInfo ? "Đang lưu..." : "Lưu"}
      </button>
    </>
  );

  const linkedMid = detail ? resolveLinkedMessageId(detail.messageId) : null;

  return (
    <>
      <DetailLinkedEmailDrawer parentOpen={isOpen} messageId={linkedMid} />
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title="Chi tiết thắc mắc"
        headerExtra={
          linkedMid != null ? <DetailLinkedMessageSwitch /> : undefined
        }
        footerLeft={footerLeft}
        footerRight={footerRight}
      >
        {loading || !form ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
            <div className="flex flex-col gap-3">
              {/* Types */}
            <div className="flex flex-col items-start gap-2 md:flex-row md:items-start md:gap-6">
              <div className="w-full shrink-0 md:w-40">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Loại thắc mắc
                  </p>
                </div>
              <div className="w-full flex-1">
                  <InquiryTypeEditor
                    value={form.types}
                    onChange={handleTypesChange}
                    disabled={savingInfo}
                  />
                </div>
              </div>

              {/* Trạng thái xử lý */}
            <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-6">
              <div className="w-full shrink-0 md:w-40">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Trạng thái xử lý
                  </p>
                </div>
              <div className="w-full flex-1">
                  <MessageStatusSelector
                    value={form.messageStatus}
                    onChange={handleMessageStatusChange}
                    disabled={savingInfo}
                  />
                </div>
              </div>

              {/* Câu hỏi */}
            <div className="flex flex-col items-start gap-2 md:flex-row md:items-start md:gap-6">
              <div className="w-full shrink-0 md:w-40">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Nội dung thắc mắc
                  </p>
                </div>
              <div className="w-full flex-1">
                  <RichTextEditor
                    ref={questionEditorRef}
                    value={form.question}
                    onChange={(html) => handleFieldChange("question", html)}
                  />
                </div>
              </div>

              {/* Câu trả lời */}
            <div className="flex flex-col items-start gap-2 md:flex-row md:items-start md:gap-6">
              <div className="w-full shrink-0 md:w-40">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Câu trả lời
                  </p>
                </div>
              <div className="w-full flex-1">
                  <RichTextEditor
                    ref={answerEditorRef}
                    value={form.answer}
                    onChange={(html) => handleFieldChange("answer", html)}
                  />
                </div>
              </div>
            </div>

            {sources.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/10">
                <p className="text-navy-700 mb-3 text-xs font-semibold tracking-wide uppercase dark:text-white">
                  {"Tài liệu tham khảo"}
                </p>
                <div className="flex flex-col gap-2">
                  {sources.map((source, index) => (
                    <div
                      key={`${source.fileId}-${index}`}
                      className="flex items-baseline gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                    >
                      <span className="text-brand-500 shrink-0 text-sm leading-6 font-semibold">
                        [{index + 1}]
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/admin/documents/list?id=${encodeURIComponent(source.fileId)}`}
                          className="text-navy-700 hover:text-brand-500 dark:hover:text-brand-400 inline text-sm leading-6 font-semibold underline-offset-2 transition-colors hover:underline dark:text-white"
                        >
                          {source.displayName || `Tài liệu ${index + 1}`}
                        </Link>
                      </div>
                    </div>
                  ))}
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
                      Message ID
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-navy-700 text-base dark:text-white">
                      {detail.messageId ?? "—"}
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
    </>
  );
};

export default InquiryDetailDrawer;
