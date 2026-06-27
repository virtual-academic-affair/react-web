import type { PluginConfig } from "streamdown";

import { STREAMDOWN_MATH_PLUGINS } from "./streamdown-math";

/** Math plugins must be available on first render so history messages parse LaTeX correctly. */
export function useStreamdownMathPlugins(): PluginConfig {
  return STREAMDOWN_MATH_PLUGINS;
}
