import Card from "@/components/card";
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
    <div className="relative flex min-h-[84vh] w-full items-center justify-center pb-10">
      {/* Background gradient */}
      <div
        className="absolute top-0 h-[45vh] w-full rounded-[20px]"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, var(--color-brand-400), var(--color-brand-600))",
        }}
      />

      {/* Card */}
      <Card extra="relative z-10 w-[850px] max-w-[calc(100vw-48px)] p-8">
        <h2 className="text-navy-700 mb-6 text-2xl font-bold dark:text-white">
          Phân quyền mới
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Email field */}
            <div className="md:col-span-1">
              <label
                htmlFor="email"
                className="mr-3 mb-2 ml-[10px] flex text-start text-sm font-bold text-gray-900 transition-all dark:text-white"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email"
                disabled={submitting}
                className="mt-2 flex h-11 w-full min-w-0 items-center justify-center rounded-2xl border border-gray-200 bg-transparent px-4 text-sm font-medium text-gray-900 transition-all duration-200 outline-none disabled:border-none! disabled:bg-gray-100! dark:border-white/10 dark:bg-transparent dark:text-white dark:disabled:bg-white/5! dark:disabled:placeholder:text-[rgba(255,255,255,0.15)]!"
              />
            </div>

            {/* Role field */}
            <div className="md:col-span-1">
              <label
                htmlFor="role"
                className="mr-3 mb-2 ml-[10px] flex text-start text-sm font-bold text-gray-900 transition-all dark:text-white"
              >
                Vai trò
              </label>
              <div className="mt-2">
                <div className="relative">
                  <input
                    readOnly
                    className="mt-2 flex h-11 w-full min-w-0 items-center justify-center rounded-2xl border border-transparent bg-transparent px-4 text-sm font-medium text-gray-900 transition-all duration-200 outline-none disabled:border-none! disabled:bg-gray-100! dark:bg-transparent dark:text-white dark:disabled:bg-white/5! dark:disabled:placeholder:text-[rgba(255,255,255,0.15)]!"
                  />
                  <RoleSelector
                    value={role}
                    onChange={setRole}
                    disabled={submitting}
                    className="absolute top-1/2 -translate-y-1/2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              {submitting ? "Đang xử lý..." : "Phân quyền"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AssignRolePage;
