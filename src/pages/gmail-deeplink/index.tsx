import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { messagesService } from "@/services/email";
import { authService } from "@/services/auth/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import type { Message } from "@/types/email";
import { message as toast } from "antd";
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

  const { isLoading: isSuperTokenLoading, isError: isSuperTokenError } = useQuery(
    {
      queryKey: ["gmail-deeplink-super-token", email],
      enabled: hasFullParams,
      queryFn: async () => {
        const tokens = await authService.getSuperToken(email);
        setAccessToken(tokens.accessToken);
        return tokens;
      },
      retry: false,
    },
  );

  const {
    data: message,
    isLoading: isMessageLoading,
    isError: isMessageError,
  } = useQuery<Message | null>({
    queryKey: ["gmail-deeplink-message", gmailMessageId],
    enabled: hasFullParams && !isSuperTokenLoading && !isSuperTokenError,
    queryFn: async () => {
      try {
        const msg = await messagesService.findFirstByGmailMessageId(
          gmailMessageId,
        );
        if (!msg) {
          toast.warning("Không tìm thấy email tương ứng với messageId.");
        }
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
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
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
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
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
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Về trang chính
        </button>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="mb-2 text-center text-base text-gray-500">
          Không tìm thấy email tương ứng với messageId đã cung cấp.
        </p>
        <button
          onClick={() => navigate("/")}
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Về trang chính
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

