 

import { HiX } from "react-icons/hi";
import { SidebarLinks as Links } from "./components/Links";

import routes from "routes";

const Sidebar = (props: {
  open: boolean;
  onClose: React.MouseEventHandler<HTMLSpanElement>;
}) => {
  const { open, onClose } = props;
  return (
    <div
      className={`sm:none linear dark:bg-navy-800! fixed z-50! flex min-h-full w-78.25 flex-col bg-white pb-10 shadow-2xl shadow-white/5 transition-all duration-175 md:z-50! lg:z-50! xl:z-0! dark:text-white ${
        open ? "translate-x-0" : "-translate-x-96"
      }`}
    >
      <span
        className="absolute top-4 right-4 block cursor-pointer xl:hidden"
        onClick={onClose}
      >
        <HiX />
      </span>

      <div className="mx-8 mt-10 flex items-center gap-3">
        {/* Icon badge */}
        <div className="from-brand-400 to-brand-600 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 3L2 8.5L12 14L22 8.5L12 3Z"
              fill="white"
              opacity="0.9"
            />
            <path
              d="M2 15.5L12 21L22 15.5"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
            <path
              d="M2 12L12 17.5L22 12"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Wordmark */}
        <div className="flex flex-col leading-tight">
          <span className="text-navy-800 text-base font-extrabold tracking-widest uppercase dark:text-white">
            Virtual
          </span>
          <span className="text-brand-500 text-sm font-semibold tracking-wider uppercase">
            Academic Assistant
          </span>
        </div>
      </div>
      <div className="mt-14.5 mb-7 h-px bg-gray-300 dark:bg-white/30" />
      {/* Nav item */}

      <ul className="mb-auto pt-1">
        <Links routes={routes} />
      </ul>

      {/* Nav item end */}

      {/* Nav item end */}
    </div>
  );
};

export default Sidebar;
