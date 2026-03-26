import Card from "@/components/card";
import Dropdown from "@/components/dropdown";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/stores/auth.store";
import type { UserInfo } from "@/utils/auth.util";
import React from "react";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import routes from "routes";
import { SidebarLinks as Links } from "./components/Links";

const Sidebar = (props: {
  open: boolean;
  onClose: React.MouseEventHandler<HTMLSpanElement>;
}) => {
  const { open } = props;
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [userInfo, setUserInfo] = React.useState<UserInfo>({});

  React.useEffect(() => {
    authService
      .getMe()
      .then(setUserInfo)
      .catch(() => {});
  }, []);

  const { name: userName, picture: avatarUrl, email: userEmail } = userInfo;
  const [darkmode, setDarkmode] = React.useState(
    document.body.classList.contains("dark"),
  );

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      clearAuth();
      navigate("/auth/login", { replace: true });
    }
  };
  return (
    <div
      className={`sm:none fixed top-5 bottom-5 left-5 z-50! flex w-78.25 flex-col gap-4 transition-all duration-175 md:z-50! lg:z-50! xl:z-0! ${
        open ? "translate-x-0" : "-translate-x-[120%]"
      }`}
    >
      {/* Menu block */}
      <Card extra="flex-1 overflow-hidden rounded-[30px] pb-4">
        <div className="h-full overflow-y-auto pt-6">
          <ul className="mt-5 px-4">
            <Links routes={routes} />
          </ul>
        </div>
      </Card>

      {/* Bottom nav block */}
      <Card extra="rounded-[30px] px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Avatar + name */}
          <Dropdown
            button={
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={avatarUrl}
                    alt={userName ?? "profile"}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="bg-brand-500 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white">
                    {userName?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="text-navy-700 text-sm font-medium dark:text-white">
                  {userName ?? "Tài khoản"}
                </span>
              </div>
            }
            children={
              <div className="shadow-shadow-500 dark:bg-navy-700! rounded-primary flex h-fit w-56 flex-col justify-start bg-white bg-cover bg-no-repeat pb-4 shadow-xl dark:text-white dark:shadow-none">
                <div className="mt-3 ml-4">
                  <p className="text-navy-700 font-bold dark:text-white">
                    {userName ?? "—"}
                  </p>
                  <p className="mt-1 text-sm font-normal text-gray-600 dark:text-gray-400">
                    {userEmail}
                  </p>
                </div>
                <div className="mt-3 h-px w-full bg-gray-200 dark:bg-white/20" />
                <div className="mt-3 ml-4 flex flex-col">
                  <button
                    onClick={handleLogout}
                    className="mt-3 cursor-pointer text-left text-sm font-medium text-red-500 hover:text-red-500"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            }
            classNames={"py-2 bottom-full mb-2 -left-[10px] w-max"}
            animation="origin-bottom-left transition-all duration-300 ease-in-out"
          />

          {/* Dark mode + notification */}
          <div className="flex items-center gap-3">
            <button
              className="dark:bg-navy-700 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:text-white"
              onClick={() => {
                if (darkmode) {
                  document.body.classList.remove("dark");
                  localStorage.setItem("theme", "light");
                  setDarkmode(false);
                } else {
                  document.body.classList.add("dark");
                  localStorage.setItem("theme", "dark");
                  setDarkmode(true);
                }
              }}
            >
              {darkmode ? (
                <RiSunFill className="h-4 w-4" />
              ) : (
                <RiMoonFill className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Sidebar;
