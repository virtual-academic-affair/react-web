import CreatePageLayout from "@/components/layouts/CreatePageLayout";
import Switch from "@/components/switch";
import { classRegistrationsService } from "@/services/class-registration";
import type {
  CreateClassRegistrationDto,
  CreateClassRegistrationItemDto,
} from "@/types/classRegistration";
import { message as toast } from "antd";
import React from "react";
import { MdAdd, MdDeleteOutline } from "react-icons/md";
import RichTextEditor from "@/components/fields/RichTextEditor";
import ProcessSteps from "./components/ProcessSteps";
import { useSearchParams, useNavigate } from "react-router-dom";
import { messagesService } from "@/services/email/messages.service";
import type { Message } from "@/types/email";
import RelatedMessageView from "../../emails/message/components/RelatedMessageView";

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
          if (!note) {
            setNote(m.subject || "");
          }
        })
        .catch(() => toast.error("Không thể tải thông tin tin nhắn."))
        .finally(() => setMessageLoading(false));
    }
  }, [searchParams, note]);

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
    } else {
      if (currentStep === 2) {
        if (validateStep2()) {
          setCurrentStep(3);
        }
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      items: items.map(({ key, ...rest }) => rest),
      messageId,
    };

    setSubmitting(true);
    try {
      await classRegistrationsService.create(dto);
      toast.success("Tạo đăng ký lớp thành công.");
      // Reset form
      setCurrentStep(1);
      setStudentCode("");
      setStudentName("");
      setAcademicYear("2025");
      setNote("");
      setItems([emptyItem()]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Tạo đăng ký lớp thất bại.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CreatePageLayout
      title="Tạo đăng ký lớp"
      processSteps={<ProcessSteps currentStep={currentStep} />}
    >
      <RelatedMessageView
        message={message}
        loading={messageLoading}
        onReselect={() => navigate("/admin/emails/message")}
      />
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
                    className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
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
                    className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
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
                    className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
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
                    className="dark:bg-navy-700/40 rounded-2xl bg-gray-50 p-4 dark:border-white/10"
                  >
                    {/* Header with remove button */}
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-navy-700 text-base font-medium dark:text-white">
                        #{idx + 1}
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
                        className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:text-red-600"
                      >
                        <MdDeleteOutline className="h-4 w-4" />
                        Xóa
                      </button>
                    </div>

                    {/* Item details */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {/* Lớp HP */}
                      <div className="flex items-center gap-6">
                        <div className="w-32 shrink-0">
                          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                            Lớp HP
                          </p>
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.className}
                            onChange={(e) =>
                              updateItem(item.key, "className", e.target.value)
                            }
                            placeholder="Nhập lớp HP"
                            className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Thông tin lớp */}
                      <div className="flex items-center gap-6">
                        <div className="w-32 shrink-0">
                          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                            Thông tin lớp
                          </p>
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.slotInfo}
                            onChange={(e) =>
                              updateItem(item.key, "slotInfo", e.target.value)
                            }
                            placeholder="Nhập thông tin lớp"
                            className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Tên MH */}
                      <div className="flex items-center gap-6">
                        <div className="w-32 shrink-0">
                          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                            Tên MH
                          </p>
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.subjectName}
                            onChange={(e) =>
                              updateItem(
                                item.key,
                                "subjectName",
                                e.target.value,
                              )
                            }
                            placeholder="Nhập tên môn học"
                            className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Mã MH */}
                      <div className="flex items-center gap-6">
                        <div className="w-32 shrink-0">
                          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                            Mã MH
                          </p>
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.subjectCode}
                            onChange={(e) =>
                              updateItem(
                                item.key,
                                "subjectCode",
                                e.target.value,
                              )
                            }
                            placeholder="Nhập mã môn học"
                            className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Trong CTDT */}
                      <div className="flex items-center gap-6">
                        <div className="w-32 shrink-0">
                          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                            Trong CTDT
                          </p>
                        </div>
                        <div className="flex-1">
                          <Switch
                            checked={item.isInCurriculum ?? false}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              updateItem(
                                item.key,
                                "isInCurriculum",
                                e.target.checked,
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add new button */}
                <button
                  type="button"
                  onClick={() => setItems((prev) => [...prev, emptyItem()])}
                  className="flex items-center justify-center gap-1 rounded-xl bg-gray-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-600"
                  title="Thêm lớp mới"
                >
                  <MdAdd className="h-4 w-4" />
                  Thêm mới
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Ghi chú */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-6">
                <div className="w-40 shrink-0">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Ghi chú
                  </p>
                </div>
                <div className="flex-1">
                  <RichTextEditor value={note} onChange={setNote} />
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex justify-end gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={submitting}
                className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
              >
                Quay lại
              </button>
            )}
            {currentStep < 3 ? (
              <button
                type="submit"
                disabled={submitting}
                className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              >
                Tiếp theo
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              >
                {submitting ? "Đang tạo..." : "Tạo đăng ký lớp"}
              </button>
            )}
          </div>
        </form>
    </CreatePageLayout>
  );
};

export default ClassRegistrationCreatePage;
