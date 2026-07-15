import Switch from "@/components/switch";
import {
  getFloatingDropdownPosition,
  type FloatingPosition,
} from "@/utils/floatingPosition";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { MdExpandMore } from "react-icons/md";

type LecturerOnlyFilterProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
};

/** Pill “Đối tượng” — mở popup chứa switch Chỉ giảng viên. */
const LecturerOnlyFilter = ({ checked, onChange }: LecturerOnlyFilterProps) => {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<FloatingPosition>({ left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropPos(getFloatingDropdownPosition(rect, { gap: 8, width: 280 }));
    }
    setOpen((p) => !p);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id="filter-group-lecturerOnly"
        onClick={handleToggle}
        className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-transform ${
          checked
            ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400"
            : "dark:bg-navy-800 border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/5"
        }`}
      >
        Đối tượng
        {checked ? (
          <span className="bg-brand-500 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white">
            1
          </span>
        ) : (
          <MdExpandMore className="h-4 w-4 opacity-50" />
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              top: dropPos.top,
              bottom: dropPos.bottom,
              left: dropPos.left,
            }}
            className="dark:bg-navy-900 fixed z-9999 max-w-[calc(100vw-24px)] rounded-2xl border border-gray-100 bg-white px-1 py-1 shadow-xl dark:border-white/10"
          >
            <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200">
              <Switch
                color="red"
                checked={checked}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onChange(e.target.checked)
                }
              />
              <span className="flex-1">Chỉ giảng viên</span>
            </label>
          </div>,
          document.body,
        )}
    </>
  );
};

export default LecturerOnlyFilter;
