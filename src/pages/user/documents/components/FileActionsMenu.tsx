import {
  dropdownMenuItemClass,
  dropdownMenuPanelClass,
} from "@/components/navbar/UserMenu";
import { getFloatingDropdownPosition } from "@/utils/floatingPosition";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdFileDownload, MdLink, MdMoreVert } from "react-icons/md";

type FileActionsMenuProps = {
  onDownload: () => void;
  onCopyLink: () => void;
  triggerClassName?: string;
};

function FileActionsMenuPanel({
  menuRef,
  menuPosition,
  onDownload,
  onCopyLink,
  onClose,
}: {
  menuRef: React.RefObject<HTMLDivElement | null>;
  menuPosition: ReturnType<typeof getFloatingDropdownPosition>;
  onDownload: () => void;
  onCopyLink: () => void;
  onClose: () => void;
}) {
  const runAction = (action: () => void) => {
    onClose();
    action();
  };

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{
        top: menuPosition.top,
        bottom: menuPosition.bottom,
        left: menuPosition.left,
        width: menuPosition.width,
      }}
      className={`${dropdownMenuPanelClass} fixed z-[99999]`}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          runAction(onDownload);
        }}
        className={dropdownMenuItemClass}
        role="menuitem"
      >
        <MdFileDownload className="h-4 w-4 shrink-0" />
        <span>Tải xuống</span>
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          runAction(onCopyLink);
        }}
        className={dropdownMenuItemClass}
        role="menuitem"
      >
        <MdLink className="h-4 w-4 shrink-0" />
        <span>Sao chép liên kết</span>
      </button>
    </div>,
    document.body,
  );
}

export function useFileActionsMenu({
  onDownload,
  onCopyLink,
}: Pick<FileActionsMenuProps, "onDownload" | "onCopyLink">) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState(
    getFloatingDropdownPosition(new DOMRect(), { minWidth: 208 }),
  );

  const closeMenu = useCallback(() => setIsOpen(false), []);

  const openAtRect = useCallback((rect: DOMRect) => {
    setMenuPosition(
      getFloatingDropdownPosition(rect, {
        minWidth: 208,
        maxHeight: 160,
      }),
    );
    setIsOpen(true);
  }, []);

  const openAtTrigger = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    openAtRect(rect);
  }, [openAtRect]);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      openAtRect(new DOMRect(event.clientX, event.clientY, 0, 0));
    },
    [openAtRect],
  );

  const toggleTriggerMenu = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (isOpen) {
        closeMenu();
        return;
      }
      openAtTrigger();
    },
    [closeMenu, isOpen, openAtTrigger],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeMenu, isOpen]);

  const menu = isOpen ? (
    <FileActionsMenuPanel
      menuRef={menuRef}
      menuPosition={menuPosition}
      onDownload={onDownload}
      onCopyLink={onCopyLink}
      onClose={closeMenu}
    />
  ) : null;

  return {
    triggerRef,
    handleContextMenu,
    toggleTriggerMenu,
    menu,
  };
}

export function FileActionsMenu({
  onDownload,
  onCopyLink,
  triggerClassName,
}: FileActionsMenuProps) {
  const { triggerRef, toggleTriggerMenu, menu } = useFileActionsMenu({
    onDownload,
    onCopyLink,
  });

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleTriggerMenu}
        className={
          triggerClassName ??
          "pointer-events-auto relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-white/8 dark:text-gray-300 dark:hover:bg-white/12"
        }
        aria-label="Tuỳ chọn tài liệu"
        aria-haspopup="menu"
      >
        <MdMoreVert className="h-4 w-4" />
      </button>
      {menu}
    </>
  );
}
