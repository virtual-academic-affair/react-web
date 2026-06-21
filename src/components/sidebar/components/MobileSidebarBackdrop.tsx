type MobileSidebarBackdropProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileSidebarBackdrop({
  open,
  onClose,
}: MobileSidebarBackdropProps) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Đóng sidebar"
      className={`absolute top-0 left-[80vw] z-40 h-dvh w-screen bg-black/70 transition-opacity duration-200 lg:hidden ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    />
  );
}
