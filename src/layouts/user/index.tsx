/**
 * User Layout
 * User-facing app is chatbot-only; legacy /documents and /forms redirect into chatbot panels.
 */

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { SourcePreviewProvider } from "@/components/assistant-ui/source-preview-context";
import { SourcePreviewCanvas } from "@/components/assistant-ui/sources";
import { ViewDocumentUrlModal } from "@/components/documents/ViewDocumentUrlModal";
import PageLoader from "@/components/loading/PageLoader";
import { useMobileBodyScrollLock } from "@/hooks/useMobileBodyScrollLock";
import { ChatbotMobileLayoutShell } from "@/layouts/chatbotMobileLayout";
import { ChatbotLayoutProvider } from "@/pages/chatbot/chatbotLayoutContext";
import { viewDocumentLocationSearch } from "@/utils/documentViewUrl";

const ChatbotPage = lazy(() => import("@/pages/chatbot"));
const ChatbotRuntimeProvider = lazy(() =>
  import("@/pages/chatbot/ChatbotRuntimeProvider").then((module) => ({
    default: module.ChatbotRuntimeProvider,
  })),
);
const ChatbotSidebar = lazy(() =>
  import("@/components/sidebar/ChatbotSidebar").then((module) => ({
    default: module.ChatbotSidebar,
  })),
);

const SOURCE_PREVIEW_SIDEBAR_DELAY_MS = 300;
const SOURCE_PREVIEW_MOBILE_DRAWER_DELAY_MS = 200;

const UserLayout = () => {
  const location = useLocation();
  const [open, setOpen] = useState(() => window.innerWidth >= 1024);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const [collapsed, setCollapsed] = useState(false);
  const sidebarStateBeforePreviewRef = useRef<{
    open: boolean;
    collapsed: boolean;
  } | null>(null);
  const openRef = useRef(open);
  const collapsedRef = useRef(collapsed);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    collapsedRef.current = collapsed;
  }, [collapsed]);

  const [sourcePreviewLocationKey, setSourcePreviewLocationKey] = useState<
    string | null
  >(null);
  const rightPanelOpen = sourcePreviewLocationKey === location.key;

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      setOpen(desktop);
      if (!desktop) {
        setCollapsed(false);
      } else if (rightPanelOpen) {
        setCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [rightPanelOpen]);

  useEffect(() => {
    if (window.innerWidth >= 1024) return;
    setOpen(false);
  }, [location.pathname]);

  const effectiveCollapsed = isDesktop && collapsed;

  const handleSourcePreviewBeforeOpen = useCallback(() => {
    const isDesktopViewport = window.innerWidth >= 1024;

    if (!sidebarStateBeforePreviewRef.current) {
      sidebarStateBeforePreviewRef.current = {
        open: openRef.current,
        collapsed: collapsedRef.current,
      };
    }

    if (isDesktopViewport) {
      if (!collapsedRef.current) {
        setCollapsed(true);
        return SOURCE_PREVIEW_SIDEBAR_DELAY_MS;
      }
      return 0;
    }

    if (openRef.current) {
      setOpen(false);
      return SOURCE_PREVIEW_MOBILE_DRAWER_DELAY_MS;
    }

    return 0;
  }, []);

  const handleSourcePreviewOpenChange = useCallback(
    (isOpen: boolean) => {
      setSourcePreviewLocationKey(isOpen ? location.key : null);
      if (isOpen) {
        if (!sidebarStateBeforePreviewRef.current) {
          sidebarStateBeforePreviewRef.current = {
            open: openRef.current,
            collapsed: collapsedRef.current,
          };
        }
        return;
      }

      const isDesktopViewport = window.innerWidth >= 1024;
      const saved = sidebarStateBeforePreviewRef.current;
      sidebarStateBeforePreviewRef.current = null;
      if (!saved) return;

      if (isDesktopViewport) {
        setCollapsed(saved.collapsed);
      } else if (saved.open) {
        setOpen(true);
      }
    },
    [location.key],
  );

  useMobileBodyScrollLock(open || rightPanelOpen);

  const viewDocSearch = viewDocumentLocationSearch(location.search);
  const userChatbotHome = viewDocSearch
    ? `/user/chatbot/documents${viewDocSearch}`
    : "/user/chatbot";

  const userRoutesContent = (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/chatbot/*" element={<ChatbotPage />} />
        <Route
          path="/documents"
          element={
            <Navigate to={`/user/chatbot/documents${viewDocSearch}`} replace />
          }
        />
        <Route
          path="/forms"
          element={
            <Navigate to={`/user/chatbot/forms${viewDocSearch}`} replace />
          }
        />
        <Route path="/" element={<Navigate to={userChatbotHome} replace />} />
        <Route path="*" element={<Navigate to="/user/chatbot" replace />} />
      </Routes>
    </Suspense>
  );

  return (
    <div className="bg-lightPrimary dark:bg-navy-900! flex h-dvh min-h-0 w-full flex-col">
      <ViewDocumentUrlModal />
      <Suspense fallback={<PageLoader />}>
        <ChatbotRuntimeProvider>
          <ChatbotLayoutProvider
            infoPanelAudience="user"
            sidebarOpen={open}
            sidebarCollapsed={effectiveCollapsed}
            onToggleSidebar={() => setOpen((current) => !current)}
            onCloseSidebar={() => setOpen(false)}
          >
            <SourcePreviewProvider
              onBeforeOpen={handleSourcePreviewBeforeOpen}
              onOpenChange={handleSourcePreviewOpenChange}
            >
              <ChatbotMobileLayoutShell
                sidebarOpen={open}
                onCloseSidebar={() => setOpen(false)}
                previewOpen={rightPanelOpen}
                sidebar={
                  <div
                    className={`flex h-full min-h-0 w-full shrink-0 self-stretch bg-transparent lg:w-auto lg:py-5 ${
                      effectiveCollapsed ? "lg:pl-0" : "lg:pl-5"
                    }`}
                  >
                    <Suspense fallback={<PageLoader />}>
                      <ChatbotSidebar
                        open={open}
                        onClose={() => setOpen(false)}
                        collapsed={effectiveCollapsed}
                        onToggleCollapse={() =>
                          setCollapsed((current) => !current)
                        }
                      />
                    </Suspense>
                  </div>
                }
                preview={<SourcePreviewCanvas />}
              >
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden py-5">
                  {userRoutesContent}
                </div>
              </ChatbotMobileLayoutShell>
            </SourcePreviewProvider>
          </ChatbotLayoutProvider>
        </ChatbotRuntimeProvider>
      </Suspense>
    </div>
  );
};

export default UserLayout;
