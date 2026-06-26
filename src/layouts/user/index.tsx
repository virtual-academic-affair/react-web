/**
 * User Layout
 * Wraps all /user/* pages with TopNavbar and content area.
 */

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { SourcePreviewProvider } from "@/components/assistant-ui/source-preview-context";
import { SourcePreviewCanvas } from "@/components/assistant-ui/sources";
import { ViewDocumentUrlModal } from "@/components/documents/ViewDocumentUrlModal";
import PageLoader from "@/components/loading/PageLoader";
import RouteNavigationOverlay from "@/components/loading/RouteNavigationOverlay";
import TopNavbar, {
  TOP_NAVBAR_PAGE_PADDING_CLASS,
} from "@/components/navbar/TopNavbar";
import { useMobileBodyScrollLock } from "@/hooks/useMobileBodyScrollLock";
import { useRouteNavigationPending } from "@/hooks/useRouteNavigationPending";
import { ChatbotMobileLayoutShell } from "@/layouts/chatbotMobileLayout";
import { DashboardMobileLayout } from "@/layouts/appMobileLayout";
import { DashboardMobileSidebar } from "@/components/sidebar/DashboardMobileSidebar";
import { ChatbotLayoutProvider } from "@/pages/chatbot/chatbotLayoutContext";
import userRoutes from "@/userRoutes";
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
const FormsPage = lazy(() => import("@/pages/documents/forms"));
const UserDocumentsPage = lazy(() => import("@/pages/user/documents"));

const UserLayout = () => {
  const location = useLocation();
  const isUserChatbotRoute =
    location.pathname === "/user/chatbot" ||
    location.pathname.startsWith("/user/chatbot/");
  const [open, setOpen] = useState(() => window.innerWidth >= 1024);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const sourcePreviewOpen =
    isUserChatbotRoute && sourcePreviewLocationKey === location.key;
  const rightPanelOpen = sourcePreviewOpen;
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
      } else if (rightPanelOpen) {
        setCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isUserChatbotRoute, rightPanelOpen]);

  useEffect(() => {
    if (!isUserChatbotRoute || window.innerWidth >= 1024) return;
    setOpen(false);
  }, [location.pathname, isUserChatbotRoute]);

  const effectiveCollapsed = isDesktop && collapsed;

  const handleSourcePreviewOpenChange = useCallback(
    (isOpen: boolean) => {
      setSourcePreviewLocationKey(isOpen ? location.key : null);
      const isDesktopViewport = window.innerWidth >= 1024;

      if (isOpen) {
        sidebarStateBeforePreviewRef.current = {
          open: openRef.current,
          collapsed: collapsedRef.current,
        };
        if (isDesktopViewport) {
          setCollapsed(true);
        } else if (openRef.current) {
          setOpen(false);
        }
        return;
      }

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

  useEffect(() => {
    if (isUserChatbotRoute) return;
    setMobileMenuOpen(false);
  }, [isUserChatbotRoute, location.pathname]);

  useMobileBodyScrollLock(
    isUserChatbotRoute ? open || rightPanelOpen : mobileMenuOpen,
  );

  const viewDocSearch = viewDocumentLocationSearch(location.search);

  const userRoutesContent = (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/documents" element={<UserDocumentsPage />} />
        <Route path="/forms" element={<FormsPage isReadOnly />} />
        <Route path="/chatbot/*" element={<ChatbotPage />} />
        <Route
          path="/"
          element={<Navigate to={`/user/documents${viewDocSearch}`} replace />}
        />
        <Route
          path="*"
          element={<Navigate to={`/user/documents${viewDocSearch}`} replace />}
        />
      </Routes>
    </Suspense>
  );

  const layoutContent = isUserChatbotRoute ? (
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
              onToggleCollapse={() => setCollapsed((current) => !current)}
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
  ) : (
    <DashboardMobileLayout
      sidebarOpen={mobileMenuOpen}
      onCloseSidebar={() => setMobileMenuOpen(false)}
      sidebar={
        <DashboardMobileSidebar
          routes={userRoutes}
          onClose={() => setMobileMenuOpen(false)}
          onNavigateStart={startNavigation}
        />
      }
    >
      <div className="relative flex min-h-0 w-full flex-1 overflow-hidden">
        <div className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain">
          <div
            className={`mx-auto mb-auto h-full min-h-0 w-full max-w-[1600px] px-4 pb-5 md:px-6 ${TOP_NAVBAR_PAGE_PADDING_CLASS}`}
          >
            {userRoutesContent}
          </div>
        </div>
      </div>
    </DashboardMobileLayout>
  );

  return (
    <div className="bg-lightPrimary dark:bg-navy-900! flex h-dvh min-h-0 w-full flex-col">
      <ViewDocumentUrlModal />
      <RouteNavigationOverlay visible={navigationPending} />
      {!isUserChatbotRoute ? (
        <TopNavbar
          routes={userRoutes}
          homeHref="/user/documents"
          chatbotHref="/user/chatbot"
          onNavigateStart={startNavigation}
          includeChatbotLink
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen((current) => !current)}
        />
      ) : null}
      {isUserChatbotRoute ? (
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
                onOpenChange={handleSourcePreviewOpenChange}
              >
                {layoutContent}
              </SourcePreviewProvider>
            </ChatbotLayoutProvider>
          </ChatbotRuntimeProvider>
        </Suspense>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">{layoutContent}</div>
      )}
    </div>
  );
};

export default UserLayout;
