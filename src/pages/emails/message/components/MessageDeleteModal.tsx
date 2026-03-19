import Checkbox from "@/components/checkbox";
import StandardModal from "@/components/modal/StandardModal";
import React, { useState } from "react";

import { MdDelete, MdWarningAmber } from "react-icons/md";

interface MessageDeleteModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (deleteTasks: boolean) => void;
  loading?: boolean;
}

const MessageDeleteModal: React.FC<MessageDeleteModalProps> = ({
  open,
  onCancel,
  onConfirm,
  loading = false,
}) => {
  const [deleteTasks, setDeleteTasks] = useState(false);

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setDeleteTasks(false);
    }
  }, [open]);

  return (
    <StandardModal
      open={open}
      onCancel={onCancel}
      onConfirm={() => onConfirm(deleteTasks)}
      title={<div className="flex items-center gap-2">Xóa email</div>}
      confirmText="Tiếp tục"
      confirmColor="bg-red-500 hover:bg-red-600"
      confirmIcon={<MdDelete className="h-4 w-4" />}
      loading={loading}
    >
      <div className="flex flex-col gap-6">
        <div className="flex gap-4 rounded-2xl bg-red-50 p-4 dark:bg-red-500/10">
          <div className="shrink-0 pt-0.5">
            <MdWarningAmber className="h-6 w-6 text-red-500" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-base font-bold text-red-800 dark:text-red-200">
              Xóa dữ liệu liên quan
            </p>
            <p className="text-sm leading-relaxed text-red-700/80 dark:text-red-200/70">
              Tất cả các hồ sơ liên quan (như <strong>Đăng ký môn học</strong>,
              <strong>Thắc mắc</strong>) liên kết với tin nhắn email này sẽ bị
              xóa. Hành động này <strong>không thể hoàn tác</strong>.
            </p>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 px-1">
          <Checkbox
            checked={deleteTasks}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDeleteTasks(e.target.checked)
            }
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-navy-700 text-sm dark:text-white">
              Đồng thời xóa các công việc được tạo từ email này.
            </span>
          </div>
        </label>
      </div>
    </StandardModal>
  );
};

export default MessageDeleteModal;
