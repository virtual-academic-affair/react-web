import AdminLayout from "@/layouts/admin";
import UserLayout from "@/layouts/user";
import AuthLayout from "@/layouts/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleRoute from "@/components/auth/RoleRoute";
import LoginPage from "@/pages/auth/login";
import GoogleCallbackPage from "@/pages/auth/login/callback";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="callback" element={<GoogleCallbackPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          {/* Admin-only routes */}
          <Route element={<RoleRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/*" element={<AdminLayout />} />
          </Route>

          {/* Non-admin routes (student, lecture) */}
          <Route element={<RoleRoute allowedRoles={["student", "lecture"]} />}>
            <Route path="/user/*" element={<UserLayout />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
