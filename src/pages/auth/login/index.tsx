/**
 * Login Page
 * Google-only sign-in — styled after Horizon UI SignIn template.
 */

import { authService } from "@/services/auth";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            const url = await authService.getGoogleAuthUrl();
            window.location.href = url;
        } catch {
            setError("Không thể kết nối với máy chủ xác thực. Vui lòng thử lại.");
            setLoading(false);
        }
    };

    return (
        <div className="mt-48 mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
            <div className="mt-[10vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
                <h4 className="mb-2.5 text-4xl font-bold text-navy-700 dark:text-white">
                    Đăng Nhập
                </h4>
                <p className="mb-9 ml-1 text-base text-gray-600">
                    Đăng nhập bằng tài khoản Google của bạn để tiếp tục.
                </p>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="mb-6 flex h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-lightPrimary text-gray-900 transition-all duration-200 hover:brightness-[0.96] dark:bg-navy-800 dark:text-white dark:hover:brightness-[1.25]! active:scale-[0.98] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500" />
                    ) : (
                        <>
                            <div className="rounded-full text-xl">
                                <FcGoogle />
                            </div>
                            <h5 className="text-sm font-medium text-navy-700 dark:text-white">
                                Đăng nhập bằng Google
                            </h5>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
