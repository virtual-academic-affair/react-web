import type { StreamdownTextComponents } from "@assistant-ui/react-streamdown";
import { StreamdownTextPrimitive } from "@assistant-ui/react-streamdown";
import {
  STREAMDOWN_CONTROLS,
  STREAMDOWN_LINK_SAFETY,
} from "@/components/markdown/streamdown-config";
import { useStreamdownMathPlugins } from "@/components/markdown/useStreamdownMathPlugins";

const MARKDOWN_COMPONENTS = {
  table: ({ children, ...props }) => (
    <div className="my-4 w-full overflow-x-auto">
      <table
        {...props}
        className="w-full min-w-max border-collapse text-left text-sm leading-6"
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead {...props} className="bg-white/[0.04]">
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }) => (
    <tr {...props} className="border-0">
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      {...props}
      className="border border-[#c8d3ef]/40 px-3 py-2 font-semibold text-[#202124] dark:border-white/20 dark:text-white"
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      {...props}
      className="border border-[#c8d3ef]/40 px-3 py-2 align-top text-[#1f1f1f] dark:border-white/20 dark:text-[#e3e3e3]"
    >
      {children}
    </td>
  ),
} satisfies StreamdownTextComponents;

export function MarkdownText() {
  const plugins = useStreamdownMathPlugins();

  return (
    <StreamdownTextPrimitive
      mode="streaming"
      controls={STREAMDOWN_CONTROLS}
      linkSafety={STREAMDOWN_LINK_SAFETY}
      plugins={plugins}
      components={MARKDOWN_COMPONENTS}
      className="text-[#1f1f1f] dark:text-[#e3e3e3]"
      containerClassName="min-w-0 text-base leading-relaxed"
    />
  );
}

export function MarkdownTextSm() {
  const plugins = useStreamdownMathPlugins();

  return (
    <StreamdownTextPrimitive
      mode="streaming"
      controls={STREAMDOWN_CONTROLS}
      linkSafety={STREAMDOWN_LINK_SAFETY}
      plugins={plugins}
      components={MARKDOWN_COMPONENTS}
      className="text-[#1f1f1f] dark:text-[#e3e3e3]"
      containerClassName="min-w-0 text-sm leading-relaxed"
    />
  );
}
