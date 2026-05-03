import { message } from "antd";
import type { KeyboardEvent, MouseEvent } from "react";
import { copyTextToClipboard } from "./copyTextToClipboard";

/** Không dùng viền/hộp — chỉ gạch chân khi hover để gợi ý có thể bấm copy. */
const variantClass: Record<"field" | "chip" | "plain", string> = {
  plain:
    "cursor-pointer select-none text-left text-navy-800 underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current dark:text-gray-100",
  field:
    "cursor-pointer select-none text-left text-sm font-medium text-navy-900 underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current dark:text-white",
  chip: "cursor-pointer select-none text-left text-xs font-semibold uppercase tracking-wide text-navy-800 underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current dark:text-gray-100",
};

const focusRing =
  "rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/35";

export interface CopyableTextProps {
  text: string;
  variant?: keyof typeof variantClass;
  className?: string;
  tooltip?: string;
  emptyLabel?: string;
  stopPropagation?: boolean;
}

export function CopyableText({
  text,
  variant = "plain",
  className = "",
  tooltip = "Sao chép",
  emptyLabel = "—",
  stopPropagation = false,
}: CopyableTextProps) {
  const trimmed = text.trim();
  const canCopy = !!trimmed;
  const display = trimmed || emptyLabel;

  const wantsFullWidth = /\bw-full\b/.test(className);
  const wantsTruncate = /\btruncate\b/.test(className);
  const tooltipWrapperClass = wantsFullWidth
    ? "block w-full min-w-0"
    : wantsTruncate
      ? "min-w-0 max-w-full flex-1 overflow-hidden"
      : "inline max-w-full min-w-0 align-baseline";

  const copy = async () => {
    if (!canCopy) return;
    const ok = await copyTextToClipboard(trimmed);
    if (ok) {
      void message.success({ content: "Đã sao chép", duration: 1.2 });
    } else {
      void message.error("Không sao chép được");
    }
  };

  const onClick = (e: MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    void copy();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (stopPropagation) e.stopPropagation();
      void copy();
    }
  };

  if (!canCopy) {
    return (
      <span
        className={`text-navy-600 dark:text-gray-400 ${className}`.trim()}
        title={tooltip}
      >
        {display}
      </span>
    );
  }

  const layout = wantsFullWidth
    ? "block w-full break-words"
    : wantsTruncate
      ? ""
      : "break-words";
  const merged =
    `${variantClass[variant]} ${focusRing} ${layout} ${className}`.trim();

  return (
    <span className={tooltipWrapperClass}>
      <span
        className={merged}
        title={tooltip}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        {display}
      </span>
    </span>
  );
}
