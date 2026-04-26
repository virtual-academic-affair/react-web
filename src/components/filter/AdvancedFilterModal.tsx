import Card from "@/components/card";
import React from "react";
import { createPortal } from "react-dom";
import { MdSearch } from "react-icons/md";

interface AdvancedFilterModalProps {
  open: boolean;
  onClear: () => void;
  onApply: () => void;
  onRequestClose: () => void;
  children: React.ReactNode;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  open,
  onClear,
  onApply,
  onRequestClose,
  children,
  anchorRef,
}) => {
  const [anchorPosition, setAnchorPosition] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const syncAnchorPosition = React.useCallback(() => {
    if (!anchorRef?.current) {
      setAnchorPosition(null);
      return;
    }

    const rect = anchorRef.current.getBoundingClientRect();
    const viewportPadding = 16;
    const gap = 8;
    const width = Math.min(672, window.innerWidth - viewportPadding * 2);
    const maxLeft = window.innerWidth - viewportPadding - width;
    const left = Math.min(
      maxLeft,
      Math.max(viewportPadding, rect.left - width - gap),
    );
    const top = Math.max(
      viewportPadding,
      Math.min(rect.top, window.innerHeight - viewportPadding - 120),
    );

    setAnchorPosition({ top, left, width });
  }, [anchorRef]);

  React.useEffect(() => {
    if (!open || !anchorRef) {
      return;
    }

    syncAnchorPosition();
    window.addEventListener("resize", syncAnchorPosition);
    window.addEventListener("scroll", syncAnchorPosition, true);
    return () => {
      window.removeEventListener("resize", syncAnchorPosition);
      window.removeEventListener("scroll", syncAnchorPosition, true);
    };
  }, [open, anchorRef, syncAnchorPosition]);

  if (!open) {
    return null;
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-999 bg-black/20 backdrop-blur-[2px]"
        onClick={onRequestClose}
      />
      <div
        className={`fixed z-1000 ${
          anchorPosition ? "" : "top-1/2 left-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 px-4 md:px-0"
        }`}
        style={
          anchorPosition
            ? {
                top: anchorPosition.top,
                left: anchorPosition.left,
                width: anchorPosition.width,
              }
            : undefined
        }
      >
        <Card extra="border border-gray-200 p-5 shadow-2xl dark:border-white/10 dark:bg-navy-800">
          <div className="flex flex-col gap-4">
            <div className="text-navy-700 -m-5 border-b border-gray-100 p-5 pb-3 text-xl font-bold dark:border-white/10 dark:text-white">
              Bộ lọc nâng cao
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 py-2 md:grid-cols-4">
              {children}
            </div>

            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClear}
                className="rounded-xl px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={onApply}
                className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors"
              >
                <MdSearch className="h-4 w-4" />
                Tìm kiếm
              </button>
            </div>
          </div>
        </Card>
      </div>
    </>,
    document.body,
  );
};

export default AdvancedFilterModal;
