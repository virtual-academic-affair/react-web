import { messagesService } from "@/services/email";
import { ApiError } from "@/services/http";
import { useAuthStore } from "@/stores/auth.store";
import type { Message } from "@/types/email";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BusinessCardsView from "./components/BusinessCardsView";

function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function GmailAccessBlocked({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <img
        src="https://www.gstatic.com/tasks/empty-tasks-light.svg"
        alt=""
        className="mb-4 w-72"
      />
      <p className="mb-2 text-center text-base font-medium text-gray-700">
        {title}
      </p>
      <p className="mb-4 text-center text-base text-gray-500">{message}</p>
      <p className="mb-4 max-w-md text-center text-sm text-gray-400">
        Nếu bạn cho rằng đây là nhầm lẫn hoặc cần hỗ trợ, vui lòng liên hệ quản
        trị viên để được xử lý.
      </p>
      <button
        type="button"
        onClick={() =>
          window.open("https://vaa.hcmus.app", "_blank", "noopener,noreferrer")
        }
        className="bg-brand-500 hover:bg-brand-600 rounded-xl px-5 py-3 text-xs font-semibold text-white"
      >
        Quản lý Giáo vụ số
      </button>
    </div>
  );
}

const GmailDeeplinkPage = () => {
  const params = useQueryParams();
  const navigate = useNavigate();

  const fromIframe = params.get("iframe") === "true";
  const email = params.get("email") ?? "";
  const gmailMessageId = params.get("messageId") ?? "";
  const threadId = params.get("threadId") ?? "";
  const hasFullParams = !!email && !!gmailMessageId && !!threadId;
  const needsAuthBootstrap = !!email && (fromIframe || hasFullParams);

  const { setAccessToken } = useAuthStore();
  const accessTokenInStore = useAuthStore((s) => s.accessToken);

  /** JWT trên query do extension gắn — đưa vào store làm Bearer cho API. */
  const bootstrapTokenFromUrl = useMemo(() => {
    return new URLSearchParams(window.location.search).get("accessToken") ?? "";
  }, []);
  const hasBootstrapTokenFromUrl = !!bootstrapTokenFromUrl;
  const strippedUrlTokenRef = useRef(false);

  useEffect(() => {
    if (!bootstrapTokenFromUrl || strippedUrlTokenRef.current) return;
    strippedUrlTokenRef.current = true;
    setAccessToken(bootstrapTokenFromUrl);
    const url = new URL(window.location.href);
    url.searchParams.delete("accessToken");
    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [bootstrapTokenFromUrl, setAccessToken]);

  const canCallApiWithToken = !!accessTokenInStore;

  const {
    data: message,
    isLoading: isMessageLoading,
    isError: isMessageError,
    error: messageQueryError,
  } = useQuery<Message | null>({
    queryKey: ["gmail-deeplink-message", threadId, gmailMessageId],
    enabled: hasFullParams && canCallApiWithToken,
    queryFn: () =>
      messagesService.findForGmailDeeplink(threadId, gmailMessageId),
    retry: false,
  });

  const messageLoadErrorText =
    messageQueryError instanceof ApiError
      ? messageQueryError.message
      : messageQueryError instanceof Error
        ? messageQueryError.message
        : "Không tải được tin từ máy chủ (kiểm tra đăng nhập / CORS / API).";

  if (!email) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="mb-4 text-center text-base text-gray-500">
          Thiếu tham số email.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2 text-sm font-semibold text-white"
        >
          Về trang chính
        </button>
      </div>
    );
  }

  if (!hasFullParams && !fromIframe) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="mb-4 text-center text-base text-gray-500">
          Cần đủ 3 tham số: messageId, threadId, email.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2 text-sm font-semibold text-white"
        >
          Về trang chính
        </button>
      </div>
    );
  }

  if (needsAuthBootstrap && !hasBootstrapTokenFromUrl) {
    return (
      <GmailAccessBlocked
        title="Thiếu accessToken"
        message="Liên kết deeplink cần có tham số accessToken (JWT) do extension hoặc máy chủ cấp."
      />
    );
  }

  if (isMessageError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="mb-2 text-center text-base font-medium text-red-500">
          Đã xảy ra lỗi khi tải dữ liệu email.
        </p>
        <p className="mb-4 max-w-lg text-center text-sm text-gray-600 dark:text-gray-400">
          {messageLoadErrorText}
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2 text-sm font-semibold text-white"
        >
          Về trang chính
        </button>
      </div>
    );
  }

  if (fromIframe && !hasFullParams && hasBootstrapTokenFromUrl) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="mb-4 max-w-md text-center text-base text-gray-500">
          Đã xác thực quyền quản trị. Mở một cuộc hội thoại trong Gmail (nhãn
          VAA) để xem hồ sơ đầy đủ.
        </p>
        <button
          type="button"
          onClick={() =>
            window.open(
              "https://vaa.hcmus.app",
              "_blank",
              "noopener,noreferrer",
            )
          }
          className="bg-brand-500 hover:bg-brand-600 rounded-xl px-5 py-3 text-xs font-semibold text-white"
        >
          Quản lý Giáo vụ số
        </button>
      </div>
    );
  }

  if (hasFullParams && (isMessageLoading || !accessTokenInStore)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-t-brand-500 h-10 w-10 animate-spin rounded-full border-4 border-gray-200" />
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <img
          src="/nothing.png"
          alt="Không có dữ liệu"
          className="mb-4 w-72 rounded-4xl"
        />
        <p className="mb-4 max-w-md text-center text-base text-gray-500">
          <div className="mb-2 font-semibold uppercase">Không tìm thấy</div>
          <span className="text-sm">
            Vui lòng thử cập nhật lại danh sách nhãn từ Gmail
          </span>
        </p>
        <button
          type="button"
          onClick={() =>
            window.open(
              "https://vaa.hcmus.app",
              "_blank",
              "noopener,noreferrer",
            )
          }
          className="bg-brand-500 hover:bg-brand-600 rounded-xl px-5 py-3 text-xs font-semibold text-white"
        >
          Quản lý Giáo vụ số
        </button>
      </div>
    );
  }

  return (
    <BusinessCardsView
      message={message}
      threadId={threadId}
      gmailMessageId={gmailMessageId}
    />
  );
};

export default GmailDeeplinkPage;
