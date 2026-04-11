import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdCheck, MdExpandMore } from "react-icons/md";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  /** Optional hex color for the option dot indicator */
  color?: string;
}

interface SelectFieldProps<T extends string = string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  /** Accessible label / aria-label for the trigger button */
  label?: string;
}

function SelectField<T extends string = string>({
  value,
  options,
  onChange,
  disabled = false,
  className,
  label,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const updatePos = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Re-anchor the dropdown on every scroll / resize while it is open
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updatePos, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, { capture: true });
      window.removeEventListener("resize", updatePos);
    };
  }, [open, updatePos]);

  const handleOpen = () => {
    if (disabled) return;
    updatePos();
    setOpen(true);
  };

  const handleSelect = (optValue: T) => {
    onChange(optValue);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={handleOpen}
        className={`dark:border-navy-600 dark:bg-navy-900 text-navy-700 focus:border-brand-500 focus:ring-brand-500/20 flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm transition-all duration-150 outline-none select-none hover:border-gray-300 hover:shadow-sm focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white dark:hover:border-white/20 ${className ?? ""}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.color && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          <span className="truncate">{selectedOption?.label ?? "—"}</span>
        </span>
        <MdExpandMore
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 dark:text-gray-500 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-200"
              onClick={() => setOpen(false)}
            />

            {/* Dropdown menu */}
            <div
              role="listbox"
              style={{
                top: dropdownPos.top,
                left: dropdownPos.left,
                minWidth: dropdownPos.width,
              }}
              className="dark:bg-navy-900 fixed z-210 rounded-2xl border border-gray-100 bg-white py-1.5 shadow-xl dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            >
              {options.map((opt) => {
                const isActive = opt.value === value;
                const dot = opt.color;
                const hoverBg = dot ? `${dot}15` : undefined;
                const activeBg = dot ? `${dot}20` : undefined;

                return (
                  <button
                    key={opt.value}
                    role="option"
                    aria-selected={isActive}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-medium transition-colors duration-100 ${
                      isActive
                        ? "text-navy-700 dark:bg-white/5 dark:text-white"
                        : "text-navy-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
                    }`}
                    style={
                      isActive
                        ? { backgroundColor: activeBg, color: dot }
                        : undefined
                    }
                    onMouseEnter={(e) => {
                      if (!isActive && hoverBg) {
                        e.currentTarget.style.backgroundColor = hoverBg;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "";
                      }
                    }}
                  >
                    {dot && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: dot }}
                      />
                    )}

                    <span className="flex-1">{opt.label}</span>

                    {isActive && <MdCheck className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

export default SelectField;
