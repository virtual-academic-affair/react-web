import CreatePageLayout from "@/components/layouts/CreatePageLayout";
import { usersService } from "@/services/users";
import type { AssignRoleDto, Role } from "@/types/users";
import { message as toast } from "antd";
import React from "react";
import RoleSelector from "@/pages/auth/accounts/components/RoleSelector.tsx";

const AssignRolePage: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<Role>("student");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Vui lòng nhập email.");
      return;
    }

    setSubmitting(true);
    try {
      const dto: AssignRoleDto = {
        email: email.trim(),
        role,
      };
      await usersService.assignRole(dto);
      toast.success("Phân quyền thành công.");
      setEmail("");
      setRole("student");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Phân quyền thất bại. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CreatePageLayout title="Phân quyền mới">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          {/* Email field */}
          <div className="flex items-center gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Email
              </p>
            </div>
            <div className="flex-1">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email người dùng..."
                disabled={submitting}
                className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30"
                required
              />
            </div>
          </div>

          {/* Role field */}
          <div className="flex items-center gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Vai trò
              </p>
            </div>
            <div className="flex-1">
              <div className="flex w-fit items-center">
                <RoleSelector
                  value={role}
                  onChange={setRole}
                  disabled={submitting}
                  className="relative! top-0! translate-y-0!"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? "Đang xử lý..." : "Phân quyền"}
          </button>
        </div>
      </form>
    </CreatePageLayout>
  );
};

export default AssignRolePage;
