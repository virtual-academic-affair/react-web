import AdminLayout from "@/layouts/admin";
import AuthLayout from "@/layouts/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LoginPage from "@/pages/auth/login";
import GoogleCallbackPage from "@/pages/auth/login/callback";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes (public) — wrapped in AuthLayout */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="callback" element={<GoogleCallbackPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/*" element={<AdminLayout />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
