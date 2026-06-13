import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { useMemo } from "react";
import { MdBuild } from "react-icons/md";
import { Streamdown } from "streamdown";

import {
  STREAMDOWN_CONTROLS,
  STREAMDOWN_LINK_SAFETY,
} from "@/components/markdown/streamdown-config";
import { useStreamdownMathPlugins } from "@/components/markdown/useStreamdownMathPlugins";

function toolArgsToMarkdown(argsText: string): string {
  const t = argsText.trim();
  if (!t) return "_Trống_";
  try {
    JSON.parse(t);
    return `\`\`\`json\n${t}\n\`\`\``;
  } catch {
    if (
      t.startsWith("#") ||
      t.includes("**") ||
      t.includes("\n-") ||
      t.includes("\n|")
    ) {
      return t;
    }
    return `\`\`\`\n${t}\n\`\`\``;
  }
}

function toolResultToMarkdown(result: unknown): string {
  if (typeof result === "string") {
    const t = result.trim();
    if (!t) return "_Trống_";
    if (
      t.startsWith("#") ||
      t.includes("**") ||
      t.includes("\n-") ||
      t.includes("\n|")
    ) {
      return t;
    }
    try {
      JSON.parse(t);
      return `\`\`\`json\n${t}\n\`\`\``;
    } catch {
      return t;
    }
  }
  return `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
}

function ToolMarkdownBlock({
  label,
  markdown,
}: {
  label: string;
  markdown: string;
}) {
  const plugins = useStreamdownMathPlugins();

  return (
    <div className="mt-2">
      <p className="mb-1 text-xs font-medium tracking-wide text-[#444746] uppercase dark:text-[#c4c7c5]">
        {label}
      </p>
      <div className="max-h-56 overflow-auto rounded-lg border border-[#e3e3e3] bg-white/90 px-2 py-2 dark:border-[#3c4043] dark:bg-[#1e1f20]/80">
        <Streamdown
          mode="static"
          isAnimating={false}
          lineNumbers={false}
          controls={STREAMDOWN_CONTROLS}
          linkSafety={STREAMDOWN_LINK_SAFETY}
          plugins={plugins}
          className="text-sm text-[#1f1f1f] dark:text-[#e3e3e3]"
        >
          {markdown}
        </Streamdown>
      </div>
    </div>
  );
}

export function ToolFallback(part: ToolCallMessagePartProps) {
  const running = part.status?.type === "running";
  const argsMd = useMemo(
    () => (part.argsText ? toolArgsToMarkdown(part.argsText) : ""),
    [part.argsText],
  );
  const resultMd = useMemo(
    () =>
      part.result !== undefined ? toolResultToMarkdown(part.result) : "",
    [part.result],
  );

  return (
    <div className="mb-3 rounded-xl border border-[#dadce0] bg-[#fafafa] p-3 dark:border-[#3c4043] dark:bg-[#2d2f31]">
      <div className="flex flex-wrap items-center gap-2 text-base font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
        <MdBuild
          className="h-5 w-5 shrink-0 text-[#1a73e8] dark:text-[#a8c7fa]"
          aria-hidden
        />
        <span className="font-mono text-sm">{part.toolName}</span>
        <span className="rounded-full bg-[#e8f0fe] px-2 py-0.5 text-xs font-normal text-[#062e6f] dark:bg-[#1f3760]/50 dark:text-[#e3e3e3]">
          {running ? "Đang thực hiện" : "Đã xử lý"}
        </span>
      </div>
      {part.argsText ? (
        <ToolMarkdownBlock label="Tham số" markdown={argsMd} />
      ) : null}
      {part.result !== undefined ? (
        <ToolMarkdownBlock label="Kết quả" markdown={resultMd} />
      ) : null}
    </div>
  );
}
