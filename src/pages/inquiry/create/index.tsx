import CreatePageLayout from "@/components/layouts/CreatePageLayout";
import { inquiriesService } from "@/services/inquiry";
import type { CreateInquiryDto, InquiryType } from "@/types/inquiry";
import { message as toast } from "antd";
import React from "react";
import RichTextEditor from "@/components/fields/RichTextEditor";
import InquiryTypeSelector from "@/components/selector/InquiryTypeSelector";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProcessSteps from "./components/ProcessSteps";
import { messagesService } from "@/services/email/messages.service";
import type { Message } from "@/types/email";
import RelatedMessageView from "../../emails/message/components/RelatedMessageView";

const InquiryCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [types, setTypes] = React.useState<InquiryType[]>([]);
  const [question, setQuestion] = React.useState("");
  const [answer, setAnswer] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<Message | null>(null);
  const [messageLoading, setMessageLoading] = React.useState(false);
  const [messageId, setMessageId] = React.useState<number | undefined>(
    searchParams.get("messageId")
      ? Number(searchParams.get("messageId"))
      : undefined,
  );

  React.useEffect(() => {
    const mId = searchParams.get("messageId");
    if (mId) {
      setMessageLoading(true);
      messagesService
        .getMessageById(Number(mId))
        .then((m) => {
          setMessage(m);
          setMessageId(m.id);
          // If question is empty, pre-fill with subject
          if (!question) {
            setQuestion(m.subject || "");
          }
        })
        .catch(() => toast.error("Không thể tải thông tin tin nhắn."))
        .finally(() => setMessageLoading(false));
    }
  }, [searchParams, question]);

  const validateStep1 = () => {
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

  const handleCreateInquiry = async (e?: React.MouseEvent | React.FormEvent) => {
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
      messageId,
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

  return (
    <CreatePageLayout
      title="Tạo thắc mắc mới"
      processSteps={<ProcessSteps currentStep={currentStep} />}
    >
      <RelatedMessageView
        message={message}
        loading={messageLoading}
        onReselect={() => navigate("/admin/emails/message")}
      />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          {currentStep === 1 && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              {/* Types */}
              <div className="flex items-start gap-6">
                <div className="w-40 shrink-0">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Loại thắc mắc
                  </p>
                </div>
                <div className="flex-1">
                  <InquiryTypeSelector
                    value={types}
                    onChange={setTypes}
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="flex items-start gap-6">
                <div className="w-40 shrink-0">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Nội dung thắc mắc
                  </p>
                </div>
                <div className="flex-1">
                  <RichTextEditor
                    value={question}
                    onChange={setQuestion}
                    placeholder="Nhập nội dung thắc mắc..."
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              {/* Answer */}
              <div className="flex items-start gap-6">
                <div className="w-40 shrink-0">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Câu trả lời
                  </p>
                </div>
                <div className="flex-1">
                  <RichTextEditor
                    value={answer}
                    onChange={setAnswer}
                    placeholder="Nhập nội dung giải đáp (nếu có)..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buttons - Absolutely separated to prevent any event leaks */}
        <div className="mt-4 flex justify-end gap-2">
          {currentStep === 1 ? (
            <>
              <button
                key="btn-cancel"
                type="button"
                onClick={() => navigate(-1)}
                disabled={submitting}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
              >
                Hủy
              </button>
              <button
                key="btn-next"
                type="button"
                onClick={handleNextStep}
                className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-8 py-3.5 text-sm font-bold text-white transition-colors"
              >
                Tiếp theo
              </button>
            </>
          ) : (
            <>
              <button
                key="btn-prev"
                type="button"
                onClick={handlePrevStep}
                disabled={submitting}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
              >
                Quay lại
              </button>
              <button
                key="btn-submit"
                type="button"
                onClick={handleCreateInquiry}
                disabled={submitting}
                className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-8 py-3.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
              >
                {submitting ? "Đang tạo..." : "Hoàn tất & Tạo"}
              </button>
            </>
          )}
        </div>
      </div>
    </CreatePageLayout>
  );
};

export default InquiryCreatePage;
