import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FC,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { MdCheck, MdExpandMore } from "react-icons/md";

export interface TagOption {
  value: string;
  label: string;
}

interface TagProps {
  /** Hex color string, e.g. "#ff0000" */
  color?: string;
  /** "selection" shows a custom dropdown when clicked */
  variant?: "default" | "selection";
  /** Disable hover/pointer styling*/
  interactive?: boolean;
  /** Current value (for selection variant) */
  value?: string;
  /** Options for selection variant */
  options?: TagOption[];
  /** Callback when selection changes */
  onChange?: (value: string) => void;
  /** Optional map of option value → hex color for color-coded dropdown items */
  optionColors?: Record<string, string>;
  /** Disabled state */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

const Tag: FC<TagProps> = ({
  color,
  variant = "default",
  interactive = true,
  value,
  options = [],
  onChange,
  optionColors,
  disabled,
  onClick,
  children,
  className,
}) => {
  if (!color) {
    color = "#4225ff";
  }
  const bgWithOpacity = `${color}20`;

  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const updatePos = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
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

  const handleOpen = (e: ReactMouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    if (disabled) return;
    updatePos();
    setOpen(true);
  };

  const handleSelect = (optValue: string) => {
    onChange?.(optValue);
    setOpen(false);
  };

  if (variant === "selection") {
    return (
      <>
        <span ref={triggerRef} className="relative inline-flex">
          <span
            style={{
              backgroundColor: bgWithOpacity,
              color,
              borderColor: color,
            }}
            onClick={(e) => {
              onClick?.();
              handleOpen(e);
            }}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 pl-3 text-xs font-medium select-none ${
              interactive
                ? "cursor-pointer transition-all duration-150 hover:opacity-80 hover:shadow-sm"
                : ""
            } ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className ?? ""}`}
          >
            {children}
            {!disabled && (
              <MdExpandMore
                className={`h-3.5 w-3.5 text-inherit transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            )}
          </span>
        </span>

        {open &&
          typeof document !== "undefined" &&
          createPortal(
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-200"
                onClick={() => setOpen(false)}
              />
              {/* Dropdown Menu */}
              <div
                style={{ top: dropdownPos.top, left: dropdownPos.left }}
                className="dark:bg-navy-900 fixed z-210 min-w-[140px] rounded-2xl border border-gray-100 bg-white py-1.5 shadow-xl dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
              >
                {options.map((opt) => {
                  const isActive = opt.value === value;
                  const itemColor = optionColors?.[opt.value] ?? color;
                  const itemBg = `${itemColor}15`;
                  const activeBg = `${itemColor}20`;

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-medium transition-colors duration-100 ${
                        isActive
                          ? "dark:bg-white/5"
                          : "hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                      style={
                        isActive
                          ? { backgroundColor: activeBg, color: itemColor }
                          : undefined
                      }
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = itemBg;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "";
                        }
                      }}
                    >
                      {/* Color dot indicator */}
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: itemColor }}
                      />

                      <span
                        className={`flex-1 ${
                          isActive ? "" : "text-navy-700 dark:text-gray-200"
                        }`}
                        style={isActive ? { color: itemColor } : undefined}
                      >
                        {opt.label}
                      </span>

                      {/* Checkmark for active item */}
                      {isActive && (
                        <MdCheck
                          className="h-4 w-4 shrink-0"
                          style={{ color: itemColor }}
                        />
                      )}
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

  return (
    <span
      style={{ backgroundColor: bgWithOpacity, color, borderColor: color }}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
        interactive ? "cursor-pointer transition-opacity hover:opacity-80" : ""
      } ${className ?? ""}`}
    >
      {children}
    </span>
  );
};

export default Tag;
