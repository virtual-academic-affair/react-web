import Switch from "@/components/switch";
import {
  setLinkedMessagePanelOpen,
  useDetailLinkedMessagePanel,
} from "@/hooks/useDetailLinkedMessagePanel";
import EmailDetailDrawer from "@/pages/emails/message/components/EmailDetailDrawer";
import { useQueryClient } from "@tanstack/react-query";
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
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767px)").matches
      : false,
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 767px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const queryClient = useQueryClient();

  const [linkedOpen] = useDetailLinkedMessagePanel();
  const visible =
    !isMobile && parentOpen && linkedOpen && messageId != null && messageId > 0;

  if (!visible || messageId == null) {
    return null;
  }

  return (
    <EmailDetailDrawer
      messageId={messageId}
      systemLabelEnum={undefined}
      side="left"
      hideBackdrop
      showFooterActions={false}
      width="max-w-[calc(50vw-36px)]"
      wrapperClassName="z-[49]"
      onClose={() => setLinkedMessagePanelOpen(false)}
      onLabelChanged={() => {
        queryClient.invalidateQueries({ queryKey: ["messages"] });
      }}
      processingIds={[]}
    />
  );
}
