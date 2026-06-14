import { useEffect, useRef, type MutableRefObject } from "react";
import { MdErrorOutline } from "react-icons/md";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewProps {
  url: string;
  initialPage?: number;
  scale: number;
  currentPage: number;
  numPages: number;
  setNumPages: (n: number) => void;
  setCurrentPage: (p: number) => void;
  pdfScrollRef: MutableRefObject<((page: number) => void) | undefined>;
}

export default function PdfPreview({
  url,
  initialPage = 1,
  scale,
  currentPage,
  numPages,
  setNumPages,
  setCurrentPage,
  pdfScrollRef,
}: PdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleScroll = () => {
    if (!containerRef.current || numPages === 0) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const middleY = scrollTop + clientHeight / 2;

    let closestPage = 1;
    let minDistance = Infinity;

    for (let i = 0; i < numPages; i++) {
      const el = pageRefs.current[i];
      if (!el) continue;
      const pageTop = el.offsetTop;
      const pageMiddle = pageTop + el.offsetHeight / 2;
      const distance = Math.abs(middleY - pageMiddle);

      if (distance < minDistance) {
        minDistance = distance;
        closestPage = i + 1;
      }
    }

    if (closestPage !== currentPage) {
      setCurrentPage(closestPage);
    }
  };

  useEffect(() => {
    pdfScrollRef.current = (page: number) => {
      const target = pageRefs.current[page - 1];
      if (containerRef.current && target) {
        containerRef.current.scrollTo({
          top: target.offsetTop - 32,
          behavior: "smooth",
        });
      }
    };
    return () => {
      pdfScrollRef.current = undefined;
    };
  }, [numPages, pdfScrollRef]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative flex flex-1 justify-center overflow-auto bg-gray-800/50 p-8"
      >
        <Document
          file={url}
          onLoadSuccess={({ numPages: n }) => {
            const safeInitialPage = Math.min(Math.max(initialPage, 1), n || 1);
            setNumPages(n);
            setCurrentPage(safeInitialPage);
            pageRefs.current = new Array(n).fill(null);

            window.setTimeout(() => {
              const container = containerRef.current;
              const target = pageRefs.current[safeInitialPage - 1];
              if (!container || !target) return;
              container.scrollTo({
                top: Math.max(target.offsetTop - 32, 0),
                behavior: "auto",
              });
            }, 0);
          }}
          loading={
            <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-2 py-20 text-white/70">
              <div className="fpv-spinner" />
              <span>Đang tải PDF...</span>
            </div>
          }
          error={
            <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3 py-20 text-gray-400">
              <MdErrorOutline className="h-12 w-12" />
              <p className="text-sm">Không thể hiển thị PDF.</p>
            </div>
          }
        >
          <div className="flex flex-col items-center gap-6">
            {Array.from(new Array(numPages), (_, index) => (
              <div
                key={`page_${index + 1}`}
                ref={(el) => {
                  pageRefs.current[index] = el;
                }}
              >
                <Page
                  pageNumber={index + 1}
                  scale={scale}
                  className="bg-white shadow-lg"
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            ))}
          </div>
        </Document>
      </div>
    </div>
  );
}
