import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
  useMessage,
  type PartState,
} from "@assistant-ui/react";
import { useCallback, useEffect, useRef } from "react";
import {
  MdAutoAwesome,
  MdChecklist,
  MdDescription,
  MdSchool,
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
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";

import { useChatbotShell } from "../chatbotShellContext";

const GEMINI_INPUT_PLACEHOLDER = "Hỏi Chatbot giáo vụ";

const EMPTY_PROMPTS = [
  {
    icon: MdSchool,
    title: "Điều kiện tốt nghiệp",
    text: "Hỏi về tín chỉ, chuẩn ngoại ngữ, chứng chỉ bắt buộc.",
  },
  {
    icon: MdChecklist,
    title: "Quy chế học vụ",
    text: "Tra cứu quy định học lại, cải thiện điểm, cảnh báo học tập.",
  },
  {
    icon: MdDescription,
    title: "Tài liệu đào tạo",
    text: "Tìm thông tin trong chương trình đào tạo và văn bản liên quan.",
  },
] as const;

function parseReasoningParentId(parentId: string | undefined) {
  return {
    defaultOpen: !parentId?.includes(":closed"),
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
    if (part.type === "tool-call") return ["group-reasoning"] as const;
    if (part.type === "source") return ["group-sources"] as const;
    return null;
  }, []);

  return (
    <MessagePrimitive.Root>
      <div className="w-full min-w-0 space-y-2 text-base leading-relaxed">
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
                const defaultOpen = running || reasoningMeta.defaultOpen;
                return (
                  <ReasoningRoot
                    key={part.indices.join("-")}
                    defaultOpen={defaultOpen}
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
              case "tool-call":
                return part.toolUI ?? <ToolFallback {...part} />;
              case "source":
                return <Source {...part} />;
              default:
                return null;
            }
          }}
        </MessagePrimitive.GroupedParts>
        {showTimestamp ? (
          <div className="pt-1 text-right text-xs text-[#9aa0a6] dark:text-[#8f98aa]">
            {timestampText}
          </div>
        ) : null}
      </div>
    </MessagePrimitive.Root>
  );
}

function GeminiComposer() {
  const isEmpty = useAuiState((s) => s.composer.isEmpty);
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const { activeSessionStatus } = useChatbotShell();
  const isArchived = activeSessionStatus === "archived";

  return (
    <ComposerPrimitive.Root
      className={`group/composer dark:bg-navy-800 relative w-full rounded-4xl bg-white p-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.16)] ${
        isArchived ? "opacity-80" : ""
      }`}
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

function GeminiStickyComposer({ glassActive }: { glassActive: boolean }) {
  return (
    <div
      className={`sticky bottom-0 z-20 shrink-0 transition-[padding] duration-200 ease-out ${
        glassActive ? "pt-[50px]" : "pt-0"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-0 h-[100px] transition-opacity duration-200 ease-out ${
          glassActive ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      >
        <div className="from-lightPrimary/0 via-lightPrimary/85 to-lightPrimary dark:from-navy-900/0 dark:via-navy-900/88 dark:to-navy-900 absolute inset-0 bg-linear-to-b [mask-image:linear-gradient(to_bottom,transparent_0%,black_30%,black_100%)] backdrop-blur-lg" />
      </div>
      <div className="bg-lightPrimary dark:bg-navy-900 relative z-10 pb-4">
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
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <div
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#d3e3fd]/60 bg-[#eef4ff] text-[#1a73e8] shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-[#a8c7fa]"
        aria-hidden
      >
        <MdAutoAwesome className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-semibold tracking-normal text-[#202124] sm:text-3xl dark:text-white">
        Bạn cần hỏi gì về học vụ?
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[#5f6368] dark:text-[#b8c0d6]">
        Nhập câu hỏi bên dưới để tra cứu quy chế, chương trình đào tạo và các
        tài liệu học vụ đã được bóc tách.
      </p>
      <div className="mt-7 grid w-full gap-3 sm:grid-cols-3">
        {EMPTY_PROMPTS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-2xl border border-[#d3e3fd]/70 bg-white/80 p-4 text-left shadow-[0_8px_28px_-24px_rgba(26,115,232,0.5)] dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#d3e3fd] text-[#0b57d0] dark:bg-[#1f3760] dark:text-[#a8c7fa]">
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold text-[#202124] dark:text-white">
                {item.title}
              </div>
              <div className="mt-1 text-xs leading-5 text-[#5f6368] dark:text-[#9aa0a6]">
                {item.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Giao diện theo hướng [Gemini clone assistant-ui](https://www.assistant-ui.com/examples/gemini). */
export function GeminiThread({ className = "" }: { className?: string }) {
  const hasMessages = useAuiState((s) => s.thread.messages.length > 0);
  const { activeThreadId } = useChatbotShell();
  const autoScrolledThreadRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasMessages || autoScrolledThreadRef.current === activeThreadId) {
      return;
    }

    autoScrolledThreadRef.current = activeThreadId;

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "auto",
      });
    });
  }, [activeThreadId, hasMessages]);

  return (
    <ThreadPrimitive.Root
      className={`flex min-h-[calc(100vh-8rem)] w-full flex-col bg-transparent text-base text-[#1f1f1f] dark:text-white ${className}`.trim()}
    >
      <ThreadPrimitive.Viewport className="w-full flex-1 overflow-visible">
        <div className="flex min-h-[calc(100vh-15rem)] w-full flex-col pt-4">
          {hasMessages ? null : <ChatbotEmptyState />}
          <ThreadPrimitive.Messages
            components={{
              UserMessage: GeminiUserMessage,
              AssistantMessage: GeminiAssistantMessage,
            }}
          />
        </div>
      </ThreadPrimitive.Viewport>
      <GeminiStickyComposer glassActive={hasMessages} />
    </ThreadPrimitive.Root>
  );
}
