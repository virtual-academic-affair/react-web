/**
 * Google OAuth Callback Page
 * Receives the authorization code from Google, exchanges it for JWT tokens,
 * stores the access token in a cookie, and redirects to the dashboard.
 */

import { authService } from "@/services/auth";
import { setAccessToken, setRefreshToken } from "@/utils/cookie.util";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function GoogleCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const hasCalledRef = useRef(false);

    useEffect(() => {
        if (hasCalledRef.current) return;
        hasCalledRef.current = true;

        const code = searchParams.get("code");

        if (!code) {
            setError("Missing authorization code. Please try signing in again.");
            return;
        }

        const authenticate = async () => {
            try {
                const { accessToken, refreshToken } = await authService.authenticateWithGoogle(code);
                console.log(accessToken, refreshToken);
                setAccessToken(accessToken);
                setRefreshToken(refreshToken);
                navigate("/admin/dashboard", { replace: true });
            } catch {
                setError("Authentication failed. Please try again.");
            }
        };

        authenticate();
    }, [searchParams, navigate]);

    if (error) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-4 dark:bg-navy-900">
                <div className="mb-4 rounded-lg bg-red-50 p-4 text-center text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                </div>
                <a
                    href="/auth/login"
                    className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-white"
                >
                    ← Back to Sign In
                </a>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-navy-900">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Signing you in…
            </p>
        </div>
    );
}
