import { authService } from "@/services/auth";
import { grantsService } from "@/services/email/grants.service";
import { useAuthStore } from "@/stores/auth.store";
import { consumeAuthCallbackFlow, getRolePath } from "@/utils/auth.util";
import { message as toast } from "antd";
import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function GoogleCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const hasCalledRef = useRef(false);

    useEffect(() => {
        if (hasCalledRef.current) return;
        hasCalledRef.current = true;

        const redirectToLoginWithError = (message: string) => {
            toast.error(message);
            navigate("/auth/login", { replace: true });
        };

        const code = searchParams.get("code");
        const flow = consumeAuthCallbackFlow();

        if (!code) {
            redirectToLoginWithError(
                "Thiếu mã xác thực. Vui lòng đăng nhập lại.",
            );
            return;
        }

        const accessToken = useAuthStore.getState().accessToken;
        const shouldGrantAccess = flow === "gmail_grant" || !!accessToken;

        if (shouldGrantAccess) {
            const grantAccess = async () => {
                try {
                    const redirectUrl = `${window.location.origin}/auth/callback`;
                    await grantsService.grantGmailAccess({ code, redirectUrl });
                    navigate("/admin/email/config", { replace: true });
                } catch {
                    redirectToLoginWithError(
                        "Cấp quyền Gmail thất bại. Vui lòng thử lại.",
                    );
                }
            };

            grantAccess();
            return;
        }

        const authenticate = async () => {
            try {
                const { accessToken } =
                    await authService.authenticateWithGoogle(code);
                useAuthStore.getState().setAccessToken(accessToken);
                const role = useAuthStore.getState().userRole;
                navigate(getRolePath(role), { replace: true });
            } catch {
                redirectToLoginWithError(
                    "Đăng nhập thất bại. Vui lòng thử lại.",
                );
            }
        };

        authenticate();
    }, [searchParams, navigate]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-navy-900">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Đang đăng nhập...
            </p>
        </div>
    );
}
