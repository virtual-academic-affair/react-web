import Dropdown from "@/components/dropdown";
import React from "react";
import { BsArrowBarUp } from "react-icons/bs";
import { FiAlignJustify, FiSearch } from "react-icons/fi";
import { IoMdNotificationsOutline } from "react-icons/io";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import { Link } from "react-router-dom";

const Navbar = (props: {
  onOpenSidenav: () => void;
  brandText: string;
  secondary?: boolean | string;
  avatarUrl?: string;
  userName?: string;
}) => {
  const { onOpenSidenav, brandText, avatarUrl, userName } = props;
  const [darkmode, setDarkmode] = React.useState(false);

  return (
    <nav className="sticky top-4 z-40 flex flex-row flex-wrap items-center justify-between rounded-xl bg-white/10 py-2 pr-2 pl-0 backdrop-blur-xl dark:bg-[#0b14374d]">
      <div>
        <div className="h-6 w-[224px] pt-1">
          <a
            className="text-navy-700 text-sm font-normal hover:underline dark:text-white dark:hover:text-white"
            href=" "
          >
            Pages
            <span className="text-navy-700 hover:text-navy-700 mx-1 text-sm dark:text-white">
              {" "}
              /{" "}
            </span>
          </a>
          <Link
            className="text-navy-700 text-sm font-normal capitalize hover:underline dark:text-white dark:hover:text-white"
            to="#"
          >
            {brandText}
          </Link>
        </div>
        <p className="text-navy-700 shrink text-[33px] capitalize dark:text-white">
          <Link
            to="#"
            className="hover:text-navy-700 font-bold capitalize dark:hover:text-white"
          >
            {brandText}
          </Link>
        </p>
      </div>

      <div className="shadow-shadow-500 dark:!bg-navy-800 relative mt-[3px] flex h-[61px] w-[355px] flex-grow items-center justify-around gap-2 rounded-full bg-white px-2 py-2 shadow-xl md:w-[365px] md:flex-grow-0 md:gap-1 xl:w-[365px] xl:gap-2 dark:shadow-none">
        <div className="bg-lightPrimary text-navy-700 dark:bg-navy-900 flex h-full items-center rounded-full xl:w-[225px] dark:text-white">
          <p className="pr-2 pl-3 text-xl">
            <FiSearch className="h-4 w-4 text-gray-400 dark:text-white" />
          </p>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="bg-lightPrimary text-navy-700 dark:bg-navy-900 block h-full w-full rounded-full text-sm font-medium outline-none placeholder:!text-gray-400 sm:w-fit dark:text-white dark:placeholder:!text-white"
          />
        </div>
        <span
          className="flex cursor-pointer text-xl text-gray-600 xl:hidden dark:text-white"
          onClick={onOpenSidenav}
        >
          <FiAlignJustify className="h-5 w-5" />
        </span>
        {/* start Notification */}
        <Dropdown
          button={
            <p className="cursor-pointer">
              <IoMdNotificationsOutline className="h-4 w-4 text-gray-600 dark:text-white" />
            </p>
          }
          animation="origin-[65%_0%] md:origin-top-right transition-all duration-300 ease-in-out"
          children={
            <div className="shadow-shadow-500 dark:!bg-navy-700 flex w-[360px] flex-col gap-3 rounded-[20px] bg-white p-4 shadow-xl sm:w-[460px] dark:text-white dark:shadow-none">
              <div className="flex items-center justify-between">
                <p className="text-navy-700 text-base font-bold dark:text-white">
                  Notification
                </p>
                <p className="text-navy-700 text-sm font-bold dark:text-white">
                  Mark all read
                </p>
              </div>

              <button className="flex w-full items-center">
                <div className="from-brandLinear to-brand-500 flex h-full w-[85px] items-center justify-center rounded-xl bg-gradient-to-b py-4 text-2xl text-white">
                  <BsArrowBarUp />
                </div>
                <div className="ml-2 flex h-full w-full flex-col justify-center rounded-lg px-1 text-sm">
                  <p className="mb-1 text-left text-base font-bold text-gray-900 dark:text-white">
                    New Update: Horizon UI Dashboard PRO
                  </p>
                  <p className="font-base text-left text-xs text-gray-900 dark:text-white">
                    A new update for your downloaded item is available!
                  </p>
                </div>
              </button>

              <button className="flex w-full items-center">
                <div className="from-brandLinear to-brand-500 flex h-full w-[85px] items-center justify-center rounded-xl bg-gradient-to-b py-4 text-2xl text-white">
                  <BsArrowBarUp />
                </div>
                <div className="ml-2 flex h-full w-full flex-col justify-center rounded-lg px-1 text-sm">
                  <p className="mb-1 text-left text-base font-bold text-gray-900 dark:text-white">
                    New Update: Horizon UI Dashboard PRO
                  </p>
                  <p className="font-base text-left text-xs text-gray-900 dark:text-white">
                    A new update for your downloaded item is available!
                  </p>
                </div>
              </button>
            </div>
          }
          classNames={"py-2 top-4 -left-[230px] md:-left-[440px] w-max"}
        />

        <div
          className="cursor-pointer text-gray-600"
          onClick={() => {
            if (darkmode) {
              document.body.classList.remove("dark");
              setDarkmode(false);
            } else {
              document.body.classList.add("dark");
              setDarkmode(true);
            }
          }}
        >
          {darkmode ? (
            <RiSunFill className="h-4 w-4 text-gray-600 dark:text-white" />
          ) : (
            <RiMoonFill className="h-4 w-4 text-gray-600 dark:text-white" />
          )}
        </div>
        {/* Profile & Dropdown */}
        <Dropdown
          button={
            avatarUrl ? (
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
            )
          }
          children={
            <div className="shadow-shadow-500 dark:!bg-navy-700 flex h-fit w-56 flex-col justify-start rounded-[20px] bg-white bg-cover bg-no-repeat pb-4 shadow-xl dark:text-white dark:shadow-none">
              <div className="mt-3 ml-4">
                <div className="flex items-center gap-2">
                  <p className="text-navy-700 text-sm font-bold dark:text-white">
                    👋 Chào, {userName ?? "there"}
                  </p>{" "}
                </div>
              </div>
              <div className="mt-3 h-px w-full bg-gray-200 dark:bg-white/20" />

              <div className="mt-3 ml-4 flex flex-col">
                <a
                  href=" "
                  className="text-sm text-gray-800 dark:text-white hover:dark:text-white"
                >
                  Cài đặt
                </a>
                <a
                  href=" "
                  className="mt-3 text-sm text-gray-800 dark:text-white hover:dark:text-white"
                >
                  Cài đặt Newsletter
                </a>
                <a
                  href=" "
                  className="mt-3 text-sm font-medium text-red-500 hover:text-red-500"
                >
                  Đăng xuất
                </a>
              </div>
            </div>
          }
          classNames={"py-2 top-8 -left-[180px] w-max"}
        />
      </div>
    </nav>
  );
};

export default Navbar;
