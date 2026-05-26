import { Alert } from "antd";
import React from "react";
import "streamdown/styles.css";

import { ChatbotErrorBoundary } from "./ChatbotErrorBoundary";
import { useChatbotShell } from "./chatbotShellContext";
import { ChatbotThreadToolbar } from "./components/ChatbotThreadToolbar";
import { GeminiThread } from "./components/GeminiThread";

function ChatbotPageInner() {
  const { errorMessage, clearError, activeThreadId } = useChatbotShell();

  return (
    <div className="flex h-[calc(100vh-2.5rem)] min-h-0 flex-col bg-transparent">
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden py-4 pr-4 pl-0 md:pr-5">
        {errorMessage ? (
          <Alert
            type="error"
            showIcon
            closable
            onClose={clearError}
            message={errorMessage}
            className="mb-4"
          />
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:flex-row">
          <ChatbotThreadToolbar />
          <div className="mx-auto flex min-h-0 w-full max-w-[860px] flex-1 flex-col overflow-hidden">
            {/* key forces a clean remount when switching sessions so
                ThreadPrimitive.Root re-subscribes to the correct thread */}
            <GeminiThread key={activeThreadId} />
          </div>
        </div>
      </div>
    </div>
  );
}

const ChatbotPage: React.FC = () => {
  return (
    <ChatbotErrorBoundary>
      <ChatbotPageInner />
    </ChatbotErrorBoundary>
  );
};

export default ChatbotPage;
