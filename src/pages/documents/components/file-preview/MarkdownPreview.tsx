import { useEffect, useState } from "react";
import { Streamdown } from "streamdown";

import {
  STREAMDOWN_CONTROLS,
  STREAMDOWN_LINK_SAFETY,
} from "@/components/markdown/streamdown-config";
import { useStreamdownMathPlugins } from "@/components/markdown/useStreamdownMathPlugins";

import "katex/dist/katex.min.css";
import "streamdown/styles.css";

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
          className={[
            "text-base leading-relaxed",
            "[&_a]:text-blue-600 [&_a]:underline",
            "[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:text-gray-600",
            "[&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5",
            "[&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold",
            "[&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold",
            "[&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold",
            "[&_li]:mb-1 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6",
            "[&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6",
            "[&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-gray-950 [&_pre]:p-4 [&_pre]:text-gray-100",
            "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
            "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-sm",
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
