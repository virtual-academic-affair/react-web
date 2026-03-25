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
      <div className="fixed top-1/2 left-1/2 z-1000 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 px-4 md:px-0">
        <Card extra="p-5 shadow-2xl border border-gray-200 dark:border-white/10 dark:bg-navy-800">
          <div className="flex flex-col gap-4">
            {title && (
              <div className="text-navy-700 -m-5 border-b border-gray-100 p-5 pb-3 text-xl font-bold dark:border-white/10 dark:text-white">
                {title}
              </div>
            )}
            <div className="mt-4 py-2">{children}</div>
            <div className="mt-2 flex justify-end gap-2">
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
