import { SourcePreviewProvider } from "@/components/assistant-ui/source-preview-context";
import { SourcePreviewCanvas } from "@/components/assistant-ui/sources";
import { ViewDocumentUrlModal } from "@/components/documents/ViewDocumentUrlModal";
import PageLoader from "@/components/loading/PageLoader";
import RouteNavigationOverlay from "@/components/loading/RouteNavigationOverlay";
import TopNavbar, {
  TOP_NAVBAR_PAGE_PADDING_CLASS,
} from "@/components/navbar/TopNavbar";
import { DashboardMobileSidebar } from "@/components/sidebar/DashboardMobileSidebar";
import { useDynamicData } from "@/hooks/useDynamicData";
import { useMobileBodyScrollLock } from "@/hooks/useMobileBodyScrollLock";
import { useRouteNavigationPending } from "@/hooks/useRouteNavigationPending";
import { DashboardMobileLayout } from "@/layouts/appMobileLayout";
import { ChatbotMobileLayoutShell } from "@/layouts/chatbotMobileLayout";
import { ChatbotLayoutProvider } from "@/pages/chatbot/chatbotLayoutContext";
import { viewDocumentLocationSearch } from "@/utils/documentViewUrl";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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

const SOURCE_PREVIEW_SIDEBAR_DELAY_MS = 300;
const SOURCE_PREVIEW_MOBILE_DRAWER_DELAY_MS = 200;

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const isAdminChatbotRoute =
    location.pathname === "/admin/chatbot" ||
    location.pathname.startsWith("/admin/chatbot/");

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
    isAdminChatbotRoute && sourcePreviewLocationKey === location.key;
  const rightPanelOpen = sourcePreviewOpen;
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
      } else if (rightPanelOpen) {
        setCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isAdminChatbotRoute, rightPanelOpen]);

  useEffect(() => {
    if (!isAdminChatbotRoute || window.innerWidth >= 1024) return;
    setOpen(false);
  }, [location.pathname, isAdminChatbotRoute]);

  const {
    data: rawData,
    isLoading: dataLoading,
    refetch: onRefresh,
  } = useDynamicData(DYNAMIC_DATA_KEYS);
  const data = rawData ?? null;

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
  useEffect(() => {
    if (isAdminChatbotRoute) return;
    setMobileMenuOpen(false);
  }, [isAdminChatbotRoute, location.pathname]);

  useMobileBodyScrollLock(
    isAdminChatbotRoute ? open || rightPanelOpen : mobileMenuOpen,
  );

  const viewDocSearch = viewDocumentLocationSearch(location.search);

  const chatbotRoutes = (
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
        <Route path="inquiry/statistics" element={<InquiryStatisticsPage />} />
        <Route path="documents/list" element={<DocumentListPage />} />
        <Route path="documents/forms" element={<FormsPage />} />
        <Route path="documents/faqs" element={<FAQsPage />} />
        <Route path="documents/candidates" element={<ProposedFAQsPage />} />
        <Route path="chatbot/*" element={<ChatbotPage />} />
        <Route
          path="class-registration"
          element={
            <Navigate
              to={`/admin/class-registration/statistics${viewDocSearch}`}
              replace
            />
          }
        />
        <Route
          path="inquiry"
          element={
            <Navigate
              to={`/admin/inquiry/statistics${viewDocSearch}`}
              replace
            />
          }
        />
        <Route
          path="/"
          element={
            <Navigate to={`/admin/email/config${viewDocSearch}`} replace />
          }
        />
        <Route
          path="email"
          element={
            <Navigate to={`/admin/email/config${viewDocSearch}`} replace />
          }
        />
        <Route
          path="emails/*"
          element={
            <Navigate to={`/admin/email/config${viewDocSearch}`} replace />
          }
        />
        <Route
          path="*"
          element={
            <Navigate to={`/admin/email/config${viewDocSearch}`} replace />
          }
        />
      </Routes>
    </Suspense>
  );

  const layoutContent = isAdminChatbotRoute ? (
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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pt-4">
        {chatbotRoutes}
      </div>
    </ChatbotMobileLayoutShell>
  ) : (
    <DashboardMobileLayout
      sidebarOpen={mobileMenuOpen}
      onCloseSidebar={() => setMobileMenuOpen(false)}
      sidebar={
        <DashboardMobileSidebar
          routes={routes}
          onClose={() => setMobileMenuOpen(false)}
          onNavigateStart={startNavigation}
        />
      }
    >
      <div className="relative flex min-h-0 w-full flex-1 overflow-hidden">
        <div className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain">
          <div
            className={`mx-auto mb-auto h-full min-h-0 w-full max-w-[1600px] px-4 pb-8 md:px-6 ${TOP_NAVBAR_PAGE_PADDING_CLASS}`}
          >
            {chatbotRoutes}
          </div>
        </div>
      </div>
    </DashboardMobileLayout>
  );

  return (
    <div className="bg-lightPrimary dark:bg-navy-900! flex h-dvh min-h-0 w-full flex-col">
      <ViewDocumentUrlModal />
      <RouteNavigationOverlay visible={navigationPending} />
      {!isAdminChatbotRoute ? (
        <TopNavbar
          routes={routes}
          homeHref="/admin/email/config"
          chatbotHref="/admin/chatbot"
          onNavigateStart={startNavigation}
          includeChatbotLink
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen((current) => !current)}
        />
      ) : null}
      {isAdminChatbotRoute ? (
        <Suspense fallback={<PageLoader />}>
          <ChatbotRuntimeProvider>
            <ChatbotLayoutProvider
              infoPanelAudience="admin"
              sidebarOpen={open}
              sidebarCollapsed={effectiveCollapsed}
              onToggleSidebar={() => setOpen((current) => !current)}
              onCloseSidebar={() => setOpen(false)}
            >
              <SourcePreviewProvider
                onBeforeOpen={handleSourcePreviewBeforeOpen}
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

export default AdminLayout;
