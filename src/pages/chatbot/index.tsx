import { Alert } from "antd";
import React from "react";
import "streamdown/styles.css";

import { ChatbotErrorBoundary } from "./ChatbotErrorBoundary";
import { useChatbotShell } from "./chatbotShellContext";
import { GeminiThread } from "./components/GeminiThread";

function ChatbotPageInner() {
  const { errorMessage, clearError, activeThreadId } = useChatbotShell();

  return (
    <div className="flex min-h-[calc(100vh-2.5rem)] w-full flex-col bg-transparent">
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
      <div className="flex min-h-0 flex-1">
        {/* key forces a clean remount when switching sessions so
            ThreadPrimitive.Root re-subscribes to the correct thread */}
        <GeminiThread
          key={activeThreadId}
          className="mx-auto max-w-[860px] flex-1"
        />
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
