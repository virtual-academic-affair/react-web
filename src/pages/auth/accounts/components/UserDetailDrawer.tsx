import Drawer from "@/components/drawer/Drawer.tsx";
import Switch from "@/components/switch";
import { usersService } from "@/services/users";
import type { Role, UpdateUserDto, User } from "@/types/users.ts";
import { message as toast } from "antd";
import { useEffect, useState } from "react";
import { getUserAvatarUrl } from "../utils.ts";
import RoleSelector from "./RoleSelector.tsx";

interface UserDetailDrawerProps {
  userId: number | null;
  onClose: () => void;
  onUserChanged: (updated: User) => void;
}

const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({
  userId,
  onClose,
  onUserChanged,
}) => {
  const [detail, setDetail] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userId == null) {
      setDetail(null);
      return;
    }
    setLoading(true);
    usersService
      .getUserById(userId)
      .then(setDetail)
      .catch((err: unknown) => {
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể tải chi tiết tài khoản.";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleRoleChange = async (newRole: Role) => {
    if (!detail || detail.role === newRole) {
      return;
    }

    setSaving(true);
    try {
      const dto: UpdateUserDto = { role: newRole };
      const updated = await usersService.updateUser(detail.id, dto);
      setDetail(updated);
      toast.success("Cập nhật vai trò thành công.");
      onUserChanged(updated);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Cập nhật vai trò thất bại.";
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
      setDetail(updated);
      toast.success(
        newStatus ? "Đã kích hoạt tài khoản." : "Đã vô hiệu hóa tài khoản.",
      );
      onUserChanged(updated);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Cập nhật trạng thái thất bại.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const isOpen = userId != null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Chi tiết tài khoản">
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
              <img
                src={getUserAvatarUrl(detail)}
                alt={detail.name || detail.email}
                className="h-12 w-12 rounded-[14px] object-cover"
              />
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
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default UserDetailDrawer;
