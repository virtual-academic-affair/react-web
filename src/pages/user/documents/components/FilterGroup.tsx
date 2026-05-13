import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdCheck, MdExpandMore } from "react-icons/md";

export interface FilterOption {
  value: string;
  displayName: string;
  color?: string;
}

interface FilterGroupProps {
  label: string;
  typeKey: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}

/**
 * A pill button that opens a tag-chip dropdown via a portal.
 * Using a portal + fixed positioning so the dropdown is never clipped
 * by parent overflow containers (e.g. the overflow-x-auto filter bar).
 */
const FilterGroup: React.FC<FilterGroupProps> = ({
  label,
  typeKey,
  options,
  selected,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Recalculate position every time we open
  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropPos({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
    setOpen((p) => !p);
  };

  // Close on outside click
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

  // Close on scroll / resize so position stays correct
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

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  const hasActive = selected.length > 0;

  return (
    <>
      {/* Trigger pill */}
      <button
        ref={triggerRef}
        type="button"
        id={`filter-group-${typeKey}`}
        onClick={handleToggle}
        className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-transform ${
          hasActive
            ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400"
            : "dark:bg-navy-800 border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/5"
        }`}
      >
        {label}
        {hasActive ? (
          <span className="bg-brand-500 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white">
            {selected.length}
          </span>
        ) : (
          <MdExpandMore className="h-4 w-4 opacity-50" />
        )}
      </button>

      {/* Dropdown via portal — escapes any parent overflow clipping */}
      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ top: dropPos.top, left: dropPos.left }}
            className="dark:bg-navy-900 fixed z-9999 w-[280px] max-w-[calc(100vw-24px)] rounded-2xl border border-gray-100 bg-white px-1 shadow-xl dark:border-white/10"
          >
            <div className="flex flex-col py-1">
              {options.map((opt) => {
                const active = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggle(opt.value)}
                    style={
                      active
                        ? {
                            backgroundColor: `${opt.color || "#7c3aed"}1A`,
                            color: opt.color || "#7c3aed",
                          }
                        : undefined
                    }
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                      active
                        ? "font-medium"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                    }`}
                  >
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: opt.color || "#7c3aed" }}
                    />
                    <span className="flex-1 text-left">{opt.displayName}</span>
                    {active && <MdCheck className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default FilterGroup;
