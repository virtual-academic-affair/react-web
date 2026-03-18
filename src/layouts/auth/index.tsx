/**
 * Auth Layout
 * Follows Horizon UI auth layout: form on the left with footer,
 * decorative panel on the right.
 */

import { useAuthStore } from "@/stores/auth.store";
import { getRolePath } from "@/utils/auth.util";
import { Navigate, Outlet } from "react-router-dom";

export default function AuthLayout() {
    const accessToken = useAuthStore((s) => s.accessToken);
    const userRole = useAuthStore((s) => s.userRole);

    if (accessToken) return <Navigate to={getRolePath(userRole)} replace />;

    return (
        <div className="relative float-right h-full min-h-screen w-full !bg-white dark:!bg-navy-900">
            <main className="mx-auto min-h-screen">
                <div className="relative flex">
                    <div className="mx-auto lg:pt-0 flex min-h-full w-full flex-col justify-center md:max-w-[75%] lg:max-w-[1013px] lg:px-8 xl:min-h-[100vh] xl:max-w-[1383px] xl:px-0 xl:pl-[70px]">
                        <div className="mb-auto flex flex-col pl-5 pr-5 md:pr-0 md:pl-12 lg:max-w-[48%] lg:pl-0 xl:max-w-full">


                            {/* Form content */}
                            <Outlet />

                            {/* Right side decorative panel */}
                            <div className="absolute right-0 hidden h-full min-h-screen lg:block lg:w-[49vw] 2xl:w-[44vw]">
                                <div className="absolute flex h-full w-full flex-col items-center justify-center bg-[#4318FF] lg:rounded-bl-[120px] xl:rounded-bl-[200px]">
                                    {/* Logo icon */}
                                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-2xl xl:h-40 xl:w-40">
                                        <svg
                                            width="70"
                                            height="70"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="xl:h-[90px] xl:w-[90px]"
                                        >
                                            <path
                                                d="M12 3L2 8.5L12 14L22 8.5L12 3Z"
                                                fill="#4318FF"
                                                opacity="0.9"
                                            />
                                            <path
                                                d="M2 15.5L12 21L22 15.5"
                                                stroke="#4318FF"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                opacity="0.7"
                                            />
                                            <path
                                                d="M2 12L12 17.5L22 12"
                                                stroke="#4318FF"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>

                                    {/* Brand text */}
                                    <h2 className="mt-6 text-center text-3xl font-extrabold tracking-wide text-white xl:text-4xl">
                                        Virtual
                                    </h2>
                                    <h2 className="mt-2 text-center text-3xl font-extrabold tracking-wide text-white xl:text-4xl">
                                        Academic Affair
                                    </h2>

                                    {/* Info card */}
                                    <div className="mt-10 rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-center backdrop-blur-sm xl:mt-14">
                                        <p className="text-sm text-white/80">
                                            Hệ thống giáo vụ ảo thông minh
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}