import {
  ComposerPrimitive,
  MessagePartPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
  type ReasoningMessagePartProps,
  type SourceMessagePartProps,
} from "@assistant-ui/react";
import { useEffect, useMemo, useState } from "react";
import {
  MdAutoAwesome,
  MdEditNote,
  MdFactCheck,
  MdKeyboardArrowDown,
  MdOutlineLightbulb,
  MdOutlinePsychology,
  MdSearch,
  MdSend,
  MdSquare,
} from "react-icons/md";

import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/services/auth/auth.service";
import { getUserInfoFromToken } from "@/utils/auth.util";

import { CHAT_INPUT_PLACEHOLDER } from "../constants";

const STEP_ICONS = [
  MdOutlineLightbulb,
  MdSearch,
  MdEditNote,
  MdFactCheck,
  MdOutlinePsychology,
] as const;

/** Không dùng useMessage trong part — tránh lỗi context; meta gắn trong parentId từ convertMessage. */
function parseReasoningParentId(parentId: string | undefined) {
  if (!parentId) return { stepIndex: 0, isLastReasoning: true };
  const full = /^r-(\d+)-of-(\d+)$/.exec(parentId);
  if (full) {
    const index = Number(full[1]);
    const total = Number(full[2]);
    return {
      stepIndex: Number.isFinite(index) ? index : 0,
      isLastReasoning: total > 0 && index === total - 1,
    };
  }
  const legacy = /^r-(\d+)$/.exec(parentId);
  if (legacy) {
    const index = Number(legacy[1]);
    return { stepIndex: Number.isFinite(index) ? index : 0, isLastReasoning: true };
  }
  return { stepIndex: 0, isLastReasoning: true };
}

const messagePartComponents = {
  Reasoning: function GeminiReasoningPart({
    text,
    status,
    parentId,
  }: ReasoningMessagePartProps) {
    const { stepIndex, isLastReasoning } = parseReasoningParentId(parentId);
    const [expanded, setExpanded] = useState(false);
    const streaming = status.type === "running";
    const open = (isLastReasoning && streaming) || expanded;

    const preview = useMemo(() => {
      const line = text.trim().split("\n")[0] ?? "";
      if (line.length <= 96) return line || "Bước suy luận";
      return `${line.slice(0, 93)}…`;
    }, [text]);

    const Icon = STEP_ICONS[stepIndex % STEP_ICONS.length];

    if (!text.trim()) return null;

    return (
      <details
        className="mb-2 border-b border-gray-200/80 pb-2 last:mb-0 last:border-b-0 last:pb-0 dark:border-white/10"
        open={open}
        onToggle={(e) => {
          if (isLastReasoning && streaming) return;
          setExpanded(e.currentTarget.open);
        }}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 py-1 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200/90 text-[#444746] dark:border-white/15 dark:text-[#c4c7c5]">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 text-left text-xs font-medium text-[#444746] dark:text-[#c4c7c5]">
            {preview}
          </span>
          <MdKeyboardArrowDown
            className={`h-5 w-5 shrink-0 text-[#444746] transition-transform dark:text-[#c4c7c5] ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </summary>
        <div className="mt-1.5 pl-10 text-xs leading-relaxed text-[#444746] dark:text-[#c4c7c5]">
          <pre className="font-sans whitespace-pre-wrap">{text}</pre>
        </div>
      </details>
    );
  },
  Text: function GeminiAnswerText() {
    return (
      <MessagePartPrimitive.Text
        component="div"
        smooth
        className="text-sm leading-relaxed whitespace-pre-wrap text-[#1f1f1f] dark:text-[#e3e3e3]"
      />
    );
  },
  Source: function GeminiSourcePart({ url, title }: SourceMessagePartProps) {
    return (
      <p className="mb-2 text-xs">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0b57d0] underline underline-offset-2 dark:text-[#a8c7fa]"
        >
          {title?.trim() || url}
        </a>
      </p>
    );
  },
};

function GeminiUserMessage() {
  return (
    <MessagePrimitive.Root className="flex w-full justify-end pb-3">
      <div className="max-w-[min(560px,88%)] rounded-3xl rounded-tr border border-gray-200/90 px-4 py-3 text-sm leading-relaxed text-[#1f1f1f] dark:border-white/15 dark:text-[#e3e3e3]">
        <MessagePrimitive.Parts components={messagePartComponents} />
      </div>
    </MessagePrimitive.Root>
  );
}

function GeminiAssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex w-full justify-start gap-3 pb-3">
      <div
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300/90 text-violet-600 dark:border-white/20 dark:text-violet-400"
        aria-hidden
      >
        <MdAutoAwesome className="h-4 w-4" />
      </div>
      <div className="max-w-[min(640px,92%)] min-w-0 flex-1 space-y-2 text-sm leading-relaxed">
        <MessagePrimitive.Parts components={messagePartComponents} />
      </div>
    </MessagePrimitive.Root>
  );
}

function useChatGreetingName() {
  const accessToken = useAuthStore((s) => s.accessToken);

  const fromToken = useMemo(() => {
    const info = getUserInfoFromToken(accessToken);
    return info.name?.trim() || info.email?.split("@")[0]?.trim() || "";
  }, [accessToken]);

  const [meForToken, setMeForToken] = useState<{
    token: string | null;
    name: string;
  }>({ token: null, name: "" });

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    authService
      .getMe()
      .then((me) => {
        if (cancelled) return;
        const n = me.name?.trim() || me.email?.split("@")[0]?.trim() || "";
        setMeForToken({ token: accessToken, name: n });
      })
      .catch(() => {
        if (cancelled) return;
        setMeForToken({ token: accessToken, name: "" });
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (!accessToken) return "bạn";
  if (meForToken.token === accessToken && meForToken.name) return meForToken.name;
  return fromToken || "bạn";
}

function GeminiComposer({ placement = "footer" }: { placement?: "footer" | "empty" }) {
  const isEmpty = useAuiState((s) => s.composer.isEmpty);
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const outerClass =
    placement === "footer"
      ? "border-t border-gray-200/60 px-5 pt-4 pb-6 md:px-6 dark:border-white/10"
      : "w-full pb-2";

  return (
    <div className={outerClass}>
      <ComposerPrimitive.Root
        className="group/composer w-full rounded-[28px] border border-gray-200/90 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#303030]"
        data-empty={isEmpty}
        data-running={isRunning}
      >
        <ComposerPrimitive.Input
          placeholder={CHAT_INPUT_PLACEHOLDER}
          rows={1}
          className="mb-3 max-h-40 min-h-[44px] w-full resize-none bg-transparent px-2 pt-0.5 text-[15px] leading-snug text-[#1f1f1f] outline-none placeholder:text-[#444746] dark:text-[#e3e3e3] dark:placeholder:text-[#c4c7c5]"
        />
        <div className="flex items-center justify-end">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <ComposerPrimitive.Send
              className="absolute flex h-10 w-10 items-center justify-center rounded-full border border-[#0b57d0]/35 text-[#062e6f] transition group-data-[empty=true]/composer:scale-0 group-data-[running=true]/composer:scale-0 hover:opacity-90 disabled:opacity-40 dark:border-[#a8c7fa]/40 dark:text-[#d3e3fd]"
              aria-label="Gửi"
            >
              <MdSend className="h-5 w-5" />
            </ComposerPrimitive.Send>
            <ComposerPrimitive.Cancel
              className="absolute flex h-10 w-10 items-center justify-center rounded-full border border-[#0b57d0]/35 text-[#062e6f] transition group-data-[running=false]/composer:scale-0 hover:opacity-90 dark:border-[#a8c7fa]/40 dark:text-[#d3e3fd]"
              aria-label="Dừng"
            >
              <MdSquare className="h-4 w-4" />
            </ComposerPrimitive.Cancel>
          </div>
        </div>
      </ComposerPrimitive.Root>
      <p className="mt-3 max-w-3xl text-left text-xs text-[#444746] dark:text-[#c4c7c5]">
        Câu trả lời của AI chỉ mang tính chất tham khảo. Xác thực lại với các tài liệu gợi ý.
      </p>
    </div>
  );
}

/** Giao diện theo hướng [Gemini clone assistant-ui](https://www.assistant-ui.com/examples/gemini). */
export function GeminiThread() {
  const greetingName = useChatGreetingName();

  return (
    <ThreadPrimitive.Root className="flex h-full min-h-0 w-full flex-col bg-transparent text-[#1f1f1f] dark:text-[#e3e3e3]">
      <ThreadPrimitive.If empty>
        <div className="flex min-h-0 flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-3xl shrink-0 px-5 pt-8 pb-10 md:px-6 md:pt-10">
            <p className="mb-6 text-left text-2xl font-normal tracking-tight text-[#1f1f1f] md:text-3xl dark:text-[#e3e3e3]">
              Chào {greetingName}
            </p>
            <GeminiComposer placement="empty" />
          </div>
        </div>
      </ThreadPrimitive.If>

      <ThreadPrimitive.If empty={false}>
        <ThreadPrimitive.Viewport className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-5 pt-5 pb-4 md:px-6 md:pt-6">
            <ThreadPrimitive.Messages
              components={{
                UserMessage: GeminiUserMessage,
                AssistantMessage: GeminiAssistantMessage,
              }}
            />
          </div>
        </ThreadPrimitive.Viewport>
      </ThreadPrimitive.If>

      <ThreadPrimitive.If empty={false}>
        <GeminiComposer placement="footer" />
      </ThreadPrimitive.If>
    </ThreadPrimitive.Root>
  );
}
