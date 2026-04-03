/**
 * Auth Layout
 * Follows Horizon UI auth layout: form on the left with footer,
 * decorative panel on the right.
 */

import authImg from "@/assets/img/auth/auth.png";
import LogoBgWhite from "@/assets/img/logo/logo-bg-white-circle.svg";
import { useAuthStore } from "@/stores/auth.store";
import { getRolePath } from "@/utils/auth.util";
import React from "react";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import { Navigate, Outlet } from "react-router-dom";

export default function AuthLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userRole = useAuthStore((s) => s.userRole);
  const [darkmode, setDarkmode] = React.useState(
    document.body.classList.contains("dark"),
  );

  if (accessToken) return <Navigate to={getRolePath(userRole)} replace />;

  const toggleDark = () => {
    if (darkmode) {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkmode(false);
    } else {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkmode(true);
    }
  };

  return (
    <div className="dark:bg-navy-900! relative float-right h-full min-h-screen w-full !bg-white">
      <button
        onClick={toggleDark}
        className="dark:bg-navy-700 dark:hover:bg-navy-600 fixed top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 shadow-md transition-colors hover:bg-gray-200 dark:text-white"
      >
        {darkmode ? (
          <RiSunFill className="h-4 w-4" />
        ) : (
          <RiMoonFill className="h-4 w-4" />
        )}
      </button>

      <main className="mx-auto min-h-screen">
        <div className="relative flex">
          <div className="mx-auto flex min-h-full w-full flex-col justify-center md:max-w-[75%] lg:max-w-[1013px] lg:px-8 lg:pt-0 xl:min-h-[100vh] xl:max-w-[1383px] xl:px-0 xl:pl-[70px]">
            <div className="mb-auto flex flex-col pr-5 pl-5 md:pr-0 md:pl-12 lg:max-w-[48%] lg:pl-0 xl:max-w-full">
              {/* Form content */}
              <Outlet />

              {/* Right side decorative panel */}
              <div className="absolute right-0 hidden h-full min-h-screen lg:block lg:w-[49vw] 2xl:w-[44vw]">
                <div
                  className="absolute flex h-full w-full flex-col items-center justify-center bg-cover bg-center lg:rounded-bl-[120px] xl:rounded-bl-[200px]"
                  style={{ backgroundImage: `url(${authImg})` }}
                >
                  {/* Logo icon */}
                  <div className="flex h-52 w-52 items-center justify-center">
                    <img
                      src={LogoBgWhite}
                      alt="Logo"
                      className="object-fit h-full w-full rounded-full"
                    />
                  </div>

                  {/* Brand text */}
                  <h2 className="mt-6 text-center text-3xl font-extrabold tracking-wide text-white xl:text-4xl">
                    Virtual
                  </h2>
                  <h2 className="mt-2 text-center text-3xl font-extrabold tracking-wide text-white xl:text-4xl">
                    Academic Affair
                  </h2>

                  {/* Footer links in decorative panel */}
                  <div className="absolute bottom-12 flex items-center justify-center">
                    <ul className="flex flex-wrap items-center gap-15">
                      {["Support", "License", "Terms of Use", "Blog"].map(
                        (link) => (
                          <li key={link}>
                            <a
                              href="#"
                              className="text-base font-medium text-white transition-colors hover:text-white/70"
                            >
                              {link}
                            </a>
                          </li>
                        ),
                      )}
                    </ul>
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
