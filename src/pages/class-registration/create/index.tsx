import Tag from "@/components/tag/Tag";
import RichTextEditor from "@/components/fields/RichTextEditor";
import CreatePageLayout from "@/components/layouts/CreatePageLayout";
import { classRegistrationsService } from "@/services/class-registration";
import { messagesService } from "@/services/email/messages.service";
import type {
  CreateClassRegistrationDto,
  CreateClassRegistrationItemDto,
} from "@/types/classRegistration";
import type { Message } from "@/types/email";
import { message as toast } from "antd";
import React from "react";
import { MdAdd, MdDeleteOutline, MdExpandMore } from "react-icons/md";

import { useNavigate, useSearchParams } from "react-router-dom";
import MessageContentSidePanel from "../../emails/message/components/MessageContentSidePanel";
import RelatedMessageView from "../../emails/message/components/RelatedMessageView";
import ProcessSteps from "./components/ProcessSteps";

interface DraftItem extends CreateClassRegistrationItemDto {
  key: string;
}

const emptyItem = (): DraftItem => ({
  key: Math.random().toString(36).slice(2),
  action: "register",
  subjectName: "",
  subjectCode: "",
  className: "",
  slotInfo: "",
  isInCurriculum: false,
});

const ClassRegistrationCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [studentCode, setStudentCode] = React.useState("");
  const [studentName, setStudentName] = React.useState("");
  const [academicYear, setAcademicYear] = React.useState("2026");
  const [note, setNote] = React.useState("");
  const [items, setItems] = React.useState<DraftItem[]>([emptyItem()]);
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<Message | null>(null);
  const [messageLoading, setMessageLoading] = React.useState(false);

  const messageId = searchParams.get("messageId")
    ? Number(searchParams.get("messageId"))
    : undefined;

  React.useEffect(() => {
    if (messageId) {
      setMessageLoading(true);
      messagesService
        .getMessageById(messageId)
        .then((m) => {
          setMessage(m);
          if (!note) {
            setNote(m.subject || "");
          }

          // Check for existing registration
          classRegistrationsService
            .getList({ messageId: m.id, limit: 1 })
            .then((resp) => {
              if (resp.items.length > 0) {
                const existing = resp.items[0];
                toast.info("Tin nhắn này đã có thông tin đăng ký lớp.");
                navigate(
                  `/admin/class-registration/registrations/${existing.id}`,
                );
              }
            });
        })
        .catch(() => toast.error("Không thể tải thông tin tin nhắn."))
        .finally(() => setMessageLoading(false));
    }
  }, [messageId, navigate, note]);

  const updateItem = (
    key: string,
    field: keyof DraftItem,
    value: string | boolean,
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, [field]: value } : item,
      ),
    );
  };

  const validateStep1 = () => {
    if (!messageId) {
      toast.error("Vui lòng đính kèm email.");
      return false;
    }
    if (!studentCode.trim()) {
      toast.error("Vui lòng nhập MSSV.");
      return false;
    }
    if (!studentName.trim()) {
      toast.error("Vui lòng nhập họ tên.");
      return false;
    }
    if (!academicYear.trim()) {
      toast.error("Vui lòng nhập năm học.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!items.length) {
      toast.error("Vui lòng thêm ít nhất một lớp con.");
      return false;
    }
    if (items.some((i) => !i.subjectName.trim())) {
      toast.error("Mỗi lớp cần có tên môn học.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      return;
    }

    const dto: CreateClassRegistrationDto = {
      studentCode: studentCode.trim(),
      studentName: studentName.trim(),
      academicYear: Number(academicYear),
      note: note || undefined,
      items: items.map((it) => {
        const { key, ...rest } = it;
        void key;
        return rest;
      }),
      messageId: messageId!,
    };

    setSubmitting(true);
    try {
      await classRegistrationsService.create(dto);
      toast.success("Tạo đăng ký lớp thành công.");
      navigate("/admin/class-registration/registrations");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Tạo đăng ký lớp thất bại.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!messageId && !messageLoading) {
    return (
      <CreatePageLayout title="Vui lòng chọn tin nhắn trước">
        <div className="flex flex-col items-center justify-center py-10">
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
                                <Tag color="#a855f7">Đăng ký lớp</Tag>
                <span>để bắt đầu tạo hồ sơ.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() =>
                navigate(
                  "/admin/email/messages?page=1&limit=10&startTour=class-registration",
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
      title="Tạo đăng ký lớp"
      processSteps={<ProcessSteps currentStep={currentStep} />}
      sideContent={sideContent}
    >
      <RelatedMessageView
        message={message}
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (currentStep === 3) {
              handleSubmit();
            } else {
              handleNext();
            }
          }}
        >
          {/* Step 1: Thông tin SV */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-6">
                <div className="w-40 shrink-0">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    MSSV
                  </p>
                </div>
                <div className="flex-1">
                  <input
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    placeholder="Nhập MSSV"
                    className="focus:border-brand-500 w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 transition-colors outline-none dark:border-white/10 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-40 shrink-0">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Họ tên
                  </p>
                </div>
                <div className="flex-1">
                  <input
                    value={studentName}
                    placeholder="Nhập họ tên"
                    onChange={(e) => setStudentName(e.target.value)}
                    className="focus:border-brand-500 w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 transition-colors outline-none dark:border-white/10 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-40 shrink-0">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Năm học
                  </p>
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="focus:border-brand-500 w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 transition-colors outline-none dark:border-white/10 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Thông tin đăng ký */}
          {currentStep === 2 && (
            <div className="mt-2">
              <div className="flex flex-col gap-4">
                {items.map((item, idx) => (
                  <div
                    key={item.key}
                    className="dark:bg-navy-700/40 hover:border-brand-500/20 rounded-2xl border border-transparent bg-gray-50 p-4 transition-colors dark:border-white/10"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-navy-700 text-base font-medium dark:text-white">
                        Lớp HP #{idx + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setItems((prev) =>
                            prev.length === 1
                              ? prev
                              : prev.filter((x) => x.key !== item.key),
                          )
                        }
                        className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <MdDeleteOutline className="h-4 w-4" />
                        Xóa
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Lớp HP
                        </label>
                        <input
                          type="text"
                          value={item.className}
                          onChange={(e) =>
                            updateItem(item.key, "className", e.target.value)
                          }
                          placeholder="Nhập lớp HP (ví dụ: IT001.L21)"
                          className="dark:bg-navy-800 focus:border-brand-500 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Thông tin lớp
                        </label>
                        <input
                          type="text"
                          value={item.slotInfo}
                          onChange={(e) =>
                            updateItem(item.key, "slotInfo", e.target.value)
                          }
                          placeholder="Nhập thông tin (thứ, tiết, phòng...)"
                          className="dark:bg-navy-800 focus:border-brand-500 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Tên môn học
                        </label>
                        <input
                          type="text"
                          value={item.subjectName}
                          onChange={(e) =>
                            updateItem(item.key, "subjectName", e.target.value)
                          }
                          placeholder="Nhập tên môn học"
                          className="dark:bg-navy-800 focus:border-brand-500 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Mã môn học
                        </label>
                        <input
                          type="text"
                          value={item.subjectCode}
                          onChange={(e) =>
                            updateItem(item.key, "subjectCode", e.target.value)
                          }
                          placeholder="Nhập mã môn học"
                          className="dark:bg-navy-800 focus:border-brand-500 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10"
                        />
                      </div>
                      <div className="dark:bg-navy-800 flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-2 dark:border-white/5">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          Trong CTDT?
                        </span>
                        <input
                          type="checkbox"
                          checked={item.isInCurriculum ?? false}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateItem(
                              item.key,
                              "isInCurriculum",
                              e.target.checked,
                            )
                          }
                          className="text-brand-500 focus:ring-brand-500 h-4 w-4 rounded border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setItems((prev) => [...prev, emptyItem()])}
                  className="hover:border-brand-500 hover:text-brand-500 dark:hover:border-brand-400 dark:hover:text-brand-400 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-4 text-sm font-medium text-gray-400 transition-colors dark:border-white/10"
                >
                  <MdAdd className="h-5 w-5" />
                  Thêm lớp học phần mới
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Ghi chú */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Ghi chú bổ sung
                </p>
                <RichTextEditor value={note} onChange={setNote} />
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex justify-end gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={submitting}
                className="rounded-2xl border border-gray-100 px-6 py-3.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-white/5 dark:text-gray-300 dark:hover:bg-white/10"
              >
                Quay lại
              </button>
            )}
            {currentStep < 3 ? (
              <button
                type="submit"
                disabled={submitting}
                className="bg-brand-500 hover:bg-brand-600 shadow-brand-500/20 rounded-2xl px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Tiếp tục
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-green-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-500/20 transition-all hover:bg-green-600 active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? "Đang xử lý..." : "Hoàn tất & Lưu đăng ký"}
              </button>
            )}
          </div>
        </form>
      )}
    </CreatePageLayout>
  );
};

export default ClassRegistrationCreatePage;
