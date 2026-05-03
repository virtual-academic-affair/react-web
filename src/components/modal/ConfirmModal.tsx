import React, { type ReactNode } from "react";

import StandardModal from "./StandardModal";

interface ConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  subTitle?: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  danger?: boolean;
  width?: number;
  icon?: "delete" | "warning";
  zIndex?: number;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onCancel,
  onConfirm,
  title,
  subTitle,
  children,
  confirmText = "Tiếp tục",
  cancelText = "Hủy",
  loading = false,
  danger = true,
}) => {
  return (
    <StandardModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={<div className="flex items-center gap-2">{title}</div>}
      confirmText={confirmText}
      cancelText={cancelText}
      confirmColor={
        danger
          ? "bg-red-500 hover:bg-red-600"
          : "bg-brand-500 hover:bg-brand-600"
      }
      loading={loading}
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        {subTitle && (
          <div className={`flex gap-3 rounded-2xl sm:gap-4 sm:p-4`}>
            <div className="flex min-w-0 flex-col gap-1">
              <p
                className={`text-navy-700 text-sm leading-relaxed dark:text-white`}
              >
                {subTitle}
              </p>
            </div>
          </div>
        )}
        {children}
      </div>
    </StandardModal>
  );
};

export default ConfirmModal;
