import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { useDynamicData } from "@/hooks/useDynamicData";
import { useEmailSockets } from "@/hooks/useEmailSockets";
import UsersPage from "@/pages/auth/accounts";
import StudentsPage from "@/pages/auth/students";
import ClassRegistrationStatisticsPage from "@/pages/class-registration/statistics";
import FormsPage from "@/pages/documents/forms";
import FAQsPage from "@/pages/documents/faqs";
import ProposedFAQsPage from "@/pages/documents/faqs/candidates";
import DocumentListPage from "@/pages/documents/list";
import ChatbotPage from "@/pages/chatbot";
import { ChatbotRuntimeProvider } from "@/pages/chatbot/ChatbotRuntimeProvider";
import GmailConfigPage from "@/pages/emails/config";
import InquiryStatisticsPage from "@/pages/inquiry/statistics";
import routes from "@/routes";
import { useEffect, useState } from "react";
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

  useEmailSockets();

  const profile = data?.settings?.["email.superEmail"];

  const isRouteActive = (route: RoutesType): boolean => {
    if (!route.path) return window.location.pathname === route.layout;
    
    const href = `${route.layout}/${route.path}`.replace(/\/+/g, "/");
    const currentPath = window.location.pathname;

    // Exact match is always true
    if (currentPath === href) return true;
    
    // Parent match only if the route has children defined in config
    const hasChildren = route.children && route.children.length > 0;
    if (hasChildren && currentPath.startsWith(`${href}/`)) {
      return true;
    }

    return false;
  };

  const getActiveRoute = (routes: RoutesType[]): string => {
    const path = window.location.pathname;
    if (path === "/admin/chatbot" || path.startsWith("/admin/chatbot/")) {
      return "Chatbot";
    }
    for (const route of routes) {
      if (route.children?.length) {
        const childActive = getActiveRoute(route.children);
        if (childActive !== "Admin") {
          return childActive;
        }
      }
      if (isRouteActive(route)) {
        return route.name;
      }
    }
    return "Admin";
  };

  const layoutBody = (
    <>
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      {/* Main content */}
      <div
        className={`relative flex min-h-screen w-full flex-col transition-all duration-300 ${
          collapsed ? "lg:ml-[100px]" : "lg:ml-[343px]"
        }`}
      >
        {/* Navbar */}
        <div
          className={`mx-auto w-[calc(100vw-6%)] transition-all duration-300 md:w-[calc(100vw-8%)] ${
            collapsed ? "lg:w-[calc(100vw-162px)]" : "lg:w-[calc(100vw-405px)]"
          }`}
        >
          <Navbar
            onOpenSidenav={() => setOpen(true)}
            brandText={getActiveRoute(routes)}
            avatarUrl={profile?.picture || undefined}
            userName={profile?.name || undefined}
          />
        </div>

        {/* Page content */}
        <div
          className={`mx-auto mb-auto h-full min-h-[84vh] w-[calc(100vw-6%)] pt-5 transition-all duration-300 md:w-[calc(100vw-8%)] ${
            collapsed ? "lg:w-[calc(100vw-162px)]" : "lg:w-[calc(100vw-405px)]"
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
            <Route path="chatbot" element={<ChatbotPage />} />
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
