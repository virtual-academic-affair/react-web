import type { ReasoningMessagePartProps } from "@assistant-ui/react";
import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";

type ReasoningVariant = "ghost" | "default";

const ReasoningVariantContext = createContext<ReasoningVariant>("default");

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
  const ghost =
    variant === "ghost"
      ? "mt-2 rounded-xl border border-dashed border-[#dadce0]/70 px-3 py-3 dark:border-[#5f6368]/40"
      : "";
  return (
    <div className={[ghost, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
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
  if (!part.text.trim()) return null;
  return (
    <pre className="font-sans whitespace-pre-wrap">{part.text}</pre>
  );
}
