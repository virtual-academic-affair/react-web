import { createPortal } from "react-dom";

export default function RouteNavigationOverlay({
  visible,
}: {
  visible: boolean;
}) {
  if (!visible) return null;

  return createPortal(
    <div
      className="bg-lightPrimary/75 dark:bg-navy-900/75 fixed inset-0 z-10000 flex items-center justify-center backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
      aria-label="Đang tải trang"
    >
      <div className="border-t-brand-500 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 dark:border-white/20" />
    </div>,
    document.body,
  );
}
