import { type ComponentPropsWithoutRef, useEffect, useState } from "react";
import { Streamdown } from "streamdown";

import {
  STREAMDOWN_CONTROLS,
  STREAMDOWN_LINK_SAFETY,
} from "@/components/markdown/streamdown-config";
import {
  mergeStreamdownComponents,
  STREAMDOWN_LIST_PROSE_CLASS,
} from "@/components/markdown/streamdown-prose";
import { useStreamdownMathPlugins } from "@/components/markdown/useStreamdownMathPlugins";

import "katex/dist/katex.min.css";
import "streamdown/styles.css";

const MARKDOWN_PREVIEW_COMPONENTS = mergeStreamdownComponents({
  table: ({
    children,
    className,
    ...props
  }: ComponentPropsWithoutRef<"table">) => (
    <div className="my-4 w-full overflow-x-auto">
      <table
        {...props}
        className={[
          "w-full min-w-max border-collapse text-left text-sm",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </table>
    </div>
  ),
});

export default function MarkdownPreview({ url }: { url: string }) {
  const plugins = useStreamdownMathPlugins();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchText = async () => {
      try {
        setLoading(true);
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch markdown");
        setContent(await res.text());
      } catch {
        setContent("Không thể đọc nội dung tệp.");
      } finally {
        setLoading(false);
      }
    };
    void fetchText();
  }, [url]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="fpv-spinner" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-800/50 p-8">
      <article className="mx-auto min-h-[80vh] max-w-[816px] rounded bg-white p-12 text-gray-800 shadow-lg">
        <Streamdown
          mode="static"
          isAnimating={false}
          lineNumbers={false}
          controls={STREAMDOWN_CONTROLS}
          linkSafety={STREAMDOWN_LINK_SAFETY}
          plugins={plugins}
          components={MARKDOWN_PREVIEW_COMPONENTS}
          className={[
            "text-base leading-relaxed",
            STREAMDOWN_LIST_PROSE_CLASS,
            "[&_a]:text-blue-600 [&_a]:underline",
            "[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:text-gray-600",
            "[&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5",
            "[&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold",
            "[&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold",
            "[&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold",
            "[&_p]:mb-3",
            "[&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-gray-950 [&_pre]:p-4 [&_pre]:text-gray-100",
            "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
            "[&_tbody_tr:nth-child(even)]:bg-gray-50",
            "[&_td]:border [&_td]:border-gray-300 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top",
            "[&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold",
          ].join(" ")}
        >
          {content}
        </Streamdown>
      </article>
    </div>
  );
}
