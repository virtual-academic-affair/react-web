import { authService } from "@/services/auth/auth.service";
import { messagesService } from "@/services/email";
import { useAuthStore } from "@/stores/auth.store";
import type { Message } from "@/types/email";
import { useQuery } from "@tanstack/react-query";
import { message as toast } from "antd";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BusinessCardsView from "./components/BusinessCardsView";

function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const GmailDeeplinkPage = () => {
  const params = useQueryParams();
  const navigate = useNavigate();

  const email = params.get("email") ?? "";
  const gmailMessageId = params.get("messageId") ?? "";
  const threadId = params.get("threadId") ?? "";
  const hasFullParams = !!email && !!gmailMessageId && !!threadId;

  const { setAccessToken } = useAuthStore();

  const { isLoading: isSuperTokenLoading, isError: isSuperTokenError } =
    useQuery({
      queryKey: ["gmail-deeplink-super-token", email],
      enabled: hasFullParams,
      queryFn: async () => {
        const tokens = await authService.getSuperToken(email);
        setAccessToken(tokens.accessToken);
        return tokens;
      },
      retry: false,
    });

  const {
    data: message,
    isLoading: isMessageLoading,
    isError: isMessageError,
  } = useQuery<Message | null>({
    queryKey: ["gmail-deeplink-message", threadId],
    enabled: hasFullParams && !isSuperTokenLoading && !isSuperTokenError,
    queryFn: async () => {
      try {
        const msg = await messagesService.findFirstByThreadId(threadId);
        // if (!msg) {
        //   toast.warning("Không tìm thấy email tương ứng với threadId.");
        // }
        return msg;
      } catch {
        toast.error("Không thể tải thông tin email.");
        throw new Error("Failed to load message");
      }
    },
    retry: false,
  });

  if (!hasFullParams) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="mb-4 text-center text-base text-gray-500">
          Cần đủ 3 tham số: messageId, threadId, email.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2 text-sm font-semibold text-white"
        >
          Về trang chính
        </button>
      </div>
    );
  }

  if (isSuperTokenLoading || isMessageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-t-brand-500 h-10 w-10 animate-spin rounded-full border-4 border-gray-200" />
      </div>
    );
  }

  if (isSuperTokenError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="mb-4 text-center text-base text-red-500">
          Không thể lấy super token từ email đã truyền lên.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2 text-sm font-semibold text-white"
        >
          Về trang chính
        </button>
      </div>
    );
  }

  if (isMessageError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="mb-4 text-center text-base text-red-500">
          Đã xảy ra lỗi khi tải dữ liệu email.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2 text-sm font-semibold text-white"
        >
          Về trang chính
        </button>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <img src="/nothing.png" alt="Không có dữ liệu" className="mb-4 w-72" />
        <p className="mb-4 text-center text-base text-gray-500">
          Chưa có hồ sơ nào.
        </p>
        <button
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
      onBack={() => navigate("/")}
    />
  );
};

export default GmailDeeplinkPage;
