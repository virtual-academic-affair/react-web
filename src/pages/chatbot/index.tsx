import { Alert } from "antd";
import React from "react";
import "streamdown/styles.css";

import { useChatbotShell } from "./chatbotShellContext";
import { ChatbotThreadToolbar } from "./components/ChatbotThreadToolbar";
import { GeminiThread } from "./components/GeminiThread";

function ChatbotPageInner() {
  const { errorMessage, clearError } = useChatbotShell();

  return (
    <div className="flex h-screen min-h-0 flex-col bg-transparent">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[800px] flex-col overflow-hidden px-4 py-4 md:px-5">
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
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ChatbotThreadToolbar />
          <GeminiThread />
        </div>
      </div>
    </div>
  );
}

const ChatbotPage: React.FC = () => {
  return <ChatbotPageInner />;
};

export default ChatbotPage;
