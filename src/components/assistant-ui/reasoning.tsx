import type { ReasoningMessagePartProps } from "@assistant-ui/react";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";

type ReasoningVariant = "ghost" | "default";
type StructuredReasoningStep = {
  id: string;
  type:
    | "query_analysis"
    | "faq_check"
    | "retrieval"
    | "call"
    | "tool_output"
    | "reasoning"
    | "thought";
  content: string;
};

const ReasoningVariantContext = createContext<ReasoningVariant>("default");
const ReasoningBusyContext = createContext(false);
const STRUCTURED_REASONING_PREFIX = "__CHATBOT_REASONING_STEPS__";

const STEP_LABELS: Record<StructuredReasoningStep["type"], string> = {
  query_analysis: "Phân tích câu hỏi",
  faq_check: "Kiểm tra FAQ",
  retrieval: "Tra cứu tài liệu",
  call: "Công cụ",
  tool_output: "Kết quả công cụ",
  reasoning: "Suy luận",
  thought: "Suy luận",
};

function parseStructuredReasoning(text: string) {
  if (!text.startsWith(STRUCTURED_REASONING_PREFIX)) return null;
  try {
    const parsed = JSON.parse(text.slice(STRUCTURED_REASONING_PREFIX.length));
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (item): item is StructuredReasoningStep =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.type === "string" &&
        typeof item.content === "string",
    );
  } catch {
    return null;
  }
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.24s]" />
      <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.12s]" />
      <span className="h-1 w-1 animate-bounce rounded-full bg-current" />
    </span>
  );
}

function StructuredReasoning({ steps }: { steps: StructuredReasoningStep[] }) {
  const busy = useContext(ReasoningBusyContext);
  return (
    <div className="space-y-2">
      {steps.map((step, index) => {
        const isReasoning = step.type === "reasoning" || step.type === "thought";
        const isCurrentStep = busy && index === steps.length - 1;
        return (
          <div
            key={step.id}
            className={[
              "chat-message-enter rounded-lg border px-3 py-2 transition-all duration-300",
              isReasoning
                ? "border-transparent bg-transparent px-0 py-1"
                : "border-[#d3e3fd]/70 bg-[#f8fafd] text-[#3c4043] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#d9e2ff]",
            ].join(" ")}
          >
            {isReasoning ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#5f6368] dark:text-[#c4c7c5]">
                {step.content}
                {isCurrentStep ? (
                  <span className="ml-2 inline-flex align-middle text-[#1a73e8] dark:text-[#a8c7fa]">
                    <ThinkingDots />
                  </span>
                ) : null}
              </p>
            ) : (
              <div className="flex items-start gap-2">
                <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-[#1a73e8] dark:bg-[#a8c7fa]" />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold tracking-wide text-[#5f6368] uppercase dark:text-[#9aa0a6]">
                    <span>{STEP_LABELS[step.type] ?? "Suy luận"}</span>
                    {isCurrentStep ? <ThinkingDots /> : null}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {step.content}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export type ReasoningRootProps = {
  children?: ReactNode;
  defaultOpen?: boolean;
  variant?: ReasoningVariant;
};

export function ReasoningRoot({
  children,
  defaultOpen = false,
  variant = "default",
}: ReasoningRootProps) {
  const [open, setOpen] = useState(defaultOpen);

  const ghostRoot = variant === "ghost" ? "bg-transparent" : "";

  return (
    <ReasoningVariantContext.Provider value={variant}>
      <details
        className={["group", ghostRoot].filter(Boolean).join(" ")}
        open={open}
        onToggle={(e) => setOpen(e.currentTarget.open)}
      >
        {children}
      </details>
    </ReasoningVariantContext.Provider>
  );
}

export type ReasoningTriggerProps = { active?: boolean };

export function ReasoningTrigger({ active }: ReasoningTriggerProps) {
  const variant = useContext(ReasoningVariantContext);
  if (variant === "ghost") {
    return (
      <summary
        data-active={active ? true : undefined}
        className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full marker:content-none [&::-webkit-details-marker]:hidden"
        aria-label="Bật tắt suy luận"
      >
        <span
          data-active={active ? true : undefined}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d3e3fd] bg-[#eef4ff] text-[#1a73e8] shadow-sm transition-colors hover:bg-[#dbe8ff] data-[active=true]:border-[#a8c7fa] data-[active=true]:bg-[#d3e3fd] dark:border-[#3d4f76] dark:bg-white/10 dark:text-[#a8c7fa] dark:hover:bg-white/15 dark:data-[active=true]:border-[#8ab4f8]/60 dark:data-[active=true]:bg-[#1f3760]/70"
        >
          <MdKeyboardArrowDown
            className="h-5 w-5 group-open:hidden"
            aria-hidden
          />
          <MdKeyboardArrowUp
            className="hidden h-5 w-5 group-open:block"
            aria-hidden
          />
          <span className="sr-only">Suy luận</span>
        </span>
        <span className="text-xs font-medium text-[#80868b] dark:text-[#9aa0a6]">
          Suy luận
        </span>
      </summary>
    );
  }
  return (
    <summary
      data-active={active || undefined}
      className="inline-flex cursor-pointer list-none items-center gap-2 py-1 marker:content-none [&::-webkit-details-marker]:hidden"
      aria-label="Bật tắt suy luận"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dadce0] bg-white text-[#1a73e8] shadow-sm transition-colors hover:bg-[#f1f3f4] dark:border-[#3c4043] dark:bg-white/10 dark:text-[#a8c7fa] dark:hover:bg-white/15">
        <MdKeyboardArrowDown
          className="h-5 w-5 group-open:hidden"
          aria-hidden
        />
        <MdKeyboardArrowUp
          className="hidden h-5 w-5 group-open:block"
          aria-hidden
        />
        <span className="sr-only">Suy luận</span>
      </span>
      <span className="text-sm font-medium text-[#5f6368] dark:text-[#c4c7c5]">
        Suy luận
      </span>
    </summary>
  );
}

export function ReasoningContent(props: ComponentProps<"div">) {
  const variant = useContext(ReasoningVariantContext);
  const { className, children, ...rest } = props;
  const busy = props["aria-busy"] === true || props["aria-busy"] === "true";
  const ghost =
    variant === "ghost"
      ? "mt-2 rounded-xl border border-dashed border-[#dadce0]/70 px-3 py-3 dark:border-[#5f6368]/40"
      : "";
  return (
    <ReasoningBusyContext.Provider value={busy}>
      <div className={[ghost, className].filter(Boolean).join(" ")} {...rest}>
        {children}
      </div>
    </ReasoningBusyContext.Provider>
  );
}

export function ReasoningText({ children }: { children: ReactNode }) {
  const variant = useContext(ReasoningVariantContext);
  if (variant === "ghost") {
    return (
      <div className="space-y-2 text-xs leading-relaxed text-[#80868b] dark:text-[#9aa0a6]">
        {children}
      </div>
    );
  }
  return <div className="space-y-2 text-sm">{children}</div>;
}

export function Reasoning(part: ReasoningMessagePartProps) {
  const structuredSteps = useMemo(
    () => parseStructuredReasoning(part.text),
    [part.text],
  );

  if (structuredSteps) return <StructuredReasoning steps={structuredSteps} />;
  if (!part.text.trim()) return null;
  return <pre className="font-sans whitespace-pre-wrap">{part.text}</pre>;
}
