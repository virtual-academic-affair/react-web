import Drawer from "@/components/drawer/Drawer.tsx";
import Switch from "@/components/switch";
import { usersService } from "@/services/users";
import { Role as RoleConst, type Role, type UpdateUserDto, type User, type UserProfile } from "@/types/users.ts";
import { formatDate } from "@/utils/date";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import React, { useState } from "react";
import { MdSave } from "react-icons/md";
import RoleSelector from "./RoleSelector.tsx";

interface UserDetailDrawerProps {
  userId: number | null;
  onClose: () => void;
  onUserChanged: (updated: User) => void;
}

type StudentProfileForm = {
  enrollmentYear: string;
  classNo: string;
  major: string;
  classAdvisor: string;
};

function profileToForm(profile: User["profile"]): StudentProfileForm {
  const p = profile ?? {};
  return {
    enrollmentYear:
      p.enrollmentYear != null ? String(p.enrollmentYear) : "",
    classNo: p.classNo ?? "",
    major: p.major ?? "",
    classAdvisor: p.classAdvisor ?? "",
  };
}

function formsEqual(a: StudentProfileForm, b: StudentProfileForm): boolean {
  return (
    a.enrollmentYear === b.enrollmentYear &&
    a.classNo === b.classNo &&
    a.major === b.major &&
    a.classAdvisor === b.classAdvisor
  );
}

/** Gửi lên API: merge profile; khóa chỉ gửi khi ô có giá trị hợp lệ. */
function formToProfileDto(form: StudentProfileForm): UserProfile {
  const dto: UserProfile = {
    classNo: form.classNo.trim(),
    major: form.major.trim(),
    classAdvisor: form.classAdvisor.trim(),
  };
  const y = form.enrollmentYear.trim();
  if (y) {
    const n = Number.parseInt(y, 10);
    if (Number.isFinite(n)) {
      dto.enrollmentYear = n;
    }
  }
  return dto;
}

const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({
  userId,
  onClose,
  onUserChanged,
}) => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [studentForm, setStudentForm] = useState<StudentProfileForm>(() => ({
    enrollmentYear: "",
    classNo: "",
    major: "",
    classAdvisor: "",
  }));

  const { data: detail = null, isLoading: loading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => usersService.getUserById(userId!),
    enabled: userId != null,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (!detail || detail.role !== RoleConst.Student) {
      return;
    }
    setStudentForm(profileToForm(detail.profile));
  }, [detail?.id, detail?.role, detail?.profile]);

  const savedStudentSnapshot = React.useMemo(
    () =>
      detail && detail.role === RoleConst.Student
        ? profileToForm(detail.profile)
        : null,
    [detail?.id, detail?.profile, detail?.role],
  );

  const studentDirty =
    savedStudentSnapshot != null &&
    !formsEqual(studentForm, savedStudentSnapshot);

  const handleRoleChange = async (newRole: Role) => {
    if (!detail || detail.role === newRole) {
      return;
    }

    setSaving(true);
    try {
      const dto: UpdateUserDto = { role: newRole };
      const updated = await usersService.updateUser(detail.id, dto);
      queryClient.setQueryData(["user", userId], updated);
      toast.success("Cập nhật thành công.");
      onUserChanged(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: boolean) => {
    if (!detail || detail.isActive === newStatus) {
      return;
    }

    setSaving(true);
    try {
      const dto: UpdateUserDto = { isActive: newStatus };
      const updated = await usersService.updateUser(detail.id, dto);
      queryClient.setQueryData(["user", userId], updated);
      toast.success(
        newStatus ? "Đã kích hoạt tài khoản." : "Đã vô hiệu hóa tài khoản.",
      );
      onUserChanged(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResetStudentForm = () => {
    if (detail?.role === RoleConst.Student) {
      setStudentForm(profileToForm(detail.profile));
    }
  };

  const handleSaveStudentProfile = async () => {
    if (!detail || detail.role !== RoleConst.Student || !studentDirty) {
      return;
    }

    setSaving(true);
    try {
      const profile = formToProfileDto(studentForm);
      const updated = await usersService.updateUser(detail.id, { profile });
      queryClient.setQueryData(["user", userId], updated);
      toast.success("Đã cập nhật thông tin học sinh.");
      onUserChanged(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const isOpen = userId != null;
  const isStudent = detail?.role === RoleConst.Student;

  const footerRight =
    isStudent && studentDirty ? (
      <>
        <button
          type="button"
          disabled={saving}
          onClick={handleResetStudentForm}
          className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
        >
          Hủy
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleSaveStudentProfile}
          className="bg-brand-500 hover:bg-brand-600 flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          <MdSave className="h-4 w-4" />
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
      </>
    ) : undefined;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết tài khoản"
      footerRight={footerRight}
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
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Avatar
              </p>
            </div>
            <div className="flex-1">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
                {detail.picture ? (
                  <img
                    src={detail.picture}
                    alt={detail.name || detail.email}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="bg-brand-500 flex h-full w-full items-center justify-center text-sm font-bold text-white">
                    {(detail.name || detail.email)[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="flex items-center gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Tên
              </p>
            </div>
            <div className="flex-1">
              <p className="text-navy-700 text-base dark:text-white">
                {detail.name || "—"}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Email
              </p>
            </div>
            <div className="flex-1">
              <p className="text-navy-700 text-base dark:text-white">
                {detail.email}
              </p>
            </div>
          </div>

          {/* Created At */}
          <div className="flex items-center gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Ngày tham gia
              </p>
            </div>
            <div className="flex-1">
              <p className="text-navy-700 text-base dark:text-white">
                {formatDate(detail.createdAt)}
              </p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Vai trò
              </p>
            </div>
            <div className="flex-1">
              <RoleSelector
                value={detail.role}
                onChange={handleRoleChange}
                disabled={saving}
              />
              {saving && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Đang lưu...
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Trạng thái hoạt động
              </p>
            </div>
            <div className="flex-1">
              <Switch
                checked={detail.isActive}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleStatusChange(e.target.checked)
                }
                disabled={saving}
              />
            </div>
          </div>

          {isStudent && (
            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/10">
              <p className="text-navy-700 mb-3 text-xs font-semibold tracking-wide uppercase dark:text-white">
                Thông tin học sinh
              </p>
              <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-6">
                  <div className="w-40 shrink-0">
                    <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Khóa (năm nhập học)
                    </p>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min={1900}
                      max={2100}
                      inputMode="numeric"
                      placeholder="VD: 2024"
                      value={studentForm.enrollmentYear}
                      onChange={(e) =>
                        setStudentForm((f) => ({
                          ...f,
                          enrollmentYear: e.target.value,
                        }))
                      }
                      disabled={saving}
                      className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-40 shrink-0">
                    <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Lớp chủ nhiệm
                    </p>
                  </div>
                  <div className="flex-1">
                    <input
                      value={studentForm.classNo}
                      onChange={(e) =>
                        setStudentForm((f) => ({
                          ...f,
                          classNo: e.target.value,
                        }))
                      }
                      disabled={saving}
                      className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-40 shrink-0">
                    <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Giáo viên chủ nhiệm
                    </p>
                  </div>
                  <div className="flex-1">
                    <input
                      value={studentForm.classAdvisor}
                      onChange={(e) =>
                        setStudentForm((f) => ({
                          ...f,
                          classAdvisor: e.target.value,
                        }))
                      }
                      disabled={saving}
                      className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-40 shrink-0">
                    <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Chuyên ngành
                    </p>
                  </div>
                  <div className="flex-1">
                    <input
                      value={studentForm.major}
                      onChange={(e) =>
                        setStudentForm((f) => ({
                          ...f,
                          major: e.target.value,
                        }))
                      }
                      disabled={saving}
                      className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Technical info */}
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
                    Google ID
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-navy-700 text-base dark:text-white">
                    {detail.googleId || "—"}
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

export default UserDetailDrawer;
