import { createMathPlugin } from "@streamdown/math";

export const STREAMDOWN_MATH_PLUGINS = {
  math: createMathPlugin({
    singleDollarTextMath: true,
    errorColor: "var(--color-red-600, #dc2626)",
  }),
} as const;
