import { useEffect, useRef } from "react";

const MOBILE_BREAKPOINT = 1024;
const EDGE_OPEN_ZONE = 36;
const SWIPE_DISTANCE = 72;
const MAX_VERTICAL_DRIFT = 80;

export function useMobileSidebarSwipe({
  open,
  onOpen,
  onClose,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const gestureRef = useRef<{
    x: number;
    y: number;
    canOpen: boolean;
    canClose: boolean;
  } | null>(null);

  useEffect(() => {
    const isMobile = () => window.innerWidth < MOBILE_BREAKPOINT;

    const handleTouchStart = (event: TouchEvent) => {
      if (!isMobile() || event.touches.length !== 1) {
        gestureRef.current = null;
        return;
      }

      const touch = event.touches[0];
      gestureRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        canOpen: !open && touch.clientX <= EDGE_OPEN_ZONE,
        canClose: open,
      };
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const gesture = gestureRef.current;
      gestureRef.current = null;
      if (!gesture || event.changedTouches.length !== 1) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - gesture.x;
      const deltaY = Math.abs(touch.clientY - gesture.y);

      if (deltaY > MAX_VERTICAL_DRIFT) return;

      if (gesture.canOpen && deltaX >= SWIPE_DISTANCE) {
        onOpen();
      }

      if (gesture.canClose && deltaX <= -SWIPE_DISTANCE) {
        onClose();
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onClose, onOpen, open]);
}
