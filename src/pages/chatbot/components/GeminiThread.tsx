import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
  type PartState,
} from "@assistant-ui/react";
import { useCallback } from "react";
import { MdAutoAwesome, MdSend, MdSquare } from "react-icons/md";

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
  const groupAssistantParts = useCallback((part: PartState) => {
    if (part.type === "reasoning") return ["group-reasoning"] as const;
    if (part.type === "source") return ["group-sources"] as const;
    return null;
  }, []);

  return (
    <MessagePrimitive.Root className="grid w-full grid-cols-[auto_1fr] gap-3 pb-3">
      <div
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4285f4]/20 to-[#8ab4f8]/30 text-[#1a73e8] dark:from-[#8ab4f8]/25 dark:to-[#aecbfa]/20 dark:text-[#a8c7fa]"
        aria-hidden
      >
        <MdAutoAwesome className="h-4 w-4" />
      </div>
      <div className="w-full min-w-0 space-y-2 text-base leading-relaxed">
        <MessagePrimitive.GroupedParts groupBy={groupAssistantParts}>
          {({ part, children }) => {
            switch (part.type) {
              case "group-reasoning": {
                const running = part.status.type === "running";
                return (
                  <ReasoningRoot
                    key={part.indices.join("-")}
                    defaultOpen={running}
                    variant="ghost"
                  >
                    <ReasoningTrigger active={running} />
                    <ReasoningContent aria-busy={running}>
                      <ReasoningText>{children}</ReasoningText>
                    </ReasoningContent>
                  </ReasoningRoot>
                );
              }
              case "group-sources":
                return (
                  <Sources key={part.indices.join("-")}>{children}</Sources>
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

function GeminiStickyComposer() {
  return (
    <div className="shrink-0 bg-transparent pt-3 pb-5 dark:border-white/10">
      <GeminiComposer />
      <p className="mx-auto mt-2 max-w-lg px-2 text-center text-xs leading-snug text-[#444746] dark:text-gray-400">
        Câu trả lời của AI chỉ mang tính chất tham khảo. Xác thực lại với các
        tài liệu gợi ý.
      </p>
    </div>
  );
}

/** Giao diện theo hướng [Gemini clone assistant-ui](https://www.assistant-ui.com/examples/gemini). */
export function GeminiThread({ className = "" }: { className?: string }) {
  return (
    <ThreadPrimitive.Root
      className={`flex h-full min-h-0 w-full flex-col bg-transparent text-base text-[#1f1f1f] dark:text-white ${className}`.trim()}
    >
      <ThreadPrimitive.Viewport className="min-h-0 w-full flex-1 overflow-y-auto overscroll-y-contain">
        <div className="w-full pt-4 pb-2 md:pt-5">
          <ThreadPrimitive.Messages
            components={{
              UserMessage: GeminiUserMessage,
              AssistantMessage: GeminiAssistantMessage,
            }}
          />
        </div>
      </ThreadPrimitive.Viewport>
      <GeminiStickyComposer />
    </ThreadPrimitive.Root>
  );
}
