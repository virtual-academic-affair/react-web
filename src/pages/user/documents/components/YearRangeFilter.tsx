import YearRangeControl from "@/components/fields/YearRangeControl";
import {
  formatYearRangeStrings,
  type YearRangeStrings,
} from "@/utils/yearRange";
import {
  getFloatingDropdownPosition,
  type FloatingPosition,
} from "@/utils/floatingPosition";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdClose, MdExpandMore } from "react-icons/md";

export type YearRange = YearRangeStrings;

interface YearRangeFilterProps {
  label: string;
  value: YearRange;
  onChange: (next: YearRange) => void;
}

/**
 * A pill button that opens a portal-based dropdown with year range inputs.
 * Uses same visual pattern as FilterGroup for consistency.
 */
const YearRangeFilter: React.FC<YearRangeFilterProps> = ({
  label,
  value,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<FloatingPosition>({ left: 0 });
  const [localValue, setLocalValue] = useState<YearRange>(value);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setLocalValue(value);
  }, [open, value]);

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

  const hasActive = Boolean(value.fromYear || value.toYear);
  const appliedLabel = formatYearRangeStrings(value);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ fromYear: "", toYear: "" });
    setLocalValue({ fromYear: "", toYear: "" });
  };

  const applyChanges = () => {
    onChange(localValue);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") applyChanges();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-transform ${
          hasActive
            ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400"
            : "dark:bg-navy-800 border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/5"
        }`}
      >
        {label}
        {hasActive ? (
          <span className="text-xs font-normal opacity-80">({appliedLabel})</span>
        ) : null}
        {hasActive ? (
          <button
            type="button"
            onClick={handleClear}
            className="bg-brand-500 hover:bg-brand-600 flex h-4 w-4 items-center justify-center rounded-full text-white"
          >
            <MdClose className="h-3 w-3" />
          </button>
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
            className="dark:bg-navy-900 fixed z-9999 w-[280px] max-w-[calc(100vw-24px)] rounded-2xl border border-gray-100 bg-white p-4 shadow-xl dark:border-white/10"
            onKeyDown={handleKeyDown}
          >
            <YearRangeControl
              value={localValue}
              onChange={setLocalValue}
              compact
            />

            <button
              type="button"
              onClick={applyChanges}
              className="bg-brand-500 hover:bg-brand-600 mt-4 w-full rounded-xl py-2 text-sm font-medium text-white transition-colors"
            >
              Áp dụng
            </button>
          </div>,
          document.body,
        )}
    </>
  );
};

export default YearRangeFilter;
