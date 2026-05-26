import { Component, type ReactNode } from "react";
import { MdRefresh, MdWarningAmber } from "react-icons/md";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

/**
 * Hứng các crash phát sinh từ runtime store của assistant-ui (ví dụ
 * "Entry not available in the store" — race khi danh sách thread thay đổi).
 * Khi gặp lỗi, hiển thị fallback và cho phép reset thay vì để cả trang trắng.
 */
export class ChatbotErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) {
      console.error("[Chatbot] runtime error", error);
    }
  }

  private handleReload = () => {
    // The runtime store is owned by a parent (layout). Resetting local state
    // would render the same broken instance again, so do a full reload.
    if (typeof window !== "undefined") {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex h-full min-h-0 w-full flex-col items-center justify-center p-4 md:p-6">
        <div className="mb-16 flex flex-col items-center md:mb-22">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-400/10 dark:text-amber-300">
            <MdWarningAmber className="h-7 w-7" aria-hidden />
          </div>

          <div className="mt-5 space-y-2">
            <h2 className="text-navy-700 text-center text-xl font-bold dark:text-white">
              Phiên trò chuyện gặp sự cố
            </h2>
            <p className="max-w-md text-center text-sm leading-6 text-gray-600 dark:text-gray-300">
              Đã có lỗi khi đồng bộ danh sách hội thoại. Tải lại trang để khởi
              tạo lại phiên chat và tiếp tục làm việc.
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={this.handleReload}
              className="bg-brand-500 hover:bg-brand-600 focus-visible:ring-brand-500/30 inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <MdRefresh className="h-5 w-5" aria-hidden />
              Tải lại
            </button>
          </div>
        </div>
      </div>
    );
  }
}
