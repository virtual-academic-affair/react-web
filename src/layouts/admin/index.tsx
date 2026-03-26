import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { useDynamicData } from "@/hooks/useDynamicData";
import { useEmailSockets } from "@/hooks/useEmailSockets";
import UsersPage from "@/pages/auth/accounts";
import AssignRolePage from "@/pages/auth/assign-role";
import CancelReasonsPage from "@/pages/class-registration/cancel-reasons";
import CancelReasonCreatePage from "@/pages/class-registration/cancel-reasons/create";
import ClassRegistrationCreatePage from "@/pages/class-registration/create";
import ClassRegistrationsPage from "@/pages/class-registration/registrations";
import ClassRegistrationStatisticsPage from "@/pages/class-registration/statistics";
import DocumentListPage from "@/pages/documents/list";
import DocumentCreatePage from "@/pages/documents/create";
import MetadataManagementPage from "@/pages/documents/metadata";
import MetadataTypeCreatePage from "@/pages/documents/metadata/create";
import GmailConfigPage from "@/pages/emails/config";
import MessagesPage from "@/pages/emails/message";
import InquiryCreatePage from "@/pages/inquiry/create";
import InquiriesPage from "@/pages/inquiry/inquiries";
import InquiryStatisticsPage from "@/pages/inquiry/statistics";
import TaskCreatePage from "@/pages/tasks/create";
import TasksPage from "@/pages/tasks/list";
import TaskStatisticsPage from "@/pages/tasks/statistics";
import TaskDetailPage from "@/pages/tasks/view";
import routes from "@/routes";
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const DYNAMIC_DATA_PARAMS = {
  enums: ["authentication.role", "shared.systemLabel"],
  settings: [
    "email.allowedDomains",
    "email.superEmail",
    "email.lastPullAt",
    "email.labels",
  ],
} as const;

const AdminLayout: React.FC = () => {
  const [open, setOpen] = React.useState(true);
  const {
    data: rawData,
    isLoading: dataLoading,
    refetch: onRefresh,
  } = useDynamicData(DYNAMIC_DATA_PARAMS);
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
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* Main content */}
      <div className="relative flex min-h-screen w-full flex-col xl:ml-[343px]">
        {/* Navbar */}
        <div className="mx-auto w-[calc(100vw-6%)] md:w-[calc(100vw-8%)] lg:w-[calc(100vw-6%)] xl:w-[calc(100vw-405px)] 2xl:w-[calc(100vw-405px)]">
          <Navbar
            onOpenSidenav={() => setOpen(true)}
            brandText={getActiveRoute(routes)}
            avatarUrl={profile?.picture || undefined}
            userName={profile?.name || undefined}
          />
        </div>

        {/* Page content */}
        <div className="mx-auto mb-auto h-full min-h-[84vh] w-[calc(100vw-6%)] pt-5 md:w-[calc(100vw-8%)] lg:w-[calc(100vw-6%)] xl:w-[calc(100vw-405px)] 2xl:w-[calc(100vw-405px)]">
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
            <Route
              path="email/messages"
              element={<MessagesPage data={data} />}
            />
            <Route path="auth/accounts" element={<UsersPage data={data} />} />
            <Route path="auth/assign-role" element={<AssignRolePage />} />
            <Route
              path="class-registration/statistics"
              element={<ClassRegistrationStatisticsPage />}
            />
            <Route
              path="class-registration/registrations"
              element={<ClassRegistrationsPage />}
            />
            <Route
              path="class-registration/create"
              element={<ClassRegistrationCreatePage />}
            />
            <Route
              path="class-registration/cancel-reasons/index"
              element={<CancelReasonsPage />}
            />
            <Route
              path="class-registration/cancel-reasons/create"
              element={<CancelReasonCreatePage />}
            />
            <Route path="inquiry/inquiries" element={<InquiriesPage />} />
            <Route path="inquiry/create" element={<InquiryCreatePage />} />
            <Route
              path="inquiry/statistics"
              element={<InquiryStatisticsPage />}
            />
            <Route path="tasks/statistics" element={<TaskStatisticsPage />} />
            <Route path="tasks/list" element={<TasksPage />} />
            <Route path="tasks/create" element={<TaskCreatePage />} />
            <Route path="tasks/view/:id" element={<TaskDetailPage />} />
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
              path="tasks"
              element={<Navigate to="/admin/tasks/statistics" replace />}
            />
            <Route
              path="class-registration"
              element={
                <Navigate to="/admin/class-registration/statistics" replace />
              }
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
              element={<Navigate to="/admin/email/messages" replace />}
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
