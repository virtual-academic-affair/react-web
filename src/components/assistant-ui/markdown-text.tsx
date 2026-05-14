import { StreamdownTextPrimitive } from "@assistant-ui/react-streamdown";

export const STREAMDOWN_CONTROLS = { table: false as const };

/** Tắt hộp thoại “Open external link?” của Streamdown. */
export const STREAMDOWN_LINK_SAFETY = { enabled: false } as const;

export function MarkdownText() {
  return (
    <StreamdownTextPrimitive
      mode="streaming"
      controls={STREAMDOWN_CONTROLS}
      linkSafety={STREAMDOWN_LINK_SAFETY}
      className="text-[#1f1f1f] dark:text-[#e3e3e3]"
      containerClassName="min-w-0 text-base leading-relaxed"
    />
  );
}
