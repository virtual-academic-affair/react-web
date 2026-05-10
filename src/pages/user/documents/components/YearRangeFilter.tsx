import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdExpandMore, MdClose } from "react-icons/md";

export interface YearRange {
  fromYear: string;
  toYear: string;
}

interface YearRangeFilterProps {
  label: string;
  value: YearRange;
  onChange: (next: YearRange) => void;
}

/** Formats a year range for display as a short summary */
function formatSummary(range: YearRange): string | null {
  const { fromYear, toYear } = range;
  if (!fromYear && !toYear) return null;
  if (fromYear && toYear) return `${fromYear} – ${toYear}`;
  if (fromYear) return `Từ ${fromYear}`;
  return `Đến ${toYear}`;
}

/**
 * A pill button that opens a portal-based dropdown with two year inputs.
 * Uses same visual pattern as FilterGroup for consistency.
 */
const YearRangeFilter: React.FC<YearRangeFilterProps> = ({
  label,
  value,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const [localValue, setLocalValue] = useState<YearRange>(value);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setLocalValue(value);
  }, [open, value]);

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

  // Close on scroll / resize
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
  const summary = formatSummary(value);

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
      {/* Trigger pill */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-transform ${
          hasActive
            ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-navy-800 dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/5"
        }`}
      >
        {label}
        {hasActive ? (
          <button
            type="button"
            onClick={handleClear}
            className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-600"
          >
            <MdClose className="h-3 w-3" />
          </button>
        ) : (
          <MdExpandMore className="h-4 w-4 opacity-50" />
        )}
      </button>

      {/* Dropdown via portal */}
      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ top: dropPos.top, left: dropPos.left }}
            className="dark:bg-navy-900 fixed z-9999 w-[280px] max-w-[calc(100vw-24px)] rounded-2xl border border-gray-100 bg-white p-4 shadow-xl dark:border-white/10"
          >
            <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {label}
            </p>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-[10px] font-medium text-gray-400">
                  Từ năm
                </label>
                <input
                  type="number"
                  value={localValue.fromYear}
                  onChange={(e) =>
                    setLocalValue({ ...localValue, fromYear: e.target.value })
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="VD: 2020"
                  min={2000}
                  max={2099}
                  className="dark:bg-navy-800 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-400 dark:border-white/10 dark:text-white dark:placeholder:text-white/30"
                />
              </div>
              <span className="mt-4 shrink-0 text-sm text-gray-400">—</span>
              <div className="flex-1">
                <label className="mb-1 block text-[10px] font-medium text-gray-400">
                  Đến năm
                </label>
                <input
                  type="number"
                  value={localValue.toYear}
                  onChange={(e) =>
                    setLocalValue({ ...localValue, toYear: e.target.value })
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="VD: 2025"
                  min={2000}
                  max={2099}
                  className="dark:bg-navy-800 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-400 dark:border-white/10 dark:text-white dark:placeholder:text-white/30"
                />
              </div>
            </div>

            <p className="mt-2 text-[10px] text-gray-400">
              Để trống cả hai = áp dụng tất cả
            </p>

            <button
              type="button"
              onClick={applyChanges}
              className="mt-4 w-full rounded-xl bg-brand-500 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
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
