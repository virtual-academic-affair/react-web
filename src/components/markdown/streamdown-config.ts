import { createMathPlugin } from "@streamdown/math";

export const STREAMDOWN_CONTROLS = { table: false as const };

/** Tắt hộp thoại “Open external link?” của Streamdown. */
export const STREAMDOWN_LINK_SAFETY = { enabled: false } as const;

export const STREAMDOWN_PLUGINS = {
  math: createMathPlugin({
    singleDollarTextMath: true,
    errorColor: "var(--color-red-600, #dc2626)",
  }),
} as const;
