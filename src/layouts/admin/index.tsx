import PageLoader from "@/components/loading/PageLoader";
import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { SourcePreviewProvider } from "@/components/assistant-ui/source-preview-context";
import { useDynamicData } from "@/hooks/useDynamicData";
import { useMobileBodyScrollLock } from "@/hooks/useMobileBodyScrollLock";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

const UsersPage = lazy(() => import("@/pages/auth/accounts"));
const StudentsPage = lazy(() => import("@/pages/auth/students"));
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
  const [collapsed, setCollapsed] = useState(false);
  const [chatbotCollapsed, setChatbotCollapsed] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<"app" | "chatbot">(() =>
    isAdminChatbotRoute ? "chatbot" : "app",
  );
  const wasChatbotRouteRef = useRef(isAdminChatbotRoute);

  useEffect(() => {
    if (isAdminChatbotRoute && !wasChatbotRouteRef.current) {
      setSidebarMode("chatbot");
    }
    if (!isAdminChatbotRoute) {
      setSidebarMode("app");
    }
    wasChatbotRouteRef.current = isAdminChatbotRoute;
  }, [isAdminChatbotRoute]);

  useEffect(() => {
    const handleResize = () => {
      setOpen(window.innerWidth >= 1024);
      if (window.innerWidth < 1024) {
        setCollapsed(false);
        setChatbotCollapsed(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const {
    data: rawData,
    isLoading: dataLoading,
    refetch: onRefresh,
  } = useDynamicData(DYNAMIC_DATA_KEYS);
  const data = rawData ?? null;

  const showChatbotSidebar = isAdminChatbotRoute && sidebarMode === "chatbot";
  const effectiveCollapsed = showChatbotSidebar ? chatbotCollapsed : collapsed;
  const handleSourcePreviewOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen || window.innerWidth < 1024) return;
    setCollapsed(true);
    setChatbotCollapsed(true);
  }, []);
  useMobileBodyScrollLock(open);

  const layoutBody = (
    <>
      {showChatbotSidebar ? (
        <div
          className={`bg-lightPrimary dark:bg-navy-900 fixed inset-0 z-50! flex w-full flex-col p-4 transition-all duration-200 lg:inset-auto lg:top-5 lg:bottom-5 lg:left-5 lg:z-0! lg:bg-transparent lg:p-0 lg:dark:bg-transparent ${
            open ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
          } ${chatbotCollapsed ? "lg:w-[70px]" : "lg:w-78.25"}`}
        >
          <Suspense fallback={<PageLoader />}>
            <ChatbotThreadToolbar
              onNavigate={() => setOpen(false)}
              onShowMenu={() => setSidebarMode("app")}
              collapsed={chatbotCollapsed}
              onToggleCollapse={() =>
                setChatbotCollapsed((current) => !current)
              }
            />
          </Suspense>
        </div>
      ) : (
        <Sidebar
          open={open}
          onClose={() => setOpen(false)}
          collapsed={effectiveCollapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onShowChatbotPanel={
            isAdminChatbotRoute ? () => setSidebarMode("chatbot") : undefined
          }
        />
      )}

      {/* Main content */}
      <div
        className={`relative flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-200 ${
          effectiveCollapsed ? "lg:ml-[100px]" : "lg:ml-[343px]"
        }`}
      >
        {/* Navbar */}
        <div className="mx-auto w-[calc(100vw-6%)] transition-all duration-200 md:w-[calc(100vw-8%)] lg:w-[calc(100%-62px)]">
          <Navbar onOpenSidenav={() => setOpen(true)} />
        </div>

        {/* Page content */}
        <div className="mx-auto mb-auto h-full min-h-[84vh] w-[calc(100vw-6%)] pt-5 transition-all duration-200 md:w-[calc(100vw-8%)] lg:w-[calc(100%-62px)]">
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
                  <Navigate to="/admin/class-registration/statistics" replace />
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
    </>
  );

  return (
    <div className="bg-lightPrimary dark:bg-navy-900! flex min-h-screen w-full">
      {isAdminChatbotRoute ? (
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

export default AdminLayout;
