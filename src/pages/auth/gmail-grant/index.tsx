/**
 * Landing page opened from the Gmail add-on when super Gmail (refresh token) is not configured.
 * Query: ?token=<app JWT from add-on> — used as Bearer to start the Gmail OAuth grant flow.
 */

import { grantsService } from "@/services/email/grants.service";
import { useAuthStore } from "@/stores/auth.store";
import { getRolePath, setAuthCallbackFlow } from "@/utils/auth.util";
import { message as toast } from "antd";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function GmailGrantFromAddonPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasStartedRef = useRef(false);
  const [message, setMessage] = useState("Đang chuyển tới Google để cấp quyền Gmail…");

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const token = searchParams.get("token");
    if (!token) {
      toast.error("Thiếu token. Mở lại liên kết từ Gmail add-on.");
      navigate("/auth/login", { replace: true });
      return;
    }

    useAuthStore.getState().setAccessToken(token);
    window.history.replaceState({}, "", "/auth/gmail-grant");

    const role = useAuthStore.getState().userRole;
    if (role !== "admin") {
      toast.warning("Chỉ tài khoản quản trị mới cấp được quyền Gmail hộ thư chung.");
      navigate(getRolePath(role), { replace: true });
      return;
    }

    const run = async () => {
      try {
        setAuthCallbackFlow("gmail_grant");
        const url = await grantsService.getGmailAuthUrl();
        window.location.href = url;
      } catch {
        setMessage("Không thể bắt đầu cấp quyền. Thử lại sau.");
        toast.error("Không thể bắt đầu cấp quyền Gmail.");
      }
    };

    void run();
  }, [searchParams, navigate]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-navy-900">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" />
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}
