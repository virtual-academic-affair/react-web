import { lazy, Suspense } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

import {
  clearViewDocumentParams,
  parseViewDocumentFromSearchParams,
} from "@/utils/documentViewUrl";

const FilePreviewModal = lazy(
  () => import("@/pages/documents/components/FilePreviewModal"),
);

const LOCAL_VIEW_DOCUMENT_PATHS = new Set([
  "/user/chatbot/documents",
  "/admin/documents/list",
]);

export function ViewDocumentUrlModal() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { viewDocumentId, isMarkdownView } =
    parseViewDocumentFromSearchParams(searchParams);

  if (!viewDocumentId || LOCAL_VIEW_DOCUMENT_PATHS.has(location.pathname)) {
    return null;
  }

  const handleClose = () => {
    const next = new URLSearchParams(searchParams);
    clearViewDocumentParams(next);
    setSearchParams(next, { replace: true });
  };

  return (
    <Suspense fallback={null}>
      <FilePreviewModal
        fileId={viewDocumentId}
        fileName=""
        downloadFormat={isMarkdownView ? "markdown" : "original"}
        isOpen
        onClose={handleClose}
      />
    </Suspense>
  );
}
