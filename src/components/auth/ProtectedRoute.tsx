/**
 * Protected Route
 * - Có access token → cho vào
 * - Không có access token nhưng có refresh token → thử refresh
 * - Không có gì → redirect về login
 */

import { refreshTokens } from "@/services/http";
import {
    getAccessToken,
    getRefreshToken,
    removeAllTokens,
    setAccessToken,
    setRefreshToken,
} from "@/utils/cookie.util";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
    const accessToken = getAccessToken();
    const currentRefreshToken = getRefreshToken();

    const [status, setStatus] = useState<"checking" | "authenticated" | "unauthenticated">(
        accessToken ? "authenticated" : currentRefreshToken ? "checking" : "unauthenticated",
    );

    useEffect(() => {
        if (status !== "checking" || !currentRefreshToken) return;

        const tryRefresh = async () => {
            try {
                const tokens = await refreshTokens(currentRefreshToken);
                setAccessToken(tokens.accessToken);
                setRefreshToken(tokens.refreshToken);
                setStatus("authenticated");
            } catch {
                removeAllTokens();
                setStatus("unauthenticated");
            }
        };

        tryRefresh();
    }, [status, currentRefreshToken]);

    if (status === "checking") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-lightPrimary dark:bg-navy-900">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" />
            </div>
        );
    }

    if (status === "unauthenticated") {
        return <Navigate to="/auth/login" replace />;
    }

    return <Outlet />;
}
