/**
 * Assign Role Drawer Component
 * Drawer form for assigning roles to users (creates user if not exists)
 */

import { usersService } from "@/services/users";
import type { AssignRoleDto } from "@/types/users";
import { Role, RoleLabels } from "@/types/users";
import { Drawer, message } from "antd";
import React from "react";
import { MdClose, MdPersonAdd } from "react-icons/md";

interface AssignRoleDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AssignRoleDrawer: React.FC<AssignRoleDrawerProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<AssignRoleDto>({
    email: "",
    role: Role.Student,
  });
  const [errors, setErrors] = React.useState<{ email?: string; role?: string }>(
    {},
  );

  // Reset form when drawer opens
  React.useEffect(() => {
    if (open) {
      setFormData({ email: "", role: Role.Student });
      setErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; role?: string } = {};

    if (!formData.email) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.role) {
      newErrors.role = "Vai trò là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await usersService.assignRole(formData);
      message.success("Tạo tài khoản thành công!");
      onSuccess();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Không thể tạo tài khoản";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={null}
      placement="right"
      onClose={onClose}
      open={open}
      width={420}
      closable={false}
      styles={{
        header: { display: "none" },
        body: { padding: 0 },
      }}
    >
      <div className="dark:bg-navy-800 flex h-full flex-col bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-brand-100 dark:bg-brand-900 flex h-10 w-10 items-center justify-center rounded-lg">
                <MdPersonAdd className="text-brand-500 h-5 w-5" />
              </div>
              <div>
                <h2 className="text-navy-700 text-lg font-bold dark:text-white">
                  Tạo tài khoản
                </h2>
                <p className="text-sm text-gray-500">
                  Tạo tài khoản mới với vai trò xác định
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <MdClose className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="flex-1 space-y-6 p-6">
            {/* Info Note */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Lưu ý:</strong> Nếu email chưa tồn tại trong hệ thống,
                tài khoản mới sẽ được tạo tự động với vai trò đã chọn.
              </p>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="assign-email"
                className="text-navy-700 block text-sm font-medium dark:text-white"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="assign-email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className={`dark:bg-navy-700 dark:border-navy-600 w-full rounded-lg border px-4 py-3 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 dark:text-white ${
                  errors.email
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200"
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <label
                htmlFor="assign-role"
                className="text-navy-700 block text-sm font-medium dark:text-white"
              >
                Vai trò <span className="text-red-500">*</span>
              </label>
              <select
                id="assign-role"
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    role: e.target.value as Role,
                  }))
                }
                className={`dark:bg-navy-700 dark:border-navy-600 w-full rounded-lg border px-4 py-3 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 dark:text-white ${
                  errors.role
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200"
                }`}
              >
                {Object.values(Role).map((role) => (
                  <option key={role} value={role}>
                    {RoleLabels[role]}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="text-xs text-red-500">{errors.role}</p>
              )}
            </div>

            {/* Role Descriptions */}
            <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Mô tả vai trò:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-blue-500" />
                  <span>
                    <strong>Sinh viên:</strong> Quyền truy cập cơ bản
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-yellow-500" />
                  <span>
                    <strong>Giảng viên:</strong> Quyền quản lý lớp học
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-red-500" />
                  <span>
                    <strong>Quản trị viên:</strong> Toàn quyền hệ thống
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-500 hover:bg-brand-600 active:bg-brand-700 flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang xử lý...
                  </>
                ) : (
                  "Tạo"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Drawer>
  );
};

export default AssignRoleDrawer;
