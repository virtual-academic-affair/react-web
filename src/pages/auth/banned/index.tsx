/**
 * Banned Page
 * Shown when a user whose account has been deactivated attempts to login.
 */

import { MdBlock } from "react-icons/md";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

export default function BannedPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Prevent direct access to this page by unauthenticated guests.
  // It should ONLY be accessible if they were just redirected here by the callback flow after failing login.
  if (!location.state?.isBannedFlow) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="mt-48 mb-16 flex h-full w-full items-center justify-center px-2 md:mx-0 md:px-0 lg:mb-10 lg:items-center lg:justify-start">
      <div className="mt-[10vh] w-full max-w-full flex-col items-center md:pl-4 lg:pl-0 xl:max-w-[420px]">
        {/* Icon */}
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <MdBlock className="h-10 w-10 text-red-500 dark:text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h4 className="text-navy-700 mb-3 text-center text-3xl font-bold dark:text-white">
          Tài khoản bị khóa
        </h4>

        {/* Description */}
        <p className="mb-2 text-center text-base text-gray-600 dark:text-gray-400">
          Tài khoản của bạn đã bị quản trị viên vô hiệu hóa.
        </p>
        <p className="mb-8 text-center text-sm text-gray-500 dark:text-gray-500">
          Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ quản trị viên để
          được hỗ trợ.
        </p>

        {/* Back to login button */}
        <button
          onClick={() => navigate("/auth/login", { replace: true })}
          className="bg-lightPrimary dark:bg-navy-800 mb-6 flex h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl text-gray-900 transition-all duration-200 hover:brightness-[0.96] focus:outline-none active:scale-[0.98] dark:text-white dark:hover:brightness-[1.25]!"
        >
          <h5 className="text-navy-700 text-sm font-medium dark:text-white">
            Quay lại trang đăng nhập
          </h5>
        </button>
      </div>
    </div>
  );
}
