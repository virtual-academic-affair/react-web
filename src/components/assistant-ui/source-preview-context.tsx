/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

export type SourcePreviewData = {
  key: string;
  title?: string;
  fileName?: string;
  fileId?: string;
  pages?: string[];
  markdownUrl?: string;
  pdfUrl?: string;
};

export type SourceFilePreviewData = {
  fileId?: string;
  fileUrl?: string;
  fileName: string;
  initialPage?: number;
};

type SourcePreviewContextValue = {
  preview: SourcePreviewData | null;
  filePreview: SourceFilePreviewData | null;
  openPreview: (preview: SourcePreviewData) => void;
  openFilePreview: (preview: SourceFilePreviewData) => void;
  closePreview: () => void;
  closeFilePreview: () => void;
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
  const [filePreview, setFilePreview] = useState<SourceFilePreviewData | null>(
    null,
  );

  useEffect(() => {
    onOpenChange?.(!!preview);
  }, [onOpenChange, preview]);

  const openPreview = useCallback((nextPreview: SourcePreviewData) => {
    setFilePreview(null);
    setPreview(nextPreview);
  }, []);

  const openFilePreview = useCallback((nextPreview: SourceFilePreviewData) => {
    setFilePreview(nextPreview);
  }, []);

  const closePreview = useCallback(() => {
    setPreview(null);
  }, []);

  const closeFilePreview = useCallback(() => {
    setFilePreview(null);
  }, []);

  const value = useMemo(
    () => ({
      preview,
      filePreview,
      openPreview,
      openFilePreview,
      closePreview,
      closeFilePreview,
    }),
    [
      closeFilePreview,
      closePreview,
      filePreview,
      openFilePreview,
      openPreview,
      preview,
    ],
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

export function useSourcePreviewOptional() {
  return useContext(SourcePreviewContext);
}
