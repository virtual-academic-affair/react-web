import type { ReasoningMessagePartProps } from "@assistant-ui/react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

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
  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  const ghostRoot =
    variant === "ghost"
      ? "rounded-lg border border-dashed border-[#dadce0]/90 bg-transparent dark:border-[#5f6368]/45"
      : "";

  return (
    <ReasoningVariantContext.Provider value={variant}>
      <details
        className={ghostRoot}
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
        className="cursor-pointer list-none rounded-md px-2 py-1.5 marker:content-none [&::-webkit-details-marker]:hidden"
      >
        <span className="block w-full truncate text-xs font-normal text-[#80868b] dark:text-[#9aa0a6]">
          Suy luận
        </span>
      </summary>
    );
  }
  return (
    <summary
      data-active={active || undefined}
      className="cursor-pointer list-none py-1 marker:content-none [&::-webkit-details-marker]:hidden"
    >
      <span className="text-sm">Suy luận</span>
    </summary>
  );
}

export function ReasoningContent(props: ComponentProps<"div">) {
  const variant = useContext(ReasoningVariantContext);
  const { className, children, ...rest } = props;
  const ghost =
    variant === "ghost"
      ? "border-t border-dashed border-[#dadce0]/70 px-2 pt-2 pb-2 dark:border-[#5f6368]/40"
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
