import { useEffect, useState } from "react";

export default function PlainTextPreview({ url }: { url: string }) {
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
    <div className="h-full overflow-auto bg-gray-800/50 p-8">
      <pre className="mx-auto min-h-[80vh] max-w-[816px] rounded bg-white p-12 font-mono text-[13px] leading-relaxed break-all whitespace-pre-wrap text-gray-800 shadow-lg">
        {content}
      </pre>
    </div>
  );
}
