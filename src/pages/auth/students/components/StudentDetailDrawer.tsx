import ConfirmModal from "@/components/modal/ConfirmModal";
import Drawer from "@/components/drawer/Drawer";
import DetailFormLayout, {
  DetailFormSection,
  FormRow,
} from "@/components/layouts/DetailFormLayout";
import StudentFormFields, {
  type StudentFormValue,
} from "@/pages/auth/students/components/StudentFormFields";
import { studentsService } from "@/services/students";
import type { Student } from "@/types/students";
import { formatDate } from "@/utils/date";
import { parseError } from "@/utils/parseError";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import React from "react";
import { MdDeleteOutline, MdSave } from "react-icons/md";

interface StudentDetailDrawerProps {
  studentId: number | null;
  onClose: () => void;
  onStudentChanged: (student: Student) => void;
  onStudentDeleted: (studentId: number) => void;
}

const StudentDetailDrawer: React.FC<StudentDetailDrawerProps> = ({
  studentId,
  onClose,
  onStudentChanged,
  onStudentDeleted,
}) => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [form, setForm] = React.useState<StudentFormValue>({
    studentCode: "",
    studentName: "",
  });

  const { data: detail = null, isLoading: loading } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => studentsService.getStudentById(studentId!),
    enabled: studentId != null,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (!detail) return;
    setForm({
      studentCode: detail.studentCode,
      studentName: detail.studentName,
    });
  }, [detail?.id, detail?.studentCode, detail?.studentName]);

  const isOpen = studentId != null;
  const studentCodeError = form.studentCode.trim()
    ? ""
    : "MSSV là trường bắt buộc.";
  const studentNameError = form.studentName.trim()
    ? ""
    : "Họ tên là trường bắt buộc.";
  const hasValidationError = Boolean(studentCodeError || studentNameError);
  const isDirty =
    !!detail &&
    (form.studentCode.trim() !== detail.studentCode ||
      form.studentName.trim() !== detail.studentName);

  const handleSave = async () => {
    if (!detail || !isDirty) return;
    const studentCode = form.studentCode.trim();
    const studentName = form.studentName.trim();

    if (!studentCode || !studentName) {
      toast.error("Vui lòng nhập đầy đủ MSSV và họ tên.");
      return;
    }

    setSaving(true);
    try {
      const updated = await studentsService.updateStudent(detail.id, {
        studentCode,
        studentName,
      });
      queryClient.setQueryData(["student", detail.id], updated);
      onStudentChanged(updated);
      toast.success("Cập nhật sinh viên thành công.");
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!detail) return;

    setDeleting(true);
    try {
      await studentsService.removeStudent(detail.id);
      toast.success("Xóa sinh viên thành công.");
      setConfirmDeleteOpen(false);
      onStudentDeleted(detail.id);
      onClose();
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title="Chi tiết sinh viên"
        footerRight={
          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={!detail || loading || saving || deleting}
            title={deleting ? "Đang xóa..." : "Xóa"}
            aria-label={deleting ? "Đang xóa..." : "Xóa"}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
          >
            <MdDeleteOutline className="h-4 w-4" />
          </button>
        }
      >
      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="dark:bg-navy-700 h-5 animate-pulse rounded bg-gray-200"
            />
          ))}
        </div>
      ) : !detail ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">Không có dữ liệu.</p>
      ) : (
        <DetailFormLayout>
          <StudentFormFields
            value={form}
            onChange={setForm}
            disabled={saving || deleting}
            errors={{
              studentCode: studentCodeError || undefined,
              studentName: studentNameError || undefined,
            }}
          />
          {isDirty && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  !detail || loading || saving || deleting || hasValidationError
                }
                className="bg-brand-500 hover:bg-brand-600 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                <MdSave className="h-4 w-4" />
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          )}

          <DetailFormSection title="Thông số kỹ thuật">
            <div className="flex flex-col gap-2">
              <FormRow label="ID">
                <p className="text-navy-700 text-sm dark:text-white">{detail.id}</p>
              </FormRow>
              <FormRow label="Ngày tạo">
                <p className="text-navy-700 text-sm dark:text-white">
                  {formatDate(detail.createdAt)}
                </p>
              </FormRow>
              <FormRow label="Cập nhật lần cuối">
                <p className="text-navy-700 text-sm dark:text-white">
                  {formatDate(detail.updatedAt)}
                </p>
              </FormRow>
            </div>
          </DetailFormSection>
        </DetailFormLayout>
      )}
      </Drawer>
      <ConfirmModal
        open={confirmDeleteOpen}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={executeDelete}
        title="Xóa sinh viên"
        subTitle={`Bạn có chắc chắn muốn xóa sinh viên "${detail?.studentCode ?? ""}${detail?.studentName ? ` - ${detail.studentName}` : ""}" không? Hành động này không thể hoàn tác.`}
        loading={deleting}
      />
    </>
  );
};

export default StudentDetailDrawer;
