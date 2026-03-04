/**
 * User Detail Drawer Component
 * Drawer for viewing and updating user details
 */

import { usersService } from "@/services/users";
import type { UpdateUserDto, User } from "@/types/users";
import { Role, RoleColors, RoleLabels } from "@/types/users";
import { Drawer, message, Switch } from "antd";
import React from "react";
import { MdClose, MdPerson, MdSave } from "react-icons/md";

interface UserDetailDrawerProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({
  open,
  user,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState<UpdateUserDto>({});

  // Reset form when user changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        role: user.role,
        isActive: user.isActive,
      });
      setIsEditing(false);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await usersService.updateUser(user.id, formData);
      message.success("Cập nhật thành công!");
      setIsEditing(false);
      onSuccess();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Không thể cập nhật người dùng";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    user &&
    (formData.role !== user.role || formData.isActive !== user.isActive);

  if (!user) return null;

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
                <MdPerson className="text-brand-500 h-5 w-5" />
              </div>
              <div>
                <h2 className="text-navy-700 text-lg font-bold dark:text-white">
                  Chi tiết người dùng
                </h2>
                <p className="text-sm text-gray-500">ID: {user.id}</p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* User Profile Card */}
          <div className="mb-6 flex flex-col items-center rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 p-6 dark:from-gray-800 dark:to-gray-700">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name || user.email}
                className="mb-4 h-20 w-20 rounded-full border-4 border-white object-cover shadow-md"
              />
            ) : (
              <div className="bg-brand-500 mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white text-2xl font-bold text-white shadow-md">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
            )}
            <h3 className="text-navy-700 text-lg font-bold dark:text-white">
              {user.name || "Chưa cập nhật tên"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {user.email}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${RoleColors[user.role as Role]?.bg || "bg-gray-100"} ${RoleColors[user.role as Role]?.text || "text-gray-800"}`}
              >
                {RoleLabels[user.role as Role] || user.role}
              </span>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                  user.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {user.isActive ? "Hoạt động" : "Vô hiệu"}
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <h4 className="text-navy-700 font-semibold dark:text-white">
              Thông tin chi tiết
            </h4>

            {/* Info Items */}
            <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Google ID
                </span>
                <span className="text-navy-700 text-sm font-medium dark:text-white">
                  {user.googleId || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Ngày tạo
                </span>
                <span className="text-navy-700 text-sm font-medium dark:text-white">
                  {new Date(user.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Cập nhật lần cuối
                </span>
                <span className="text-navy-700 text-sm font-medium dark:text-white">
                  {new Date(user.updatedAt).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>

            {/* Edit Section */}
            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-navy-700 font-semibold dark:text-white">
                  Chỉnh sửa
                </h4>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-brand-500 hover:text-brand-600 text-sm font-medium"
                >
                  {isEditing ? "Hủy chỉnh sửa" : "Chỉnh sửa"}
                </button>
              </div>

              <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                {/* Role */}
                <div className="space-y-2">
                  <label className="text-navy-700 block text-sm font-medium dark:text-white">
                    Vai trò
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        role: e.target.value as Role,
                      }))
                    }
                    disabled={!isEditing}
                    className={`dark:bg-navy-700 dark:border-navy-600 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 dark:text-white ${
                      !isEditing ? "cursor-not-allowed opacity-60" : ""
                    }`}
                  >
                    {Object.values(Role).map((role) => (
                      <option key={role} value={role}>
                        {RoleLabels[role]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-navy-700 block text-sm font-medium dark:text-white">
                      Trạng thái hoạt động
                    </label>
                    <p className="text-xs text-gray-500">
                      Tắt để vô hiệu hóa tài khoản
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isActive: checked }))
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {isEditing && hasChanges && (
          <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-brand-500 hover:bg-brand-600 active:bg-brand-700 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <MdSave className="h-4 w-4" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default UserDetailDrawer;
