import Switch from "@/components/switch";
import {
  setLinkedMessagePanelOpen,
  useDetailLinkedMessagePanel,
} from "@/hooks/useDetailLinkedMessagePanel";
import { DYNAMIC_DATA_QUERY_KEY } from "@/hooks/useDynamicData";
import EmailDetailDrawer from "@/pages/emails/message/components/EmailDetailDrawer";
import type { SystemLabelEnumData } from "@/types/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";

export function DetailLinkedMessageSwitch() {
  const [open, setOpen] = useDetailLinkedMessagePanel();
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <span className="text-sm font-medium whitespace-nowrap text-gray-600 dark:text-gray-300">
        Hiển thị nội dung tin nhắn
      </span>
      <Switch
        checked={open}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setOpen(e.target.checked)
        }
        color="brand"
      />
    </label>
  );
}

interface DetailLinkedEmailDrawerProps {
  /** Khi false không render (tránh fetch khi đóng hoàn toàn) */
  parentOpen: boolean;
  messageId: number | null;
}

/**
 * Drawer tin nhắn bên trái, không backdrop — dùng cùng drawer chi tiết bên phải.
 */
export function DetailLinkedEmailDrawer({
  parentOpen,
  messageId,
}: DetailLinkedEmailDrawerProps) {
  const queryClient = useQueryClient();
  const { data: dynamicData } = useQuery({
    queryKey: DYNAMIC_DATA_QUERY_KEY,
    enabled: false,
  });
  const systemLabelEnum = (dynamicData?.enums?.["shared.systemLabel"] ??
    undefined) as SystemLabelEnumData | null | undefined;

  const [linkedOpen] = useDetailLinkedMessagePanel();
  const visible =
    parentOpen && linkedOpen && messageId != null && messageId > 0;

  if (!visible || messageId == null) {
    return null;
  }

  return (
    <EmailDetailDrawer
      messageId={messageId}
      systemLabelEnum={systemLabelEnum}
      side="left"
      hideBackdrop
      showFooterActions={false}
      width="max-w-2xl"
      wrapperClassName="z-[49]"
      onClose={() => setLinkedMessagePanelOpen(false)}
      onLabelChanged={() => {
        queryClient.invalidateQueries({ queryKey: ["messages"] });
      }}
      processingIds={[]}
    />
  );
}
