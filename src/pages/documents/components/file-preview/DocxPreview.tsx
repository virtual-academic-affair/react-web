import * as docx from "docx-preview";
import { useEffect, useRef, useState } from "react";
import { MdErrorOutline } from "react-icons/md";

export default function DocxPreview({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDocx = async () => {
      try {
        if (!containerRef.current) return;
        setLoading(true);
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch docx file");
        const blob = await res.blob();

        await docx.renderAsync(blob, containerRef.current, undefined, {
          className: "docx-viewer-section",
          inWrapper: false,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
        });
      } catch (err) {
        console.error(err);
        setError("Không thể hiển thị tệp DOCX. Vui lòng tải xuống để xem.");
      } finally {
        setLoading(false);
      }
    };
    void renderDocx();
  }, [url]);

  return (
    <div className="flex-1 overflow-auto bg-gray-800/50 p-8">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-800/50">
          <div className="flex flex-col items-center justify-center gap-2 text-white/70">
            <div className="fpv-spinner" />
            <span>Đang tải DOCX...</span>
          </div>
        </div>
      )}

      {error ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
          <MdErrorOutline className="h-12 w-12" />
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <div className="flex min-h-full flex-col items-center justify-center">
          <div
            ref={containerRef}
            className="w-full max-w-[816px] overflow-hidden rounded bg-white shadow-lg [&>section]:m-0! [&>section]:bg-transparent! [&>section]:p-12! [&>section]:shadow-none!"
          />
        </div>
      )}
    </div>
  );
}
