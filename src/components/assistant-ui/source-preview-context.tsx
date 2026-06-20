/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

export type SourcePreviewData = {
  key: string;
  title?: string;
  fileName?: string;
  pageLabel: string;
  pages?: string[];
  markdownUrl?: string;
  pdfUrl?: string;
};

type SourcePreviewContextValue = {
  preview: SourcePreviewData | null;
  openPreview: (preview: SourcePreviewData) => void;
  closePreview: () => void;
};

const SourcePreviewContext = createContext<SourcePreviewContextValue | null>(
  null,
);

export function SourcePreviewProvider({
  children,
  onOpenChange,
  desktopOpenDelayMs = 220,
}: PropsWithChildren<{
  onOpenChange?: (open: boolean) => void;
  desktopOpenDelayMs?: number;
}>) {
  const [preview, setPreview] = useState<SourcePreviewData | null>(null);
  const previewRef = useRef<SourcePreviewData | null>(null);
  const openTimerRef = useRef<number | null>(null);

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current === null) return;
    window.clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
  }, []);

  const openPreview = useCallback(
    (nextPreview: SourcePreviewData) => {
      clearOpenTimer();

      if (previewRef.current || window.innerWidth < 1024) {
        previewRef.current = nextPreview;
        setPreview(nextPreview);
        onOpenChange?.(true);
        return;
      }

      onOpenChange?.(true);
      openTimerRef.current = window.setTimeout(() => {
        previewRef.current = nextPreview;
        setPreview(nextPreview);
        openTimerRef.current = null;
      }, desktopOpenDelayMs);
    },
    [clearOpenTimer, desktopOpenDelayMs, onOpenChange],
  );

  const closePreview = useCallback(() => {
    clearOpenTimer();
    previewRef.current = null;
    setPreview(null);
    onOpenChange?.(false);
  }, [clearOpenTimer, onOpenChange]);

  useEffect(() => clearOpenTimer, [clearOpenTimer]);

  const value = useMemo(
    () => ({ preview, openPreview, closePreview }),
    [closePreview, openPreview, preview],
  );

  return (
    <SourcePreviewContext.Provider value={value}>
      {children}
    </SourcePreviewContext.Provider>
  );
}

export function useSourcePreview() {
  const context = useContext(SourcePreviewContext);
  if (!context) {
    throw new Error(
      "useSourcePreview must be used within SourcePreviewProvider",
    );
  }
  return context;
}
