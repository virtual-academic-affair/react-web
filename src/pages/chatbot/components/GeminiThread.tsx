import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
  useMessage,
  type PartState,
} from "@assistant-ui/react";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { LuBookOpen, LuCheck, LuCopy, LuFileQuestion } from "react-icons/lu";
import { MdArrowDownward, MdSend, MdSquare, MdUnarchive } from "react-icons/md";

import { MarkdownTextSm } from "@/components/assistant-ui/markdown-text";
import {
  Reasoning,
  ReasoningContent,
  ReasoningRoot,
  ReasoningText,
  ReasoningTrigger,
} from "@/components/assistant-ui/reasoning";
import { Source, Sources } from "@/components/assistant-ui/sources";
import { copyTextToClipboard } from "@/components/copyable/copyTextToClipboard";
import {
  ScrollFadeArea,
  useScrollFadeMask,
} from "@/components/scroll-fade/ScrollFadeArea";
import Tooltip from "@/components/tooltip/Tooltip";
import { useAuthStore } from "@/stores/auth.store";
import { Role } from "@/types/users";

import { chatMarkdownToFaqHtml } from "@/utils/chatMarkdownToFaqHtml";
import {
  assistantActionButtonClass,
  assistantActionIconClass,
  assistantActionIconStroke,
} from "../assistantActionButton";
import { useChatbotLayoutOptional } from "../chatbotLayoutContext";
import { useChatbotShell } from "../chatbotShellContext";

const GEMINI_INPUT_PLACEHOLDER = "Tra cứu với Giáo vụ số";
const CHAT_THREAD_MAX_WIDTH_CLASS = "max-w-[700px]";
const CHAT_COMPOSER_MAX_WIDTH_CLASS = "max-w-[650px]";
const CHAT_THREAD_GUTTER_CLASS = `mx-auto w-full ${CHAT_THREAD_MAX_WIDTH_CLASS} px-4 sm:px-5`;
const CHAT_COMPOSER_GUTTER_CLASS = `mx-auto w-full ${CHAT_COMPOSER_MAX_WIDTH_CLASS} px-4 sm:px-5`;

const ChatViewportContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

const NEW_CHAT_GREETINGS = [
  "Khởi động tra cứu ngay",
  "Bắt đầu câu hỏi của bạn",
  "Tối ưu hóa thời gian tìm kiếm dữ liệu",
  "Hãy bắt đầu cuộc hội thoại",
  "Giải đáp mọi quy trình",
] as const;

function parseReasoningParentId(parentId: string | undefined) {
  return {
    processingTimeMs: (() => {
      const raw = parentId?.match(/:ms=(\d+)/)?.[1];
      if (!raw) return undefined;
      const value = Number(raw);
      return Number.isFinite(value) ? value : undefined;
    })(),
  };
}

function getMessageTextContent(
  content: readonly { type: string; text?: string }[],
): string {
  return content
    .filter(
      (part): part is { type: "text"; text: string } =>
        part.type === "text" && typeof part.text === "string",
    )
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function GeminiAssistantMarkdown() {
  return <MarkdownTextSm />;
}

function GeminiMessageSources({
  open,
  sourceCount,
  children,
}: {
  open: boolean;
  sourceCount: number;
  children: ReactNode;
}) {
  return (
    <div
      className={`grid min-h-0 transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      }`}
      aria-hidden={!open}
    >
      <div className="min-h-0 overflow-hidden">
        <Sources sourceCount={sourceCount}>{children}</Sources>
      </div>
    </div>
  );
}

const geminiUserMessagePartComponents = {
  Reasoning: () => null,
  Text: MarkdownTextSm,
  Source,
};

function GeminiUserMessage() {
  return (
    <MessagePrimitive.Root className="flex w-full justify-end pb-3">
      <div className="w-fit max-w-[66.666%] rounded-3xl bg-[#e9eef6] px-4 py-3 text-sm leading-relaxed text-[#1f1f1f] dark:bg-white/10 dark:text-white">
        <MessagePrimitive.Parts
          unstable_showEmptyOnNonTextEnd={false}
          components={geminiUserMessagePartComponents}
        />
      </div>
    </MessagePrimitive.Root>
  );
}

function GeminiAssistantMessage() {
  const messageId = useMessage((state) => state.id);
  const messageContent = useMessage((state) => state.content);
  const messageStatus = useMessage((state) => state.status?.type);
  const isLastAssistantMessage = useAuiState((s) => {
    const messages = s.thread.messages;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "assistant") {
        return messages[i].id === messageId;
      }
    }
    return false;
  });
  const hasFinalContent = messageContent.some(
    (part) =>
      (part.type === "text" && part.text.trim()) || part.type === "source",
  );
  const sourceParts = useMemo(
    () => messageContent.filter((part) => part.type === "source"),
    [messageContent],
  );
  const showActions =
    hasFinalContent &&
    messageStatus !== "running" &&
    messageStatus !== "requires-action";

  const groupAssistantParts = useCallback((part: PartState) => {
    if (part.type === "reasoning") return ["group-reasoning"] as const;
    if (part.type === "source") return ["group-sources"] as const;
    return null;
  }, []);

  const [copied, setCopied] = useState(false);
  const [faqSaved, setFaqSaved] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const userRole = useAuthStore((s) => s.userRole);
  const isAdmin = userRole === Role.Admin;
  const chatbotLayout = useChatbotLayoutOptional();

  const assistantAnswerText = useMemo(
    () =>
      getMessageTextContent(
        messageContent.filter((part) => part.type === "text"),
      ),
    [messageContent],
  );

  const precedingUserQuestion = useAuiState((s) => {
    const messages = s.thread.messages;
    const currentIndex = messages.findIndex((m) => m.id === messageId);
    if (currentIndex <= 0) return "";

    for (let i = currentIndex - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message.role === "user") {
        return getMessageTextContent(message.content);
      }
    }

    return "";
  });

  useEffect(() => {
    setSourcesOpen(false);
    setFaqSaved(false);
  }, [messageId]);

  const handleCopy = useCallback(async () => {
    const text = assistantAnswerText.trim();
    if (!text) return;
    const success = await copyTextToClipboard(text);
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [assistantAnswerText]);

  const handleAddFaq = useCallback(() => {
    chatbotLayout?.openFaqDrawer({
      question: precedingUserQuestion,
      answer: chatMarkdownToFaqHtml(assistantAnswerText),
      onCreated: () => {
        setFaqSaved(true);
        window.setTimeout(() => setFaqSaved(false), 2000);
      },
    });
  }, [assistantAnswerText, chatbotLayout, precedingUserQuestion]);

  const actionBar = showActions ? (
    <div className="flex items-center gap-1 pt-2">
      <Tooltip label={copied ? "Đã sao chép" : "Sao chép câu trả lời"}>
        <button
          type="button"
          onClick={() => void handleCopy()}
          disabled={!assistantAnswerText.trim()}
          className={assistantActionButtonClass}
          aria-label={copied ? "Đã sao chép" : "Sao chép câu trả lời"}
        >
          {copied ? (
            <LuCheck
              className="h-[17px] w-[17px] text-green-500"
              strokeWidth={2}
            />
          ) : (
            <LuCopy
              className={assistantActionIconClass}
              strokeWidth={assistantActionIconStroke}
            />
          )}
        </button>
      </Tooltip>

      {sourceParts.length > 0 ? (
        <Tooltip label="Tài liệu tham khảo">
          <button
            type="button"
            onClick={() => setSourcesOpen((current) => !current)}
            className={`${assistantActionButtonClass} ${
              sourcesOpen
                ? "bg-gray-100 text-[#202124] dark:bg-white/10 dark:text-white"
                : ""
            }`}
            aria-expanded={sourcesOpen}
            aria-label="Tài liệu tham khảo"
          >
            <LuBookOpen
              className={assistantActionIconClass}
              strokeWidth={assistantActionIconStroke}
            />
          </button>
        </Tooltip>
      ) : null}

      {isAdmin ? (
        <Tooltip label={faqSaved ? "Đã thêm FAQ" : "Thêm FAQ"}>
          <button
            type="button"
            onClick={handleAddFaq}
            className={`${assistantActionButtonClass} transition-transform duration-200 ${
              faqSaved ? "scale-110" : ""
            }`}
            aria-label={faqSaved ? "Đã thêm FAQ" : "Thêm FAQ từ câu hỏi"}
            aria-pressed={faqSaved}
          >
            {faqSaved ? (
              <LuCheck
                className="h-[17px] w-[17px] text-green-500"
                strokeWidth={2}
              />
            ) : (
              <LuFileQuestion
                className={assistantActionIconClass}
                strokeWidth={assistantActionIconStroke}
              />
            )}
          </button>
        </Tooltip>
      ) : null}
    </div>
  ) : null;

  return (
    <MessagePrimitive.Root>
      <div className="relative w-full min-w-0 pb-4 text-sm leading-relaxed">
        <div className="space-y-2">
          <MessagePrimitive.GroupedParts groupBy={groupAssistantParts}>
            {({ part, children }) => {
              switch (part.type) {
                case "group-reasoning": {
                  const running =
                    "status" in part && part.status?.type === "running";
                  const firstReasoningPart = part.indices
                    .map((index) => messageContent[index])
                    .find((item) => item?.type === "reasoning");
                  const reasoningMeta = parseReasoningParentId(
                    firstReasoningPart &&
                      "parentId" in firstReasoningPart &&
                      typeof firstReasoningPart.parentId === "string"
                      ? firstReasoningPart.parentId
                      : undefined,
                  );
                  return (
                    <ReasoningRoot
                      key={part.indices.join("-")}
                      defaultOpen={false}
                      resetKey={`${messageId}:${part.indices.join("-")}`}
                      variant="ghost"
                    >
                      <ReasoningTrigger
                        active={running}
                        processingTimeMs={reasoningMeta.processingTimeMs}
                      />
                      <ReasoningContent aria-busy={running}>
                        <ReasoningText>{children}</ReasoningText>
                      </ReasoningContent>
                    </ReasoningRoot>
                  );
                }
                case "group-sources":
                  return (
                    <div key={part.indices.join("-")} className="space-y-2">
                      {actionBar}
                      <GeminiMessageSources
                        open={sourcesOpen}
                        sourceCount={part.indices.length}
                      >
                        {children}
                      </GeminiMessageSources>
                    </div>
                  );
                case "text":
                  return <GeminiAssistantMarkdown />;
                case "reasoning":
                  return <Reasoning {...part} />;
                case "source":
                  return <Source {...part} />;
                default:
                  return null;
              }
            }}
          </MessagePrimitive.GroupedParts>

          {sourceParts.length === 0 ? actionBar : null}
        </div>

        {isLastAssistantMessage && showActions ? (
          <p className="pt-1 text-[10px] leading-snug text-[#80868b] dark:text-gray-500">
            AI có thể mắc lỗi. Hãy kiểm tra lại với các tài liệu liên quan.
          </p>
        ) : null}
      </div>
    </MessagePrimitive.Root>
  );
}

function GeminiComposer({ centered = false }: { centered?: boolean }) {
  const isEmpty = useAuiState((s) => s.composer.isEmpty);
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const { activeSessionStatus } = useChatbotShell();
  const isArchived = activeSessionStatus === "archived";
  const composerScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEmpty || !composerScrollRef.current) return;
    composerScrollRef.current.scrollTop = 0;
  }, [isEmpty]);

  return (
    <ComposerPrimitive.Root
      className={`chatbot-composer-root group/composer relative w-full rounded-4xl border px-3 py-2 transition-[border-color,box-shadow,background-color] duration-300 ${
        centered
          ? "dark:bg-navy-800 border-[#d3e3fd]/80 bg-white/90 shadow-[0_18px_70px_-28px_rgba(26,115,232,0.45)] backdrop-blur-xl dark:border-white/10 dark:shadow-[0_20px_70px_-30px_rgba(58,91,246,0.38)]"
          : "dark:bg-navy-800 border-transparent bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.16)]"
      } ${isArchived ? "opacity-80" : ""}`}
      data-empty={isEmpty}
      data-running={isRunning}
    >
      <ScrollFadeArea
        ref={composerScrollRef}
        className={`app-scrollbar-hidden max-h-36 ${
          isEmpty ? "overflow-y-hidden" : "overflow-y-auto"
        }`}
      >
        <ComposerPrimitive.Input
          placeholder={
            isArchived
              ? "Cuộc trò chuyện đã lưu trữ chỉ có thể xem lại"
              : GEMINI_INPUT_PLACEHOLDER
          }
          rows={1}
          disabled={isArchived}
          className="app-scrollbar-hidden [field-sizing:content] w-full resize-none overflow-hidden bg-transparent px-3 py-1.5 pt-2 pr-14 text-sm leading-snug text-[#1f1f1f] outline-none placeholder:text-[#444746] dark:text-white dark:placeholder:text-gray-400"
        />
      </ScrollFadeArea>
      {isArchived ? null : (
        <div className="absolute right-2.5 bottom-2 size-9">
          <ComposerPrimitive.Send
            className="dark:bg-brand-500 absolute inset-0 flex items-center justify-center rounded-full bg-[#d3e3fd] text-[#062e6f] transition-transform duration-200 ease-out group-data-[empty=true]/composer:pointer-events-none group-data-[empty=true]/composer:scale-0 group-data-[running=true]/composer:pointer-events-none group-data-[running=true]/composer:scale-0 hover:opacity-90 disabled:opacity-40 dark:text-white"
            aria-label="Gửi"
          >
            <MdSend className="h-[18px] w-[18px]" />
          </ComposerPrimitive.Send>
          <ComposerPrimitive.Cancel
            className="dark:bg-navy-700 absolute inset-0 flex items-center justify-center rounded-full bg-[#d3e3fd] text-[#062e6f] transition-transform duration-200 ease-out group-data-[running=false]/composer:pointer-events-none group-data-[running=false]/composer:scale-0 hover:opacity-90 dark:text-white"
            aria-label="Dừng"
          >
            <MdSquare className="h-3.5 w-3.5" />
          </ComposerPrimitive.Cancel>
        </div>
      )}
    </ComposerPrimitive.Root>
  );
}

function GeminiStickyComposer({
  showScrollBottom,
  onScrollToBottom,
  animateFromCenter,
}: {
  showScrollBottom: boolean;
  onScrollToBottom: () => void;
  animateFromCenter: boolean;
}) {
  return (
    <div className="bg-lightPrimary dark:bg-navy-900 relative z-20 w-full shrink-0 pt-2 lg:-translate-y-1">
      {showScrollBottom ? (
        <button
          type="button"
          onClick={() => onScrollToBottom()}
          className="absolute bottom-[calc(100%+1rem)] left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-gray-900/80 text-white shadow-md backdrop-blur transition-all hover:bg-gray-900 dark:bg-[#1f3760] dark:text-[#a8c7fa] dark:hover:bg-[#1a73e8] dark:hover:text-white"
          aria-label="Cuộn xuống cuối đoạn chat"
        >
          <MdArrowDownward className="h-5 w-5" />
        </button>
      ) : null}

      <div
        className={`${CHAT_COMPOSER_GUTTER_CLASS} mb-4 ${
          animateFromCenter ? "chatbot-composer-dock-enter" : ""
        }`}
      >
        <GeminiComposer />
      </div>
    </div>
  );
}

function ChatbotEmptyState() {
  const [greeting] = useState(
    () =>
      NEW_CHAT_GREETINGS[Math.floor(Math.random() * NEW_CHAT_GREETINGS.length)],
  );

  return (
    <div className="flex min-h-full w-full flex-1 flex-col items-center justify-center py-10 sm:py-12">
      <div
        className={`w-full ${CHAT_THREAD_MAX_WIDTH_CLASS} -translate-y-[3vh]`}
      >
        <h1 className="mb-10 text-center text-2xl leading-snug font-light tracking-[-0.02em] text-[#3c4043] sm:text-[1.75rem] md:text-3xl dark:text-[#e8eaed]">
          {greeting}
        </h1>
        <div className={`mx-auto w-full ${CHAT_COMPOSER_MAX_WIDTH_CLASS}`}>
          <GeminiComposer centered />
        </div>
      </div>
    </div>
  );
}

const SKELETON_ROWS = [
  { side: "right", widths: ["72%"] },
  { side: "left", widths: ["88%", "64%", "40%"] },
  { side: "right", widths: ["55%"] },
  { side: "left", widths: ["80%", "52%"] },
] as const;

function ChatMessagesSkeletonLoader() {
  return (
    <div
      className="flex w-full flex-col gap-6 px-1 pt-4"
      aria-hidden
      aria-label="Đang tải tin nhắn…"
    >
      {SKELETON_ROWS.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className={`flex w-full flex-col gap-2 ${
            row.side === "right" ? "items-end" : "items-start"
          }`}
        >
          {row.widths.map((width, lineIdx) => (
            <div
              key={lineIdx}
              style={{ width }}
              className="h-4 animate-pulse rounded-full bg-[#e9eef6] dark:bg-white/10"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Giao diện theo hướng [Gemini clone assistant-ui](https://www.assistant-ui.com/examples/gemini). */
export function GeminiThread({ className = "" }: { className?: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const messagesCount = useAuiState((s) => s.thread.messages.length);
  const { activeThreadId, isLoadingMessages, sessions, unarchiveThread } =
    useChatbotShell();
  const { sidebarOpen, sidebarCollapsed } = useChatbotLayoutOptional() ?? {};
  const activeSession = sessions.find((s) => s.id === activeThreadId);
  const isNewThread = !activeSession?.serverId;
  const isArchivedThread = activeSession?.status === "archived";
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const viewportFadeStyle = useScrollFadeMask(viewportRef, [
    messagesCount,
    activeThreadId,
    isLoadingMessages,
  ]);

  const updateScrollButton = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    setShowScrollBottom(
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight > 150,
    );
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior,
    });
  }, []);

  useEffect(() => {
    if (messagesCount === 0) {
      const frameId = window.requestAnimationFrame(updateScrollButton);
      return () => window.cancelAnimationFrame(frameId);
    }

    const frameId = window.requestAnimationFrame(() => {
      scrollToBottom("auto");
      updateScrollButton();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeThreadId, messagesCount, scrollToBottom, updateScrollButton]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.addEventListener("scroll", updateScrollButton, { passive: true });
    window.addEventListener("resize", updateScrollButton);
    const frameId = window.requestAnimationFrame(updateScrollButton);
    return () => {
      window.cancelAnimationFrame(frameId);
      viewport.removeEventListener("scroll", updateScrollButton);
      window.removeEventListener("resize", updateScrollButton);
    };
  }, [updateScrollButton]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(updateScrollButton);
    return () => window.cancelAnimationFrame(frameId);
  }, [sidebarOpen, sidebarCollapsed, updateScrollButton]);

  const showEmptyState =
    isNewThread && messagesCount === 0 && !isLoadingMessages;

  return (
    <ThreadPrimitive.Root
      className={`relative isolate flex h-full min-h-0 min-w-0 flex-col bg-transparent text-base text-[#1f1f1f] dark:text-white ${className}`.trim()}
    >
      {isArchivedThread && activeSession ? (
        <div className="pointer-events-none absolute top-3 right-4 z-20 flex justify-end sm:right-5">
          <button
            type="button"
            onClick={() => void unarchiveThread(activeSession)}
            className="pointer-events-auto inline-flex h-9 items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-3 text-xs font-semibold text-[#444746] shadow-sm backdrop-blur transition hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-[#1a73e8]/30 focus-visible:outline-none dark:border-white/10 dark:bg-navy-800/95 dark:text-gray-200 dark:hover:bg-white/10"
            aria-label="Khôi phục cuộc trò chuyện"
          >
            <MdUnarchive className="h-4 w-4 shrink-0" aria-hidden />
            Khôi phục
          </button>
        </div>
      ) : null}

      {showEmptyState ? (
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <span className="chatbot-ambient-light chatbot-ambient-light-one" />
          <span className="chatbot-ambient-light chatbot-ambient-light-two" />
          <span className="chatbot-ambient-light chatbot-ambient-light-three" />
        </div>
      ) : null}

      <ChatViewportContext.Provider value={viewportRef}>
        <ThreadPrimitive.Viewport
          ref={viewportRef}
          style={viewportFadeStyle}
          className="flex min-h-0 w-full flex-1 [scrollbar-width:thin] flex-col overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          <div
            className={`${CHAT_THREAD_GUTTER_CLASS} flex min-h-full flex-col`}
          >
            {isLoadingMessages ? (
              <ChatMessagesSkeletonLoader />
            ) : isNewThread && messagesCount === 0 ? (
              <ChatbotEmptyState />
            ) : null}
            {!isLoadingMessages && (
              <ThreadPrimitive.Messages
                components={{
                  UserMessage: GeminiUserMessage,
                  AssistantMessage: GeminiAssistantMessage,
                }}
              />
            )}
          </div>
        </ThreadPrimitive.Viewport>

        {showEmptyState ? null : (
          <GeminiStickyComposer
            showScrollBottom={showScrollBottom}
            onScrollToBottom={scrollToBottom}
            animateFromCenter={isNewThread && messagesCount > 0}
          />
        )}
      </ChatViewportContext.Provider>
    </ThreadPrimitive.Root>
  );
}
