import { message as toast } from "antd";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Support both old (?accessToken=) and new (?token="...") shapes.
    const token = searchParams.get("accessToken") ?? searchParams.get("token");
    if (token) {
      const normalized = token.replace(/^"+|"+$/g, "");
      navigate(`/?token=${encodeURIComponent(normalized)}`, { replace: true });
      return;
    }

    toast.info("Đang xử lý đăng nhập…");
    navigate("/", { replace: true });
  }, [navigate, searchParams]);

  return (
    <div className="dark:bg-navy-900 fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="border-t-brand-500 h-10 w-10 animate-spin rounded-full border-4 border-gray-200" />
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Đang đăng nhập...
      </p>
    </div>
  );
}
