/**
 * User Layout
 * Wraps all /user/* pages with UserSidebar, Navbar, and content area.
 * Mirrors the admin layout structure with collapsible sidebar support.
 */

import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { SourcePreviewProvider } from "@/components/assistant-ui/source-preview-context";
import { SourcePreviewCanvas } from "@/components/assistant-ui/sources";
import PageLoader from "@/components/loading/PageLoader";
import Navbar from "@/components/navbar";
import { MobileSidebarBackdrop } from "@/components/sidebar/components/MobileSidebarBackdrop";
import UserSidebar from "@/components/sidebar/UserSidebar";
import { useMobileBodyScrollLock } from "@/hooks/useMobileBodyScrollLock";

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
  const [appSidebarLocationKey, setAppSidebarLocationKey] = useState<
    string | null
  >(null);
  const sourcePreviewOpen =
    isUserChatbotRoute && sourcePreviewLocationKey === location.key;

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      setOpen(desktop);
      if (!desktop) {
        setCollapsed(false);
      } else if (sourcePreviewOpen) {
        setCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sourcePreviewOpen]);

  const showChatbotSidebar =
    isUserChatbotRoute && appSidebarLocationKey !== location.key;
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
  useMobileBodyScrollLock(open || sourcePreviewOpen);

  const mobileCanvasPosition = sourcePreviewOpen
    ? "-translate-x-[180vw]"
    : open
      ? "translate-x-0"
      : "-translate-x-[80vw]";

  const layoutBody = (
    <div
      className={`relative flex transition-transform duration-200 ease-in-out lg:w-full lg:[translate:none] ${
        isUserChatbotRoute ? "w-[280vw]" : "w-[180vw]"
      } h-dvh min-h-0 overflow-hidden ${mobileCanvasPosition}`}
    >
      <MobileSidebarBackdrop open={open} onClose={() => setOpen(false)} />

      {showChatbotSidebar ? (
        <Suspense fallback={<PageLoader />}>
          <ChatbotSidebar
            open={open}
            onClose={() => setOpen(false)}
            collapsed={effectiveCollapsed}
            onToggleCollapse={() => setCollapsed((current) => !current)}
            onShowMenu={() => setAppSidebarLocationKey(location.key)}
          />
        </Suspense>
      ) : (
        <UserSidebar
          open={open}
          onClose={() => setOpen(false)}
          collapsed={effectiveCollapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onShowChatbotPanel={
            isUserChatbotRoute
              ? () => setAppSidebarLocationKey(null)
              : undefined
          }
        />
      )}

      {/* Main content */}
      <div
        className={`relative flex h-dvh min-h-0 w-screen min-w-0 shrink-0 flex-col transition-all duration-200 lg:w-auto lg:flex-1 ${
          isUserChatbotRoute
            ? "overflow-hidden"
            : "overflow-x-hidden overflow-y-auto overscroll-y-contain"
        } ${effectiveCollapsed ? "lg:ml-[100px]" : "lg:ml-[343px]"}`}
      >
        {/* Navbar */}
        <div className="mx-auto w-[calc(100vw-6%)] transition-all duration-200 md:w-[calc(100vw-8%)] lg:w-[calc(100%-62px)]">
          <Navbar
            sidebarOpen={open}
            overlayOpen={sourcePreviewOpen}
            onOpenSidenav={() => setOpen(true)}
          />
        </div>

        {/* Page content */}
        <div
          className={`transition-all duration-200 ${
            isUserChatbotRoute
              ? "flex min-h-0 w-full flex-1 overflow-hidden py-5"
              : "mx-auto mb-auto h-full min-h-[84vh] w-[calc(100vw-6%)] py-5 md:w-[calc(100vw-8%)] lg:w-[calc(100%-62px)]"
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
    <div className="bg-lightPrimary dark:bg-navy-900! h-dvh min-h-0 w-full overflow-hidden">
      {isUserChatbotRoute ? (
        <Suspense fallback={<PageLoader />}>
          <ChatbotRuntimeProvider>
            <SourcePreviewProvider onOpenChange={handleSourcePreviewOpenChange}>
              {layoutBody}
            </SourcePreviewProvider>
          </ChatbotRuntimeProvider>
        </Suspense>
      ) : (
        layoutBody
      )}
    </div>
  );
};

export default UserLayout;
