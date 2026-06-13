/**
 * User Layout
 * Wraps all /user/* pages with UserSidebar, Navbar, and content area.
 * Mirrors the admin layout structure with collapsible sidebar support.
 */

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import PageLoader from "@/components/loading/PageLoader";
import Navbar from "@/components/navbar";
import UserSidebar from "@/components/sidebar/UserSidebar";
import { useMobileBodyScrollLock } from "@/hooks/useMobileBodyScrollLock";

const ChatbotPage = lazy(() => import("@/pages/chatbot"));
const ChatbotRuntimeProvider = lazy(() =>
  import("@/pages/chatbot/ChatbotRuntimeProvider").then((module) => ({
    default: module.ChatbotRuntimeProvider,
  })),
);
const ChatbotThreadToolbar = lazy(() =>
  import("@/pages/chatbot/components/ChatbotThreadToolbar").then((module) => ({
    default: module.ChatbotThreadToolbar,
  })),
);
const FormsPage = lazy(() => import("@/pages/documents/forms"));
const UserDocumentsPage = lazy(() => import("@/pages/user/documents"));

const UserLayout = () => {
  const [open, setOpen] = useState(() => window.innerWidth >= 1024);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setOpen(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const location = useLocation();
  const isUserChatbotRoute =
    location.pathname === "/user/chatbot" ||
    location.pathname.startsWith("/user/chatbot/");
  const [sidebarMode, setSidebarMode] = useState<"app" | "chatbot">(() =>
    isUserChatbotRoute ? "chatbot" : "app",
  );
  const wasChatbotRouteRef = useRef(isUserChatbotRoute);

  useEffect(() => {
    if (isUserChatbotRoute && !wasChatbotRouteRef.current) {
      setSidebarMode("chatbot");
    }
    if (!isUserChatbotRoute) {
      setSidebarMode("app");
    }
    wasChatbotRouteRef.current = isUserChatbotRoute;
  }, [isUserChatbotRoute]);

  const showChatbotSidebar = isUserChatbotRoute && sidebarMode === "chatbot";
  const effectiveCollapsed = showChatbotSidebar ? false : collapsed;
  useMobileBodyScrollLock(open);

  const layoutBody = (
    <>
      {showChatbotSidebar ? (
        <div
          className={`bg-lightPrimary dark:bg-navy-900 fixed inset-0 z-50! flex w-full flex-col p-4 transition-all duration-200 lg:inset-auto lg:top-5 lg:bottom-5 lg:left-5 lg:z-0! lg:w-78.25 lg:bg-transparent lg:p-0 lg:dark:bg-transparent ${
            open ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
          }`}
        >
          <Suspense fallback={<PageLoader />}>
            <ChatbotThreadToolbar onShowMenu={() => setSidebarMode("app")} />
          </Suspense>
        </div>
      ) : (
        <UserSidebar
          open={open}
          onClose={() => setOpen(false)}
          collapsed={effectiveCollapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onShowChatbotPanel={
            isUserChatbotRoute ? () => setSidebarMode("chatbot") : undefined
          }
        />
      )}

      {/* Main content */}
      <div
        className={`relative flex min-h-screen w-full flex-col transition-all duration-200 ${
          effectiveCollapsed ? "lg:ml-[100px]" : "lg:ml-[343px]"
        }`}
      >
        {/* Navbar */}
        <div
          className={`mx-auto w-[calc(100vw-6%)] transition-all duration-200 md:w-[calc(100vw-8%)] ${
            effectiveCollapsed
              ? "lg:w-[calc(100vw-162px)]"
              : "lg:w-[calc(100vw-405px)]"
          }`}
        >
          <Navbar onOpenSidenav={() => setOpen(true)} />
        </div>

        {/* Page content */}
        <div
          className={`mx-auto mb-auto h-full min-h-[84vh] w-[calc(100vw-6%)] pt-5 transition-all duration-200 md:w-[calc(100vw-8%)] ${
            effectiveCollapsed
              ? "lg:w-[calc(100vw-162px)]"
              : "lg:w-[calc(100vw-405px)]"
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
    </>
  );

  return (
    <div className="bg-lightPrimary dark:bg-navy-900! flex min-h-screen w-full">
      {isUserChatbotRoute ? (
        <Suspense fallback={<PageLoader />}>
          <ChatbotRuntimeProvider>{layoutBody}</ChatbotRuntimeProvider>
        </Suspense>
      ) : (
        layoutBody
      )}
    </div>
  );
};

export default UserLayout;
