import React, { type ReactNode } from "react";

import { Modal } from "antd";
import { MdDelete, MdWarningAmber } from "react-icons/md";

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
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  loading = false,
  danger = true,
  width = 600,
  icon = "delete",
  zIndex,
}) => {
  const IconComponent = icon === "delete" ? MdDelete : MdWarningAmber;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-xl font-bold text-navy-700 dark:text-white">
          <IconComponent className={`h-6 w-6 ${danger ? "text-red-500" : "text-amber-500"}`} />
          {title}
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`${
              danger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-brand-500 hover:bg-brand-600"
            } flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50`}
          >
            {icon === "delete" && <MdDelete className="h-4 w-4" />}
            {loading ? "Đang xử lý..." : confirmText}
          </button>
        </div>
      }
      width={width}
      centered
      className="modal-rounded-30"
      styles={{
        mask: {
          backdropFilter: "blur(6px)",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
        },
      }}
      zIndex={zIndex}
    >
      <div className="flex flex-col gap-6 px-8 py-6">
        {subTitle && (
          <div className={`flex gap-4 rounded-2xl p-4 ${danger ? "bg-red-50 dark:bg-red-500/10" : "bg-brand-50 dark:bg-brand-500/10"}`}>
            <div className="shrink-0">
              <IconComponent className={`h-6 w-6 ${danger ? "text-red-500" : "text-brand-500"}`} />
            </div>
            <div className="flex flex-col gap-1">
              <p className={`text-base font-medium ${danger ? "text-red-800 dark:text-red-200" : "text-brand-800 dark:text-brand-200"}`}>
                Thông tin quan trọng
              </p>
              <p className={`text-sm leading-relaxed ${danger ? "text-red-700/80 dark:text-red-200/70" : "text-brand-700/80 dark:text-brand-200/70"}`}>
                {subTitle}
              </p>
            </div>
          </div>
        )}
        {children}
      </div>
    </Modal>
  );
};

export default ConfirmModal;
