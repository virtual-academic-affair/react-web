import RichTextEditor from "@/components/fields/RichTextEditor";
import CreatePageLayout from "@/components/layouts/CreatePageLayout";
import InquiryTypeSelector from "@/components/selector/InquiryTypeSelector";
import { messagesService } from "@/services/email/messages.service";
import { inquiriesService } from "@/services/inquiry";
import type { CreateInquiryDto, InquiryType } from "@/types/inquiry";
import { useQuery } from "@tanstack/react-query";
import { message as toast } from "antd";
import React from "react";
import { MdExpandMore } from "react-icons/md";
import { useNavigate, useSearchParams } from "react-router-dom";

import MessageContentSidePanel from "../../emails/message/components/MessageContentSidePanel";
import RelatedMessageView from "../../emails/message/components/RelatedMessageView";
import ProcessSteps from "./components/ProcessSteps";

const InquiryCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [types, setTypes] = React.useState<InquiryType[]>([]);
  const [question, setQuestion] = React.useState("");
  const [answer, setAnswer] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const messageId = searchParams.get("messageId")
    ? Number(searchParams.get("messageId"))
    : undefined;

  // Fetch related message
  const { data: message, isLoading: messageLoading } = useQuery({
    queryKey: ["message", messageId],
    queryFn: () => messagesService.getMessageById(messageId!),
    enabled: !!messageId,
    staleTime: 5 * 60 * 1000,
  });

  // Check if the message already has an inquiry attached
  useQuery({
    queryKey: ["inquiries", { messageId }],
    queryFn: () => inquiriesService.getList({ messageId: message!.id, limit: 1 }),
    enabled: !!message,
    staleTime: 0,
    select: (resp) => {
      if (resp.items.length > 0) {
        const existing = resp.items[0];
        toast.info("Tin nhắn này đã có thông tin thắc mắc.");
        navigate(`/admin/inquiry/inquiries/${existing.id}`);
      }
      return resp;
    },
  });

  // Pre-fill question from message subject
  React.useEffect(() => {
    if (!message) return;
    if (!question) setQuestion(message.subject || "");
  }, [message, question]);

  const validateStep1 = () => {
    if (!messageId) {
      toast.error("Vui lòng đính kèm email.");
      return false;
    }
    if (!types.length) {
      toast.error("Vui lòng chọn ít nhất một loại thắc mắc.");
      return false;
    }
    if (!question.trim()) {
      toast.error("Vui lòng nhập nội dung thắc mắc.");
      return false;
    }
    return true;
  };

  const handleNextStep = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setCurrentStep(1);
  };

  const handleCreateInquiry = async (
    e?: React.MouseEvent | React.FormEvent,
  ) => {
    e?.preventDefault();

    // Final validation
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    const dto: CreateInquiryDto = {
      types,
      question: question.trim(),
      answer: answer.trim() || undefined,
      messageId: messageId!,
    };

    setSubmitting(true);
    try {
      await inquiriesService.create(dto);
      toast.success("Tạo thắc mắc thành công.");
      navigate("/admin/inquiry/inquiries");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tạo thắc mắc thất bại.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!messageId && !messageLoading) {
    return (
      <CreatePageLayout title="Vui lòng chọn tin nhắn trước">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="mb-10 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            Hồ sơ cần được tạo từ một tin nhắn email cụ thể
          </p>

          <div className="mb-12 flex flex-col items-start gap-6 text-left">
            <div className="flex items-center gap-4">
              <div className="bg-brand-500 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-white">
                1
              </div>
              <p className="text-navy-700 text-base dark:text-white">
                Mở <strong>DS tin nhắn</strong>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-brand-500 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-white">
                2
              </div>
              <div className="text-navy-700 flex items-center gap-2 text-base dark:text-white">
                <span>Tại tin nhắn muốn xử lý, gắn nhãn bằng nút</span>
                <span className="dark:bg-navy-800 inline-flex aspect-square h-6 items-center rounded-lg border border-gray-200 bg-white pr-1.5 pl-1 text-gray-500 shadow-sm dark:border-white/10 dark:text-gray-300">
                  <MdExpandMore className="h-4 w-4" />
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-brand-500 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-white">
                3
              </div>
              <div className="text-navy-700 flex items-center gap-2 text-base dark:text-white">
                <span>Chọn nhãn</span>
                <span
                  style={{ backgroundColor: "#17c1e820", color: "#17c1e8" }}
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm"
                >
                  Thắc mắc
                </span>
                <span>để bắt đầu tạo hồ sơ.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() =>
                navigate(
                  "/admin/email/messages?page=1&limit=10&startTour=inquiry",
                )
              }
              className="dark:bg-navy-800 dark:hover:bg-navy-700 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:text-white"
            >
              Hướng dẫn
            </button>
            <button
              onClick={() => navigate("/admin/email/messages?page=1&limit=10")}
              className="bg-brand-500 hover:bg-brand-600 shadow-brand-500/20 rounded-2xl px-8 py-4 text-sm font-bold text-white shadow-lg transition-all active:scale-95"
            >
              DS tin nhắn
            </button>
          </div>
        </div>
      </CreatePageLayout>
    );
  }

  const sideContent = message?.content ? (
    <MessageContentSidePanel content={message.content} />
  ) : undefined;

  return (
    <CreatePageLayout
      title="Tạo thắc mắc mới"
      processSteps={<ProcessSteps currentStep={currentStep} />}
      sideContent={sideContent}
    >
      <RelatedMessageView
        message={message ?? null}
        loading={messageLoading}
        onReselect={() => navigate("/admin/email/message")}
      />

      {messageLoading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="animate-pulse text-gray-500 italic">
            Đang tải thông tin tin nhắn...
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {currentStep === 1 && (
              <div className="animate-fadeIn flex flex-col gap-6">
                {/* Types */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Loại thắc mắc
                  </p>
                  <InquiryTypeSelector
                    value={types}
                    onChange={setTypes}
                    disabled={submitting}
                  />
                </div>

                {/* Question */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Nội dung thắc mắc
                  </p>
                  <RichTextEditor
                    value={question}
                    onChange={setQuestion}
                    placeholder="Nhập nội dung thắc mắc..."
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="animate-fadeIn flex flex-col gap-4">
                {/* Answer */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Câu trả lời / Giải đáp
                  </p>
                  <RichTextEditor
                    value={answer}
                    onChange={setAnswer}
                    placeholder="Nhập nội dung giải đáp (nếu có)..."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-3">
            {currentStep === 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                  className="rounded-2xl px-6 py-3.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-brand-500 hover:bg-brand-600 shadow-brand-500/20 rounded-2xl px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98]"
                >
                  Tiếp tục
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={submitting}
                  className="rounded-2xl px-6 py-3.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleCreateInquiry}
                  disabled={submitting}
                  className="rounded-2xl bg-green-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-500/20 transition-all hover:bg-green-600 active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? "Đang xử lý..." : "Hoàn tất & Tạo thắc mắc"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </CreatePageLayout>
  );
};

export default InquiryCreatePage;
