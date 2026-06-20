/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
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
}: PropsWithChildren<{
  onOpenChange?: (open: boolean) => void;
}>) {
  const [preview, setPreview] = useState<SourcePreviewData | null>(null);

  const openPreview = useCallback(
    (nextPreview: SourcePreviewData) => {
      setPreview(nextPreview);
      onOpenChange?.(true);
    },
    [onOpenChange],
  );

  const closePreview = useCallback(() => {
    setPreview(null);
    onOpenChange?.(false);
  }, [onOpenChange]);

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
