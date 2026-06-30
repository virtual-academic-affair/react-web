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
  const processedTitle =
    target?.title?.trim() || "Cuộc trò chuyện không xác định";
  const displayTitle =
    processedTitle.length > 50
      ? `${processedTitle.slice(0, 50)}...`
      : processedTitle;
  return (
    <ConfirmModal
      open={!!target}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Xoá cuộc trò chuyện"
      subTitle={`Bạn có chắc chắn muốn xoá cuộc trò chuyện "${displayTitle}" không? Hành động này không thể hoàn tác.`}
      confirmText="Xoá"
      loading={loading}
    />
  );
}
