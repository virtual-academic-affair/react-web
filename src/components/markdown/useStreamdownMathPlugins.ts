import { useEffect, useState } from "react";
import type { PluginConfig } from "streamdown";

export function useStreamdownMathPlugins() {
  const [plugins, setPlugins] = useState<PluginConfig>();

  useEffect(() => {
    let mounted = true;

    import("./streamdown-math").then((module) => {
      if (mounted) {
        setPlugins(module.STREAMDOWN_MATH_PLUGINS);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return plugins;
}
