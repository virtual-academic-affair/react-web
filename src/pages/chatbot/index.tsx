import { Alert } from "antd";
import "katex/dist/katex.min.css";
import React, { useEffect, useRef } from "react";
import "streamdown/styles.css";

import { SourcePreviewPanel } from "@/components/assistant-ui/sources";
import { useSourcePreview } from "@/components/assistant-ui/source-preview-context";

import { ChatbotErrorBoundary } from "./ChatbotErrorBoundary";
import { useChatbotShell } from "./chatbotShellContext";
import { GeminiThread } from "./components/GeminiThread";

function ChatbotPageInner() {
  const { errorMessage, clearError, activeThreadId } = useChatbotShell();
  const { preview, closePreview } = useSourcePreview();
  const previousThreadIdRef = useRef(activeThreadId);

  useEffect(() => {
    if (previousThreadIdRef.current !== activeThreadId) {
      closePreview();
      previousThreadIdRef.current = activeThreadId;
    }
  }, [activeThreadId, closePreview]);

  return (
    <div className="flex max-h-full min-h-screen w-full flex-col bg-transparent">
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
      <div className="flex min-h-0 flex-1 items-start gap-4">
        <div className="flex min-w-0 flex-1">
          {/* key forces a clean remount when switching sessions so
              ThreadPrimitive.Root re-subscribes to the correct thread */}
          <GeminiThread
            key={activeThreadId}
            className="mx-auto max-w-[860px] flex-1"
          />
        </div>
        {preview ? <SourcePreviewPanel key={preview.key} /> : null}
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
