import Drawer from "@/components/drawer/Drawer";
import { inquiriesService } from "@/services/inquiry";
import type { Inquiry, InquiryType, UpdateInquiryDto } from "@/types/inquiry";
import type { MessageStatus } from "@/types/messageStatus";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import React from "react";
import { MdSave } from "react-icons/md";
import type ReactQuill from "react-quill-new";
import { useSearchParams } from "react-router-dom";
import MessageStatusSelector from "@/components/selector/MessageStatusSelector";
import InquiryTypeEditor from "@/components/selector/InquiryTypeEditor";
import RichTextEditor from "@/components/fields/RichTextEditor";
import { formatDate } from "@/utils/date";

interface InquiryDetailDrawerProps {
  inquiryId: number | null;
  onClose: () => void;
  onInquiryChanged: (next: Inquiry) => void;
}

const InquiryDetailDrawer: React.FC<InquiryDetailDrawerProps> = ({
  inquiryId,
  onClose,
  onInquiryChanged,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const answerEditorRef = React.useRef<ReactQuill>(null);
  const questionEditorRef = React.useRef<ReactQuill>(null);
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
      answer: detail.answer ?? "",
      messageStatus: detail.messageStatus ?? null,
    });
  }, [detail, inquiryId]);

  // Focus on editor when focus param is present
  React.useEffect(() => {
    const focusParam = searchParams.get("focus");
    if (focusParam === "answer" && answerEditorRef.current && form) {
      const next = new URLSearchParams(searchParams);
      next.delete("focus");
      setSearchParams(next, { replace: true });

      setTimeout(() => {
        const editor = answerEditorRef.current?.getEditor();
        if (editor) {
          editor.focus();
        }
      }, 100);
    } else if (focusParam === "question" && questionEditorRef.current && form) {
      const next = new URLSearchParams(searchParams);
      next.delete("focus");
      setSearchParams(next, { replace: true });

      setTimeout(() => {
        const editor = questionEditorRef.current?.getEditor();
        if (editor) {
          editor.focus();
        }
      }, 100);
    }
  }, [searchParams, form, setSearchParams]);

  const handleFieldChange = (
    field: "question" | "answer",
    value: string,
  ) => {
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
      answer: detail.answer ?? "",
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
      JSON.stringify([...form.types].sort()) !== JSON.stringify([...(detail.types ?? [])].sort()) ||
      form.question !== (detail.question ?? "") ||
      form.answer !== (detail.answer ?? "") ||
      form.messageStatus !== (detail.messageStatus ?? null)
    );
  }, [detail, form]);

  const isOpen = inquiryId != null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Chi tiết thắc mắc">
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
            <div className="flex items-start gap-6">
              <div className="w-40 shrink-0">
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Loại thắc mắc
                </p>
              </div>
              <div className="flex-1">
                <InquiryTypeEditor
                  value={form.types}
                  onChange={handleTypesChange}
                  disabled={savingInfo}
                />
              </div>
            </div>

            {/* Trạng thái xử lý */}
            <div className="flex items-center gap-6">
              <div className="w-40 shrink-0">
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Trạng thái xử lý
                </p>
              </div>
              <div className="flex-1">
                <MessageStatusSelector
                  value={form.messageStatus}
                  onChange={handleMessageStatusChange}
                  disabled={savingInfo}
                />
              </div>
            </div>

            {/* Câu hỏi */}
            <div className="flex items-start gap-6">
              <div className="w-40 shrink-0">
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Nội dung thắc mắc
                </p>
              </div>
              <div className="flex-1">
                <RichTextEditor
                  ref={questionEditorRef}
                  value={form.question}
                  onChange={(html) => handleFieldChange("question", html)}
                />
              </div>
            </div>

            {/* Câu trả lời */}
            <div className="flex items-start gap-6">
              <div className="w-40 shrink-0">
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Câu trả lời
                </p>
              </div>
              <div className="flex-1">
                <RichTextEditor
                  ref={answerEditorRef}
                  value={form.answer}
                  onChange={(html) => handleFieldChange("answer", html)}
                />
              </div>
            </div>

            {isDirty && (
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={savingInfo}
                  onClick={handleResetForm}
                  className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={savingInfo}
                  onClick={handleSaveInfo}
                  className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                >
                  <MdSave className="h-4 w-4" />
                  {savingInfo ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            )}
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
  );
};

export default InquiryDetailDrawer;
