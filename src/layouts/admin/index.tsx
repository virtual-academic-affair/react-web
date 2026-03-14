/**
 * Admin Layout
 * Wraps all /admin/* pages with the Sidebar and Navbar.
 * Owns the single dynamic-data fetch so both the Navbar and AdminPage
 * share the same data without duplicate requests.
 */

import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import UsersPage from "@/pages/auth/accounts";
import AssignRolePage from "@/pages/auth/assign-role";
import CancelReasonsPage from "@/pages/class-registration/cancel-reasons";
import CancelReasonCreatePage from "@/pages/class-registration/cancel-reasons/create";
import ClassRegistrationCreatePage from "@/pages/class-registration/create";
import ClassRegistrationsPage from "@/pages/class-registration/registrations";
import ClassRegistrationStatisticsPage from "@/pages/class-registration/statistics";
import GmailConfigPage from "@/pages/emails/config";
import MessagesPage from "@/pages/emails/message";
import routes from "@/routes";
import { dynamicDataService } from "@/services/shared";
import type { DynamicDataResponse } from "@/types/shared";
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
} satisfies Parameters<typeof dynamicDataService.get>[0];

const AdminLayout: React.FC = () => {
  const [open, setOpen] = React.useState(true);
  const [data, setData] = React.useState<DynamicDataResponse | null>(null);
  const [dataLoading, setDataLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    setDataLoading(true);
    try {
      const result = await dynamicDataService.get(DYNAMIC_DATA_PARAMS);
      setData(result);
    } catch {
      // keep existing data on refresh failure
    } finally {
      setDataLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        avatarUrl={profile?.picture || undefined}
        userName={profile?.name || undefined}
      />

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
                  onRefresh={fetchData}
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
