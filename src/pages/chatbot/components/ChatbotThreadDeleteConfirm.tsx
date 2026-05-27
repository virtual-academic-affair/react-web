import ConfirmModal from "@/components/modal/ConfirmModal";

import type { ChatThreadSession } from "../types";

type ChatbotThreadDeleteConfirmProps = {
  target: ChatThreadSession | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ChatbotThreadDeleteConfirm({
  target,
  loading,
  onCancel,
  onConfirm,
}: ChatbotThreadDeleteConfirmProps) {
  return (
    <ConfirmModal
      open={!!target}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Xoá cuộc trò chuyện"
      subTitle={`Bạn có chắc chắn muốn xoá cuộc trò chuyện "${target?.title?.trim() || "Cuộc trò chuyện mới"}" không? Hành động này không thể hoàn tác.`}
      confirmText="Xoá"
      loading={loading}
    />
  );
}
