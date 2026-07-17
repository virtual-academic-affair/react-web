import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

type ModalShellProps = {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: ReactNode;
  /** Outer width constraint (dialog box). */
  panelClassName?: string;
  /** Passed to Card `extra` (layout inside the rounded shell). */
  cardClassName?: string;
  zIndexClassName?: string;
  animateEnter?: boolean;
};

export function ModalShell({
  open,
  onClose,
  ariaLabel,
  children,
  panelClassName = "w-full max-w-5xl",
  cardClassName = "flex h-[min(82vh,760px)] flex-col overflow-hidden shadow-2xl",
  zIndexClassName = "z-120",
  animateEnter = false,
}: ModalShellProps) {
  useBodyScrollLock(open);

  if (!open) return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center p-4 sm:p-6 ${
        animateEnter ? "corpus-modal-backdrop-enter" : ""
      }`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`relative ${panelClassName} ${
          animateEnter ? "corpus-modal-panel-enter" : ""
        }`}
      >
        <div
          className={`dark:bg-navy-800 relative flex flex-col rounded-4xl border border-gray-200 bg-white bg-clip-border dark:border-[#ffffff33] dark:text-white dark:shadow-none ${cardClassName}`}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
