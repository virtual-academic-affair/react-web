/**
 * User Layout
 * Wraps all /user/* pages with TopNavbar and content area.
 */

import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { SourcePreviewProvider } from "@/components/assistant-ui/source-preview-context";
import { SourcePreviewCanvas } from "@/components/assistant-ui/sources";
import PageLoader from "@/components/loading/PageLoader";
import RouteNavigationOverlay from "@/components/loading/RouteNavigationOverlay";
import TopNavbar, { TOP_NAVBAR_PAGE_PADDING_CLASS } from "@/components/navbar/TopNavbar";
import { ChatbotLayoutProvider } from "@/pages/chatbot/chatbotLayoutContext";
import { MobileSidebarBackdrop } from "@/components/sidebar/components/MobileSidebarBackdrop";
import { useMobileBodyScrollLock } from "@/hooks/useMobileBodyScrollLock";
import { useRouteNavigationPending } from "@/hooks/useRouteNavigationPending";
import userRoutes from "@/userRoutes";

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
const FormsPage = lazy(() => import("@/pages/documents/forms"));
const UserDocumentsPage = lazy(() => import("@/pages/user/documents"));

const UserLayout = () => {
  const location = useLocation();
  const isUserChatbotRoute =
    location.pathname === "/user/chatbot" ||
    location.pathname.startsWith("/user/chatbot/");
  const [open, setOpen] = useState(() => window.innerWidth >= 1024);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const [collapsed, setCollapsed] = useState(false);
  const [sourcePreviewLocationKey, setSourcePreviewLocationKey] = useState<
    string | null
  >(null);
  const sourcePreviewOpen =
    isUserChatbotRoute && sourcePreviewLocationKey === location.key;
  const { navigationPending, startNavigation } = useRouteNavigationPending();

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (isUserChatbotRoute) {
        setOpen(desktop);
      }
      if (!desktop) {
        setCollapsed(false);
      } else if (sourcePreviewOpen) {
        setCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isUserChatbotRoute, sourcePreviewOpen]);

  const effectiveCollapsed = isDesktop && collapsed;

  const handleSourcePreviewOpenChange = useCallback(
    (isOpen: boolean) => {
      setSourcePreviewLocationKey(isOpen ? location.key : null);
      if (isOpen && window.innerWidth >= 1024) {
        setCollapsed(true);
      }
    },
    [location.key],
  );
  useMobileBodyScrollLock(isUserChatbotRoute && (open || sourcePreviewOpen));

  const mobileCanvasPosition = !isUserChatbotRoute
    ? ""
    : sourcePreviewOpen
      ? "-translate-x-[180vw]"
      : open
        ? "translate-x-0"
        : "-translate-x-[80vw]";

  const layoutContent = (
    <div
      className={`relative flex min-h-0 flex-1 overflow-hidden transition-transform duration-200 ease-in-out lg:translate-none ${
        isUserChatbotRoute
          ? `w-[280vw] lg:w-full ${mobileCanvasPosition}`
          : "w-full"
      }`}
    >
        {isUserChatbotRoute ? (
          <>
            <MobileSidebarBackdrop open={open} onClose={() => setOpen(false)} />
            <div className="flex h-full min-h-0 shrink-0 self-stretch lg:py-5 lg:pl-5">
              <Suspense fallback={<PageLoader />}>
                <ChatbotSidebar
                  open={open}
                  onClose={() => setOpen(false)}
                  collapsed={effectiveCollapsed}
                  onToggleCollapse={() => setCollapsed((current) => !current)}
                />
              </Suspense>
            </div>
          </>
        ) : null}

        <div
          className={`relative flex h-full min-h-0 w-screen min-w-0 shrink-0 flex-col lg:w-auto lg:flex-1 ${
            isUserChatbotRoute
              ? "overflow-hidden"
              : "overflow-x-hidden overflow-y-auto overscroll-y-contain"
          }`}
        >
          <div
            className={`transition-all duration-200 ${
              isUserChatbotRoute
                ? "flex min-h-0 w-full flex-1 overflow-hidden py-5"
                : `mx-auto mb-auto h-full min-h-0 w-full max-w-[1600px] px-4 pb-5 md:px-6 ${TOP_NAVBAR_PAGE_PADDING_CLASS}`
            }`}
          >
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/documents" element={<UserDocumentsPage />} />
                <Route path="/forms" element={<FormsPage isReadOnly />} />
                <Route path="/chatbot/*" element={<ChatbotPage />} />
                <Route
                  path="/"
                  element={<Navigate to="/user/documents" replace />}
                />
                <Route
                  path="*"
                  element={<Navigate to="/user/documents" replace />}
                />
              </Routes>
            </Suspense>
          </div>
        </div>

        {isUserChatbotRoute ? <SourcePreviewCanvas /> : null}
    </div>
  );

  return (
    <div className="bg-lightPrimary dark:bg-navy-900! flex h-dvh min-h-0 w-full flex-col">
      <RouteNavigationOverlay visible={navigationPending} />
      {!isUserChatbotRoute ? (
        <TopNavbar
          routes={userRoutes}
          homeHref="/user/documents"
          chatbotHref="/user/chatbot"
          onNavigateStart={startNavigation}
          includeChatbotLink
        />
      ) : null}
      {isUserChatbotRoute ? (
        <Suspense fallback={<PageLoader />}>
          <ChatbotRuntimeProvider>
            <ChatbotLayoutProvider
              onToggleSidebar={() => setOpen((current) => !current)}
            >
              <SourcePreviewProvider onOpenChange={handleSourcePreviewOpenChange}>
                {layoutContent}
              </SourcePreviewProvider>
            </ChatbotLayoutProvider>
          </ChatbotRuntimeProvider>
        </Suspense>
      ) : (
        layoutContent
      )}
    </div>
  );
};

export default UserLayout;
