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
  /** Nội dung bổ sung bên cạnh nút đóng (vd. switch) */
  headerExtra?: ReactNode;
  /** Drawer trượt từ phải (mặc định) hoặc từ trái */
  side?: "left" | "right";
  /** Không render lớp phủ mờ (dùng khi mở song song drawer khác có backdrop) */
  hideBackdrop?: boolean;
  /** z-index lớp bọc (mặc định z-50). Drawer trái thường dùng z-[49] để nằm dưới drawer phải. */
  wrapperClassName?: string;
}

const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footerLeft,
  footerRight,
  width = "max-w-3xl",
  headerExtra,
  side = "right",
  hideBackdrop = false,
  wrapperClassName = "z-50",
}) => {
  const offTransform =
    side === "right"
      ? "translate-x-[calc(100%+48px)]"
      : "-translate-x-[calc(100%+48px)]";
  const marginClass = side === "right" ? "mr-6" : "ml-6";
  const flexJustify = side === "right" ? "justify-end" : "justify-start";

  return (
    <>
      {isOpen && !hideBackdrop && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        className={`pointer-events-none fixed inset-0 flex ${flexJustify} ${wrapperClassName}`}
      >
        {/* Desktop drawer (side panel) */}
        <div
          className={`dark:bg-navy-800 pointer-events-auto my-6 hidden h-[calc(100%-48px)] w-full ${width} flex-col rounded-[30px] bg-white shadow-2xl transition-transform duration-300 ${marginClass} md:flex ${
            isOpen ? "translate-x-0" : offTransform
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-4 dark:border-white/10">
            <h2 className="text-navy-700 min-w-0 flex-1 truncate text-xl font-bold dark:text-white">
              {title}
            </h2>
            <div className="flex shrink-0 items-center gap-3">
              {headerExtra}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <MdClose className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

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

        {/* Mobile bottom sheet */}
        <div
          className={`dark:bg-navy-800 pointer-events-auto fixed right-0 bottom-0 left-0 flex h-[90vh] flex-col rounded-t-[30px] bg-white shadow-2xl transition-transform duration-300 md:hidden ${
            isOpen ? "translate-y-0" : "translate-y-[120%]"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="dark:bg-navy-800 absolute -top-10 left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-gray-200 text-gray-500 shadow-md transition-colors dark:border-white/20 dark:text-gray-200 dark:hover:bg-white/10"
            aria-label="Đóng"
          >
            <MdClose className="h-5 w-5 text-white dark:text-gray-200" />
          </button>

          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-4 dark:border-white/10">
            <h2 className="text-navy-700 min-w-0 flex-1 truncate pr-12 text-xl font-bold dark:text-white">
              {title}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

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
