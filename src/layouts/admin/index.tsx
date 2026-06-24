import { SourcePreviewProvider } from "@/components/assistant-ui/source-preview-context";
import { SourcePreviewCanvas } from "@/components/assistant-ui/sources";
import PageLoader from "@/components/loading/PageLoader";
import RouteNavigationOverlay from "@/components/loading/RouteNavigationOverlay";
import TopNavbar, { TOP_NAVBAR_PAGE_PADDING_CLASS } from "@/components/navbar/TopNavbar";
import { ChatbotLayoutProvider } from "@/pages/chatbot/chatbotLayoutContext";
import { MobileSidebarBackdrop } from "@/components/sidebar/components/MobileSidebarBackdrop";
import { useDynamicData } from "@/hooks/useDynamicData";
import { useMobileBodyScrollLock } from "@/hooks/useMobileBodyScrollLock";
import { useRouteNavigationPending } from "@/hooks/useRouteNavigationPending";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import routes from "routes";

const UsersPage = lazy(() => import("@/pages/auth/accounts"));
const StudentsPage = lazy(() => import("@/pages/auth/students"));
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
const ClassRegistrationStatisticsPage = lazy(
  () => import("@/pages/class-registration/statistics"),
);
const FAQsPage = lazy(() => import("@/pages/documents/faqs"));
const ProposedFAQsPage = lazy(
  () => import("@/pages/documents/faqs/candidates"),
);
const FormsPage = lazy(() => import("@/pages/documents/forms"));
const DocumentListPage = lazy(() => import("@/pages/documents/list"));
const GmailConfigPage = lazy(() => import("@/pages/emails/config"));
const InquiryStatisticsPage = lazy(() => import("@/pages/inquiry/statistics"));

const DYNAMIC_DATA_KEYS = [
  "auth.roleDomains",
  "email.superEmail",
  "email.lastPullAt",
  "email.labels",
  "email.gmailHistoryId",
] as const;

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const isAdminChatbotRoute =
    location.pathname === "/admin/chatbot" ||
    location.pathname.startsWith("/admin/chatbot/");

  const [open, setOpen] = useState(() => window.innerWidth >= 1024);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const [collapsed, setCollapsed] = useState(false);
  const [sourcePreviewLocationKey, setSourcePreviewLocationKey] = useState<
    string | null
  >(null);
  const sourcePreviewOpen =
    isAdminChatbotRoute && sourcePreviewLocationKey === location.key;
  const { navigationPending, startNavigation } = useRouteNavigationPending();

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (isAdminChatbotRoute) {
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
  }, [isAdminChatbotRoute, sourcePreviewOpen]);

  const {
    data: rawData,
    isLoading: dataLoading,
    refetch: onRefresh,
  } = useDynamicData(DYNAMIC_DATA_KEYS);
  const data = rawData ?? null;

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
  useMobileBodyScrollLock(
    isAdminChatbotRoute && (open || sourcePreviewOpen),
  );

  const mobileCanvasPosition = !isAdminChatbotRoute
    ? ""
    : sourcePreviewOpen
      ? "-translate-x-[180vw]"
      : open
        ? "translate-x-0"
        : "-translate-x-[80vw]";

  const layoutContent = (
    <div
      className={`relative flex min-h-0 flex-1 overflow-hidden transition-transform duration-200 ease-in-out lg:translate-none ${
        isAdminChatbotRoute
          ? `w-[280vw] lg:w-full ${mobileCanvasPosition}`
          : "w-full"
      }`}
    >
        {isAdminChatbotRoute ? (
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
            isAdminChatbotRoute
              ? "overflow-hidden"
              : "overflow-x-hidden overflow-y-auto overscroll-y-contain"
          }`}
        >
          <div
            className={`transition-all duration-200 ${
              isAdminChatbotRoute
                ? "flex min-h-0 w-full flex-1 overflow-hidden pt-4"
                : `mx-auto mb-auto h-full min-h-0 w-full max-w-[1600px] px-4 pb-8 md:px-6 ${TOP_NAVBAR_PAGE_PADDING_CLASS}`
            }`}
          >
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route
                  path="email/config"
                  element={
                    <GmailConfigPage
                      data={data}
                      dataLoading={dataLoading}
                      onRefresh={onRefresh}
                    />
                  }
                />
                <Route path="auth/accounts" element={<UsersPage data={data} />} />
                <Route path="auth/students" element={<StudentsPage />} />
                <Route
                  path="class-registration/statistics"
                  element={<ClassRegistrationStatisticsPage />}
                />
                <Route
                  path="inquiry/statistics"
                  element={<InquiryStatisticsPage />}
                />
                <Route path="documents/list" element={<DocumentListPage />} />
                <Route path="documents/forms" element={<FormsPage />} />
                <Route path="documents/faqs" element={<FAQsPage />} />
                <Route
                  path="documents/candidates"
                  element={<ProposedFAQsPage />}
                />
                <Route path="chatbot/*" element={<ChatbotPage />} />
                <Route
                  path="class-registration"
                  element={
                    <Navigate
                      to="/admin/class-registration/statistics"
                      replace
                    />
                  }
                />
                <Route
                  path="inquiry"
                  element={<Navigate to="/admin/inquiry/statistics" replace />}
                />
                <Route
                  path="/"
                  element={<Navigate to="/admin/email/config" replace />}
                />
                <Route
                  path="email"
                  element={<Navigate to="/admin/email/config" replace />}
                />
                <Route
                  path="emails/*"
                  element={<Navigate to="/admin/email/config" replace />}
                />
                <Route
                  path="*"
                  element={<Navigate to="/admin/email/config" replace />}
                />
              </Routes>
            </Suspense>
          </div>
        </div>

        {isAdminChatbotRoute ? <SourcePreviewCanvas /> : null}
    </div>
  );

  return (
    <div className="bg-lightPrimary dark:bg-navy-900! flex h-dvh min-h-0 w-full flex-col">
      <RouteNavigationOverlay visible={navigationPending} />
      {!isAdminChatbotRoute ? (
        <TopNavbar
          routes={routes}
          homeHref="/admin/email/config"
          chatbotHref="/admin/chatbot"
          onNavigateStart={startNavigation}
          includeChatbotLink
        />
      ) : null}
      {isAdminChatbotRoute ? (
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

export default AdminLayout;
