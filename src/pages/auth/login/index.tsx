/**
 * Login Page
 * Google-only sign-in — styled after Horizon UI SignIn template.
 */

import { authService } from "@/services/auth";
import { useAuthStore } from "@/stores/auth.store";
import { setAuthCallbackFlow } from "@/utils/auth.util";
import { message as toast } from "antd";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Navigate } from "react-router-dom";

export default function LoginPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [loading, setLoading] = useState(false);

  // SPA navigation (not hard navigation) guard: token is in memory → redirect to their dashboard
  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      setAuthCallbackFlow("signin");
      const url = await authService.getGoogleAuthUrl();
      window.location.href = url;
    } catch {
      toast.error("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <div className="mt-48 mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
      <div className="mt-[10vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
        <h4 className="text-navy-700 mb-2.5 text-4xl font-bold dark:text-white">
          Đăng nhập
        </h4>
        <p className="mb-9 ml-1 text-base text-gray-600"></p>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="bg-lightPrimary dark:bg-navy-800 mb-6 flex h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl text-gray-900 transition-all duration-200 hover:brightness-[0.96] focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:hover:brightness-[1.25]!"
        >
          {loading ? (
            <div className="border-t-brand-500 h-5 w-5 animate-spin rounded-full border-2 border-gray-300" />
          ) : (
            <>
              <div className="rounded-full text-xl">
                <FcGoogle />
              </div>
              <h5 className="text-navy-700 text-sm font-medium dark:text-white">
                Đăng nhập bằng Google
              </h5>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
