import React, { type ReactNode } from "react";

import { MdDelete, MdWarningAmber } from "react-icons/md";
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
  icon = "delete",
}) => {
  const IconComponent = icon === "delete" ? MdDelete : MdWarningAmber;

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
      confirmIcon={
        icon === "delete" ? <MdDelete className="h-4 w-4" /> : undefined
      }
      loading={loading}
    >
      <div className="flex flex-col gap-6">
        {subTitle && (
          <div
            className={`flex gap-4 rounded-2xl p-4 ${danger ? "bg-red-50 dark:bg-red-500/10" : "bg-brand-50 dark:bg-brand-500/10"}`}
          >
            <div className="shrink-0 pt-0.5">
              <IconComponent
                className={`h-6 w-6 ${danger ? "text-red-500" : "text-brand-500"}`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <p
                className={`text-base font-bold ${danger ? "text-red-800 dark:text-red-200" : "text-brand-800 dark:text-brand-200"}`}
              >
                Thông tin quan trọng
              </p>
              <p
                className={`text-sm leading-relaxed ${danger ? "text-red-700/80 dark:text-red-200/70" : "text-brand-700/80 dark:text-brand-200/70"}`}
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
