import PageLoader from "@/components/loading/PageLoader";
import { lazy, Suspense, useEffect } from "react";

import { useSourcePreview } from "@/components/assistant-ui/source-preview-context";
import type { ChatbotInfoPanelType } from "../chatbotLayoutContext";

const UserDocumentsPage = lazy(() => import("@/pages/user/documents"));
const FormsPage = lazy(() => import("@/pages/documents/forms"));

function ChatbotInfoContent({ type }: { type: ChatbotInfoPanelType }) {
  if (type === "documents") {
    return <UserDocumentsPage embedded />;
  }

  return <FormsPage embedded isReadOnly />;
}

export function ChatbotInfoView({ type }: { type: ChatbotInfoPanelType }) {
  const { closePreview } = useSourcePreview();

  useEffect(() => {
    closePreview();
  }, [closePreview, type]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="mx-auto min-h-0 w-full max-w-[1600px] flex-1 overflow-y-auto overscroll-contain px-4 pt-14 pb-5 sm:px-6 lg:pt-5">
        <Suspense fallback={<PageLoader />}>
          <ChatbotInfoContent type={type} />
        </Suspense>
      </div>
    </div>
  );
}
