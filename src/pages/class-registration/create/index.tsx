import Card from "@/components/card";
import { classRegistrationsService } from "@/services/class-registration";
import type {
  CreateClassRegistrationDto,
  CreateClassRegistrationItemDto,
  RegistrationAction,
} from "@/types/classRegistration";
import { message as toast } from "antd";
import React from "react";

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
  isInCurriculum: true,
});

const ClassRegistrationCreatePage: React.FC = () => {
  const [studentCode, setStudentCode] = React.useState("");
  const [studentName, setStudentName] = React.useState("");
  const [academicYear, setAcademicYear] = React.useState("2025");
  const [note, setNote] = React.useState("");
  const [messageId, setMessageId] = React.useState("");
  const [items, setItems] = React.useState<DraftItem[]>([emptyItem()]);
  const [submitting, setSubmitting] = React.useState(false);

  const updateItem = (
    key: string,
    field: keyof DraftItem,
    value: string | boolean | RegistrationAction,
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode || !studentName || !academicYear) {
      toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }
    if (!items.length || items.some((i) => !i.subjectName.trim())) {
      toast.error("Mỗi lớp con cần có tên môn học.");
      return;
    }

    const dto: CreateClassRegistrationDto = {
      studentCode: studentCode.trim(),
      studentName: studentName.trim(),
      academicYear: Number(academicYear),
      note: note || undefined,
      messageId: messageId ? Number(messageId) : undefined,
      items: items.map(({ key, ...rest }) => rest),
    };

    setSubmitting(true);
    try {
      await classRegistrationsService.create(dto);
      toast.success("Tạo đăng ký lớp thành công.");
      setStudentCode("");
      setStudentName("");
      setAcademicYear("2025");
      setNote("");
      setMessageId("");
      setItems([emptyItem()]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tạo đăng ký lớp thất bại.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card extra="p-6">
      <h2 className="text-navy-700 text-xl font-bold dark:text-white">
        Tạo đăng ký lớp
      </h2>
      <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
        Tạo mới hồ sơ đăng ký và các yêu cầu lớp con.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            placeholder="Mã sinh viên"
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value)}
            className="h-11 rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
          />
          <input
            placeholder="Họ và tên"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="h-11 rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
          />
          <input
            placeholder="Năm học"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="h-11 rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
          />
          <input
            placeholder="Message ID (optional)"
            value={messageId}
            onChange={(e) => setMessageId(e.target.value)}
            className="h-11 rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
          />
        </div>

        <textarea
          placeholder="Ghi chú"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-gray-200 bg-transparent p-4 text-sm outline-none dark:border-white/10 dark:text-white"
        />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-navy-700 text-base font-medium dark:text-white">
              Danh sách lớp con
            </h3>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, emptyItem()])}
              className="bg-brand-500 hover:bg-brand-600 rounded-lg px-3 py-1.5 text-sm font-medium text-white"
            >
              Thêm lớp con
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.key}
                className="rounded-2xl border border-gray-200 p-4 dark:border-white/10"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-navy-700 dark:text-white">
                    Lớp con #{idx + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setItems((prev) =>
                        prev.length === 1 ? prev : prev.filter((x) => x.key !== item.key),
                      )
                    }
                    className="rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Xóa
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <select
                    value={item.action}
                    onChange={(e) =>
                      updateItem(item.key, "action", e.target.value as RegistrationAction)
                    }
                    className="h-11 rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
                  >
                    <option value="register">register</option>
                    <option value="cancel">cancel</option>
                  </select>
                  <input
                    placeholder="Tên môn học"
                    value={item.subjectName}
                    onChange={(e) => updateItem(item.key, "subjectName", e.target.value)}
                    className="h-11 rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
                  />
                  <input
                    placeholder="Mã môn"
                    value={item.subjectCode}
                    onChange={(e) => updateItem(item.key, "subjectCode", e.target.value)}
                    className="h-11 rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
                  />
                  <input
                    placeholder="Tên lớp"
                    value={item.className}
                    onChange={(e) => updateItem(item.key, "className", e.target.value)}
                    className="h-11 rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
                  />
                  <input
                    placeholder="Slot info"
                    value={item.slotInfo}
                    onChange={(e) => updateItem(item.key, "slotInfo", e.target.value)}
                    className="h-11 rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={Boolean(item.isInCurriculum)}
                      onChange={(e) =>
                        updateItem(item.key, "isInCurriculum", e.target.checked)
                      }
                    />
                    Trong chương trình học
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Đang tạo..." : "Tạo đăng ký lớp"}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default ClassRegistrationCreatePage;
