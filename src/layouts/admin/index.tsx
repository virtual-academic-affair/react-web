import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { useDynamicData } from "@/hooks/useDynamicData";
import UsersPage from "@/pages/auth/accounts";
import StudentsPage from "@/pages/auth/students";
import ChatbotPage from "@/pages/chatbot";
import { ChatbotRuntimeProvider } from "@/pages/chatbot/ChatbotRuntimeProvider";
import { ChatbotThreadToolbar } from "@/pages/chatbot/components/ChatbotThreadToolbar";
import ClassRegistrationStatisticsPage from "@/pages/class-registration/statistics";
import FAQsPage from "@/pages/documents/faqs";
import ProposedFAQsPage from "@/pages/documents/faqs/candidates";
import FormsPage from "@/pages/documents/forms";
import DocumentListPage from "@/pages/documents/list";
import GmailConfigPage from "@/pages/emails/config";
import InquiryStatisticsPage from "@/pages/inquiry/statistics";
import { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

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
  const effectiveCollapsed = showChatbotSidebar ? false : collapsed;

  const layoutBody = (
    <>
      {showChatbotSidebar ? (
        <div
          className={`bg-lightPrimary dark:bg-navy-900 fixed inset-0 z-50! flex w-full flex-col p-4 transition-all duration-300 lg:inset-auto lg:top-5 lg:bottom-5 lg:left-5 lg:z-0! lg:w-78.25 lg:bg-transparent lg:p-0 ${
            open ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
          }`}
        >
          <ChatbotThreadToolbar onShowMenu={() => setSidebarMode("app")} />
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
        className={`relative flex min-h-screen w-full flex-col transition-all duration-300 ${
          effectiveCollapsed ? "lg:ml-[100px]" : "lg:ml-[343px]"
        }`}
      >
        {/* Navbar */}
        <div
          className={`mx-auto w-[calc(100vw-6%)] transition-all duration-300 md:w-[calc(100vw-8%)] ${
            effectiveCollapsed
              ? "lg:w-[calc(100vw-162px)]"
              : "lg:w-[calc(100vw-405px)]"
          }`}
        >
          <Navbar onOpenSidenav={() => setOpen(true)} />
        </div>

        {/* Page content */}
        <div
          className={`mx-auto mb-auto h-full min-h-[84vh] w-[calc(100vw-6%)] pt-5 transition-all duration-300 md:w-[calc(100vw-8%)] ${
            effectiveCollapsed
              ? "lg:w-[calc(100vw-162px)]"
              : "lg:w-[calc(100vw-405px)]"
          }`}
        >
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
            <Route path="documents/candidates" element={<ProposedFAQsPage />} />
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
              path="tasks/*"
              element={<Navigate to="/admin/email/config" replace />}
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
              path="email/message"
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
        </div>
      </div>
    </>
  );

  return (
    <div className="bg-lightPrimary dark:bg-navy-900! flex min-h-screen w-full">
      {isAdminChatbotRoute ? (
        <ChatbotRuntimeProvider>{layoutBody}</ChatbotRuntimeProvider>
      ) : (
        layoutBody
      )}
    </div>
  );
};

export default AdminLayout;
