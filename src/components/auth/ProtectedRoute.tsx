import { refreshTokens } from "@/services/http";
import { useAuthStore } from "@/stores/auth.store";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
    const accessToken = useAuthStore((state) => state.accessToken);

    const [status, setStatus] = useState<"checking" | "authenticated" | "unauthenticated">(
        accessToken ? "authenticated" : "checking",
    );

    useEffect(() => {
        if (status !== "checking") return;

        const tryRefresh = async () => {
            try {
                const tokens = await refreshTokens();
                useAuthStore.getState().setAccessToken(tokens.accessToken);
                setStatus("authenticated");
            } catch {
                useAuthStore.getState().clearAuth();
                setStatus("unauthenticated");
            }
        };

        tryRefresh();
    }, [status]);

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
