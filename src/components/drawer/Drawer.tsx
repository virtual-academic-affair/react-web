import type { ReactNode } from "react";
import React from "react";
import { MdClose } from "react-icons/md";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  width?: string;
}

const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footerLeft,
  footerRight,
  width = "max-w-3xl",
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className="pointer-events-none fixed inset-0 z-50 flex justify-end">
        <div
          className={`dark:bg-navy-800 pointer-events-auto my-6 mr-6 flex h-[calc(100%-48px)] w-full ${width} flex-col rounded-[30px] bg-white shadow-2xl transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "translate-x-[calc(100%+48px)]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/10">
            <h2 className="text-navy-700 text-xl font-bold dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <MdClose className="h-5 w-5" />
            </button>
          </div>

          {/* Body (scrollable) */}
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

          {/* Footer (sticky) */}
          {(footerLeft || footerRight) && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 dark:border-white/10">
              <div className="flex items-center gap-3 empty:hidden">
                {footerLeft}
              </div>
              <div className="flex items-center gap-2 empty:hidden">
                {footerRight}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Drawer;
