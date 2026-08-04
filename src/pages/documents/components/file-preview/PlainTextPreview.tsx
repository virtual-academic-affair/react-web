import { useEffect, useState } from "react";

export default function PlainTextPreview({
  url,
  flush = false,
}: {
  url: string;
  flush?: boolean;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchText = async () => {
      try {
        setLoading(true);
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch text");
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
    <div
      className={`h-full overflow-auto bg-gray-800/50 ${flush ? "py-3" : "p-8"}`}
    >
      <pre
        className={
          flush
            ? "mx-auto block min-h-full w-full max-w-[816px] bg-white px-3 py-2 font-mono text-[13px] leading-relaxed break-all whitespace-pre-wrap text-gray-800 dark:bg-navy-900 dark:text-white"
            : "mx-auto min-h-[80vh] max-w-[816px] rounded bg-white p-12 font-mono text-[13px] leading-relaxed break-all whitespace-pre-wrap text-gray-800 shadow-lg"
        }
      >
        {content}
      </pre>
    </div>
  );
}
