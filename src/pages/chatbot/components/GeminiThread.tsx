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
  useContext,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  MdArrowDownward,
  MdCheck,
  MdContentCopy,
  MdSend,
  MdSquare,
} from "react-icons/md";

import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import {
  Reasoning,
  ReasoningContent,
  ReasoningRoot,
  ReasoningText,
  ReasoningTrigger,
} from "@/components/assistant-ui/reasoning";
import { Source, Sources } from "@/components/assistant-ui/sources";

import { useChatbotShell } from "../chatbotShellContext";

const GEMINI_INPUT_PLACEHOLDER = "Hỏi Chatbot giáo vụ";
const COPY_BUTTON_HIDE_OFFSET = 300;

const ChatViewportContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

const NEW_CHAT_GREETINGS = [
  "Cùng bắt đầu nhé, bạn muốn hỏi điều gì?",
  "Hôm nay bạn cần tra cứu thông tin gì?",
  "Bạn đang băn khoăn điều gì về học vụ?",
  "Cùng tìm câu trả lời cho hành trình học tập của bạn.",
  "Bạn muốn tìm hiểu quy chế hay chương trình đào tạo?",
  "Có câu hỏi nào về học tập cần mình hỗ trợ không?",
  "Sẵn sàng rồi, chúng ta cùng tra cứu nhé.",
  "Bạn cần mình hỗ trợ điều gì hôm nay?",
  "Cùng tháo gỡ câu hỏi học vụ của bạn nhé.",
  "Hãy bắt đầu với điều bạn đang quan tâm.",
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

function formatAssistantTimestamp(raw: unknown) {
  const date = raw instanceof Date ? raw : new Date(String(raw ?? ""));
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const geminiUserMessagePartComponents = {
  Reasoning: () => null,
  Text: MarkdownText,
  Source,
};

function GeminiUserMessage() {
  return (
    <MessagePrimitive.Root className="flex w-full justify-end pb-3">
      <div className="w-fit max-w-[66.666%] rounded-3xl rounded-tr bg-[#e9eef6] px-4 py-3 text-base leading-relaxed text-[#1f1f1f] dark:bg-white/10 dark:text-white">
        <MessagePrimitive.Parts
          unstable_showEmptyOnNonTextEnd={false}
          components={geminiUserMessagePartComponents}
        />
      </div>
    </MessagePrimitive.Root>
  );
}

function GeminiAssistantMessage() {
  const viewportRef = useContext(ChatViewportContext);
  const messageId = useMessage((state) => state.id);
  const messageContent = useMessage((state) => state.content);
  const createdAt = useMessage((state) => state.createdAt);
  const messageStatus = useMessage((state) => state.status?.type);
  const timestampText = formatAssistantTimestamp(createdAt);
  const hasFinalContent = messageContent.some(
    (part) =>
      (part.type === "text" && part.text.trim()) || part.type === "source",
  );
  const showTimestamp =
    timestampText &&
    hasFinalContent &&
    messageStatus !== "running" &&
    messageStatus !== "requires-action";
  const groupAssistantParts = useCallback((part: PartState) => {
    if (part.type === "reasoning") return ["group-reasoning"] as const;
    if (part.type === "source") return ["group-sources"] as const;
    return null;
  }, []);

  const messageRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [showCopyBtn, setShowCopyBtn] = useState(true);

  const handleCopy = useCallback(() => {
    const text = messageContent
      .filter(
        (part): part is Extract<typeof part, { type: "text" }> =>
          part.type === "text",
      )
      .map((part) => part.text)
      .join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [messageContent]);

  useEffect(() => {
    const el = messageRef.current;
    const viewport = viewportRef?.current;
    if (!el || !viewport) return;

    const check = () => {
      const messageRect = el.getBoundingClientRect();
      const viewportRect = viewport.getBoundingClientRect();
      setShowCopyBtn(
        messageRect.bottom - viewportRect.top > COPY_BUTTON_HIDE_OFFSET,
      );
    };

    viewport.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    const resizeObserver = new ResizeObserver(check);
    resizeObserver.observe(el);
    resizeObserver.observe(viewport);
    check();
    return () => {
      viewport.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      resizeObserver.disconnect();
    };
  }, [viewportRef]);

  return (
    <MessagePrimitive.Root>
      <div
        ref={messageRef}
        className="relative w-full min-w-0 pb-9 text-base leading-relaxed"
      >
        {hasFinalContent && (
          <div
            className={`sticky top-3 z-10 flex h-0 justify-end transition-opacity duration-200 ${
              showCopyBtn ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5f6368] transition-colors hover:bg-gray-100 hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:bg-white/10 dark:hover:text-white"
              aria-label={copied ? "Đã sao chép" : "Sao chép"}
              title={copied ? "Đã sao chép" : "Sao chép"}
            >
              {copied ? (
                <MdCheck className="h-[18px] w-[18px] text-green-500" />
              ) : (
                <MdContentCopy className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        )}
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
                    <Sources
                      key={part.indices.join("-")}
                      sourceCount={part.indices.length}
                    >
                      {children}
                    </Sources>
                  );
                case "text":
                  return <MarkdownText />;
                case "reasoning":
                  return <Reasoning {...part} />;
                case "source":
                  return <Source {...part} />;
                default:
                  return null;
              }
            }}
          </MessagePrimitive.GroupedParts>
          {showTimestamp ? (
            <div className="pt-1 text-right text-xs text-[#9aa0a6] dark:text-[#8f98aa]">
              Trả lời lúc {timestampText}
            </div>
          ) : null}
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

function GeminiComposer({ centered = false }: { centered?: boolean }) {
  const isEmpty = useAuiState((s) => s.composer.isEmpty);
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const { activeSessionStatus } = useChatbotShell();
  const isArchived = activeSessionStatus === "archived";

  return (
    <ComposerPrimitive.Root
      className={`group/composer relative w-full rounded-4xl border p-3 transition-[border-color,box-shadow,background-color] duration-300 ${
        centered
          ? "dark:bg-navy-800 border-[#d3e3fd]/80 bg-white/90 shadow-[0_18px_70px_-28px_rgba(26,115,232,0.45)] backdrop-blur-xl dark:border-white/10 dark:shadow-[0_20px_70px_-30px_rgba(58,91,246,0.38)]"
          : "dark:bg-navy-800 border-transparent bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.16)]"
      } ${isArchived ? "opacity-80" : ""}`}
      data-empty={isEmpty}
      data-running={isRunning}
    >
      <ComposerPrimitive.Input
        placeholder={
          isArchived
            ? "Cuộc trò chuyện đã lưu trữ chỉ có thể xem lại"
            : GEMINI_INPUT_PLACEHOLDER
        }
        rows={1}
        disabled={isArchived}
        className="max-h-40 w-full resize-none bg-transparent py-2 pr-14 pl-2 text-base leading-snug text-[#1f1f1f] outline-none placeholder:text-[#444746] dark:text-white dark:placeholder:text-gray-400"
      />
      {isArchived ? null : (
        <div className="absolute top-1/2 right-3 size-10 -translate-y-1/2">
          <ComposerPrimitive.Send
            className="dark:bg-brand-500 absolute inset-0 flex items-center justify-center rounded-full bg-[#d3e3fd] text-[#062e6f] transition-transform duration-200 ease-out group-data-[empty=true]/composer:pointer-events-none group-data-[empty=true]/composer:scale-0 group-data-[running=true]/composer:pointer-events-none group-data-[running=true]/composer:scale-0 hover:opacity-90 disabled:opacity-40 dark:text-white"
            aria-label="Gửi"
          >
            <MdSend className="h-5 w-5" />
          </ComposerPrimitive.Send>
          <ComposerPrimitive.Cancel
            className="dark:bg-navy-700 absolute inset-0 flex items-center justify-center rounded-full bg-[#d3e3fd] text-[#062e6f] transition-transform duration-200 ease-out group-data-[running=false]/composer:pointer-events-none group-data-[running=false]/composer:scale-0 hover:opacity-90 dark:text-white"
            aria-label="Dừng"
          >
            <MdSquare className="h-4 w-4" />
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
    <div className="bg-lightPrimary dark:bg-navy-900 relative z-20 w-full shrink-0 pt-2">
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
        className={`mx-auto mb-4 w-full max-w-[860px] px-[3vw] md:px-[4vw] lg:px-0 ${
          animateFromCenter ? "chatbot-composer-dock-enter" : ""
        }`}
      >
        <GeminiComposer />
        <p className="mx-auto mt-2 max-w-lg text-center text-xs leading-snug text-[#444746] dark:text-gray-400">
          Câu trả lời của AI chỉ mang tính chất tham khảo. Xác thực lại với các
          tài liệu gợi ý.
        </p>
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
    <div className="flex min-h-[32rem] w-full flex-1 items-center justify-center px-4 py-12 sm:px-6">
      <div className="relative z-10 w-full max-w-[820px] -translate-y-[4vh]">
        <h1 className="mb-8 text-center text-3xl leading-tight font-normal tracking-[-0.03em] text-[#3c4043] sm:text-4xl md:text-[2.65rem] dark:text-[#e8eaed]">
          {greeting}
        </h1>
        <GeminiComposer centered />
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
              className={`h-4 animate-pulse rounded-full bg-[#e9eef6] dark:bg-white/10 ${
                row.side === "right" ? "rounded-tr-sm" : "rounded-tl-sm"
              }`}
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
  const { activeThreadId, isLoadingMessages, sessions } = useChatbotShell();
  const isNewThread = !sessions.find((s) => s.id === activeThreadId)?.serverId;
  const [showScrollBottom, setShowScrollBottom] = useState(false);

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

  const showEmptyState =
    isNewThread && messagesCount === 0 && !isLoadingMessages;

  return (
    <ThreadPrimitive.Root
      className={`relative isolate flex h-full min-h-0 min-w-0 flex-col bg-transparent text-base text-[#1f1f1f] dark:text-white ${className}`.trim()}
    >
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
          className="flex min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          <div className="mx-auto flex min-h-full w-full max-w-[860px] flex-col px-[3vw] md:px-[4vw] lg:px-0">
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
