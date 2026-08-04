import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import type { ReactNode } from "react";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { MdClose } from "react-icons/md";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  width?: string;
  /** Ghi đè layout vùng nội dung; mặc định vùng này tự cuộn theo chiều dọc. */
  bodyClassName?: string;
  /** Nội dung bổ sung bên cạnh nút đóng (vd. switch) */
  headerExtra?: ReactNode;
  /** Drawer trượt từ phải (mặc định) hoặc từ trái */
  side?: "left" | "right";
  /** Căn giữa màn hình (modal rộng), không lệch về một bên */
  centered?: boolean;
  /** Không render lớp phủ mờ (dùng khi mở song song drawer khác có backdrop) */
  hideBackdrop?: boolean;
  /** z-index lớp bọc (mặc định z-60, trên top nav z-50). Drawer trái thường dùng z-55 để nằm dưới drawer phải. */
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
  bodyClassName,
  headerExtra,
  side = "right",
  centered = false,
  hideBackdrop = false,
  wrapperClassName = "z-60",
}) => {
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const offTransform = centered
    ? "translate-y-3 opacity-0"
    : side === "right"
      ? "translate-x-[calc(100%+48px)]"
      : "-translate-x-[calc(100%+48px)]";
  const onTransform = centered ? "translate-y-0 opacity-100" : "translate-x-0";
  const marginClass = centered ? "mx-6" : side === "right" ? "mr-6" : "ml-6";
  const flexJustify = centered
    ? "justify-center"
    : side === "right"
      ? "justify-end"
      : "justify-start";
  const resolvedBodyClassName =
    bodyClassName ??
    "min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 text-sm leading-relaxed md:px-6 md:py-5";

  return createPortal(
    <>
      {isOpen && !hideBackdrop && (
        <div
          className="fixed inset-0 z-60 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        className={`pointer-events-none fixed inset-0 flex ${flexJustify} ${wrapperClassName}`}
      >
        {/* Desktop drawer (side panel) */}
        <div
          className={`dark:bg-navy-800 my-6 hidden h-[calc(100%-48px)] w-full ${width} flex-col rounded-[30px] bg-white shadow-2xl transition-[transform,opacity] duration-200 ${marginClass} md:flex ${
            isOpen ? "pointer-events-auto" : "pointer-events-none"
          } ${isOpen ? onTransform : offTransform}`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 md:gap-3 md:px-6 md:py-4 dark:border-white/10">
            <h2 className="text-navy-700 min-w-0 flex-1 truncate text-base font-bold dark:text-white">
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

          <div className={resolvedBodyClassName}>{children}</div>

          {(footerLeft || footerRight) && (
            <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 md:px-6 md:py-4 dark:border-white/10">
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
          className={`dark:bg-navy-800 fixed right-0 bottom-0 left-0 flex h-[90dvh] flex-col rounded-t-[30px] bg-white shadow-2xl transition-transform duration-200 md:hidden ${
            isOpen
              ? "pointer-events-auto translate-y-0"
              : "pointer-events-none translate-y-[120%]"
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

          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 md:gap-3 md:px-6 md:py-4 dark:border-white/10">
            <h2 className="text-navy-700 min-w-0 flex-1 truncate pr-10 text-base font-bold md:pr-12 dark:text-white">
              {title}
            </h2>
          </div>

          <div className={resolvedBodyClassName}>{children}</div>

          {(footerLeft || footerRight) && (
            <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 md:px-6 md:py-4 dark:border-white/10">
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
    </>,
    document.body,
  );
};

export default Drawer;
