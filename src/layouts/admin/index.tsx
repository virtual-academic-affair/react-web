/**
 * Admin Layout
 * Wraps all /admin/* pages with the Sidebar and Navbar.
 * Owns the single dynamic-data fetch so both the Navbar and AdminPage
 * share the same data without duplicate requests.
 */

import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import routes from "@/routes";
import { dynamicDataService } from "@/services/shared";
import type { DynamicDataResponse } from "@/types/shared";
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminPage from "../../pages/admin";

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

  const getActiveRoute = (routes: RoutesType[]): string => {
    for (const route of routes) {
      if (
        window.location.href.indexOf(route.layout + "/" + route.path) !== -1
      ) {
        return route.name;
      }
    }
    return "Admin";
  };

  return (
    <div className="flex h-full w-full">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* Main content */}
      <div className="bg-lightPrimary dark:bg-navy-900! relative flex h-full w-full flex-col xl:ml-78.25">
        {/* Navbar */}
        <div className="mx-auto w-[calc(100vw-6%)] md:w-[calc(100vw-8%)] lg:w-[calc(100vw-6%)] xl:w-[calc(100vw-375px)] 2xl:w-[calc(100vw-375px)]">
          <Navbar
            onOpenSidenav={() => setOpen(true)}
            brandText={getActiveRoute(routes)}
            avatarUrl={profile?.picture || undefined}
            userName={profile?.name || undefined}
          />
        </div>

        {/* Page content */}
        <div className="mx-auto mb-auto h-full min-h-[84vh] w-[calc(100vw-6%)] pt-5 md:w-[calc(100vw-8%)] lg:w-[calc(100vw-6%)] xl:w-[calc(100vw-375px)] 2xl:w-[calc(100vw-375px)]">
          <Routes>
            <Route
              path="dashboard"
              element={
                <AdminPage
                  data={data}
                  dataLoading={dataLoading}
                  onRefresh={fetchData}
                />
              }
            />
            <Route
              path="/"
              element={<Navigate to="/admin/dashboard" replace />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
