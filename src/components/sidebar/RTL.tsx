/* eslint-disable */

import { HiX } from "react-icons/hi";
import Links from "./@/components/Links";

import SidebarCard from "@/components/sidebar/@/components/SidebarCard";
import routes from "routes";

const Sidebar = (props: {
  open: boolean;
  onClose: React.MouseEventHandler<HTMLSpanElement>;
}) => {
  const { open, onClose } = props;
  return (
    <div
      className={`sm:none linear dark:!bg-navy-800 fixed !z-50 flex min-h-full flex-col bg-white pb-10 shadow-2xl shadow-white/5 transition-all duration-175 md:!z-50 lg:!z-50 xl:!z-0 dark:text-white ${
        open ? "translate-x-0" : "-translate-x-96"
      }`}
    >
      <span
        className="absolute end-4 top-4 block cursor-pointer xl:hidden"
        onClick={onClose}
      >
        <HiX />
      </span>

      <div className={`mx-[56px] mt-[50px] flex items-center`}>
        <div className="font-poppins text-navy-700 ms-1 mt-1 h-2.5 text-[26px] font-bold uppercase dark:text-white">
          Horizon <span className="font-medium">FREE</span>
        </div>
      </div>
      <div className="mt-[58px] mb-7 h-px bg-gray-300 dark:bg-white/30" />
      {/* Nav item */}

      <ul className="mb-auto pt-1">
        <Links routes={routes} />
      </ul>

      {/* Free Horizon Card */}
      <div className="flex justify-center">
        <SidebarCard />
      </div>

      {/* Nav item end */}
    </div>
  );
};

export default Sidebar;
