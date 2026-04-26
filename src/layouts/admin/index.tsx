import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { useDynamicData } from "@/hooks/useDynamicData";
import { useEmailSockets } from "@/hooks/useEmailSockets";
import UsersPage from "@/pages/auth/accounts";
import StudentsPage from "@/pages/auth/students";
import ClassRegistrationStatisticsPage from "@/pages/class-registration/statistics";
import DocumentCreatePage from "@/pages/documents/create";
import DocumentListPage from "@/pages/documents/list";
import MetadataManagementPage from "@/pages/documents/metadata";
import MetadataTypeCreatePage from "@/pages/documents/metadata/create";
import GmailConfigPage from "@/pages/emails/config";
import InquiryStatisticsPage from "@/pages/inquiry/statistics";
import routes from "@/routes";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const DYNAMIC_DATA_KEYS = [
  "auth.roleDomains",
  "email.superEmail",
  "email.lastPullAt",
  "email.labels",
  "email.gmailHistoryId",
] as const;

const AdminLayout: React.FC = () => {
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
    const href = `${route.layout}/${route.path}`.replace(/\/+/g, "/");
    if (!route.path) {
      return window.location.pathname.startsWith(route.layout);
    }
    return (
      window.location.pathname === href ||
      window.location.pathname.startsWith(`${href}/`)
    );
  };

  const getActiveRoute = (routes: RoutesType[]): string => {
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

  return (
    <div className="bg-lightPrimary dark:bg-navy-900! flex min-h-screen w-full">
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
            <Route path="documents/create" element={<DocumentCreatePage />} />
            <Route
              path="documents/metadata/index"
              element={<MetadataManagementPage />}
            />
            <Route
              path="documents/metadata/create"
              element={<MetadataTypeCreatePage />}
            />
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
    </div>
  );
};

export default AdminLayout;
