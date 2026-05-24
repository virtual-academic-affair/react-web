import { Button, Result } from "antd";
import { Component, type ReactNode } from "react";

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
      <div className="flex h-full min-h-0 w-full flex-1 items-center justify-center p-6">
        <Result
          status="warning"
          title="Phiên trò chuyện gặp sự cố"
          subTitle="Đã có lỗi khi đồng bộ danh sách hội thoại. Bạn có thể tải lại để tiếp tục."
          extra={
            <Button type="primary" onClick={this.handleReload}>
              Tải lại
            </Button>
          }
        />
      </div>
    );
  }
}
