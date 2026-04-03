import React from "react";
import { MdExpandMore } from "react-icons/md";

export interface TagOption {
  value: string;
  label: string;
}

interface TagProps {
  /** Hex color string, e.g. "#ff0000" */
  color?: string;
  /** "selection" shows a native dropdown when clicked */
  variant?: "default" | "selection";
  /** Current value (for selection variant) */
  value?: string;
  /** Options for selection variant */
  options?: TagOption[];
  /** Callback when selection changes */
  onChange?: (value: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

const Tag: React.FC<TagProps> = ({
  color,
  variant = "default",
  value,
  options = [],
  onChange,
  disabled,
  onClick,
  children,
  className,
}) => {
  if (!color) {
    color = "#4225ff";
  }
  const bgWithOpacity = `${color}20`;

  if (variant === "selection") {
    return (
      <span className="relative inline-flex">
        <span
          style={{ backgroundColor: bgWithOpacity, color, borderColor: color }}
          onClick={onClick}
          className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 pl-3 text-xs font-medium transition-opacity hover:opacity-80 ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className ?? ""}`}
        >
          {children}
          {!disabled && <MdExpandMore className="h-3.5 w-3.5 text-inherit" />}
        </span>
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </span>
    );
  }

  return (
    <span
      style={{ backgroundColor: bgWithOpacity, color, borderColor: color }}
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 ${className ?? ""}`}
    >
      {children}
    </span>
  );
};

export default Tag;
