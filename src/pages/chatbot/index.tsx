import "katex/dist/katex.min.css";
import React, { useEffect, useRef } from "react";
import { Route, Routes } from "react-router-dom";
import "streamdown/styles.css";

import { useSourcePreview } from "@/components/assistant-ui/source-preview-context";

import FAQCreationDrawer from "@/pages/documents/faqs/components/FAQCreationDrawer";

import { ChatbotErrorBoundary } from "./ChatbotErrorBoundary";
import { useChatbotLayout } from "./chatbotLayoutContext";
import { useChatbotShell } from "./chatbotShellContext";
import { CorpusTraversalModal } from "./components/CorpusTraversalModal";
import { ChatbotInfoView } from "./components/ChatbotInfoPanel";
import { ChatbotMobileMenuButton } from "./components/ChatbotMobileMenuButton";
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

function ChatbotChatView() {
  const { activeThreadId } = useChatbotShell();
  const { closePreview } = useSourcePreview();
  const {
    infoPanelAudience,
    faqDrawerOpen,
    faqInitialDraft,
    closeFaqDrawer,
    corpusTraversalModal,
    closeCorpusTraversalModal,
    setCorpusTraversalPreviewStepIndex,
    setCorpusTraversalReplay,
  } = useChatbotLayout();
  const previousThreadIdRef = useRef(activeThreadId);

  useEffect(() => {
    if (previousThreadIdRef.current !== activeThreadId) {
      closePreview();
      previousThreadIdRef.current = activeThreadId;
    }
  }, [activeThreadId, closePreview]);

  return (
    <>
      <div className="flex min-h-0 flex-1 items-stretch pt-12 lg:pt-0">
        <div className="flex min-h-0 min-w-0 flex-1">
          <GeminiThread
            key={activeThreadId}
            className="min-h-0 w-full flex-1"
          />
        </div>
      </div>

      {infoPanelAudience === "admin" ? (
        <FAQCreationDrawer
          open={faqDrawerOpen}
          onClose={closeFaqDrawer}
          onCreated={faqInitialDraft.onCreated}
          initialQuestion={faqInitialDraft.question}
          initialAnswer={faqInitialDraft.answer}
        />
      ) : null}

      <CorpusTraversalModal
        state={corpusTraversalModal}
        onClose={closeCorpusTraversalModal}
        onPreviewStepIndexChange={setCorpusTraversalPreviewStepIndex}
        onReplayChange={setCorpusTraversalReplay}
      />
    </>
  );
}

function ChatbotPageInner() {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-transparent">
      <ChatbotMobileMenuButton />
      <ChatbotKeyboardShortcuts />
      <Routes>
        <Route index element={<ChatbotChatView />} />
        <Route path="chat/:threadId" element={<ChatbotChatView />} />
        <Route
          path="documents"
          element={<ChatbotInfoView type="documents" />}
        />
        <Route path="forms" element={<ChatbotInfoView type="forms" />} />
      </Routes>
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
