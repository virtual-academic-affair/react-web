import AdminLayout from "@/layouts/admin";
import UserLayout from "@/layouts/user";
import AuthLayout from "@/layouts/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleRoute from "@/components/auth/RoleRoute";
import LoginPage from "@/pages/auth/login";
import GoogleCallbackPage from "@/pages/auth/login/callback";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import { useEffect, useState } from "react";
import viVN from "antd/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";

// Globally set dayjs locale to Vietnamese
dayjs.locale("vi");

export default function App() {
  const [isDark, setIsDark] = useState(() => document.body.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains("dark"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorBgBase: isDark ? "#0b1437" : "#ffffff",
          colorBgContainer: isDark ? "#111c44" : "#ffffff",
          colorBgElevated: isDark ? "#111c44" : "#ffffff",
          colorBorderSecondary: isDark ? "#2b3674" : "#f0f0f0", // Calendar borders
          colorTextBase: isDark ? "#ffffff" : "#1b2559",
          colorText: isDark ? "#ffffff" : "#1b2559",
          colorTextQuaternary: isDark ? "#a3aed0" : "#a0aec0", // e.g. placeholder, empty text
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="callback" element={<GoogleCallbackPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={["admin"]} />}>
              <Route path="/admin/*" element={<AdminLayout />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={["student", "lecture"]} />}>
              <Route path="/user/*" element={<UserLayout />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/admin/email/config" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
