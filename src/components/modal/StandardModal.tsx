import Card from "@/components/card";
import React from "react";
import { createPortal } from "react-dom";

interface StandardModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  confirmIcon?: React.ReactNode;
  title?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
}

const StandardModal: React.FC<StandardModalProps> = ({
  open,
  onCancel,
  onConfirm,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  confirmColor = "bg-brand-500 hover:bg-brand-600",
  confirmIcon,
  title,
  loading = false,
  children,
}) => {
  if (!open) {
    return null;
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-999 bg-black/20 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div className="fixed top-1/2 left-1/2 z-1000 w-[min(100%,28rem)] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 px-3 sm:px-4 md:w-full md:max-w-2xl md:px-0">
        <Card extra="p-4 shadow-2xl border border-gray-200 dark:border-white/10 dark:bg-navy-800 sm:p-5">
          <div className="flex flex-col gap-3 sm:gap-4">
            {title && (
              <div className="text-navy-700 -mx-4 -mt-4 border-b border-gray-100 px-4 pb-3 pt-4 text-base font-bold dark:border-white/10 dark:text-white sm:-mx-5 sm:-mt-5 sm:px-5 sm:pb-3 sm:pt-5">
                {title}
              </div>
            )}
            <div className="mt-1 py-1 text-sm leading-relaxed sm:mt-2 sm:py-2">
              {children}
            </div>
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="rounded-xl px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`${confirmColor} flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-all active:scale-95 disabled:opacity-50`}
              >
                {confirmIcon}
                {loading ? "Đang xử lý..." : confirmText}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </>,
    document.body,
  );
};

export default StandardModal;
