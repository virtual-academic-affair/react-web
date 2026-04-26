/**
 * OAuth return URL after Google Gmail grant. Backend redirects here with:
 * ?success=1&token=<jwt>&message=... or ?success=0&message=...
 */

import { getRolePath } from "@/utils/auth.util";
import { useAuthStore } from "@/stores/auth.store";
import { message as toast } from "antd";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function formatOAuthMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("access_denied") || lower.includes("access denied")) {
    return "Bạn đã từ chối cấp quyền Gmail.";
  }
  return raw;
}

export default function GmailGrantCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const success = searchParams.get("success") === "1";
    const token = searchParams.get("token");
    const messageParam = searchParams.get("message") ?? "";

    if (success && token) {
      const normalized = token.replace(/^"+|"+$/g, "");
      useAuthStore.getState().setAccessToken(normalized);
      toast.success("Cấp quyền Gmail thành công.");
      const role = useAuthStore.getState().userRole;
      navigate(getRolePath(role), { replace: true });
      return;
    }

    toast.error(
      messageParam
        ? formatOAuthMessage(messageParam)
        : "Cấp quyền Gmail không thành công.",
    );
    navigate("/auth/login", { replace: true });
  }, [navigate, searchParams]);

  return (
    <div className="dark:bg-navy-900 fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="border-t-brand-500 h-10 w-10 animate-spin rounded-full border-4 border-gray-200" />
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Đang hoàn tất cấp quyền Gmail…
      </p>
    </div>
  );
}
