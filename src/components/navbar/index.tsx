import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { FiAlignJustify } from "react-icons/fi";

const DRAG_MARGIN = 8;
const DRAG_THRESHOLD = 6;

interface NavbarProps {
  sidebarOpen: boolean;
  onOpenSidenav: () => void;
  contained?: boolean;
}

const Navbar = ({
  sidebarOpen,
  onOpenSidenav,
  contained = false,
}: NavbarProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
    startRect: DOMRect;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const clampToViewport = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      let deltaX = 0;
      let deltaY = 0;

      if (rect.left < DRAG_MARGIN) {
        deltaX = DRAG_MARGIN - rect.left;
      } else if (rect.right > window.innerWidth - DRAG_MARGIN) {
        deltaX = window.innerWidth - DRAG_MARGIN - rect.right;
      }

      if (rect.top < DRAG_MARGIN) {
        deltaY = DRAG_MARGIN - rect.top;
      } else if (rect.bottom > window.innerHeight - DRAG_MARGIN) {
        deltaY = window.innerHeight - DRAG_MARGIN - rect.bottom;
      }

      if (deltaX || deltaY) {
        setDragOffset((current) => ({
          x: current.x + deltaX,
          y: current.y + deltaY,
        }));
      }
    };

    window.addEventListener("resize", clampToViewport);
    return () => window.removeEventListener("resize", clampToViewport);
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;

    const button = buttonRef.current;
    if (!button) return;

    button.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: dragOffset.x,
      startOffsetY: dragOffset.y,
      startRect: button.getBoundingClientRect(),
      moved: false,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance > DRAG_THRESHOLD) {
      drag.moved = true;
    }

    if (!drag.moved) return;

    const maxLeft = window.innerWidth - drag.startRect.width - DRAG_MARGIN;
    const maxTop = window.innerHeight - drag.startRect.height - DRAG_MARGIN;
    const left = Math.min(
      Math.max(DRAG_MARGIN, drag.startRect.left + deltaX),
      maxLeft,
    );
    const top = Math.min(
      Math.max(DRAG_MARGIN, drag.startRect.top + deltaY),
      maxTop,
    );

    setDragOffset({
      x: drag.startOffsetX + left - drag.startRect.left,
      y: drag.startOffsetY + top - drag.startRect.top,
    });
  };

  const finishDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const button = buttonRef.current;
    if (button?.hasPointerCapture(event.pointerId)) {
      button.releasePointerCapture(event.pointerId);
    }

    suppressClickRef.current = drag.moved;
    dragRef.current = null;
  };

  const handleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    onOpenSidenav();
  };

  if (sidebarOpen) return null;

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label="Mở menu"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      style={{
        transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
      }}
      className={`dark:bg-navy-800! top-4 right-4 z-40 mt-2 flex h-11 w-11 touch-none items-center justify-center rounded-full border-2 border-gray-300 bg-white text-gray-600 shadow-lg transition-colors select-none hover:bg-gray-50 active:cursor-grabbing lg:hidden dark:text-white dark:hover:bg-white/10 ${
        contained ? "absolute" : "fixed"
      }`}
    >
      <FiAlignJustify className="h-5 w-5" />
    </button>
  );
};

export default Navbar;
