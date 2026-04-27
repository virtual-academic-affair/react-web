import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleRoute from "@/components/auth/RoleRoute";
import AdminLayout from "@/layouts/admin";
import AuthLayout from "@/layouts/auth";
import UserLayout from "@/layouts/user";
import BannedPage from "@/pages/auth/banned";
import GmailGrantFromAddonPage from "@/pages/auth/gmail-grant";
import LoginPage from "@/pages/auth/login";
import GoogleCallbackPage from "@/pages/auth/login/callback";
import GmailDeeplinkPage from "@/pages/gmail-deeplink";
import UserDashboard from "@/pages/user";
import { refreshTokens } from "@/services/http";
import { useAuthStore } from "@/stores/auth.store";
import { ConfigProvider, message as toast, theme } from "antd";
import viVN from "antd/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import "driver.js/dist/driver.css";
import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

dayjs.locale("vi");

/**
 * On fresh page load the Zustand store has no token (in-memory only).
 * We attempt a silent token refresh via the HTTP-only cookie.
 * - If refresh succeeds  → redirect to the user's home
 * - If refresh fails     → show the public landing page
 *
 * This mirrors the same pattern used by ProtectedRoute.
 */
function RootRedirect() {
  const location = useLocation();
  const { accessToken } = useAuthStore();
  const searchParams = new URLSearchParams(location.search);
  const tokenParam = searchParams.get("token");
  const grantParam = searchParams.get("grant");
  const messageId = searchParams.get("messageId");
  const threadId = searchParams.get("threadId");
  const email = searchParams.get("email");
  const shouldDeepLinkRedirect = !!messageId && !!threadId && !!email;
  const grantHandledRef = useRef(false);

  const [status, setStatus] = useState<"checking" | "done">(
    accessToken ? "done" : "checking",
  );

  useEffect(() => {
    if (!grantHandledRef.current && (grantParam === "1" || grantParam === "0")) {
      grantHandledRef.current = true;
      if (grantParam === "1") {
        toast.success("Cấp quyền thành công.");
      } else {
        toast.error("Cấp quyền thất bại.");
      }

      if (!tokenParam && !shouldDeepLinkRedirect) {
        window.history.replaceState({}, "", "/");
      }
    }

    if (shouldDeepLinkRedirect) return;
    if (tokenParam) {
      const normalized = tokenParam.replace(/^"+|"+$/g, "");
      useAuthStore.getState().setAccessToken(normalized);
      setStatus("done");
      // Clean URL (drop token) after we store it
      window.history.replaceState({}, "", "/");
      return;
    }
    if (status !== "checking") return;
    refreshTokens()
      .then((tokens) => {
        useAuthStore.getState().setAccessToken(tokens.accessToken);
        setStatus("done");
      })
      .catch(() => {
        setStatus("done"); // not logged in → show landing
      });
  }, [status, shouldDeepLinkRedirect, tokenParam, grantParam]);

  // Deep-link entry: /?messageId=...&email=... -> /gmail-deeplink?... (preserve full query)
  if (shouldDeepLinkRedirect) {
    return <Navigate to={`/gmail-deeplink${location.search}`} replace />;
  }

  if (status === "checking") {
    return (
      <div className="bg-lightPrimary dark:bg-navy-900 flex min-h-screen items-center justify-center">
        <div className="border-t-brand-500 h-10 w-10 animate-spin rounded-full border-4 border-gray-200" />
      </div>
    );
  }

  // Re-read from store after refresh
  const { accessToken: token, userRole: role } = useAuthStore.getState();
  if (token) {
    if (role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/user" replace />;
  }

  return <UserDashboard />;
}

export default function App() {
  const [isDark, setIsDark] = useState(() =>
    document.body.classList.contains("dark"),
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains("dark"));
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
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
          colorBorderSecondary: isDark ? "#2b3674" : "#f0f0f0",
          colorTextBase: isDark ? "#ffffff" : "#1b2559",
          colorText: isDark ? "#ffffff" : "#1b2559",
          colorTextQuaternary: isDark ? "#a3aed0" : "#a0aec0",
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          {/* ── Auth ── */}
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="callback" element={<GoogleCallbackPage />} />
            <Route path="gmail-grant" element={<GmailGrantFromAddonPage />} />
            <Route path="banned" element={<BannedPage />} />
          </Route>

          {/* ── Root: landing for guests, redirect for authenticated users ── */}
          <Route path="/" element={<RootRedirect />} />

          {/* ── Gmail deep-link page (public) ── */}
          <Route path="/gmail-deeplink" element={<GmailDeeplinkPage />} />

          {/* ── Protected routes ── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={["admin"]} />}>
              <Route path="/admin/*" element={<AdminLayout />} />
            </Route>

            <Route
              element={<RoleRoute allowedRoles={["student", "lecture"]} />}
            >
              <Route path="/user/*" element={<UserLayout />} />
            </Route>
          </Route>

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
