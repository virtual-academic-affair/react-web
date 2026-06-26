import type { ReasoningMessagePartProps } from "@assistant-ui/react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { MdCheck, MdKeyboardArrowRight } from "react-icons/md";
import { Streamdown } from "streamdown";

import {
  STREAMDOWN_CONTROLS,
  STREAMDOWN_LINK_SAFETY,
} from "@/components/markdown/streamdown-config";
import {
  mergeStreamdownComponents,
  STREAMDOWN_LIST_PROSE_CLASS,
} from "@/components/markdown/streamdown-prose";
import { ScrollFadeArea } from "@/components/scroll-fade/ScrollFadeArea";
import { useStreamdownMathPlugins } from "@/components/markdown/useStreamdownMathPlugins";

type ReasoningVariant = "ghost" | "default";
type StructuredReasoningStep = {
  id: string;
  type: string;
  content: string;
};

const ReasoningVariantContext = createContext<ReasoningVariant>("default");
const ReasoningBusyContext = createContext(false);
const ReasoningDisclosureContext = createContext<{
  open: boolean;
  toggle: () => void;
} | null>(null);
const STRUCTURED_REASONING_PREFIX = "__CHATBOT_REASONING_STEPS__";

function useReasoningDisclosure() {
  const context = useContext(ReasoningDisclosureContext);
  if (!context) {
    throw new Error(
      "ReasoningTrigger and ReasoningContent must be used inside ReasoningRoot",
    );
  }
  return context;
}

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

function ReasoningMarkdown({ text }: { text: string }) {
  const plugins = useStreamdownMathPlugins();

  return (
    <Streamdown
      mode="streaming"
      controls={STREAMDOWN_CONTROLS}
      linkSafety={STREAMDOWN_LINK_SAFETY}
      plugins={plugins}
      components={mergeStreamdownComponents()}
      className={`text-xs leading-relaxed text-[#3c4043] italic dark:text-[#d9e2ff] ${STREAMDOWN_LIST_PROSE_CLASS}`}
    >
      {text}
    </Streamdown>
  );
}

function StepIcon({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative flex h-[22px] w-[22px] shrink-0 items-center justify-center">
      {/* Completed State */}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-full bg-[#1a73e8] text-white transition-all duration-200 dark:bg-[#4285f4] ${
          isActive ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <MdCheck className="h-3 w-3" />
      </div>

      {/* Active State */}
      <div
        className={`absolute inset-0 transition-all duration-200 ${
          isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
      >
        <div
          className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-[#1a73e8] dark:border-[#6dabf7]"
          style={{ animation: "spin 3s linear infinite" }}
        />
        <div className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1a73e8] dark:bg-[#6dabf7]" />
      </div>
    </div>
  );
}

function StepConnector({ dashed }: { dashed?: boolean }) {
  return (
    <div
      className={
        "my-1 w-px flex-1 border-l border-[#d3e3fd] dark:border-[#3d4f76] " +
        (dashed ? "border-dashed" : "border-solid")
      }
    />
  );
}

function StructuredReasoningStep({
  step,
  isLast,
  isActive,
  isNextActive,
}: {
  step: StructuredReasoningStep;
  isLast: boolean;
  isActive: boolean;
  isNextActive: boolean;
}) {
  return (
    <div className="chat-message-enter flex gap-2.5">
      <div className="flex flex-col items-center">
        <StepIcon isActive={isActive} />
        {!isLast && <StepConnector dashed={isNextActive} />}
      </div>
      <div className="min-w-0 flex-1 pb-5">
        <ReasoningMarkdown text={step.content} />
        {isActive && (
          <span className="ml-1 inline-flex align-middle text-[#1a73e8] dark:text-[#6dabf7]">
            <ThinkingDots />
          </span>
        )}
      </div>
    </div>
  );
}

function StructuredReasoning({ steps }: { steps: StructuredReasoningStep[] }) {
  const busy = useContext(ReasoningBusyContext);

  return (
    <div className="italic">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isActive = busy && isLast;
        const isNextActive = busy && index === steps.length - 2;

        return (
          <StructuredReasoningStep
            key={step.id}
            step={step}
            isLast={isLast}
            isActive={isActive}
            isNextActive={isNextActive}
          />
        );
      })}
    </div>
  );
}

export type ReasoningRootProps = {
  children?: ReactNode;
  defaultOpen?: boolean;
  resetKey?: string;
  variant?: ReasoningVariant;
};

export function ReasoningRoot({
  children,
  defaultOpen = false,
  resetKey,
  variant = "default",
}: ReasoningRootProps) {
  return (
    <ReasoningRootInner
      key={`${resetKey ?? "static"}:${defaultOpen ? "open" : "closed"}`}
      defaultOpen={defaultOpen}
      variant={variant}
    >
      {children}
    </ReasoningRootInner>
  );
}

function ReasoningRootInner({
  children,
  defaultOpen,
  variant,
}: {
  children?: ReactNode;
  defaultOpen: boolean;
  variant: ReasoningVariant;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const ghostRoot = variant === "ghost" ? "bg-transparent" : "";

  return (
    <ReasoningVariantContext.Provider value={variant}>
      <ReasoningDisclosureContext.Provider
        value={{ open, toggle: () => setOpen((current) => !current) }}
      >
        <div className={ghostRoot}>{children}</div>
      </ReasoningDisclosureContext.Provider>
    </ReasoningVariantContext.Provider>
  );
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export type ReasoningTriggerProps = {
  active?: boolean;
  processingTimeMs?: number;
};

export function ReasoningTrigger({
  active,
  processingTimeMs,
}: ReasoningTriggerProps) {
  const variant = useContext(ReasoningVariantContext);
  const { open, toggle } = useReasoningDisclosure();
  const startTimeRef = useRef<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!active) {
      startTimeRef.current = null;
      return;
    }

    startTimeRef.current = Date.now();
    const timerId = window.setInterval(() => {
      const startTime = startTimeRef.current;
      if (startTime) {
        setElapsedMs(Date.now() - startTime);
      }
    }, 100);

    return () => window.clearInterval(timerId);
  }, [active]);

  const displayTimeMs = active ? elapsedMs : processingTimeMs;
  // @ts-ignore
  const durationText =
    typeof displayTimeMs === "number" && Number.isFinite(displayTimeMs)
      ? `${formatDuration(displayTimeMs)}`
      : "";
  if (variant === "ghost") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        data-active={active ? true : undefined}
        className="group/reasoning-trigger inline-flex cursor-pointer items-center gap-1.5 py-1 text-[#80868b] transition-colors hover:text-[#1a73e8] data-[active=true]:text-[#1a73e8] dark:text-[#9aa0a6] dark:hover:text-[#a8c7fa] dark:data-[active=true]:text-[#a8c7fa]"
        aria-label="Bật tắt suy nghĩ"
      >
        <span
          className={`inline-flex items-baseline gap-1.5 ${
            active ? "reasoning-status-shimmer" : ""
          }`}
        >
          <span className="text-xs font-medium">Suy nghĩ</span>
          {/* {durationText ? (
            <span
              className={`text-xs ${
                active
                  ? ""
                  : "text-[#9aa0a6] transition-colors group-hover/reasoning-trigger:text-[#1a73e8] dark:text-[#8f98aa] dark:group-hover/reasoning-trigger:text-[#a8c7fa]"
              }`}
            >
              {durationText}
            </span>
          ) : null} */}
        </span>
        <MdKeyboardArrowRight
          className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? "rotate-90" : "rotate-0"
          }`}
          aria-hidden
        />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      data-active={active || undefined}
      className="group/reasoning-trigger inline-flex cursor-pointer items-center gap-1.5 py-1 text-[#5f6368] transition-colors hover:text-[#1a73e8] data-[active=true]:text-[#1a73e8] dark:text-[#c4c7c5] dark:hover:text-[#a8c7fa] dark:data-[active=true]:text-[#a8c7fa]"
      aria-label="Bật tắt suy nghĩ"
    >
      <span
        className={`inline-flex items-baseline gap-1.5 ${
          active ? "reasoning-status-shimmer" : ""
        }`}
      >
        <span className="text-sm font-medium">Suy nghĩ</span>
        {/* {durationText ? (
          <span
            className={`text-xs ${
              active
                ? ""
                : "text-[#80868b] transition-colors group-hover/reasoning-trigger:text-[#1a73e8] dark:text-[#9aa0a6] dark:group-hover/reasoning-trigger:text-[#a8c7fa]"
            }`}
          >
            {durationText}
          </span>
        ) : null} */}
      </span>
      <MdKeyboardArrowRight
        className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "rotate-90" : "rotate-0"
        }`}
        aria-hidden
      />
    </button>
  );
}

export function ReasoningContent(props: ComponentProps<"div">) {
  const variant = useContext(ReasoningVariantContext);
  const { open } = useReasoningDisclosure();
  const { className, children, style, ...rest } = props;
  const busy = props["aria-busy"] === true || props["aria-busy"] === "true";
  const ghostScrollClass =
    variant === "ghost"
      ? "ml-1 mt-2 min-h-0 max-h-60 overflow-x-hidden overflow-y-auto overscroll-contain pr-2 italic [scrollbar-width:thin] sm:pr-3"
      : "";

  if (variant === "ghost") {
    return (
      <ReasoningBusyContext.Provider value={busy}>
        <div
          className={`grid min-h-0 transition-[grid-template-rows,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open
              ? "mb-5 grid-rows-[1fr] opacity-100"
              : "pointer-events-none mb-0 grid-rows-[0fr] opacity-0"
          }`}
          aria-hidden={!open}
          {...rest}
        >
          <ScrollFadeArea
            wrapperClassName="min-h-0 overflow-hidden"
            className={[ghostScrollClass, className].filter(Boolean).join(" ")}
            style={style}
            thresholdPx={4}
            watchDeps={[open, busy, children]}
          >
            {children}
          </ScrollFadeArea>
        </div>
      </ReasoningBusyContext.Provider>
    );
  }

  return (
    <ReasoningBusyContext.Provider value={busy}>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
        style={style}
        aria-hidden={!open}
        {...rest}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={[
              className,
              "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              open ? "translate-y-0" : "-translate-y-2",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {children}
          </div>
        </div>
      </div>
    </ReasoningBusyContext.Provider>
  );
}

export function ReasoningText({ children }: { children: ReactNode }) {
  const variant = useContext(ReasoningVariantContext);
  if (variant === "ghost") {
    return (
      <div className="space-y-2 text-xs leading-relaxed text-[#80868b] italic dark:text-[#9aa0a6]">
        {children}
      </div>
    );
  }
  return <div className="space-y-2 text-sm italic">{children}</div>;
}

export function Reasoning(part: ReasoningMessagePartProps) {
  const structuredSteps = useMemo(
    () => parseStructuredReasoning(part.text),
    [part.text],
  );

  if (structuredSteps) return <StructuredReasoning steps={structuredSteps} />;
  if (!part.text.trim()) return null;
  return <ReasoningMarkdown text={part.text} />;
}
