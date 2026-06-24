import "katex/dist/katex.min.css";
import React, { useEffect, useRef } from "react";
import { MdClose, MdErrorOutline } from "react-icons/md";
import "streamdown/styles.css";

import { useSourcePreview } from "@/components/assistant-ui/source-preview-context";

import { ChatbotErrorBoundary } from "./ChatbotErrorBoundary";
import { useChatbotLayout } from "./chatbotLayoutContext";
import { useChatbotShell } from "./chatbotShellContext";
import { GeminiThread } from "./components/GeminiThread";
import { useChatbotKeyboardShortcuts } from "./useChatbotKeyboardShortcuts";

function ChatbotKeyboardShortcuts() {
  const { switchToNewThread } = useChatbotShell();
  const { openSearch } = useChatbotLayout();

  useChatbotKeyboardShortcuts({
    onNewChat: switchToNewThread,
    onOpenSearch: openSearch,
  });

  return null;
}

function ChatbotPageInner() {
  const { errorMessage, clearError, activeThreadId } = useChatbotShell();
  const { closePreview } = useSourcePreview();
  const previousThreadIdRef = useRef(activeThreadId);

  useEffect(() => {
    if (previousThreadIdRef.current !== activeThreadId) {
      closePreview();
      previousThreadIdRef.current = activeThreadId;
    }
  }, [activeThreadId, closePreview]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-transparent">
      <ChatbotKeyboardShortcuts />
      {errorMessage ? (
        <div className="mx-auto mt-3 mb-2 flex w-[calc(100%-2rem)] max-w-[700px] shrink-0 items-start gap-3 rounded-2xl border border-red-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-red-300/15 dark:bg-[#131f49]/95">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-400/10 dark:text-red-300">
            <MdErrorOutline className="h-5 w-5" aria-hidden />
          </span>
          <p
            role="alert"
            className="min-w-0 flex-1 py-1 text-sm leading-6 font-medium text-[#3c4043] dark:text-[#d9e2ff]"
          >
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={clearError}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl text-[#80868b] transition-colors hover:bg-gray-100 hover:text-[#3c4043] focus-visible:ring-2 focus-visible:ring-[#1a73e8]/30 focus-visible:outline-none dark:text-[#9aa0a6] dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Đóng thông báo lỗi"
          >
            <MdClose className="h-5 w-5" aria-hidden />
          </button>
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 items-stretch">
        <div className="flex min-h-0 min-w-0 flex-1">
          {/* key forces a clean remount when switching sessions so
              ThreadPrimitive.Root re-subscribes to the correct thread */}
          <GeminiThread
            key={activeThreadId}
            className="min-h-0 w-full flex-1"
          />
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
