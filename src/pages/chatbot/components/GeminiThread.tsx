import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
  type PartState,
} from "@assistant-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MdAttachFile,
  MdAutoAwesome,
  MdImage,
  MdKeyboardArrowDown,
  MdMic,
  MdSchool,
  MdSearch,
  MdSend,
  MdSquare,
  MdTravelExplore,
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

function useDismissOnOutsideClick(
  open: boolean,
  setOpen: (value: boolean) => void,
) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, setOpen]);
  return ref;
}

const TOOL_OPTIONS = [
  { id: "deep", label: "Nghiên cứu sâu", Icon: MdTravelExplore },
  { id: "image", label: "Tạo ảnh", Icon: MdImage },
  { id: "web", label: "Tìm trên web", Icon: MdSearch },
  { id: "learn", label: "Giúp tôi học", Icon: MdSchool },
] as const;

const MODEL_OPTIONS = [
  {
    id: "fast",
    label: "Fast",
    desc: "Phản hồi nhanh, phù hợp đa số câu hỏi thường gặp.",
  },
  {
    id: "thinking",
    label: "Thinking",
    desc: "Cân nhắc kỹ hơn trước khi đưa ra câu trả lời.",
  },
  {
    id: "pro",
    label: "Pro",
    desc: "Ưu tiên độ đầy đủ và chi tiết khi cần.",
  },
] as const;

function GeminiToolsMenu() {
  const [open, setOpen] = useState(false);
  const [active, setActive] =
    useState<(typeof TOOL_OPTIONS)[number]["id"]>("web");
  const ref = useDismissOnOutsideClick(open, setOpen);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-0.5 rounded-full px-3 py-2 text-sm font-medium text-[#444746] transition hover:bg-black/[0.04] dark:text-gray-300 dark:hover:bg-white/10"
      >
        Công cụ
        <MdKeyboardArrowDown
          className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="dark:bg-navy-800 absolute bottom-full left-0 z-50 mb-1 min-w-[220px] overflow-hidden rounded-xl border border-[#e3e3e3] bg-white py-1 shadow-lg dark:border-white/10">
          {TOOL_OPTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActive(id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-[#f8f9fa] dark:hover:bg-white/10 ${
                active === id
                  ? "dark:bg-brand-500/20 bg-[#e8f0fe] text-[#062e6f] dark:text-white"
                  : "text-[#1f1f1f] dark:text-gray-200"
              }`}
            >
              <Icon
                className="h-4 w-4 shrink-0 text-[#444746] dark:text-gray-400"
                aria-hidden
              />
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function GeminiModelPicker() {
  const [open, setOpen] = useState(false);
  const [active, setActive] =
    useState<(typeof MODEL_OPTIONS)[number]["id"]>("fast");
  const ref = useDismissOnOutsideClick(open, setOpen);
  const current =
    MODEL_OPTIONS.find((m) => m.id === active) ?? MODEL_OPTIONS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-0.5 rounded-full px-3 py-2 text-sm font-medium text-[#444746] transition hover:bg-black/[0.04] dark:text-gray-300 dark:hover:bg-white/10"
      >
        {current.label}
        <MdKeyboardArrowDown
          className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="dark:bg-navy-800 absolute right-0 bottom-full z-50 mb-1 w-[min(100vw-2rem,280px)] overflow-hidden rounded-xl border border-[#e3e3e3] bg-white py-1 shadow-lg dark:border-white/10">
          {MODEL_OPTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setActive(m.id);
                setOpen(false);
              }}
              className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition hover:bg-[#f8f9fa] dark:hover:bg-white/10 ${
                active === m.id ? "dark:bg-brand-500/20 bg-[#e8f0fe]" : ""
              }`}
            >
              <span className="text-sm font-medium text-[#1f1f1f] dark:text-white">
                {m.label}
              </span>
              <span className="text-xs leading-snug text-[#444746] dark:text-gray-400">
                {m.desc}
              </span>
            </button>
          ))}
          <div className="border-t border-[#e3e3e3] px-3 py-2 text-xs text-[#444746] dark:border-white/10 dark:text-gray-400">
            Nâng cấp Gemini Advanced để mở khóa thêm mô hình và tính năng.
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GeminiComposer() {
  const isEmpty = useAuiState((s) => s.composer.isEmpty);
  const isRunning = useAuiState((s) => s.thread.isRunning);

  return (
    <ComposerPrimitive.Root
      className="group/composer dark:bg-navy-800 w-full rounded-4xl bg-white p-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.16)]"
      data-empty={isEmpty}
      data-running={isRunning}
    >
      <ComposerPrimitive.Input
        placeholder={GEMINI_INPUT_PLACEHOLDER}
        rows={1}
        className="mb-2 max-h-40 min-h-[44px] w-full resize-none bg-transparent px-2 pt-0.5 text-base leading-snug text-[#1f1f1f] outline-none placeholder:text-[#444746] dark:text-white dark:placeholder:text-gray-400"
      />
      <div className="flex items-center gap-0.5">
        <ComposerPrimitive.AddAttachment className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#444746] transition hover:bg-black/[0.04] disabled:opacity-35 dark:text-gray-300 dark:hover:bg-white/10">
          <MdAttachFile className="h-5 w-5" aria-hidden />
        </ComposerPrimitive.AddAttachment>
        <GeminiToolsMenu />
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <GeminiModelPicker />
          <div className="relative size-10 shrink-0">
            <ComposerPrimitive.Dictate className="absolute inset-0 flex items-center justify-center rounded-full bg-[#d3e3fd] text-[#062e6f] transition-transform duration-200 ease-out group-data-[empty=false]/composer:pointer-events-none group-data-[empty=false]/composer:scale-0 group-data-[running=true]/composer:pointer-events-none group-data-[running=true]/composer:scale-0 dark:bg-white/10 dark:text-gray-300">
              <MdMic className="h-5 w-5" aria-hidden />
            </ComposerPrimitive.Dictate>
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
        </div>
      </div>
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
